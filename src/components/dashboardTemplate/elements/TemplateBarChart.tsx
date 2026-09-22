"use client";

import { useTemplateMachineSeries } from "@/lib/dashboardTemplate/useTemplateMachineSeries";
import { useChartPalette } from "@/components/charts/chartTheme";
import { resolveFieldComparison } from "@/lib/dashboardTemplate/resolveFieldComparison";
import { ComparisonBarChart } from "@/components/charts/ComparisonBarChart";

export interface TemplateBarChartProps {
  machineId: string;
  /** Comma-separated field paths — same convention as trend_chart's multi-series mode,
   *  compared at the current instant instead of over time. */
  fields: string;
  labels?: string;
  unit?: string;
}

export function TemplateBarChart({ machineId, fields, labels, unit }: TemplateBarChartProps) {
  const { latest } = useTemplateMachineSeries(machineId);
  const palette = useChartPalette();
  const items = resolveFieldComparison(latest, fields, labels, palette);
  return <ComparisonBarChart items={items} unit={unit} />;
}
