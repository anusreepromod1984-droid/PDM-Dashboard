import type { ReactNode } from "react";
import type { Severity } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { IconMapPin, IconWrench, type IconComponent } from "@/components/icons";

/**
 * The Super Dashboard's per-metric card shell: icon + title, a severity pill, a
 * current/normal readout, a slot for the metric's own mini-chart, then a location +
 * recommendation footer. Pure presentational — every metric's data resolution lives in
 * TemplateMaintenanceCard, this only lays it out.
 */
export function MetricCard({
  icon: Icon,
  title,
  severity,
  current,
  normal,
  location,
  recommendation,
  unavailable,
  children,
}: {
  icon: IconComponent;
  title: string;
  severity: Severity;
  current: string;
  normal: string;
  location: string;
  recommendation: string;
  /** No backing sensor exists for this metric — show a neutral "No Data" badge instead of a severity pill. */
  unavailable?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col gap-3 rounded-xl border border-hairline bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Icon className="h-4 w-4 shrink-0 text-muted" />
          <h3 className="truncate text-sm font-semibold text-primary">{title}</h3>
        </div>
        <div className="shrink-0">
          {unavailable ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-muted">
              No Data
            </span>
          ) : (
            <StatusBadge severity={severity} />
          )}
        </div>
      </div>

      <div className="space-y-0.5 text-xs">
        <div className="text-secondary">
          <span className="text-muted">Current: </span>
          {current}
        </div>
        <div className="text-muted">
          <span className="text-muted">Normal: </span>
          {normal}
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center py-1">{children}</div>

      <div className="flex flex-col gap-1 border-t border-hairline pt-2 text-[11px] text-muted">
        <div className="flex items-center gap-1.5">
          <IconMapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{location}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <IconWrench className="h-3 w-3 shrink-0" />
          <span className="truncate">{recommendation}</span>
        </div>
      </div>
    </div>
  );
}
