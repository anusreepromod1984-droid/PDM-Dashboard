"use client";

import { useTemplateMachineSeries } from "@/lib/dashboardTemplate/useTemplateMachineSeries";
import { SpectrumBarChart } from "@/components/charts/SpectrumBarChart";
import { useChartPalette } from "@/components/charts/chartTheme";

export interface TemplateSpectrumChartProps {
  machineId: string;
  source: "vibration" | "acoustic";
  unit: string;
  colorIndex?: number;
}

export function TemplateSpectrumChart({ machineId, source, unit, colorIndex }: TemplateSpectrumChartProps) {
  const { latest } = useTemplateMachineSeries(machineId);
  const palette = useChartPalette();
  const harmonics = source === "acoustic" ? latest?.microphone.harmonics : latest?.vibration.harmonics;

  if (!harmonics) return <p className="text-xs text-muted">No spectrum data</p>;

  return (
    <SpectrumBarChart
      harmonics={harmonics}
      amplitudeUnit={unit}
      color={colorIndex !== undefined ? palette.series[colorIndex % palette.series.length] : undefined}
    />
  );
}
