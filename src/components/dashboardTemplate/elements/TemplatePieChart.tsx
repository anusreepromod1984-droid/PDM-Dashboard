"use client";

import { useTemplateMachineSeries } from "@/lib/dashboardTemplate/useTemplateMachineSeries";
import { useChartPalette } from "@/components/charts/chartTheme";
import { resolveFieldComparison } from "@/lib/dashboardTemplate/resolveFieldComparison";
import { PieChart } from "@/components/charts/PieChart";

export interface TemplatePieChartProps {
  machineId: string;
  fields: string;
  labels?: string;
  unit?: string;
  /** false renders a plain pie instead of a donut. */
  donut?: boolean;
}

export function TemplatePieChart({ machineId, fields, labels, unit, donut = true }: TemplatePieChartProps) {
  const { latest } = useTemplateMachineSeries(machineId);
  const palette = useChartPalette();
  const items = resolveFieldComparison(latest, fields, labels, palette);
  return <PieChart items={items} unit={unit} donut={donut} />;
}
