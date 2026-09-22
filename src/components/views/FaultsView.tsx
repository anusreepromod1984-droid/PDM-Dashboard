"use client";

import { useMachineSeries } from "@/hooks/useMachineSeries";
import { useRealtime } from "@/context/RealtimeProvider";
import { Card } from "@/components/Card";
import { FaultGauge } from "@/components/FaultGauge";
import { StatusBadge } from "@/components/StatusBadge";
import { WaitingForData } from "@/components/WaitingForData";
import { TrendLineChart } from "@/components/charts/TrendLineChart";
import { useChartPalette } from "@/components/charts/chartTheme";
import { faultSeverity, visibleMotorFaults, worstSeverity } from "@/lib/constants";
import { isFaultBreached } from "@/lib/faultSignature";

export function FaultsView({ machineId }: { machineId: string }) {
  const { latest, history } = useMachineSeries(machineId);
  const { activeAlerts } = useRealtime();
  const palette = useChartPalette();

  if (!latest) return <WaitingForData />;

  const breaches = activeAlerts[machineId] ?? [];
  const faults = visibleMotorFaults(latest.motorFaults);
  const overall = worstSeverity(latest.motorFaults.map((f) => faultSeverity(f.confidence)));

  return (
    <div className="flex flex-col gap-6">
      <Card
        title="Fault model output"
        subtitle="Confidence per fault class from the onboard diagnostic model"
        actions={<StatusBadge severity={overall} />}
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {faults.map((f) => (
            <FaultGauge key={f.fault_code} fault={f} breached={isFaultBreached(breaches, f.fault_code)} />
          ))}
        </div>
      </Card>

      <Card title="Confidence trend" subtitle="All fault classes over time">
        <TrendLineChart
          yTitle="Confidence"
          series={latest.motorFaults.map((f, idx) => ({
            label: `${f.fault_code} · ${f.description}`,
            color: palette.series[idx % palette.series.length],
            points: history.map((h) => ({
              x: h.timestamp,
              y: h.motorFaults.find((mf) => mf.fault_code === f.fault_code)?.confidence ?? 0,
            })),
          }))}
        />
      </Card>
    </div>
  );
}
