"use client";

import { useTemplateMachineSeries } from "@/lib/dashboardTemplate/useTemplateMachineSeries";
import { TrendLineChart, type TrendSeries } from "@/components/charts/TrendLineChart";
import { useChartPalette } from "@/components/charts/chartTheme";
import { resolveTelemetryField } from "@/lib/dashboardTemplate/resolveField";
import type { Telemetry } from "@/lib/types";

export interface TemplateTrendChartProps {
  machineId: string;
  /** Single-series mode. */
  field?: string;
  label?: string;
  colorIndex?: number;
  /** Multi-series mode — comma-separated, same length, zipped positionally (matching
   *  every hardcoded multi-series chart's own convention: index 0/1/2 -> palette
   *  series 0/1/2, e.g. Ir/Iy/Ib or Roll/Pitch/Yaw). Takes precedence over field/label
   *  when both are given. */
  fields?: string;
  labels?: string;
  unit?: string;
  yTitle?: string;
  /** area_chart reuses this component verbatim with filled: true baked into its
   *  registry entry — same data, just filled under the line. */
  filled?: boolean;
}

function seriesPoints(history: Telemetry[], field: string) {
  return history
    .map((t) => {
      const y = resolveTelemetryField(t, field);
      return y === null ? null : { x: t.timestamp, y };
    })
    .filter((p): p is { x: number; y: number } => p !== null);
}

export function TemplateTrendChart({
  machineId,
  field,
  label,
  colorIndex = 0,
  fields,
  labels,
  unit,
  yTitle,
  filled = false,
}: TemplateTrendChartProps) {
  const { history } = useTemplateMachineSeries(machineId);
  const palette = useChartPalette();

  let series: TrendSeries[];
  if (fields) {
    const fieldList = fields.split(",").map((f) => f.trim());
    const labelList = (labels ?? "").split(",").map((l) => l.trim());
    series = fieldList.map((f, i) => ({
      label: labelList[i] || f,
      color: palette.series[i % palette.series.length],
      points: seriesPoints(history, f),
      suffix: unit,
    }));
  } else {
    series = [
      {
        label: label ?? field ?? "",
        color: palette.series[colorIndex % palette.series.length],
        points: seriesPoints(history, field ?? ""),
        suffix: unit,
      },
    ];
  }

  return <TrendLineChart series={series} yTitle={yTitle} filled={filled} />;
}
