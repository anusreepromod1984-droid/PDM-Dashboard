"use client";

import { useMemo, type ReactNode } from "react";
import { RealtimeContext, type RealtimeContextValue } from "@/context/RealtimeProvider";
import type { MachineMeta, MachineRecord } from "@/lib/types";

/**
 * Feeds the exact same RealtimeContext that the tenant's socket-backed
 * RealtimeProvider does, but from a one-shot REST snapshot instead of a live
 * connection — used only by the Gbotz dashboard-template preview pane, which has no
 * per-company socket session. Every hook (useMachines/useMachineTelemetry) and every
 * component that self-subscribes (MachineCard) works unmodified against this, so the
 * preview renders through the identical code path a tenant's browser does.
 */
export function StaticRealtimeProvider({
  machines,
  records,
  children,
}: {
  machines: MachineMeta[];
  records: Record<string, MachineRecord>;
  children: ReactNode;
}) {
  const value = useMemo<RealtimeContextValue>(
    () => ({
      serverUrl: "",
      connectionStatus: "connected",
      lastConnectedAt: null,
      hasBootstrapped: true,
      schema: null,
      machines,
      records,
      upstream: null,
      activeAlerts: {},
      activeActivity: {},
      latestDiagnosis: {},
      reconnect: () => {},
    }),
    [machines, records]
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}
