"use client";

import { useRef } from "react";
import { useChartPalette } from "@/components/charts/chartTheme";
import {
  DUR_GAUGE_SETTLE,
  DUR_GAUGE_SWEEP,
  DUR_UPDATE,
  EASE_SETTLE,
  EASE_SWEEP,
  EASE_UPDATE,
  gsap,
  prefersReducedMotion,
  useGSAP,
} from "@/lib/animation";

export interface ArcZone {
  /** Upper bound of this zone, in the gauge's own value units. Zones are consumed in
   *  order and must cover [min, max] with no gaps. */
  to: number;
  color: string;
}

const SIZE = 140;
const STROKE = 11;
const RADIUS = 54;
const CENTER_X = SIZE / 2;
const CENTER_Y = SIZE / 2;

function pointOnArc(angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CENTER_X + RADIUS * Math.cos(rad), y: CENTER_Y + RADIUS * Math.sin(rad) };
}

function describeArc(startAngle: number, endAngle: number) {
  const start = pointOnArc(startAngle);
  const end = pointOnArc(endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

/**
 * A dial gauge: a fixed good/warning/critical colored arc (the zones never move) with
 * a needle pointing at the live value — covers vibration/RPM/flow/pressure/humidity,
 * from a half-circle sweep up to a near-full-circle speedometer via `sweep`.
 */
export function MiniArcGauge({
  value,
  min,
  max,
  zones,
  sweep = 180,
  valueLabel,
  subLabel,
  size = SIZE,
}: {
  value: number;
  min: number;
  max: number;
  zones: ArcZone[];
  /** Total degrees the dial sweeps, centered at top-dead-center. 180 = half circle. */
  sweep?: number;
  valueLabel?: string;
  subLabel?: string;
  size?: number;
}) {
  const palette = useChartPalette();
  const startAngle = -sweep / 2;
  const span = max - min || 1;
  const clamped = Math.min(max, Math.max(min, value));
  const needle = pointOnArc(startAngle + ((clamped - min) / span) * sweep);

  const needleRef = useRef<SVGLineElement | null>(null);
  const proxyRef = useRef({ v: clamped });
  const isFirstRunRef = useRef(true);

  // Needle position is driven imperatively via GSAP (direct SVG attribute writes on
  // needleRef, bypassing React re-render for the animated frames) rather than by
  // React state, per the standard GSAP+React pattern — animating through state would
  // force a re-render on every tween frame.
  useGSAP(() => {
    if (!needleRef.current) return;
    const isFirstRun = isFirstRunRef.current;
    isFirstRunRef.current = false;

    function applyAngle(v: number) {
      const angle = startAngle + ((Math.min(max, Math.max(min, v)) - min) / span) * sweep;
      const p = pointOnArc(angle);
      needleRef.current?.setAttribute("x2", p.x.toFixed(2));
      needleRef.current?.setAttribute("y2", p.y.toFixed(2));
    }

    gsap.killTweensOf(proxyRef.current);

    if (prefersReducedMotion()) {
      proxyRef.current.v = clamped;
      applyAngle(clamped);
      return;
    }

    if (isFirstRun) {
      // The "instrument cluster boot" effect: sweep to the far end of the scale, then
      // settle back to the real value with a single soft overshoot.
      gsap
        .timeline({ onUpdate: () => applyAngle(proxyRef.current.v) })
        .fromTo(proxyRef.current, { v: min }, { v: max, duration: DUR_GAUGE_SWEEP, ease: EASE_SWEEP })
        .to(proxyRef.current, { v: clamped, duration: DUR_GAUGE_SETTLE, ease: EASE_SETTLE });
    } else {
      // Later live-telemetry updates: a plain tween straight to the new value, no
      // repeated overshoot — the boot sweep is a one-time entrance, not a per-tick
      // replay.
      gsap.to(proxyRef.current, {
        v: clamped,
        duration: DUR_UPDATE,
        ease: EASE_UPDATE,
        onUpdate: () => applyAngle(proxyRef.current.v),
      });
    }
  }, [clamped]);

  const zoneArcs = zones.reduce<{ from: number; arcs: { d: string; color: string }[] }>(
    (acc, zone) => {
      const to = Math.min(max, zone.to);
      const a0 = startAngle + ((Math.max(min, acc.from) - min) / span) * sweep;
      const a1 = startAngle + ((Math.min(max, to) - min) / span) * sweep;
      acc.arcs.push({ d: describeArc(a0, a1), color: zone.color });
      return { from: to, arcs: acc.arcs };
    },
    { from: min, arcs: [] }
  ).arcs;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full" style={{ maxWidth: size }}>
        {zoneArcs.map((z, i) => (
          <path key={i} d={z.d} fill="none" stroke={z.color} strokeWidth={STROKE} strokeLinecap="round" />
        ))}
        <line
          ref={needleRef}
          x1={CENTER_X}
          y1={CENTER_Y}
          x2={needle.x}
          y2={needle.y}
          stroke={palette.text}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <circle cx={CENTER_X} cy={CENTER_Y} r={4} fill={palette.text} />
        {valueLabel && (
          <text x={CENTER_X} y={CENTER_Y + 24} textAnchor="middle" fontSize={17} fontWeight={700} fill={palette.text}>
            {valueLabel}
          </text>
        )}
      </svg>
      {subLabel && <span className="text-[11px] text-muted">{subLabel}</span>}
    </div>
  );
}
