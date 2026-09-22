"use client";

import { useMemo, useRef, useState } from "react";
import { useChartPalette } from "@/components/charts/chartTheme";
import { useContainerWidth } from "@/components/charts/useContainerWidth";
import { ChartLegend } from "@/components/charts/ChartLegend";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
import { declutter, formatTickNumber, formatTickTime, niceTicks, scaleLinear } from "@/lib/chartMath";
import { DUR_DRAW, EASE_DRAW, gsap, prefersReducedMotion, useGSAP } from "@/lib/animation";
import { OFFLINE_AFTER_MS } from "@/lib/constants";

/**
 * A series' points are sparse (only real samples, no padded nulls for missing
 * intervals — see backend/src/db/telemetryRepo.ts) so an offline/no-data stretch shows
 * up purely as a bigger-than-normal gap between two consecutive points' `x`. The
 * threshold is derived from each series' own typical sampling interval (its median
 * consecutive-point delta) rather than a fixed constant, since the same chart renders
 * both a "live" range (~5s cadence) and a "7d" range (backend-decimated to ~15min
 * cadence to stay under maxPoints) — a fixed threshold would misfire on one of them.
 * Floored at OFFLINE_AFTER_MS so a live range's own jitter never reads as an outage.
 */
function computeGapThreshold(points: { x: number }[]): number {
  if (points.length < 3) return Infinity;
  const deltas: number[] = [];
  for (let i = 1; i < points.length; i++) deltas.push(points[i]!.x - points[i - 1]!.x);
  deltas.sort((a, b) => a - b);
  const median = deltas[Math.floor(deltas.length / 2)]!;
  return median > 0 ? Math.max(median * 3, OFFLINE_AFTER_MS) : Infinity;
}

interface PointGroup {
  points: { x: number; y: number }[];
  /** True for the 2-point connector bridging a detected data gap — rendered as a
   *  muted dashed segment instead of a real data line. */
  isGap: boolean;
}

/** Splits one series' points into contiguous real-data runs plus, between any two
 *  runs separated by a gap, a 2-point bridge segment so the gap is still visible on
 *  the axis but never looks like a plotted, continuous reading. */
function splitAtGaps(points: { x: number; y: number }[], gapThreshold: number): PointGroup[] {
  if (points.length === 0) return [];
  const groups: PointGroup[] = [];
  let current: { x: number; y: number }[] = [points[0]!];
  for (let i = 1; i < points.length; i++) {
    if (points[i]!.x - points[i - 1]!.x > gapThreshold) {
      groups.push({ points: current, isGap: false });
      groups.push({ points: [points[i - 1]!, points[i]!], isGap: true });
      current = [points[i]!];
    } else {
      current.push(points[i]!);
    }
  }
  groups.push({ points: current, isGap: false });
  return groups;
}

export interface TrendSeries {
  label: string;
  color: string;
  points: { x: number; y: number }[];
  suffix?: string;
  /** Renders this series as a dashed line — e.g. a "baseline" reference series
   *  plotted alongside a solid "actual" series (same chart, two real series). */
  dashed?: boolean;
}

export interface TrendThreshold {
  value: number;
  color?: string;
  label?: string;
}

const PAD = {
  normal: { left: 50, right: 58, top: 14, bottom: 26, endLabelGap: 14, tickFont: 11, yTitleFont: 10.5 },
  compact: { left: 34, right: 8, top: 8, bottom: 16, endLabelGap: 10, tickFont: 9, yTitleFont: 9 },
};

export interface TrendMarker {
  x: number;
  label: string;
  kind?: "call" | "repair" | string;
}

export function TrendLineChart({
  series,
  height = 260,
  yTitle,
  filled = false,
  compact = false,
  thresholds,
  markers,
}: {
  series: TrendSeries[];
  height?: number;
  yTitle?: string;
  /** Area-chart mode — fills between each line and the plot baseline. */
  filled?: boolean;
  /** Card-sized rendering — tighter padding/fonts, no end-of-line value labels or
   *  legend; for use inside small metric-card mini-charts rather than a full panel. */
  compact?: boolean;
  /** Horizontal dashed reference lines (e.g. a "normal" limit) drawn across the plot. */
  thresholds?: TrendThreshold[];
  /** Vertical event lines — diagnosis call or post-repair recovery. */
  markers?: TrendMarker[];
}) {
  const palette = useChartPalette();
  const padCfg = compact ? PAD.compact : PAD.normal;
  const LEFT_PAD = padCfg.left;
  const RIGHT_PAD = padCfg.right;
  const TOP_PAD = padCfg.top;
  const BOTTOM_PAD = padCfg.bottom;
  const END_LABEL_GAP = padCfg.endLabelGap;
  const [containerRef, width] = useContainerWidth(compact ? 220 : 560);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);

  const plotWidth = Math.max(10, width - LEFT_PAD - RIGHT_PAD);
  const plotHeight = Math.max(10, height - TOP_PAD - BOTTOM_PAD);

  const referenceSeries = series.reduce((a, b) => (b.points.length > a.points.length ? b : a), series[0]);
  const pointCount = referenceSeries?.points.length ?? 0;

  const thresholdValues = (thresholds?.map((t) => t.value) ?? []).filter(Number.isFinite);
  const xs = series.flatMap((s) => s.points.map((p) => p.x)).filter(Number.isFinite);
  const ys = series.flatMap((s) => s.points.map((p) => p.y)).filter(Number.isFinite);
  const xMin = Math.min(...xs, Infinity);
  const xMax = Math.max(...xs, -Infinity);
  const rawYMin = Math.min(...ys, ...thresholdValues, Infinity);
  const rawYMax = Math.max(...ys, ...thresholdValues, -Infinity);
  const hasData =
    pointCount > 0
    && Number.isFinite(xMin)
    && Number.isFinite(xMax)
    && Number.isFinite(rawYMin)
    && Number.isFinite(rawYMax);

  const pad = (rawYMax - rawYMin) * 0.15 || Math.abs(rawYMax) * 0.1 || 1;
  const yTicks = useMemo(
    () => (hasData ? niceTicks(rawYMin - pad, rawYMax + pad, 4) : [0, 1]),
    [hasData, rawYMin, rawYMax, pad]
  );
  const yDomain: [number, number] = [yTicks[0], yTicks[yTicks.length - 1]];
  const xDomain: [number, number] = hasData ? [xMin, xMax] : [0, 1];

  const xScale = scaleLinear(xDomain, [LEFT_PAD, LEFT_PAD + plotWidth]);
  const yScale = scaleLinear(yDomain, [TOP_PAD + plotHeight, TOP_PAD]);

  const xTickCount = width < 480 ? 3 : 5;
  const xTicks = Array.from({ length: xTickCount }, (_, i) => xMin + ((xMax - xMin) * i) / (xTickCount - 1));

  // Plain computation, not useMemo — same rationale as endLabelItems below: series and
  // scale functions are recreated every render regardless, and these arrays are tiny.
  const gapThreshold = computeGapThreshold(referenceSeries?.points ?? []);
  const pointGroups: PointGroup[][] = series.map((s) => splitAtGaps(s.points, gapThreshold));
  const hasGap = pointGroups.some((groups) => groups.some((g) => g.isGap));

  const toPath = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? "M" : "L"}${xScale(p.x).toFixed(1)},${yScale(p.y).toFixed(1)}`).join(" ");

  // Area fill = each real (non-gap) run's own line, closed back along the baseline —
  // never filled under a gap-bridge segment, since there's no real reading to fill under.
  const areaPathsBySeries: string[][] = filled
    ? pointGroups.map((groups) =>
        groups
          .filter((g) => !g.isGap && g.points.length > 0)
          .map((g) => {
            const first = g.points[0]!;
            const last = g.points[g.points.length - 1]!;
            return `${toPath(g.points)} L${xScale(last.x).toFixed(1)},${(TOP_PAD + plotHeight).toFixed(1)} L${xScale(first.x).toFixed(1)},${(TOP_PAD + plotHeight).toFixed(1)} Z`;
          })
      )
    : [];

  // End-of-line value labels, decluttered so closely-converging series never stack their text.
  // (Plain computation, not useMemo — the series array and scale functions are recreated every
  // render anyway, and the array here is at most a handful of items.)
  const endLabelItems = series
    .map((s, i) => {
      const last = s.points[s.points.length - 1];
      if (!last) return null;
      return {
        seriesIndex: i,
        text: `${formatTickNumber(last.y)}${s.suffix ? ` ${s.suffix}` : ""}`,
        rawY: yScale(last.y),
      };
    })
    .filter((v): v is NonNullable<typeof v> => v !== null)
    .sort((a, b) => a.rawY - b.rawY);
  const declutteredY = declutter(
    endLabelItems.map((i) => i.rawY),
    END_LABEL_GAP
  );
  const endLabels = endLabelItems.map((item, idx) => ({ ...item, labelY: declutteredY[idx] }));

  const handlePointerMove = (evt: React.PointerEvent<SVGRectElement>) => {
    if (!hasData || pointCount === 0) return;
    const rect = evt.currentTarget.ownerSVGElement?.getBoundingClientRect();
    if (!rect) return;
    const relX = evt.clientX - rect.left;
    const fraction = Math.min(1, Math.max(0, (relX - LEFT_PAD) / plotWidth));
    const targetX = xDomain[0] + fraction * (xDomain[1] - xDomain[0]);
    let nearest = 0;
    let nearestDist = Infinity;
    referenceSeries.points.forEach((p, i) => {
      const d = Math.abs(p.x - targetX);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = i;
      }
    });
    setHoverIndex(nearest);
    setPointer({ x: evt.clientX - rect.left, y: evt.clientY - rect.top });
  };

  const handlePointerLeave = () => {
    setHoverIndex(null);
    setPointer(null);
  };

  const hoverX =
    hoverIndex !== null && referenceSeries?.points[hoverIndex] ? xScale(referenceSeries.points[hoverIndex].x) : null;

  const svgRef = useRef<SVGSVGElement | null>(null);

  // One-time draw-in reveal for solid (non-dashed) series lines, the first time real
  // data actually renders — not on every live-tick re-render after that: this chart
  // recomputes its whole coordinate system (axis domain) from the current data on
  // every render, so there's no stable "append to the existing path" to animate
  // incrementally, and re-triggering a draw-in on every tick would be both visually
  // noisy and a paint-forcing SVG animation running continuously instead of once.
  // Dashed reference-line series and gap-bridge segments are skipped (their own dash
  // pattern would conflict with the reveal's stroke-dasharray) and just render
  // instantly as before.
  useGSAP(() => {
    if (!hasData || !svgRef.current || prefersReducedMotion()) return;
    const paths = svgRef.current.querySelectorAll<SVGPathElement>("path[data-trend-draw='true']");
    paths.forEach((path) => {
      const len = path.getTotalLength();
      gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
      gsap.to(path, {
        strokeDashoffset: 0,
        duration: DUR_DRAW,
        ease: EASE_DRAW,
        onComplete: () => {
          path.style.strokeDasharray = "";
          path.style.strokeDashoffset = "";
        },
      });
    });
    // Deliberately depends only on hasData (false -> true == "data first arrived"),
    // not on series/linePaths — those change every live tick and must NOT retrigger
    // the draw-in.
  }, [hasData]);

  return (
    <div className="w-full">
      {/* overflow-hidden: `width` (from useContainerWidth) is a plain number applied
          as the SVG's literal width attribute, not a percentage — it's normally kept
          in sync with this container's real size via ResizeObserver, but this is a
          hard backstop against the one case that can still momentarily disagree (the
          very first paint, before that measurement lands) so the chart can never
          visually spill outside its card regardless. Matters most in narrow
          containers, like the /3d flow's half-viewport machine panel. */}
      <div ref={containerRef} className="relative w-full overflow-hidden" style={{ height }}>
        <svg
          ref={svgRef}
          width={width}
          height={height}
          role="img"
          aria-label={yTitle ? `Trend chart of ${yTitle}` : "Trend chart"}
        >
          {yTitle && (
            <text x={LEFT_PAD} y={10} fontSize={padCfg.yTitleFont} fill={palette.muted} fontWeight={500}>
              {yTitle}
            </text>
          )}

          {yTicks.map((t) => (
            <g key={t}>
              <line
                x1={LEFT_PAD}
                x2={LEFT_PAD + plotWidth}
                y1={yScale(t)}
                y2={yScale(t)}
                stroke={palette.grid}
                strokeWidth={1}
              />
              <text x={LEFT_PAD - 8} y={yScale(t) + 3.5} textAnchor="end" fontSize={padCfg.tickFont} fill={palette.muted}>
                {formatTickNumber(t)}
              </text>
            </g>
          ))}

          {thresholds?.map((th, i) => (
            <line
              key={i}
              x1={LEFT_PAD}
              x2={LEFT_PAD + plotWidth}
              y1={yScale(th.value)}
              y2={yScale(th.value)}
              stroke={th.color ?? palette.baseline}
              strokeWidth={1.5}
              strokeDasharray="4,3"
            />
          ))}

          <line x1={LEFT_PAD} x2={LEFT_PAD} y1={TOP_PAD} y2={TOP_PAD + plotHeight} stroke={palette.baseline} strokeWidth={1} />
          <line
            x1={LEFT_PAD}
            x2={LEFT_PAD + plotWidth}
            y1={TOP_PAD + plotHeight}
            y2={TOP_PAD + plotHeight}
            stroke={palette.baseline}
            strokeWidth={1}
          />

          {hasData &&
            xTicks.map((t, i) => (
              <text
                key={i}
                x={xScale(t)}
                y={height - 6}
                textAnchor={i === 0 ? "start" : i === xTicks.length - 1 ? "end" : "middle"}
                fontSize={padCfg.tickFont}
                fill={palette.muted}
              >
                {formatTickTime(t, xMax - xMin)}
              </text>
            ))}

          {filled &&
            hasData &&
            areaPathsBySeries.map((paths, i) =>
              paths.map((d, j) => (
                <path key={`${series[i].label}-area-${j}`} d={d} fill={series[i].color} fillOpacity={0.15} stroke="none" />
              ))
            )}

          {hasData &&
            pointGroups.map((groups, i) =>
              groups.map((g, j) => (
                <path
                  key={`${series[i].label}-${j}`}
                  data-trend-draw={!g.isGap && !series[i].dashed ? "true" : undefined}
                  d={toPath(g.points)}
                  fill="none"
                  stroke={g.isGap ? palette.muted : series[i].color}
                  strokeWidth={g.isGap ? 1.5 : 2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  strokeDasharray={g.isGap ? "2,5" : series[i].dashed ? "5,4" : undefined}
                  opacity={g.isGap ? 0.8 : 1}
                />
              ))
            )}

          {hasData &&
            series.map((s) => {
              const last = s.points[s.points.length - 1];
              if (!last) return null;
              return (
                <circle
                  key={s.label}
                  cx={xScale(last.x)}
                  cy={yScale(last.y)}
                  r={4}
                  fill={s.color}
                  stroke={palette.surface}
                  strokeWidth={2}
                />
              );
            })}

          {!compact &&
            hasData &&
            endLabels.map((item) => (
              <text
                key={item.seriesIndex}
                x={LEFT_PAD + plotWidth + 6}
                y={item.labelY + 3.5}
                fontSize={11}
                fontWeight={600}
                fill={palette.textSecondary}
              >
                {item.text}
              </text>
            ))}

          {hasData &&
            (markers ?? []).map((marker, i) => {
              if (!Number.isFinite(marker.x) || marker.x < xMin || marker.x > xMax) return null;
              const mx = xScale(marker.x);
              const isRepair = marker.kind === "repair";
              const color = isRepair ? "var(--status-good)" : "var(--status-warning)";
              return (
                <g key={`marker-${i}-${marker.x}`}>
                  <line
                    x1={mx}
                    x2={mx}
                    y1={TOP_PAD}
                    y2={TOP_PAD + plotHeight}
                    stroke={color}
                    strokeWidth={1.25}
                    strokeDasharray="3,3"
                    opacity={0.85}
                  />
                  {!compact && (
                    <text
                      x={mx + 4}
                      y={TOP_PAD + 10}
                      fontSize={9}
                      fill={color}
                      fontWeight={600}
                    >
                      {marker.label}
                    </text>
                  )}
                </g>
              );
            })}

          {hoverX !== null && (
            <line
              x1={hoverX}
              x2={hoverX}
              y1={TOP_PAD}
              y2={TOP_PAD + plotHeight}
              stroke={palette.baseline}
              strokeWidth={1}
              strokeDasharray="3,3"
            />
          )}
          {hoverIndex !== null &&
            series.map((s) => {
              const p = s.points[hoverIndex];
              if (!p) return null;
              return (
                <circle key={s.label} cx={xScale(p.x)} cy={yScale(p.y)} r={4} fill={s.color} stroke={palette.surface} strokeWidth={2} />
              );
            })}

          <rect
            x={LEFT_PAD}
            y={TOP_PAD}
            width={plotWidth}
            height={plotHeight}
            fill="transparent"
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
          />
        </svg>

        {hoverIndex !== null && pointer && referenceSeries?.points[hoverIndex] && (
          <ChartTooltip
            x={pointer.x}
            y={pointer.y}
            containerWidth={width}
            title={formatTickTime(referenceSeries.points[hoverIndex].x, xMax - xMin)}
            rows={series
              .filter((s) => s.points[hoverIndex])
              .map((s) => ({
                label: s.label,
                value: `${formatTickNumber(s.points[hoverIndex].y)}${s.suffix ? ` ${s.suffix}` : ""}`,
                color: s.color,
              }))}
          />
        )}
      </div>
      {!compact && <ChartLegend items={series.map((s) => ({ label: s.label, color: s.color }))} variant="line" />}
      {!compact && hasGap && (
        <div className="mt-1 flex items-center gap-1.5 px-1 text-xs text-muted">
          <span className="h-0 w-3.5 shrink-0 border-t-2 border-dashed" style={{ borderColor: palette.muted }} />
          <span>Gap — no data / machine offline</span>
        </div>
      )}
    </div>
  );
}
