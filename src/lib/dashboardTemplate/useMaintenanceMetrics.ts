"use client";

import { useMemo } from "react";
import { useMachines } from "@/context/RealtimeProvider";
import { useNow } from "@/hooks/useNow";
import { useTemplateMachineSeries } from "@/lib/dashboardTemplate/useTemplateMachineSeries";
import {
  MAINTENANCE_METRIC_KEYS,
  resolveMaintenanceMetric,
  type MaintenanceMetricKey,
  type MaintenanceMetricResult,
} from "@/lib/dashboardTemplate/maintenanceMetrics";

/** Resolves all 15 Super Dashboard metrics for one machine in one place, so the KPI
 *  strip's aggregate counts and each individual card always agree — both read from
 *  this same hook rather than recomputing severity independently. */
export function useMaintenanceMetrics(machineId: string): Record<MaintenanceMetricKey, MaintenanceMetricResult> {
  const { latest, history } = useTemplateMachineSeries(machineId);
  const machines = useMachines();
  const ratedRpm = machines.find((m) => m.id === machineId)?.ratedRpm ?? 1500;
  const now = useNow(30_000);

  return useMemo(() => {
    const ctx = { machineId, latest, history, ratedRpm, now };
    const result = {} as Record<MaintenanceMetricKey, MaintenanceMetricResult>;
    for (const key of MAINTENANCE_METRIC_KEYS) {
      result[key] = resolveMaintenanceMetric(key, ctx);
    }
    return result;
  }, [machineId, latest, history, ratedRpm, now]);
}
