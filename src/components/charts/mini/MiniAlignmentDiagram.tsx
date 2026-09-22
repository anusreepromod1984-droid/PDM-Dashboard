"use client";

import { useChartPalette } from "@/components/charts/chartTheme";

/** Two coupled shafts with a dashed centerline and an offset annotation — orientation/alignment. */
export function MiniAlignmentDiagram({
  offset,
  limit,
  unit = "mm",
  color,
}: {
  offset: number;
  limit: number;
  unit?: string;
  color: string;
}) {
  const palette = useChartPalette();
  const width = 220;
  const height = 78;
  const midY = height / 2;
  // Exaggerated for legibility at this size — capped so an extreme reading doesn't run the
  // shaft off the viewBox.
  const shift = Math.min(16, (offset / (limit || 1)) * 16);

  return (
    <div className="flex flex-col gap-1">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        <line x1={14} x2={width - 14} y1={midY} y2={midY} stroke={palette.baseline} strokeDasharray="3,3" strokeWidth={1} />
        <rect x={14} y={midY - 11} width={72} height={22} rx={7} fill={palette.grid} stroke={palette.baseline} strokeWidth={1} />
        <rect x={width - 86} y={midY - 11 + shift} width={72} height={22} rx={7} fill={palette.grid} stroke={palette.baseline} strokeWidth={1} />
        <line x1={width / 2 - 6} x2={width / 2 - 6} y1={midY} y2={midY + shift} stroke={color} strokeWidth={2} />
        <line x1={width / 2 + 6} x2={width / 2 + 6} y1={midY} y2={midY + shift} stroke={color} strokeWidth={2} />
        <text x={width / 2} y={midY + shift + (shift >= 0 ? 22 : -14)} textAnchor="middle" fontSize={11} fontWeight={700} fill={color}>
          {offset.toFixed(2)} {unit}
        </text>
      </svg>
    </div>
  );
}
