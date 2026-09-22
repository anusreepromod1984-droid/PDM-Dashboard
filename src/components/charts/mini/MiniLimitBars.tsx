"use client";

import { useChartPalette } from "@/components/charts/chartTheme";

/** Horizontal bar per phase (L1/L2/L3-style) plus a shared vertical limit line — voltage imbalance. */
export function MiniLimitBars({
  bars,
  min,
  max,
  limit,
  unit,
}: {
  bars: { label: string; value: number; color: string }[];
  min: number;
  max: number;
  limit?: number;
  unit?: string;
}) {
  const palette = useChartPalette();
  const width = 220;
  const leftPad = 22;
  const rightPad = 34;
  const topPad = 4;
  const barGap = 5;
  const barHeight = 14;
  const height = topPad * 2 + bars.length * barHeight + (bars.length - 1) * barGap;
  const plotWidth = width - leftPad - rightPad;
  const span = max - min || 1;
  const scale = (v: number) => leftPad + ((Math.min(max, Math.max(min, v)) - min) / span) * plotWidth;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
      {bars.map((b, i) => {
        const y = topPad + i * (barHeight + barGap);
        const x1 = scale(b.value);
        return (
          <g key={b.label}>
            <text x={0} y={y + barHeight * 0.75} fontSize={9.5} fill={palette.muted}>
              {b.label}
            </text>
            <rect x={leftPad} y={y} width={plotWidth} height={barHeight} rx={3} fill={palette.grid} />
            <rect x={leftPad} y={y} width={Math.max(0, x1 - leftPad)} height={barHeight} rx={3} fill={b.color} />
            <text x={x1 + 5} y={y + barHeight * 0.75} fontSize={9.5} fontWeight={600} fill={palette.text}>
              {Math.round(b.value)}
              {unit}
            </text>
          </g>
        );
      })}
      {limit !== undefined && (
        <line x1={scale(limit)} x2={scale(limit)} y1={0} y2={height} stroke={palette.baseline} strokeDasharray="3,3" strokeWidth={1.5} />
      )}
    </svg>
  );
}
