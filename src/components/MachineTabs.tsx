"use client";

import { useState } from "react";
import { useMachines } from "@/context/RealtimeProvider";
import { MachineViewNav } from "@/components/MachineViewNav";
import { SuperDashboard } from "@/components/SuperDashboard";
import { IconMaximize } from "@/components/icons";

export function MachineTabs({ machineId }: { machineId: string }) {
  const machines = useMachines();
  const machine = machines.find((m) => m.id === machineId);
  const [superOpen, setSuperOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div data-tour="machine-header">
          <h1 className="text-lg font-semibold text-primary">{machine?.name ?? machineId}</h1>
          <p className="mt-0.5 flex items-center gap-2 text-sm text-muted">
            <span
              className={`h-1.5 w-1.5 rounded-full ${machine?.online ? "pulse-dot" : ""}`}
              style={{ backgroundColor: machine?.online ? "var(--status-good)" : "var(--text-muted)" }}
            />
            {machine?.location ?? "Unknown location"}
          </p>
        </div>
        <button
          type="button"
          data-tour="machine-super-dashboard"
          onClick={() => setSuperOpen(true)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-hairline bg-surface px-3 py-1.5 text-sm font-medium text-secondary transition-colors hover:border-baseline hover:text-primary"
        >
          <IconMaximize className="h-3.5 w-3.5" />
          Super Dashboard
        </button>
      </div>

      <MachineViewNav machineId={machineId} />

      {superOpen && <SuperDashboard machineId={machineId} onClose={() => setSuperOpen(false)} />}
    </div>
  );
}
