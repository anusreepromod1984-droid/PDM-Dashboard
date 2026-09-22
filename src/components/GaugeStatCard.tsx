"use client";

import type { ReactNode } from "react";
import type { Severity } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import type { IconComponent } from "@/components/icons";
import { useEntranceAnimation } from "@/hooks/useEntranceAnimation";

/**
 * Machine Overview's gauge-card shell — same dial-gauge/status-pill visual language as
 * the Super Dashboard's per-metric cards (dashboardTemplate/elements/MetricCard.tsx),
 * trimmed down for real live-sensor cards: no numbered index badge, and no forced
 * location/recommendation footer (those are Super Dashboard-specific mock-data flavor).
 */
export function GaugeStatCard({
  icon: Icon,
  title,
  severity,
  hint,
  children,
  staggerIndex = 0,
}: {
  icon: IconComponent;
  title: string;
  severity?: Severity;
  hint?: string;
  children: ReactNode;
  /** This card's position in a list of siblings mounting together — see Card's
   *  staggerIndex for the same convention. */
  staggerIndex?: number;
}) {
  const ref = useEntranceAnimation<HTMLDivElement>(staggerIndex);

  return (
    <div ref={ref} className="flex flex-col gap-2 rounded-xl border border-hairline bg-surface p-4">
      <div className="flex min-w-0 items-center gap-2">
        <Icon className="h-4 w-4 shrink-0 text-muted" />
        <h3 className="truncate text-sm font-semibold text-primary">{title}</h3>
      </div>
      <div className="flex flex-1 items-center justify-center py-1">{children}</div>
      {hint && <span className="text-center text-xs text-muted">{hint}</span>}
      {severity && (
        <div className="flex justify-center">
          <StatusBadge severity={severity} />
        </div>
      )}
    </div>
  );
}
