"use client";

import { useTemplateMachineSeries } from "@/lib/dashboardTemplate/useTemplateMachineSeries";
import { useRealtime } from "@/context/RealtimeProvider";
import { FaultGauge } from "@/components/FaultGauge";
import { isFaultBreached } from "@/lib/faultSignature";

export interface TemplateFaultGaugeProps {
  machineId: string;
  /** Pin one specific fault by code; omitted = show the worst active fault. */
  faultCode?: string;
}

export function TemplateFaultGauge({ machineId, faultCode }: TemplateFaultGaugeProps) {
  const { latest } = useTemplateMachineSeries(machineId);
  const { activeAlerts } = useRealtime();
  const faults = latest?.motorFaults ?? [];
  const fault = faultCode
    ? faults.find((f) => f.fault_code === faultCode)
    : faults.reduce<(typeof faults)[number] | null>(
        (worst, f) => (!worst || f.confidence > worst.confidence ? f : worst),
        null
      );

  if (!fault) return <p className="text-xs text-muted">No fault data</p>;
  return <FaultGauge fault={fault} breached={isFaultBreached(activeAlerts[machineId] ?? [], fault.fault_code)} />;
}
