"use client";

import { FAULT_THRESHOLDS, faultConfidenceFraction, faultSeverity } from "@/lib/constants";
import { IconAlertTriangle } from "@/components/icons";
import type { MotorFault } from "@/lib/types";

const SEVERITY_COLOR = {
  good: "var(--status-good)",
  warning: "var(--status-warning)",
  critical: "var(--status-critical)",
};

/**
 * Confidence is a plain 0-100% value, not a physical quantity with a min/max range —
 * client feedback was that a gauge/arc chart overstates it as something to be "read"
 * rather than a straightforward percentage, so this is a labeled progress bar instead.
 * Same props as the old gauge, so every call site (MachineOverviewView, FaultsView, the
 * dashboardTemplate fault-gauge elements) needed no changes.
 */
export function FaultGauge({
  fault,
  dangerThreshold = FAULT_THRESHOLDS.critical,
  breached = false,
}: {
  fault: MotorFault;
  /** Fraction (0-1) along the bar, at and beyond which the track shows a critical-zone tint. */
  dangerThreshold?: number;
  /** True once this fault_code has an active breach from the backend's alert engine
   * (its confidence crossed the machine's configured alert_threshold) — independent of
   * this bar's own display-only warning/critical color. */
  breached?: boolean;
}) {
  const fraction = faultConfidenceFraction(fault.confidence);
  const severity = faultSeverity(fraction);
  const pct = Math.round(fraction * 100);
  const color = SEVERITY_COLOR[severity];
  const dangerZoneWidth = (1 - dangerThreshold) * 100;

  return (
    <div
      className={`relative flex flex-col gap-3 rounded-lg border p-3 ${
        breached ? "border-transparent bg-surface-2 fault-alert-glow" : "border-hairline bg-surface-2"
      }`}
    >
      {breached && (
        <span
          className="absolute -right-1.5 -top-1.5 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white"
          style={{ backgroundColor: "var(--status-critical)" }}
        >
          <IconAlertTriangle className="h-2.5 w-2.5" />
          Alert
        </span>
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-primary">{fault.description}</div>
          <div className="text-[11px] text-muted">{fault.fault_code}</div>
        </div>
        <span className="shrink-0 text-lg font-semibold tabular-nums" style={{ color }}>
          {pct}%
        </span>
      </div>

      <div className="relative h-2 w-full overflow-hidden rounded-full bg-surface">
        {dangerZoneWidth > 0 && (
          <div
            className="absolute inset-y-0 right-0 rounded-full"
            // rgb()-with-alpha rather than color-mix() — see globals.css's "-rgb"
            // companion properties for why.
            style={{
              width: `${dangerZoneWidth}%`,
              backgroundColor: "rgb(var(--status-critical-rgb) / 18%)",
            }}
          />
        )}
        {pct > 0 && (
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        )}
      </div>
    </div>
  );
}
