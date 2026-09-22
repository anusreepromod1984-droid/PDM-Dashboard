"use client";

import { useTemplateMachineSeries } from "@/lib/dashboardTemplate/useTemplateMachineSeries";
import { StatCard } from "@/components/StatCard";
import { resolveTelemetryField } from "@/lib/dashboardTemplate/resolveField";
import { resolveStatIcon } from "@/lib/dashboardTemplate/statIcons";
import { formatHours, formatNumber } from "@/lib/format";
import { nextMaintenanceDisplay } from "@/lib/injectedRul";
import { motorTempSeverity, pressureSeverity, vibrationSeverity } from "@/lib/constants";
import type { Severity } from "@/lib/types";

export type StatSeverityFrom = "vibration" | "motorTemp" | "voltageImbalance" | "soundLevel" | "pressure";

export interface TemplateStatCardProps {
  machineId: string;
  field: string;
  label: string;
  unit?: string;
  decimals?: number;
  icon?: string;
  hint?: string;
  /** "hours" formats via formatHours ("Xd Yh") instead of a decimal number — for
   *  runtime/remaining-hours fields. */
  format?: "number" | "hours";
  /** Colors the value via the same threshold the hardcoded views use for this
   *  specific metric — not a generic threshold config, just the metrics that
   *  actually get this treatment today. */
  severityFrom?: StatSeverityFrom;
}

const SEVERITY_FNS: Record<StatSeverityFrom, (value: number) => Severity> = {
  vibration: vibrationSeverity,
  motorTemp: motorTempSeverity,
  voltageImbalance: (v) => (v > 2 ? "warning" : "good"),
  soundLevel: (v) => (v > 85 ? "warning" : "good"),
  pressure: pressureSeverity,
};

export function TemplateStatCard({
  machineId,
  field,
  label,
  unit,
  decimals = 1,
  icon,
  hint,
  format = "number",
  severityFrom,
}: TemplateStatCardProps) {
  const { latest, scenario } = useTemplateMachineSeries(machineId);
  const value = resolveTelemetryField(latest, field);
  const remaining = field === "runtime.remainingHours"
    ? nextMaintenanceDisplay(
        typeof value === "number" ? value : null,
        scenario,
        typeof value === "number",
      )
    : null;
  const severity = remaining?.severity
    ?? (severityFrom && value !== null ? SEVERITY_FNS[severityFrom](value) : undefined);
  const Icon = resolveStatIcon(icon);
  return (
    <StatCard
      label={label}
      value={remaining ? remaining.value : format === "hours" ? formatHours(value) : formatNumber(value, decimals)}
      unit={remaining ? undefined : unit}
      severity={severity}
      hint={remaining ? remaining.hint : hint}
      icon={Icon ? <Icon className="h-4 w-4" /> : undefined}
    />
  );
}
