import { resolveTelemetryField } from "@/lib/dashboardTemplate/resolveField";
import type { Telemetry } from "@/lib/types";

export interface ComparisonItem {
  label: string;
  value: number;
  color: string;
}

/**
 * Shared by bar_chart/pie_chart/radar_chart — all three compare several fields of the
 * same machine's current snapshot (same fields/labels convention as trend_chart's
 * multi-series mode), differing only in how the result gets drawn.
 */
export function resolveFieldComparison(
  latest: Telemetry | null,
  fields: string,
  labels: string | undefined,
  palette: { series: string[] }
): ComparisonItem[] {
  const fieldList = fields
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean);
  const labelList = (labels ?? "").split(",").map((l) => l.trim());
  return fieldList.map((field, i) => ({
    label: labelList[i] || field,
    value: resolveTelemetryField(latest, field) ?? 0,
    color: palette.series[i % palette.series.length]!,
  }));
}
