"use client";

import { useMachines, useRealtime } from "@/context/RealtimeProvider";
import { useCompany } from "@/context/CompanyProvider";
import { MachineCard } from "@/components/MachineCard";
import { StatCard } from "@/components/StatCard";
import { faultSeverity, motorTempSeverity, vibrationSeverity, worstSeverity } from "@/lib/constants";
import { IconAlertTriangle, IconCpu } from "@/components/icons";
import { useEntranceAnimation } from "@/hooks/useEntranceAnimation";

/**
 * The plant overview in the /3d flow. The left/main area is left empty — this is
 * "frame 1"; the 3D team's Unreal Engine environment ("frame 2") occupies that space.
 * The machine list sits in a transparent right panel instead of the regular flow's
 * floor map, reusing the exact same MachineCard tile the tenant Overview page renders
 * below its plant floor map — same live telemetry, same click-through to the machine.
 */
export default function ThreeDOverviewPage() {
  const headerRef = useEntranceAnimation<HTMLDivElement>(1);
  const machines = useMachines();
  const { records } = useRealtime();
  const { company } = useCompany();

  const onlineCount = machines.filter((m) => m.online).length;
  // Same per-machine severity formula DefaultOverview/MachineCard use elsewhere in the
  // app (worstSeverity of fault/vibration/motor-temp) — not extracted to a shared
  // helper since it's already duplicated this way at every other call site.
  const criticalCount = machines.filter((m) => {
    const t = records[m.id]?.latest;
    if (!t) return false;
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
    <div className="flex h-full w-full">
      {/* Reserved for the 3D scene — pointer-events-none (inherited from ThreeDShell's
          root, restated here for clarity) so clicks/drags/scroll here reach the 3D
          world instead of stopping on this empty div. */}
      <div className="pointer-events-none h-full flex-1" />

      {/* pointer-events-auto: opts this panel and its MachineCard children back into
          being clickable/scrollable, since the ancestor chain up to ThreeDShell's
          root is pointer-events-none. */}
      <aside className="pointer-events-auto flex h-full w-full max-w-sm shrink-0 flex-col gap-4 overflow-y-auto bg-transparent p-4 sm:p-6">
        <div ref={headerRef} className="three-d-panel flex shrink-0 flex-col gap-3 rounded-2xl border border-hairline p-4 shadow-2xl">
          <h1 className="truncate text-sm font-semibold text-primary">{company.name}</h1>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Machines online"
              value={`${onlineCount}/${machines.length}`}
              icon={<IconCpu className="h-4 w-4" />}
            />
            <StatCard
              label="Machines critical"
              value={String(criticalCount)}
              icon={<IconAlertTriangle className="h-4 w-4" />}
              severity={criticalCount > 0 ? "critical" : "good"}
            />
          </div>
        </div>

        {machines.length === 0 && <p className="px-1 text-xs text-muted">Waiting for machine list…</p>}
        {machines.map((m, i) => (
          // +2: continues the cascade after HomeLink (index 0) and this header panel
          // (index 1), instead of restarting from 0 alongside them.
          <MachineCard key={m.id} id={m.id} name={m.name} location={m.location} online={m.online} staggerIndex={i + 2} />
        ))}
      </aside>
    </div>
  );
}
