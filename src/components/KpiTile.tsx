"use client";

import type { IconComponent } from "@/components/icons";
import { useEntranceAnimation } from "@/hooks/useEntranceAnimation";
import { useAnimatedValue } from "@/hooks/useAnimatedValue";

/** A compact icon + label/value pill — the Super Dashboard's KPI-strip tile
 *  (see dashboardTemplate/elements/TemplateMaintenanceKpiStrip.tsx), shared so any
 *  health-summary strip in the app reads consistently. */
export function KpiTile({
  icon: Icon,
  label,
  value,
  color,
  staggerIndex = 0,
  className,
}: {
  icon: IconComponent;
  label: string;
  value: string;
  color?: string;
  /** This tile's position in a list of siblings mounting together — see Card's
   *  staggerIndex for the same convention. */
  staggerIndex?: number;
  /** Extra classes for callers placing tiles in a grid (e.g. col-span-*). */
  className?: string;
}) {
  const ref = useEntranceAnimation<HTMLDivElement>(staggerIndex);
  const { display, ref: valueRef } = useAnimatedValue<HTMLDivElement>(value);

  return (
    <div
      ref={ref}
      className={`flex min-w-[150px] flex-1 items-center gap-3 rounded-xl border border-hairline bg-surface px-4 py-3${className ? ` ${className}` : ""}`}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <div className="min-w-0">
        <div className="text-xs text-muted">{label}</div>
        <div ref={valueRef} className="text-lg font-semibold tabular-nums" style={color ? { color } : undefined}>
          {display}
        </div>
      </div>
    </div>
  );
}
