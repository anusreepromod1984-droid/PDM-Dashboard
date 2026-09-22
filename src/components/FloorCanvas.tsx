"use client";

import { useCallback, useEffect, useRef, useState, type HTMLAttributes, type Ref } from "react";
import { DEFAULT_MACHINE_ASSET_KEY, MACHINE_ASSETS } from "@/components/machineAssets";
import { FLOOR_BAYS, FLOOR_ROWS } from "@/lib/floorLocation";
import type { Severity } from "@/lib/types";

/** Shared floor-map visual language for the read-only viewer (PlantMap.tsx) and the
 *  Gbotz drag-and-drop editor (gbotz/PlantMapEditor.tsx) — same grid, same zoom
 *  control, same legend, same equipment tile, so a machine looks identical whether
 *  you're placing it or just looking at it. */

export const SEVERITY_COLOR: Record<Severity, string> = {
  good: "var(--status-good)",
  warning: "var(--status-warning)",
  critical: "var(--status-critical)",
};

/** Keeps a node's center a fixed margin from the canvas edge so its tile never clips. */
export function clampPercent(value: number): number {
  return Math.min(97, Math.max(3, value));
}

// The floor is genuinely bigger than the viewport (not just visually zoomed) so pan/zoom
// reaches real, distinct placeable space instead of a fixed box the size of the resting
// viewport — dragging a machine toward what looks like open canvas actually lands there.
// MIN_ZOOM is the raw CSS scale at which the whole floor exactly fills the viewport (the
// resting/default look); MAX_ZOOM caps how far in a wheel/pinch/button zoom can go. Zoom
// is a continuous value (not discrete steps) so wheel and pinch gestures can drive it
// smoothly; the displayed percentage is re-based off MIN_ZOOM so it still reads "100%"
// at rest.
const FLOOR_SIZE_MULTIPLIER = 2;
const MIN_ZOOM = 1 / FLOOR_SIZE_MULTIPLIER;
const MAX_ZOOM = MIN_ZOOM * 4;
/** Multiplier applied per +/- button click — continuous zoom has no fixed step list, so
 *  buttons just scale the current value instead of jumping to a table entry. */
const ZOOM_BUTTON_FACTOR = 1.4;
/** Tuned so a standard mouse-wheel notch (~100 raw deltaY) changes zoom by ~1.2x, while a
 *  trackpad's much smaller continuous scroll deltas accumulate to the same feel over a
 *  gesture. Delta is clamped before this is applied so a single large wheel spike (some
 *  mice fire these) can't jump zoom too far in one event. */
const WHEEL_ZOOM_SENSITIVITY = 0.0018;
const WHEEL_DELTA_CLAMP = 120;
const ZOOM_EPSILON = 0.001;
/** Resting height of the pan/zoom viewport box (not the floor itself, which is
 *  FLOOR_SIZE_MULTIPLIER times larger and scrolls/scales inside it). */
const VIEWPORT_HEIGHT_REM = 24;
/** How far past the floor's true edge a pan is allowed to go, in raw viewport pixels —
 *  a small rubber-band margin so the floor doesn't feel like it's hitting a hard wall. */
const OVERSCAN_PX = 24;

interface Point {
  x: number;
  y: number;
}

function pointerDistance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function pointerMidpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

const LEGEND: { severity: Severity; label: string }[] = [
  { severity: "good", label: "Good" },
  { severity: "warning", label: "Warning" },
  { severity: "critical", label: "Critical" },
];

export function FloorLegend() {
  return (
    <div data-tour="plant-map-legend" className="flex flex-wrap items-center gap-3">
      {LEGEND.map((l) => (
        <span key={l.severity} className="flex items-center gap-1.5 text-xs font-medium text-secondary">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SEVERITY_COLOR[l.severity] }} />
          {l.label}
        </span>
      ))}
      <span className="flex items-center gap-1.5 text-xs font-medium text-secondary">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "var(--text-muted)" }} />
        Offline
      </span>
    </div>
  );
}

/**
 * The floor surface itself: a map-style camera over the floor. An outer viewport
 * (`overflow: hidden`, fills the component edge-to-edge) clips an inner "world" layer
 * that holds the industrial-grid backdrop and the children (machine nodes, still
 * positioned by left/top percent — untouched by the camera). The world layer is moved
 * with `transform: translate() scale()`, the standard performant technique for
 * map/canvas-style pan+zoom (cheaper than resizing/scrolling a box, and what Miro/Figma-
 * style canvases and libraries like panzoom use). At the default 1x zoom the world
 * exactly fills the viewport (no panning possible or needed); zooming in reveals more
 * than fits, and dragging the empty floor — not a machine node, which stops propagation
 * itself — pans the camera around it.
 */
export function FloorCanvas({
  children,
  surfaceRef,
  surfaceProps,
  backgroundImageUrl,
}: {
  children: React.ReactNode;
  /** Forwarded to the world layer so callers (the drag editor) can read its rendered
   *  (post-transform) bounding rect to convert a pointer/drop position into a floor
   *  percentage — getBoundingClientRect() already reflects the current pan/zoom. */
  surfaceRef?: Ref<HTMLDivElement>;
  /** Spread onto the same layer — the editor uses this for onDragOver/onDrop
   *  (placing an unplaced machine from the tray). */
  surfaceProps?: HTMLAttributes<HTMLDivElement>;
  /** Already API_URL-prefixed URL of the company's uploaded floor-plan image. When set,
   *  it renders full-bleed on the world layer (the same 0-100% coordinate space machine
   *  tiles already use, so it pans/scales with them for free) with only a faint bay/row
   *  grid over it for alignment reference. When null/undefined, falls back to today's
   *  plain CSS grid unchanged. */
  backgroundImageUrl?: string | null;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const dragRef = useRef<{ pointerId: number; startClient: Point; startPan: Point } | null>(null);
  // Active touch/pointer contacts on the viewport, keyed by pointerId — tracked so a
  // second finger touching down can be detected and switch from single-finger pan to
  // two-finger pinch-zoom.
  const pointersRef = useRef<Map<number, Point>>(new Map());
  const pinchRef = useRef<{ startDistance: number; startZoom: number; startWorld: Point } | null>(null);
  // Mirrors of the latest committed zoom/pan, updated both every render and immediately
  // inside zoomAt/pinch handling — the render-time sync covers external setters (Reset,
  // buttons), the in-handler update keeps rapid successive wheel/pinch events (which can
  // fire faster than React re-renders) reading fresh values instead of a stale render.
  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  zoomRef.current = zoom;
  panRef.current = pan;

  const clampPan = useCallback((next: Point, z: number): Point => {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return next;
    const floorWidth = rect.width * FLOOR_SIZE_MULTIPLIER * z;
    const floorHeight = rect.height * FLOOR_SIZE_MULTIPLIER * z;
    const minX = Math.min(0, rect.width - floorWidth) - OVERSCAN_PX;
    const minY = Math.min(0, rect.height - floorHeight) - OVERSCAN_PX;
    return {
      x: Math.min(OVERSCAN_PX, Math.max(minX, next.x)),
      y: Math.min(OVERSCAN_PX, Math.max(minY, next.y)),
    };
  }, []);

  // Shared by wheel-zoom and the +/- buttons: zoom to `nextZoomRaw`, keeping whatever
  // world point currently sits under (clientX, clientY) fixed on screen — Google
  // Maps/Figma-style anchored zoom. Buttons pass the viewport's own center as the anchor.
  const zoomAt = useCallback(
    (nextZoomRaw: number, clientX: number, clientY: number) => {
      const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoomRaw));
      const rect = viewportRef.current?.getBoundingClientRect();
      if (!rect) {
        zoomRef.current = clamped;
        setZoom(clamped);
        return;
      }
      const ax = clientX - rect.left;
      const ay = clientY - rect.top;
      const prevZoom = zoomRef.current;
      const prevPan = panRef.current;
      const worldX = (ax - prevPan.x) / prevZoom;
      const worldY = (ay - prevPan.y) / prevZoom;
      const nextPan = clampPan({ x: ax - worldX * clamped, y: ay - worldY * clamped }, clamped);
      zoomRef.current = clamped;
      panRef.current = nextPan;
      setZoom(clamped);
      setPan(nextPan);
    },
    [clampPan],
  );

  function zoomByButton(factor: number) {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return;
    zoomAt(zoomRef.current * factor, rect.left + rect.width / 2, rect.top + rect.height / 2);
  }

  function resetZoom() {
    zoomRef.current = MIN_ZOOM;
    panRef.current = { x: 0, y: 0 };
    setZoom(MIN_ZOOM);
    setPan({ x: 0, y: 0 });
  }

  // Mouse wheel and trackpad gestures both arrive as native `wheel` events — a plain
  // mouse scroll, a trackpad two-finger scroll, and (in Chromium/Firefox) a trackpad
  // pinch gesture reported as `ctrl+wheel`. All three are treated the same way here.
  // Attached via a raw listener (not React's onWheel) with `passive: false` so
  // preventDefault() reliably stops the page from scrolling/zooming while the cursor is
  // over the map.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    function handleWheel(e: WheelEvent) {
      e.preventDefault();
      const clampedDelta = Math.max(-WHEEL_DELTA_CLAMP, Math.min(WHEEL_DELTA_CLAMP, e.deltaY));
      const factor = Math.exp(-clampedDelta * WHEEL_ZOOM_SENSITIVITY);
      zoomAt(zoomRef.current * factor, e.clientX, e.clientY);
    }
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [zoomAt]);

  function handleViewportPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size === 2) {
      // Second finger down: hand off from single-finger pan to two-finger pinch-zoom.
      dragRef.current = null;
      const [p1, p2] = Array.from(pointersRef.current.values());
      const rect = viewportRef.current?.getBoundingClientRect();
      const startZoom = zoomRef.current;
      const startPan = panRef.current;
      const mid = pointerMidpoint(p1, p2);
      const startWorld = rect
        ? { x: (mid.x - rect.left - startPan.x) / startZoom, y: (mid.y - rect.top - startPan.y) / startZoom }
        : { x: 0, y: 0 };
      pinchRef.current = { startDistance: pointerDistance(p1, p2), startZoom, startWorld };
      setIsPanning(true);
    } else if (pointersRef.current.size === 1) {
      dragRef.current = { pointerId: e.pointerId, startClient: { x: e.clientX, y: e.clientY }, startPan: pan };
      setIsPanning(true);
    }
  }

  function handleViewportPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (pointersRef.current.has(e.pointerId)) {
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    if (pointersRef.current.size === 2 && pinchRef.current) {
      const [p1, p2] = Array.from(pointersRef.current.values());
      const rect = viewportRef.current?.getBoundingClientRect();
      if (!rect) return;
      const { startDistance, startZoom, startWorld } = pinchRef.current;
      const distance = pointerDistance(p1, p2);
      // Guard near-zero distance (fingers landed on top of each other) to avoid a
      // division blowing the ratio up to an extreme zoom in one frame.
      const ratio = startDistance > 1 ? distance / startDistance : 1;
      const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, startZoom * ratio));
      const mid = pointerMidpoint(p1, p2);
      const nextPan = clampPan(
        { x: mid.x - rect.left - startWorld.x * nextZoom, y: mid.y - rect.top - startWorld.y * nextZoom },
        nextZoom,
      );
      zoomRef.current = nextZoom;
      panRef.current = nextPan;
      setZoom(nextZoom);
      setPan(nextPan);
      return;
    }

    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.startClient.x;
    const dy = e.clientY - drag.startClient.y;
    const nextPan = clampPan({ x: drag.startPan.x + dx, y: drag.startPan.y + dy }, zoom);
    panRef.current = nextPan;
    setPan(nextPan);
  }

  // Purely decorative bay/row divider lines — bolder than the fine tile-seam grid
  // below, in world-percent (not px) so they land on evenly-spaced FLOOR_BAYS x
  // FLOOR_ROWS boundaries, like painted floor lines marking out work bays. Shared
  // between the no-image case (painted at full strength, directly on the world layer's
  // own background) and the image case (painted faintly on a separate overlay div
  // stacked on top of the photo, kept purely as a rough visual scale/alignment aid).
  // Machine placement (mapX/mapY) is a freeform percentage independent of this grid —
  // there is no bay/row coordinate a machine is snapped to or labeled with.
  const bayRowGridImage = [
    `repeating-linear-gradient(90deg, transparent 0, transparent calc(100%/${FLOOR_BAYS} - 1px), color-mix(in srgb, var(--text-muted) 40%, transparent) calc(100%/${FLOOR_BAYS} - 1px), color-mix(in srgb, var(--text-muted) 40%, transparent) calc(100%/${FLOOR_BAYS}))`,
    `repeating-linear-gradient(0deg, transparent 0, transparent calc(100%/${FLOOR_ROWS} - 1px), color-mix(in srgb, var(--text-muted) 40%, transparent) calc(100%/${FLOOR_ROWS} - 1px), color-mix(in srgb, var(--text-muted) 40%, transparent) calc(100%/${FLOOR_ROWS}))`,
  ].join(", ");

  function endPan(e: React.PointerEvent<HTMLDivElement>) {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) {
      pinchRef.current = null;
    }
    if (pointersRef.current.size === 1) {
      // One finger lifted out of a pinch — resume single-finger pan from here instead of
      // just stopping, so the gesture flows continuously into a drag.
      const [[pointerId, point]] = Array.from(pointersRef.current.entries());
      dragRef.current = { pointerId, startClient: point, startPan: panRef.current };
      setIsPanning(true);
      return;
    }
    if (pointersRef.current.size === 0) {
      dragRef.current = null;
      setIsPanning(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FloorLegend />
        <div data-tour="plant-map-zoom" className="flex items-center gap-1 rounded-lg border border-hairline p-1">
          <button
            type="button"
            onClick={() => zoomByButton(1 / ZOOM_BUTTON_FACTOR)}
            disabled={zoom <= MIN_ZOOM + ZOOM_EPSILON}
            className="h-6 w-6 rounded-md text-sm font-medium text-secondary transition-colors hover:bg-surface-2 disabled:opacity-40"
            aria-label="Zoom out"
          >
            −
          </button>
          <span className="w-10 text-center text-xs tabular-nums text-muted">{Math.round((zoom / MIN_ZOOM) * 100)}%</span>
          <button
            type="button"
            onClick={() => zoomByButton(ZOOM_BUTTON_FACTOR)}
            disabled={zoom >= MAX_ZOOM - ZOOM_EPSILON}
            className="h-6 w-6 rounded-md text-sm font-medium text-secondary transition-colors hover:bg-surface-2 disabled:opacity-40"
            aria-label="Zoom in"
          >
            +
          </button>
          {(zoom > MIN_ZOOM + ZOOM_EPSILON || pan.x !== 0 || pan.y !== 0) && (
            <button type="button" onClick={resetZoom} className="px-1.5 text-xs font-medium text-muted hover:text-primary">
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Caution-stripe frame around the whole floor — a factory floor's most
          recognizable visual cue (a marked work-cell boundary), kept thin so it reads
          as an accent rather than a warning. */}
      <div
        className="relative overflow-hidden rounded-xl p-2"
        style={{ background: "repeating-linear-gradient(45deg, #d99a06 0 10px, #1c1a16 10px 20px)" }}
      >
        <div
          ref={viewportRef}
          className={`relative overflow-hidden rounded-lg border border-hairline bg-surface-2 [touch-action:none] ${
            isPanning ? "cursor-grabbing" : "cursor-grab"
          }`}
          style={{
            height: `${VIEWPORT_HEIGHT_REM}rem`,
            // The texture lives on the viewport itself (never transformed, always covers
            // the full box) rather than on the panned/scaled world layer below — a
            // transformed element's background is clipped to its own box, so panning that
            // box would reveal blank surface-2 past its edge instead of more texture.
            // Shifting backgroundPosition by the same `pan` and pre-scaling cell size by
            // `zoom` keeps it pixel-aligned with the world layer's machines at every
            // pan/zoom (a child at local position L renders at pan + zoom*L under
            // `translate(pan) scale(zoom)`; a line at the same L needs the same math).
            // Two layers: a fine tile-seam grid (as before) plus a faint diagonal
            // crosshatch standing in for poured-concrete floor texture. Dropped
            // entirely once a real floor-plan image is set — a real photo already has
            // its own floor texture, and this decorative crosshatch would clash with it.
            backgroundImage: backgroundImageUrl
              ? undefined
              : [
                  "repeating-linear-gradient(0deg, var(--hairline) 0, var(--hairline) 1px, transparent 1px, transparent var(--floor-cell))",
                  "repeating-linear-gradient(90deg, var(--hairline) 0, var(--hairline) 1px, transparent 1px, transparent var(--floor-cell))",
                  "repeating-linear-gradient(45deg, color-mix(in srgb, var(--hairline) 50%, transparent) 0, color-mix(in srgb, var(--hairline) 50%, transparent) 1px, transparent 1px, transparent calc(var(--floor-cell) / 2))",
                ].join(", "),
            backgroundPosition: `${pan.x}px ${pan.y}px`,
            // Rebased off MIN_ZOOM, same as the displayed percentage above — otherwise the
            // grid would render at half its usual density at the (now 0.5-raw-scale) resting
            // zoom instead of looking exactly as it did before this floor-size change.
            "--floor-cell": `${2.5 * (zoom / MIN_ZOOM)}rem`,
            boxShadow: "inset 0 0 2.5rem color-mix(in srgb, black 12%, transparent)",
          } as React.CSSProperties}
          onPointerDown={handleViewportPointerDown}
          onPointerMove={handleViewportPointerMove}
          onPointerUp={endPan}
          onPointerCancel={endPan}
        >
          <div
            ref={surfaceRef}
            {...surfaceProps}
            className={`absolute left-0 top-0 ${surfaceProps?.className ?? ""}`}
            style={{
              width: `${FLOOR_SIZE_MULTIPLIER * 100}%`,
              height: `${FLOOR_SIZE_MULTIPLIER * 100}%`,
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "0 0",
              // Purely decorative bay/row divider lines — bolder than the fine
              // tile-seam grid above, like painted floor lines marking out work bays
              // (see bayRowGridImage above). Living on this transformed layer (not the
              // viewport) means they pan/scale for free with the machines. Once a
              // floor-plan image is set, these lines move to a separate overlay
              // div below (a background-image here would paint behind the <img>, not
              // over it, regardless of DOM order) — this own background is only used
              // in the no-image fallback.
              backgroundImage: backgroundImageUrl ? undefined : bayRowGridImage,
              ...surfaceProps?.style,
            }}
          >
            {backgroundImageUrl && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element -- admin-uploaded, arbitrary-origin image; next/image's domain allowlist doesn't fit a per-company upload. */}
                <img
                  src={backgroundImageUrl}
                  alt=""
                  className="pointer-events-none absolute inset-0 h-full w-full select-none"
                  style={{ objectFit: "fill" }}
                  draggable={false}
                />
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{ backgroundImage: bayRowGridImage, opacity: 0.35 }}
                />
              </>
            )}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * The equipment tile itself — an illustrated machine asset (see
 * components/machineAssets/) rather than an abstract chip, so the floor map reads as
 * real equipment sitting on the real photo behind it. No name label is rendered here
 * on purpose — callers show identifying details on hover (see PlantMap.tsx's and
 * PlantMapEditor.tsx's own hover-tooltip wrappers) rather than a permanent chip
 * competing with the floor-plan image for space. A small severity-colored dot (reuses
 * the .pulse-dot keyframe already defined in globals.css, same convention as
 * MachineCard) is the only status indicator that stays always-visible, in the same
 * corner position the old chassis tile used. Purely presentational: callers own
 * positioning (absolute + left/top percent) and interactivity (Link vs. draggable div).
 * Machines in critical condition (online, worst severity) additionally get the
 * `.machine-radiation-glow` ring (globals.css) around the icon — an ambient, always-
 * visible "hot" indicator distinct from the small hover-independent status dot below.
 */
export function MachineTile({
  severity,
  online,
  stale,
}: {
  severity: Severity;
  online: boolean;
  stale?: boolean;
}) {
  const color = SEVERITY_COLOR[severity];
  const Asset = MACHINE_ASSETS[DEFAULT_MACHINE_ASSET_KEY];
  const critical = online && severity === "critical";
  return (
    <span className="flex flex-col items-center" data-stale={stale ? "true" : undefined}>
      <span className="flex flex-col items-center transition-transform group-hover:scale-105">
        <span className={`relative ${critical ? "machine-radiation-glow" : ""}`}>
          <Asset className="h-11 w-[3.7rem] shrink-0 drop-shadow-[0_2px_3px_rgba(0,0,0,0.35)]" />
          {/* Bottom-right, not top-right — the Gbotz editor puts its own "unplace" ×
              button at -right/-top of this same tile, and the two would otherwise sit
              on top of each other. */}
          <span
            className={`absolute -right-1 -bottom-1 h-2.5 w-2.5 rounded-full border border-surface-1 ${online ? "pulse-dot" : ""}`}
            style={{ backgroundColor: online ? color : "var(--text-muted)" }}
          />
        </span>
        {/* Grounded shadow — pins the unit to the floor instead of floating. */}
        <span
          className="-mt-0.5 h-1.5 w-9 rounded-[50%] blur-[2px]"
          style={{ backgroundColor: "color-mix(in srgb, var(--surface-2) 40%, black 60%)" }}
        />
      </span>
    </span>
  );
}
