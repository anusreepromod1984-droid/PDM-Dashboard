"use client";

import { useTemplateMachineSeries } from "@/lib/dashboardTemplate/useTemplateMachineSeries";
import { useRealtime } from "@/context/RealtimeProvider";
import { FaultGauge } from "@/components/FaultGauge";
import { visibleMotorFaults } from "@/lib/constants";
import { isFaultBreached } from "@/lib/faultSignature";

export interface TemplateFaultGaugeGridProps {
  machineId: string;
}

/** Every entry in motorFaults, not just the worst one (contrast with fault_gauge) —
 *  matches MachineOverviewView/FaultsView's grid. */
export function TemplateFaultGaugeGrid({ machineId }: TemplateFaultGaugeGridProps) {
  const { latest } = useTemplateMachineSeries(machineId);
  const { activeAlerts } = useRealtime();
  const faults = visibleMotorFaults(latest?.motorFaults ?? []);
  const breaches = activeAlerts[machineId] ?? [];

  if (faults.length === 0) return <p className="text-xs text-muted">No fault data</p>;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {faults.map((f) => (
        <FaultGauge key={f.fault_code} fault={f} breached={isFaultBreached(breaches, f.fault_code)} />
      ))}
    </div>
  );
}
