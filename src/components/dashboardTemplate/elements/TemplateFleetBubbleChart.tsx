"use client";

import { useMachines, useRealtime } from "@/context/RealtimeProvider";
import { Card } from "@/components/Card";
import { BubbleChart } from "@/components/charts/BubbleChart";
import { faultSeverity, motorTempSeverity, vibrationSeverity, worstSeverity } from "@/lib/constants";

export interface TemplateFleetBubbleChartProps {
  title?: string;
  subtitle?: string;
}

/** The fleet health map — reproduces the hardcoded Plant Overview's bubble-chart
 *  computation verbatim (vibration vs motor temp, bubble size = power, colored by
 *  worst severity) across every machine, not just one. */
export function TemplateFleetBubbleChart({ title, subtitle }: TemplateFleetBubbleChartProps) {
  const { records } = useRealtime();
  const machines = useMachines();

  const bubbles = machines
    .map((m) => {
      const t = records[m.id]?.latest;
      if (!t) return null;
      const worstFault =
        t.motorFaults.length > 0 ? t.motorFaults.reduce((a, b) => (a.confidence > b.confidence ? a : b)) : null;
      const severity = worstSeverity([
        worstFault ? faultSeverity(worstFault.confidence) : "good",
        vibrationSeverity(t.imuAcceleration),
        motorTempSeverity(t.temperature.motor),
      ]);
      return { id: m.id, label: m.name, x: t.imuAcceleration, y: t.temperature.motor, size: t.energyMeter.power, severity };
    })
    .filter((b): b is NonNullable<typeof b> => b !== null);

  if (bubbles.length === 0) return null;

  return (
    <Card title={title ?? "Fleet health map"} subtitle={subtitle ?? "Vibration vs motor temperature — bubble size is power draw"}>
      <BubbleChart
        bubbles={bubbles}
        xLabel="Vibration"
        yLabel="Motor temp"
        xSuffix="mm/s"
        ySuffix="°C"
        sizeLabel="Power"
        sizeSuffix="kW"
      />
    </Card>
  );
}
