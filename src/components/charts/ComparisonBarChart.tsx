"use client";

import { useState } from "react";
import { useChartPalette } from "@/components/charts/chartTheme";
import { useContainerWidth } from "@/components/charts/useContainerWidth";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
import { formatTickNumber, niceTicks, scaleLinear } from "@/lib/chartMath";
import type { ComparisonItem } from "@/lib/dashboardTemplate/resolveFieldComparison";

const LEFT_PAD = 46;
const RIGHT_PAD = 12;
const TOP_PAD = 18;
const BOTTOM_PAD = 30;
const MAX_BAR_WIDTH = 56;

function roundedTopPath(x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, Math.max(h, 0));
  if (h <= 0) return "";
  return `M${x},${y + h} L${x},${y + radius} Q${x},${y} ${x + radius},${y} L${x + w - radius},${y} Q${x + w},${y} ${x + w},${y + radius} L${x + w},${y + h} Z`;
}

export function ComparisonBarChart({ items, height = 240, unit }: { items: ComparisonItem[]; height?: number; unit?: string }) {
  const palette = useChartPalette();
  const [containerRef, width] = useContainerWidth(560);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);

  const plotWidth = Math.max(10, width - LEFT_PAD - RIGHT_PAD);
  const plotHeight = Math.max(10, height - TOP_PAD - BOTTOM_PAD);

  const maxValue = Math.max(...items.map((i) => i.value), 0);
  const yTicks = niceTicks(0, maxValue * 1.15 || 1, 4);
  const yDomain: [number, number] = [0, yTicks[yTicks.length - 1]!];
  const yScale = scaleLinear(yDomain, [TOP_PAD + plotHeight, TOP_PAD]);
  const baseline = TOP_PAD + plotHeight;

  const bandWidth = plotWidth / Math.max(1, items.length);
  const barWidth = Math.min(MAX_BAR_WIDTH, bandWidth * 0.55);

  return (
    <div className="w-full">
      <div ref={containerRef} className="relative w-full" style={{ height }}>
        <svg width={width} height={height} role="img" aria-label="Bar chart">
          {yTicks.map((t) => (
            <g key={t}>
              <line x1={LEFT_PAD} x2={LEFT_PAD + plotWidth} y1={yScale(t)} y2={yScale(t)} stroke={palette.grid} strokeWidth={1} />
              <text x={LEFT_PAD - 8} y={yScale(t) + 3.5} textAnchor="end" fontSize={11} fill={palette.muted}>
                {formatTickNumber(t)}
              </text>
            </g>
          ))}

          <line x1={LEFT_PAD} x2={LEFT_PAD + plotWidth} y1={baseline} y2={baseline} stroke={palette.baseline} strokeWidth={1} />

          {items.map((item, i) => {
            const bandStart = LEFT_PAD + i * bandWidth;
            const barX = bandStart + (bandWidth - barWidth) / 2;
            const barY = yScale(Math.max(0, item.value));
            const barH = baseline - barY;
            const isHovered = hoverIdx === i;
            return (
              <g key={item.label}>
                <path d={roundedTopPath(barX, barY, barWidth, barH, 4)} fill={item.color} opacity={isHovered ? 0.85 : 1} />
                <text x={bandStart + bandWidth / 2} y={barY - 8} textAnchor="middle" fontSize={11} fontWeight={600} fill={palette.textSecondary}>
                  {formatTickNumber(item.value)}
                </text>
                <text x={bandStart + bandWidth / 2} y={height - 10} textAnchor="middle" fontSize={11} fill={palette.textSecondary} fontWeight={500}>
                  {item.label}
                </text>
                <rect
                  x={bandStart}
                  y={TOP_PAD}
                  width={bandWidth}
                  height={plotHeight}
                  fill="transparent"
                  onPointerMove={(evt) => {
                    const rect = evt.currentTarget.ownerSVGElement?.getBoundingClientRect();
                    setHoverIdx(i);
                    if (rect) setPointer({ x: evt.clientX - rect.left, y: evt.clientY - rect.top });
                  }}
                  onPointerLeave={() => {
                    setHoverIdx(null);
                    setPointer(null);
                  }}
                />
              </g>
            );
          })}
        </svg>

        {hoverIdx !== null && pointer && items[hoverIdx] && (
          <ChartTooltip
            x={pointer.x}
            y={pointer.y}
            containerWidth={width}
            title={items[hoverIdx].label}
            rows={[
              {
                label: items[hoverIdx].label,
                value: `${formatTickNumber(items[hoverIdx].value)}${unit ? ` ${unit}` : ""}`,
                color: items[hoverIdx].color,
              },
            ]}
          />
        )}
      </div>
    </div>
  );
}
