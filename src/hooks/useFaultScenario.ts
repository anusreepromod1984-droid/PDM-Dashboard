"use client";

import { useEffect, useState } from "react";
import type { FaultScenario } from "@/lib/faultStore";

/**
 * Active live-test scenario for a machine. Inject lives in the Next BFF, so the
 * socket stream never sees it — views that need injected RUL subscribe here.
 */
export function useFaultScenario(machineId: string | undefined): FaultScenario {
  const [scenario, setScenario] = useState<FaultScenario>("nominal");

  useEffect(() => {
    if (!machineId) return;
    let cancelled = false;
    fetch(`/api/machines/${encodeURIComponent(machineId)}/inject-fault`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.scenario) setScenario(data.scenario as FaultScenario);
      })
      .catch(() => {});

    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<{ machineId?: string; scenario?: FaultScenario }>).detail;
      if (detail?.machineId === machineId && detail.scenario) setScenario(detail.scenario);
    };
    window.addEventListener("apms:fault-scenario-changed", onChange);
    return () => {
      cancelled = true;
      window.removeEventListener("apms:fault-scenario-changed", onChange);
    };
  }, [machineId]);

  return scenario;
}
