"use client";

import { useTemplateMachineSeries } from "@/lib/dashboardTemplate/useTemplateMachineSeries";
import { useChartPalette } from "@/components/charts/chartTheme";
import { resolveFieldComparison } from "@/lib/dashboardTemplate/resolveFieldComparison";
import { RadarChart } from "@/components/charts/RadarChart";

export interface TemplateRadarChartProps {
  machineId: string;
  fields: string;
  labels?: string;
  unit?: string;
  colorIndex?: number;
}

export function TemplateRadarChart({ machineId, fields, labels, unit, colorIndex = 0 }: TemplateRadarChartProps) {
  const { latest } = useTemplateMachineSeries(machineId);
  const palette = useChartPalette();
  const items = resolveFieldComparison(latest, fields, labels, palette);
  return <RadarChart items={items} unit={unit} color={palette.series[colorIndex % palette.series.length]} />;
}
