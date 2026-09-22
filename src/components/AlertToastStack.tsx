"use client";

import { useState, useEffect } from "react";
import { useRealtime } from "@/context/RealtimeProvider";
import { useCompany } from "@/context/CompanyProvider";
import { usePathname } from "next/navigation";
import { formatNumber } from "@/lib/format";
import { IconAlertTriangle, IconX } from "@/components/icons";
import { useFaultScenario } from "@/hooks/useFaultScenario";
import type { AlertBreach } from "@/lib/types";

function thresholdLabel(breach: AlertBreach): string {
  const unit = breach.unit ? ` ${breach.unit}` : "";
  const { threshold, direction } = breach;
  if (direction === "both" && typeof threshold === "object" && threshold !== null) {
    return `outside ${formatNumber(threshold.low)}–${formatNumber(threshold.high)}${unit}`;
  }
  if (direction === "high" && typeof threshold === "number") return `above ${formatNumber(threshold)}${unit}`;
  if (direction === "low" && typeof threshold === "number") return `below ${formatNumber(threshold)}${unit}`;
  if (direction === "state") return "sensor reporting abnormal";
  return "";
}

function valueLabel(breach: AlertBreach): string {
  if (breach.message) return breach.message;
  if (typeof breach.value === "boolean") return breach.value ? "Abnormal" : "Normal";
  return `${formatNumber(breach.value)}${breach.unit ? ` ${breach.unit}` : ""}`;
}

function cardKey(machineId: string, breach: AlertBreach): string {
  return `${machineId}::${breach.key}`;
}

/** Reads machineId from /[slug]/machines/[machineId]/... — returns null on any other page. */
function useFocusedMachineId(): string | null {
  const pathname = usePathname();
  const { slug } = useCompany();
  const segments = pathname.split("/").filter(Boolean);
  const machinesIndex = segments.indexOf("machines");
  if (machinesIndex < 1 || segments[machinesIndex - 1] !== slug || !segments[machinesIndex + 1]) return null;
  return segments[machinesIndex + 1]!;
}

/**
 * Alert toasts for the **currently viewed machine only** — fleet-wide alerts for other
 * machines are tracked in activeAlerts but are not shown as toasts here (the AI Assistant
 * panel covers fleet-level awareness). Dismissible per (machine, parameter) key; a
 * dismissed toast stays hidden until the breach genuinely clears and fires again.
 */
export function AlertToastStack() {
  const { activeAlerts, machines } = useRealtime();
  const focusedMachineId = useFocusedMachineId();
  const injectScenario = useFaultScenario(focusedMachineId ?? undefined);
  const [dismissed, setDismissed] = useState<ReadonlySet<string>>(new Set());

  // Only show toasts for the focused machine; if no machine is focused (e.g. overview),
  // show nothing — the AI Assistant and fleet rollup handle that view.
  // Live-test inject owns the screen: do not keep flashing the MQTT PF001 card on top.
  const focusedAlerts = focusedMachineId && injectScenario === "nominal"
    ? (activeAlerts[focusedMachineId] ?? [])
    : [];

  const cards = focusedMachineId
    ? focusedAlerts.map((breach) => {
        const machine = machines.find((m) => m.id === focusedMachineId);
        const machineName = machine?.name ?? focusedMachineId;
        return { machineId: focusedMachineId, machineName, breach, key: cardKey(focusedMachineId, breach) };
      })
    : [];

  // Adjusting state during render (not in an Effect) per
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const liveKeys = new Set(cards.map((c) => c.key));
  const stillLive = new Set([...dismissed].filter((k) => liveKeys.has(k)));
  if (stillLive.size !== dismissed.size) setDismissed(stillLive);

  const visibleCards = cards.filter((c) => !dismissed.has(c.key));

  useEffect(() => {
    if (visibleCards.length === 0) return;
    const timer = setTimeout(() => {
      setDismissed((prev) => {
        const next = new Set(prev);
        visibleCards.forEach((c) => next.add(c.key));
        return next;
      });
    }, 8000);
    return () => clearTimeout(timer);
  }, [visibleCards]);

  if (visibleCards.length === 0) return null;

  function dismiss(key: string) {
    setDismissed((prev) => new Set(prev).add(key));
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 top-2 z-40 mx-auto flex w-[min(92%,28rem)] flex-col gap-2 transition-all duration-200">
      {visibleCards.map(({ machineName, breach, key }) => (
        <div
          key={key}
          className="pointer-events-auto relative flex items-start gap-2.5 rounded-xl border border-[color-mix(in_srgb,var(--status-critical)_45%,transparent)] bg-[color-mix(in_srgb,var(--status-critical)_14%,var(--surface-1))] py-2.5 pl-3.5 pr-8 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <span
            className="pulse-dot mt-1.5 h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: "var(--status-critical)" }}
          />
          <div className="flex min-w-0 flex-col gap-0.5 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-primary">
              <IconAlertTriangle className="h-4 w-4 shrink-0" style={{ color: "var(--status-critical)" }} />
              <span className="truncate">{machineName}</span>
            </div>
            <div className="text-secondary leading-relaxed">
              <span className="font-semibold text-primary">{breach.paramName}</span>: {valueLabel(breach)}
              {thresholdLabel(breach) && <> — {thresholdLabel(breach)}</>}
            </div>
          </div>
          <button
            type="button"
            onClick={() => dismiss(key)}
            aria-label="Dismiss alert"
            title="Dismiss"
            className="absolute right-2 top-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-secondary transition-colors hover:bg-[color-mix(in_srgb,var(--status-critical)_20%,transparent)] hover:text-primary"
          >
            <IconX className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}


