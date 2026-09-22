"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useMachineTelemetry } from "@/context/RealtimeProvider";
import { useCompany } from "@/context/CompanyProvider";
import { TimeRangeProvider } from "@/context/TimeRangeProvider";
import { MachineTabs } from "@/components/MachineTabs";
import { StaleBanner } from "@/components/StaleBanner";
import { TimeRangePicker } from "@/components/TimeRangePicker";
import { FaultInjectorBar } from "@/components/FaultInjectorBar";
import { findMachineView } from "@/lib/machineViews";

/**
 * Client wrapper so the (async, server-component) machine layout can host
 * freshness-aware chrome without itself becoming a client component. One insertion
 * here covers all six machine detail tabs — StaleBanner, the time-range picker, the
 * data-stale dimming, and the disabled-view redirect guard all live above {children},
 * not per-view.
 */
export function MachineHeader({ machineId, children }: { machineId: string; children: React.ReactNode }) {
  const { freshness, lastUpdatedAt } = useMachineTelemetry(machineId);
  const { routes, enabledViews } = useCompany();
  const pathname = usePathname();
  const router = useRouter();
  const activeSlug = pathname.split("/").pop() ?? "";
  const activeView = activeSlug === machineId ? findMachineView("") : findMachineView(activeSlug);
  const disabled = activeView && !enabledViews.includes(activeView.key);

  useEffect(() => {
    if (disabled) router.replace(routes.machine(machineId));
  }, [disabled, machineId, routes, router]);

  return (
    <TimeRangeProvider>
      <div className="flex flex-col gap-4">
        <MachineTabs machineId={machineId} />
        <FaultInjectorBar machineId={machineId} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <StaleBanner freshness={freshness} lastUpdatedAt={lastUpdatedAt} />
          </div>
          <TimeRangePicker />
        </div>
        {disabled ? (
          <div className="rounded-xl border border-dashed border-hairline bg-surface p-8 text-center text-sm text-muted">
            This view isn&apos;t enabled for your company.
          </div>
        ) : (
          <div data-stale={freshness === "stale" || freshness === "offline"}>{children}</div>
        )}
      </div>
    </TimeRangeProvider>
  );
}
