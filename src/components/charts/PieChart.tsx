"use client";

import { useState } from "react";
import { useChartPalette } from "@/components/charts/chartTheme";
import { useContainerWidth } from "@/components/charts/useContainerWidth";
import { ChartLegend } from "@/components/charts/ChartLegend";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
import { formatTickNumber, polarToCartesian } from "@/lib/chartMath";
import type { ComparisonItem } from "@/lib/dashboardTemplate/resolveFieldComparison";

function donutSlicePath(cx: number, cy: number, outerR: number, innerR: number, startAngle: number, endAngle: number) {
  // A perfect 360° sweep degenerates (start === end) — nudge it just short of a full
  // circle so the arc commands stay well-defined for a single-slice chart.
  const clampedEnd = endAngle - startAngle >= 359.999 ? startAngle + 359.999 : endAngle;
  const startOuter = polarToCartesian(cx, cy, outerR, startAngle);
  const endOuter = polarToCartesian(cx, cy, outerR, clampedEnd);
  const largeArcFlag = clampedEnd - startAngle <= 180 ? 0 : 1;

  if (innerR <= 0) {
    return `M${cx},${cy} L${startOuter.x},${startOuter.y} A${outerR},${outerR} 0 ${largeArcFlag} 1 ${endOuter.x},${endOuter.y} Z`;
  }
  const startInner = polarToCartesian(cx, cy, innerR, clampedEnd);
  const endInner = polarToCartesian(cx, cy, innerR, startAngle);
  return `M${startOuter.x},${startOuter.y} A${outerR},${outerR} 0 ${largeArcFlag} 1 ${endOuter.x},${endOuter.y} L${startInner.x},${startInner.y} A${innerR},${innerR} 0 ${largeArcFlag} 0 ${endInner.x},${endInner.y} Z`;
}

export function PieChart({
  items,
  height = 240,
  unit,
  donut = true,
}: {
  items: ComparisonItem[];
  height?: number;
  unit?: string;
  donut?: boolean;
}) {
  const palette = useChartPalette();
  const [containerRef, width] = useContainerWidth(400);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);

  const total = items.reduce((sum, item) => sum + Math.max(0, item.value), 0);
  const size = Math.min(width, height);
  const cx = width / 2;
  const cy = height / 2;
  const outerR = size / 2 - 8;
  const innerR = donut ? outerR * 0.6 : 0;

  const slices = items.map((item, idx) => {
    const priorSum = items.slice(0, idx).reduce((sum, it) => sum + Math.max(0, it.value), 0);
    const value = Math.max(0, item.value);
    const startAngle = total > 0 ? (priorSum / total) * 360 : 0;
    const endAngle = total > 0 ? ((priorSum + value) / total) * 360 : 0;
    return { ...item, startAngle, endAngle, fraction: total > 0 ? value / total : 0 };
  });

  const hovered = hoverIdx !== null ? slices[hoverIdx] : undefined;

  return (
    <div className="w-full">
      <div ref={containerRef} className="relative w-full" style={{ height }}>
        <svg width={width} height={height} role="img" aria-label="Pie chart">
          {slices.map((slice, i) => (
            <path
              key={slice.label}
              d={donutSlicePath(cx, cy, outerR, innerR, slice.startAngle, slice.endAngle)}
              fill={slice.color}
              opacity={hoverIdx === null || hoverIdx === i ? 1 : 0.45}
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
          ))}
          {donut && (
            <text x={cx} y={cy + 4} textAnchor="middle" fontSize={13} fontWeight={600} fill={palette.text}>
              {formatTickNumber(hovered ? hovered.value : total)}
            </text>
          )}
        </svg>

        {hovered && pointer && (
          <ChartTooltip
            x={pointer.x}
            y={pointer.y}
            containerWidth={width}
            title={hovered.label}
            rows={[
              {
                label: hovered.label,
                value: `${formatTickNumber(hovered.value)}${unit ? ` ${unit}` : ""} (${Math.round(hovered.fraction * 100)}%)`,
                color: hovered.color,
              },
            ]}
          />
        )}
      </div>
      <ChartLegend items={items.map((i) => ({ label: i.label, color: i.color }))} variant="rect" />
    </div>
  );
}
