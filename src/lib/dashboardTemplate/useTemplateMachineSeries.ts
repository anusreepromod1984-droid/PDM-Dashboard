"use client";

import { useContext, useMemo } from "react";
import { useMachineTelemetry } from "@/context/RealtimeProvider";
import { TimeRangeContext } from "@/context/TimeRangeProvider";
import { useMachineHistory } from "@/hooks/useMachineHistory";
import { useFaultScenario } from "@/hooks/useFaultScenario";
import { applyFaultPrognostics } from "@/lib/injectedRul";
import type { Telemetry } from "@/lib/types";

/**
 * The one data source every machine-scoped template element uses. Reproduces
 * useMachineSeries' exact past+live-tail merge (frontend/src/hooks/useMachineSeries.ts)
 * but reads the time range via useContext directly instead of the throwing
 * useTimeRange() — so it degrades to "live" (tail-only, no REST fetch) when no
 * TimeRangeProvider is mounted (the fleet page), and gets real time-range fidelity
 * when one is (every machine-detail page, via MachineHeader).
 */
export function useTemplateMachineSeries(machineId: string) {
  const record = useMachineTelemetry(machineId);
  const scenario = useFaultScenario(machineId);
  const timeRange = useContext(TimeRangeContext);
  const range = timeRange?.range ?? "live";
  const customRange = timeRange?.customRange ?? null;
  const { data: past } = useMachineHistory(machineId, range, customRange);

  const history = useMemo<Telemetry[]>(() => {
    const merged = (() => {
      if (range === "live" || !past || past.length === 0) return record.history;
      // See useMachineSeries.ts — a custom range's `to` is a fixed instant, not "now".
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

  return { ...record, latest, history, scenario };
}
