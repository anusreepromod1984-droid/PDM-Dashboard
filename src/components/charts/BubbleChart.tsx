"use client";

import { useState } from "react";
import { useChartPalette } from "@/components/charts/chartTheme";
import { useContainerWidth } from "@/components/charts/useContainerWidth";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
import { StatusBadge } from "@/components/StatusBadge";
import { formatTickNumber, niceTicks, scaleLinear, scaleSqrtArea } from "@/lib/chartMath";
import type { Severity } from "@/lib/types";

export interface Bubble {
  id: string;
  label: string;
  x: number;
  y: number;
  size: number;
  severity: Severity;
}

const SEVERITY_COLOR: Record<Severity, string> = {
  good: "var(--status-good)",
  warning: "var(--status-warning)",
  critical: "var(--status-critical)",
};

const LEFT_PAD = 54;
const RIGHT_PAD = 24;
const TOP_PAD = 28;
const BOTTOM_PAD = 40;
const MIN_RADIUS = 16;
const MAX_RADIUS = 38;

export function BubbleChart({
  bubbles,
  xLabel,
  yLabel,
  xSuffix,
  ySuffix,
  sizeLabel,
  sizeSuffix,
  height = 320,
}: {
  bubbles: Bubble[];
  xLabel: string;
  yLabel: string;
  xSuffix?: string;
  ySuffix?: string;
  sizeLabel: string;
  sizeSuffix?: string;
  height?: number;
}) {
  const palette = useChartPalette();
  const [containerRef, width] = useContainerWidth(560);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);

  const plotWidth = Math.max(10, width - LEFT_PAD - RIGHT_PAD);
  const plotHeight = Math.max(10, height - TOP_PAD - BOTTOM_PAD);

  const xs = bubbles.map((b) => b.x);
  const ys = bubbles.map((b) => b.y);
  const sizes = bubbles.map((b) => b.size);
  const xMin = Math.min(...xs, Infinity);
  const xMax = Math.max(...xs, -Infinity);
  const yMin = Math.min(...ys, Infinity);
  const yMax = Math.max(...ys, -Infinity);
  const sizeMin = Math.min(...sizes, Infinity);
  const sizeMax = Math.max(...sizes, -Infinity);
  const hasData = bubbles.length > 0 && Number.isFinite(xMin) && Number.isFinite(yMin);

  // Generous padding — bubbles have radius/labels that extend past their center point,
  // so the domain needs headroom or edge bubbles clip against the plot border.
  const xSpan = xMax - xMin || 1;
  const ySpan = yMax - yMin || 1;
  const xTicks = hasData ? niceTicks(xMin - xSpan * 0.3, xMax + xSpan * 0.3, 4) : [0, 1];
  const yTicks = hasData ? niceTicks(yMin - ySpan * 0.35, yMax + ySpan * 0.35, 4) : [0, 1];
  const xDomain: [number, number] = [xTicks[0], xTicks[xTicks.length - 1]];
  const yDomain: [number, number] = [yTicks[0], yTicks[yTicks.length - 1]];

  const xScale = scaleLinear(xDomain, [LEFT_PAD, LEFT_PAD + plotWidth]);
  const yScale = scaleLinear(yDomain, [TOP_PAD + plotHeight, TOP_PAD]);
  const radiusScale = scaleSqrtArea(
    Number.isFinite(sizeMin) && sizeMax > sizeMin ? [sizeMin, sizeMax] : [0, sizeMax || 1],
    [MIN_RADIUS, MAX_RADIUS]
  );

  const hovered = bubbles.find((b) => b.id === hoverId) ?? null;

  return (
    <div className="w-full">
      <div ref={containerRef} className="relative w-full" style={{ height }}>
        <svg width={width} height={height} role="img" aria-label={`Bubble chart of ${yLabel} against ${xLabel}, sized by ${sizeLabel}`}>
          <text x={LEFT_PAD} y={12} fontSize={10.5} fill={palette.muted} fontWeight={500}>
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
            bubbles.map((b) => {
              const r = radiusScale(b.size);
              const isHovered = hoverId === b.id;
              const cx = xScale(b.x);
              const cy = yScale(b.y);
              return (
                <g
                  key={b.id}
                  className="cursor-default"
                  onPointerMove={(evt) => {
                    const rect = evt.currentTarget.ownerSVGElement?.getBoundingClientRect();
                    setHoverId(b.id);
                    if (rect) setPointer({ x: evt.clientX - rect.left, y: evt.clientY - rect.top });
                  }}
                  onPointerLeave={() => {
                    setHoverId(null);
                    setPointer(null);
                  }}
                >
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill={SEVERITY_COLOR[b.severity]}
                    fillOpacity={isHovered ? 0.55 : 0.38}
                    stroke={SEVERITY_COLOR[b.severity]}
                    strokeWidth={2}
                  />
                  <text x={cx} y={cy - r - 8} textAnchor="middle" fontSize={11} fontWeight={600} fill={palette.text}>
                    {b.label}
                  </text>
                </g>
              );
            })}
        </svg>

        {hovered && pointer && (
          <ChartTooltip
            x={pointer.x}
            y={pointer.y}
            containerWidth={width}
            title={hovered.label}
            rows={[
              {
                label: xLabel,
                value: `${formatTickNumber(hovered.x)}${xSuffix ? ` ${xSuffix}` : ""}`,
                color: SEVERITY_COLOR[hovered.severity],
              },
              {
                label: yLabel,
                value: `${formatTickNumber(hovered.y)}${ySuffix ? ` ${ySuffix}` : ""}`,
                color: SEVERITY_COLOR[hovered.severity],
              },
              {
                label: sizeLabel,
                value: `${formatTickNumber(hovered.size)}${sizeSuffix ? ` ${sizeSuffix}` : ""}`,
                color: SEVERITY_COLOR[hovered.severity],
              },
            ]}
          />
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 px-1">
        <StatusBadge severity="good" />
        <StatusBadge severity="warning" />
        <StatusBadge severity="critical" />
        <span className="text-xs text-muted">· bubble size = {sizeLabel.toLowerCase()}</span>
      </div>
    </div>
  );
}
