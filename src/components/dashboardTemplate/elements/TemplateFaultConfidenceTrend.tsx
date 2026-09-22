"use client";

import { useTemplateMachineSeries } from "@/lib/dashboardTemplate/useTemplateMachineSeries";
import { TrendLineChart } from "@/components/charts/TrendLineChart";
import { useChartPalette } from "@/components/charts/chartTheme";

export interface TemplateFaultConfidenceTrendProps {
  machineId: string;
}

/** One series per distinct fault class currently reported, plotted over history —
 *  verbatim translation of FaultsView's dynamic series-generation. */
export function TemplateFaultConfidenceTrend({ machineId }: TemplateFaultConfidenceTrendProps) {
  const { latest, history } = useTemplateMachineSeries(machineId);
  const palette = useChartPalette();
  const faults = latest?.motorFaults ?? [];

  if (faults.length === 0) return <p className="text-xs text-muted">No fault data</p>;

  const series = faults.map((f, idx) => ({
    label: `${f.fault_code} · ${f.description}`,
    color: palette.series[idx % palette.series.length],
    points: history.map((h) => ({
      x: h.timestamp,
      y: h.motorFaults.find((mf) => mf.fault_code === f.fault_code)?.confidence ?? 0,
    })),
  }));

  return <TrendLineChart series={series} yTitle="Confidence" />;
}
