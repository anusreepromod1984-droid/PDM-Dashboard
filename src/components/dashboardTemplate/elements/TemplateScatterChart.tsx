"use client";

import { useTemplateMachineSeries } from "@/lib/dashboardTemplate/useTemplateMachineSeries";
import { ScatterChart } from "@/components/charts/ScatterChart";
import { useChartPalette } from "@/components/charts/chartTheme";
import { resolveTelemetryField } from "@/lib/dashboardTemplate/resolveField";

export interface TemplateScatterChartProps {
  machineId: string;
  xField: string;
  yField: string;
  xLabel: string;
  yLabel: string;
  xUnit?: string;
  yUnit?: string;
  colorIndex?: number;
}

export function TemplateScatterChart({
  machineId,
  xField,
  yField,
  xLabel,
  yLabel,
  xUnit,
  yUnit,
  colorIndex = 0,
}: TemplateScatterChartProps) {
  const { history } = useTemplateMachineSeries(machineId);
  const palette = useChartPalette();

  const points = history
    .map((t) => {
      const x = resolveTelemetryField(t, xField);
      const y = resolveTelemetryField(t, yField);
      return x === null || y === null ? null : { x, y, timestamp: t.timestamp };
    })
    .filter((p): p is { x: number; y: number; timestamp: number } => p !== null);

  return (
    <ScatterChart
      points={points}
      xLabel={xLabel}
      yLabel={yLabel}
      xSuffix={xUnit}
      ySuffix={yUnit}
      color={palette.series[colorIndex % palette.series.length]}
    />
  );
}
