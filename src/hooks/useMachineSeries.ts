"use client";

import { useMemo } from "react";
import { useMachineTelemetry } from "@/context/RealtimeProvider";
import { useTimeRange } from "@/context/TimeRangeProvider";
import { useMachineHistory } from "@/hooks/useMachineHistory";
import { useFaultScenario } from "@/hooks/useFaultScenario";
import { applyFaultPrognostics } from "@/lib/injectedRul";
import type { Telemetry } from "@/lib/types";

/**
 * What the 6 machine-detail views actually call — merges the REST-fetched past with the
 * socket-fed live tail so `history` is always a plain `Telemetry[]`, keeping every
 * existing chart expression (`history.map(h => ({x: h.timestamp, y: ...}))`) unchanged.
 * Dupes at the boundary are impossible by construction: the tail is filtered to strictly
 * after the last historical sample.
 */
export function useMachineSeries(machineId: string | undefined) {
  const { range, customRange } = useTimeRange();
  const record = useMachineTelemetry(machineId);
  const scenario = useFaultScenario(machineId);
  const { data: past, isLoading, error } = useMachineHistory(machineId, range, customRange);

  const history = useMemo<Telemetry[]>(() => {
    const merged = (() => {
      if (range === "live" || !past || past.length === 0) return record.history;
      // A custom range's `to` is an explicit instant chosen by the user, not "now" — unlike
      // the preset durations, it must not be extended with fresh live-tail samples.
      if (range === "custom") return past;
      const cutoff = past[past.length - 1]!.timestamp;
      return past.concat(record.history.filter((t) => t.timestamp > cutoff));
    })();
    if (scenario === "nominal") return merged;
    return merged.map((row) => applyFaultPrognostics(row, scenario)!);
  }, [past, record.history, range, scenario]);

  const latest = useMemo(
    () => applyFaultPrognostics(record.latest, scenario),
    [record.latest, scenario],
  );

  return { ...record, latest, history, scenario, isLoadingHistory: range !== "live" && isLoading, historyError: error };
}
