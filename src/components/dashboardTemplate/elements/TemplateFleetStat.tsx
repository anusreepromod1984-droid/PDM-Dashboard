"use client";

import { useMachines, useRealtime } from "@/context/RealtimeProvider";
import { StatCard } from "@/components/StatCard";
import { resolveStatIcon } from "@/lib/dashboardTemplate/statIcons";
import { formatNumber } from "@/lib/format";
import { faultSeverity, motorTempSeverity, vibrationSeverity, worstSeverity } from "@/lib/constants";

export type FleetMetric = "online" | "activeFaults" | "power" | "avgVibration" | "criticalMachines";

export interface TemplateFleetStatProps {
  metric: FleetMetric;
  label: string;
  unit?: string;
  decimals?: number;
  icon?: string;
}

/** Fleet-wide aggregates — the four stat cards the hardcoded Plant Overview always
 *  computed inline. Reproduced here verbatim so a Liquid-authored dashboard can match
 *  it exactly, one machine-scoped element (stat_card) can't express these. */
export function TemplateFleetStat({ metric, label, unit, decimals = 1, icon }: TemplateFleetStatProps) {
  const { records } = useRealtime();
  const machines = useMachines();
  const telemetryList = Object.values(records).filter((r) => r.latest);
  const Icon = resolveStatIcon(icon);
  const iconEl = Icon ? <Icon className="h-4 w-4" /> : undefined;

  if (metric === "online") {
    const onlineCount = machines.filter((m) => m.online).length;
    return <StatCard label={label} value={`${onlineCount}/${machines.length}`} icon={iconEl} />;
  }

  if (metric === "activeFaults") {
    const activeFaults = telemetryList.reduce(
      (sum, r) => sum + r.latest!.motorFaults.filter((f) => faultSeverity(f.confidence) !== "good").length,
      0
    );
    return (
      <StatCard
        label={label}
        value={String(activeFaults)}
        severity={activeFaults > 0 ? "warning" : "good"}
        icon={iconEl}
      />
    );
  }

  if (metric === "criticalMachines") {
    // Same per-machine severity computation as the hardcoded Plant Overview
    // (frontend/src/app/(tenant)/[company]/page.tsx's DefaultOverview) — worst of the
    // fault-model, vibration, and motor-temp readings.
    const criticalCount = telemetryList.filter((r) => {
      const t = r.latest!;
      const worstFault =
        t.motorFaults.length > 0 ? t.motorFaults.reduce((a, b) => (a.confidence > b.confidence ? a : b)) : null;
      const severity = worstSeverity([
        worstFault ? faultSeverity(worstFault.confidence) : "good",
        vibrationSeverity(t.imuAcceleration),
        motorTempSeverity(t.temperature.motor),
      ]);
      return severity === "critical";
    }).length;
    return (
      <StatCard
        label={label}
        value={String(criticalCount)}
        severity={criticalCount > 0 ? "critical" : "good"}
        icon={iconEl}
      />
    );
  }

  if (metric === "power") {
    const totalPower = telemetryList.reduce((sum, r) => sum + r.latest!.energyMeter.power, 0);
    return <StatCard label={label} value={formatNumber(totalPower, decimals)} unit={unit} icon={iconEl} />;
  }

  const avgVibration =
    telemetryList.length > 0
      ? telemetryList.reduce((sum, r) => sum + r.latest!.imuAcceleration, 0) / telemetryList.length
      : 0;
  return <StatCard label={label} value={formatNumber(avgVibration, decimals)} unit={unit} icon={iconEl} />;
}
