"use client";

import { useState } from "react";
import { useChartPalette } from "@/components/charts/chartTheme";
import { useContainerWidth } from "@/components/charts/useContainerWidth";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
import { formatTickNumber, formatTickTime, niceTicks, scaleLinear } from "@/lib/chartMath";

export interface ScatterPoint {
  x: number;
  y: number;
  timestamp: number;
}

const LEFT_PAD = 50;
const RIGHT_PAD = 16;
const TOP_PAD = 16;
const BOTTOM_PAD = 40;

export function ScatterChart({
  points,
  xLabel,
  yLabel,
  xSuffix,
  ySuffix,
  color,
  height = 280,
}: {
  points: ScatterPoint[];
  xLabel: string;
  yLabel: string;
  xSuffix?: string;
  ySuffix?: string;
  color?: string;
  height?: number;
}) {
  const palette = useChartPalette();
  const [containerRef, width] = useContainerWidth(560);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const dotColor = color ?? palette.series[0];

  const plotWidth = Math.max(10, width - LEFT_PAD - RIGHT_PAD);
  const plotHeight = Math.max(10, height - TOP_PAD - BOTTOM_PAD);

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const xMin = Math.min(...xs, Infinity);
  const xMax = Math.max(...xs, -Infinity);
  const yMin = Math.min(...ys, Infinity);
  const yMax = Math.max(...ys, -Infinity);
  const hasData = points.length > 0 && Number.isFinite(xMin) && Number.isFinite(yMin);

  const xSpan = xMax - xMin || 1;
  const ySpan = yMax - yMin || 1;
  const xTicks = hasData ? niceTicks(xMin - xSpan * 0.1, xMax + xSpan * 0.1, 5) : [0, 1];
  const yTicks = hasData ? niceTicks(yMin - ySpan * 0.15, yMax + ySpan * 0.15, 4) : [0, 1];
  const xDomain: [number, number] = [xTicks[0], xTicks[xTicks.length - 1]];
  const yDomain: [number, number] = [yTicks[0], yTicks[yTicks.length - 1]];

  const xScale = scaleLinear(xDomain, [LEFT_PAD, LEFT_PAD + plotWidth]);
  const yScale = scaleLinear(yDomain, [TOP_PAD + plotHeight, TOP_PAD]);

  const latestIndex = points.length - 1;

  // Nearest-point hover (by pixel distance, not just X) — dense scatter needs the
  // reader only to be closest to a point, not to land dead-center on an 8px dot.
  const handlePointerMove = (evt: React.PointerEvent<SVGRectElement>) => {
    if (!hasData) return;
    const rect = evt.currentTarget.ownerSVGElement?.getBoundingClientRect();
    if (!rect) return;
    const relX = evt.clientX - rect.left;
    const relY = evt.clientY - rect.top;
    let nearest = 0;
    let nearestDist = Infinity;
    points.forEach((p, i) => {
      const dx = xScale(p.x) - relX;
      const dy = yScale(p.y) - relY;
      const d = dx * dx + dy * dy;
      if (d < nearestDist) {
        nearestDist = d;
        nearest = i;
      }
    });
    setHoverIdx(nearest);
    setPointer({ x: relX, y: relY });
  };

  const handlePointerLeave = () => {
    setHoverIdx(null);
    setPointer(null);
  };

  return (
    <div className="w-full">
      <div ref={containerRef} className="relative w-full" style={{ height }}>
        <svg width={width} height={height} role="img" aria-label={`Scatter chart of ${yLabel} against ${xLabel}`}>
          <text x={LEFT_PAD} y={10} fontSize={10.5} fill={palette.muted} fontWeight={500}>
            {yLabel}
            {ySuffix ? ` (${ySuffix})` : ""}
          </text>

          {yTicks.map((t) => (
            <g key={`y${t}`}>
              <line x1={LEFT_PAD} x2={LEFT_PAD + plotWidth} y1={yScale(t)} y2={yScale(t)} stroke={palette.grid} strokeWidth={1} />
              <text x={LEFT_PAD - 8} y={yScale(t) + 3.5} textAnchor="end" fontSize={11} fill={palette.muted}>
                {formatTickNumber(t)}
              </text>
            </g>
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
            xTicks.map((t) => (
              <text key={`x${t}`} x={xScale(t)} y={TOP_PAD + plotHeight + 16} textAnchor="middle" fontSize={11} fill={palette.muted}>
                {formatTickNumber(t)}
              </text>
            ))}
          <text x={LEFT_PAD + plotWidth} y={height - 6} textAnchor="end" fontSize={10.5} fill={palette.muted} fontWeight={500}>
            {xLabel}
            {xSuffix ? ` (${xSuffix})` : ""}
          </text>

          {hasData &&
            points.map((p, i) => {
              const isLatest = i === latestIndex;
              // Older readings fade toward the background; the newest reading anchors the eye,
              // so drift toward a danger zone reads at a glance.
              const age = latestIndex > 0 ? i / latestIndex : 1;
              const opacity = isLatest ? 1 : 0.15 + age * 0.55;
              return (
                <circle
                  key={`${p.timestamp}-${i}`}
                  cx={xScale(p.x)}
                  cy={yScale(p.y)}
                  r={isLatest ? 6.5 : 4}
                  fill={dotColor}
                  fillOpacity={opacity}
                  stroke={isLatest ? palette.surface : "none"}
                  strokeWidth={isLatest ? 2 : 0}
                />
              );
            })}

          {hoverIdx !== null && points[hoverIdx] && (
            <circle
              cx={xScale(points[hoverIdx].x)}
              cy={yScale(points[hoverIdx].y)}
              r={9}
              fill="none"
              stroke={palette.textSecondary}
              strokeWidth={1.5}
            />
          )}

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

        {hoverIdx !== null && pointer && points[hoverIdx] && (
          <ChartTooltip
            x={pointer.x}
            y={pointer.y}
            containerWidth={width}
            title={formatTickTime(points[hoverIdx].timestamp)}
            rows={[
              {
                label: xLabel,
                value: `${formatTickNumber(points[hoverIdx].x)}${xSuffix ? ` ${xSuffix}` : ""}`,
                color: dotColor,
              },
              {
                label: yLabel,
                value: `${formatTickNumber(points[hoverIdx].y)}${ySuffix ? ` ${ySuffix}` : ""}`,
                color: dotColor,
              },
            ]}
          />
        )}
      </div>
      <p className="mt-2 px-1 text-[11px] text-muted">Faded dots are older readings · solid dot is the current reading</p>
    </div>
  );
}
