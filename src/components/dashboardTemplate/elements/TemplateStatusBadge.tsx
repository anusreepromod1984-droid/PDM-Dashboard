"use client";

import { useTemplateMachineSeries } from "@/lib/dashboardTemplate/useTemplateMachineSeries";
import { StatusBadge } from "@/components/StatusBadge";
import { faultSeverity, motorTempSeverity, vibrationSeverity, worstSeverity } from "@/lib/constants";

export interface TemplateStatusBadgeProps {
  machineId: string;
}

export function TemplateStatusBadge({ machineId }: TemplateStatusBadgeProps) {
  const { latest } = useTemplateMachineSeries(machineId);
  if (!latest) return <StatusBadge severity="good" />;

  const worstFault =
    latest.motorFaults.length > 0
      ? latest.motorFaults.reduce((a, b) => (a.confidence > b.confidence ? a : b))
      : null;

  const severity = worstSeverity([
    worstFault ? faultSeverity(worstFault.confidence) : "good",
    vibrationSeverity(latest.imuAcceleration),
    motorTempSeverity(latest.temperature.motor),
  ]);

  return <StatusBadge severity={severity} />;
}
