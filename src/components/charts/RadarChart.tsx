"use client";

import { useState } from "react";
import { useChartPalette } from "@/components/charts/chartTheme";
import { useContainerWidth } from "@/components/charts/useContainerWidth";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
import { formatTickNumber, niceTicks, polarToCartesian, scaleLinear } from "@/lib/chartMath";
import type { ComparisonItem } from "@/lib/dashboardTemplate/resolveFieldComparison";

const AXIS_LABEL_PAD = 34;

function polygonPath(points: { x: number; y: number }[]) {
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + " Z";
}

export function RadarChart({
  items,
  height = 280,
  unit,
  color,
}: {
  items: ComparisonItem[];
  height?: number;
  unit?: string;
  color?: string;
}) {
  const palette = useChartPalette();
  const [containerRef, width] = useContainerWidth(400);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const fillColor = color ?? palette.series[0]!;

  const size = Math.min(width, height);
  const cx = width / 2;
  const cy = height / 2;
  const outerR = Math.max(10, size / 2 - AXIS_LABEL_PAD);

  const maxValue = Math.max(...items.map((i) => Math.max(0, i.value)), 0);
  const ticks = niceTicks(0, maxValue * 1.15 || 1, 4);
  const domain: [number, number] = [0, ticks[ticks.length - 1]!];
  const radialScale = scaleLinear(domain, [0, outerR]);

  const n = Math.max(items.length, 1);
  const angleStep = 360 / n;

  const axisPoints = items.map((_, i) => polarToCartesian(cx, cy, outerR, i * angleStep));
  const dataPoints = items.map((item, i) => polarToCartesian(cx, cy, radialScale(Math.max(0, item.value)), i * angleStep));

  return (
    <div className="w-full">
      <div ref={containerRef} className="relative w-full" style={{ height }}>
        <svg width={width} height={height} role="img" aria-label="Radar chart">
          {ticks.map((t) => (
            <path
              key={t}
              d={polygonPath(items.map((_, i) => polarToCartesian(cx, cy, radialScale(t), i * angleStep)))}
              fill="none"
              stroke={palette.grid}
              strokeWidth={1}
            />
          ))}

          {axisPoints.map((p, i) => <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={palette.baseline} strokeWidth={1} />)}

          <path d={polygonPath(dataPoints)} fill={fillColor} fillOpacity={0.22} stroke={fillColor} strokeWidth={2} strokeLinejoin="round" />

          {dataPoints.map((p, i) => (
            <circle
              key={items[i]!.label}
              cx={p.x}
              cy={p.y}
              r={hoverIdx === i ? 5 : 3.5}
              fill={fillColor}
              stroke={palette.surface}
              strokeWidth={1.5}
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

          {items.map((item, i) => {
            const angle = i * angleStep;
            const labelPoint = polarToCartesian(cx, cy, outerR + 16, angle);
            const anchor = angle === 0 || angle === 180 ? "middle" : angle > 0 && angle < 180 ? "start" : "end";
            return (
              <text key={item.label} x={labelPoint.x} y={labelPoint.y + 3.5} textAnchor={anchor} fontSize={11} fill={palette.textSecondary} fontWeight={500}>
                {item.label}
              </text>
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
                color: fillColor,
              },
            ]}
          />
        )}
      </div>
    </div>
  );
}
