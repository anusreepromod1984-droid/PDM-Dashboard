"use client";

import { useChartPalette } from "@/components/charts/chartTheme";

/** A single vertical fill bar against a max, colored by severity — dust/PM, tool wear. */
export function MiniThresholdBar({
  value,
  max,
  color,
  valueLabel,
  axisLabel,
}: {
  value: number;
  max: number;
  color: string;
  valueLabel: string;
  axisLabel?: string;
}) {
  const palette = useChartPalette();
  const width = 60;
  const height = 84;
  const barWidth = 24;
  const x = width / 2 - barWidth / 2;
  const clamped = Math.min(max, Math.max(0, value));
  const fillHeight = max > 0 ? (clamped / max) * height : 0;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[88px] w-auto">
        <rect x={x} y={0} width={barWidth} height={height} rx={5} fill={palette.grid} />
        <rect x={x} y={height - fillHeight} width={barWidth} height={fillHeight} rx={5} fill={color} />
      </svg>
      <span className="text-xs font-semibold" style={{ color }}>
        {valueLabel}
      </span>
      {axisLabel && <span className="text-[10px] text-muted">{axisLabel}</span>}
    </div>
  );
}
