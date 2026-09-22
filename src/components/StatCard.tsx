"use client";

import type { ReactNode } from "react";
import type { Severity } from "@/lib/types";
import { useEntranceAnimation } from "@/hooks/useEntranceAnimation";
import { useAnimatedValue } from "@/hooks/useAnimatedValue";

const SEVERITY_COLOR: Record<Severity, string> = {
  good: "var(--status-good)",
  warning: "var(--status-warning)",
  critical: "var(--status-critical)",
};

export function StatCard({
  label,
  value,
  unit,
  icon,
  severity,
  hint,
  staggerIndex = 0,
}: {
  label: string;
  value: string;
  unit?: string;
  icon?: ReactNode;
  severity?: Severity;
  hint?: string;
  /** This card's position in a list of siblings mounting together — see Card's
   *  staggerIndex for the same convention. */
  staggerIndex?: number;
}) {
  const ref = useEntranceAnimation<HTMLDivElement>(staggerIndex);
  const { display, ref: valueRef } = useAnimatedValue<HTMLSpanElement>(value);

  return (
    <div ref={ref} className="flex flex-col gap-2 rounded-xl border border-hairline bg-surface p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">{label}</span>
        {icon && <span className="text-muted">{icon}</span>}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span
          ref={valueRef}
          className="text-2xl font-semibold tabular-nums text-primary"
          style={severity ? { color: SEVERITY_COLOR[severity] } : undefined}
        >
          {display}
        </span>
        {unit && <span className="text-sm text-muted">{unit}</span>}
      </div>
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </div>
  );
}
