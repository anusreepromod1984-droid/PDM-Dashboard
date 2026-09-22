"use client";

import { useMachines } from "@/context/RealtimeProvider";

/**
 * Compact machine identity strip above the /3d flow's tab-nav strip — mirrors
 * MachineTabs.tsx's header (name, location, online dot), deliberately without the
 * Super Dashboard button that header also carries in the regular tenant flow (see
 * machines/[machineId]/layout.tsx — out of /3d scope). Fixes the previous gap where
 * none of the 7 machine-tab screens indicated which machine was being viewed.
 */
export function ThreeDMachineHeader({ machineId }: { machineId: string }) {
  const machines = useMachines();
  const machine = machines.find((m) => m.id === machineId);

  return (
    <div className="px-3 py-2.5">
      <h1 className="text-sm font-semibold text-primary">{machine?.name ?? machineId}</h1>
      <p className="mt-0.5 flex items-center gap-2 text-xs text-muted">
        <span
          className={`h-1.5 w-1.5 rounded-full ${machine?.online ? "pulse-dot" : ""}`}
          style={{ backgroundColor: machine?.online ? "var(--status-good)" : "var(--text-muted)" }}
        />
        {machine?.location ?? "Unknown location"}
      </p>
    </div>
  );
}
