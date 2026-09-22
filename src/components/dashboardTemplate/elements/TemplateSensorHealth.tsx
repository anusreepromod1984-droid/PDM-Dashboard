"use client";

import { useTemplateMachineSeries } from "@/lib/dashboardTemplate/useTemplateMachineSeries";
import { Card } from "@/components/Card";
import { StatusBadge } from "@/components/StatusBadge";

export interface TemplateSensorHealthProps {
  machineId: string;
}

/** Verbatim translation of EnvironmentView's "Sensor health" card. */
export function TemplateSensorHealth({ machineId }: TemplateSensorHealthProps) {
  const { latest } = useTemplateMachineSeries(machineId);
  if (!latest) return null;

  return (
    <Card
      title="Sensor health"
      subtitle="Aggregate status reported by the on-device diagnostics"
      actions={<StatusBadge severity={latest.sensorStatus.ok ? "good" : "warning"} />}
    >
      <p className="text-sm text-secondary">{latest.sensorStatus.message}</p>
    </Card>
  );
}
