"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import { useMachines } from "@/context/RealtimeProvider";
import { useCompany } from "@/context/CompanyProvider";
import { DashboardTemplateRenderer } from "@/components/dashboardTemplate/DashboardTemplateRenderer";
import { DEFAULT_MACHINE_TEMPLATES } from "@/lib/dashboardTemplate/defaultTemplates";
import { IconEdit, IconX } from "@/components/icons";

/**
 * Fullscreen takeover, not a route — mounted directly under MachineTabs, which already
 * sits inside every context this needs (Realtime/Company/Theme/TimeRange). Renders
 * through the same Liquid dashboard-template engine as the six per-machine tabs and
 * the fleet page (frontend/src/lib/dashboardTemplate/) rather than stacking hardcoded
 * view components — this is what makes it both a real full-bleed responsive grid (the
 * template's own Tailwind classes control column count per breakpoint, no max-w cap)
 * and editable (it's just the "super" entry in the same template system, see
 * useDashboardTemplateDraft.ts's TEMPLATE_VIEW_TABS). Unlike the other six views, there
 * is no legacy hardcoded fallback component — DEFAULT_MACHINE_TEMPLATES.super is the
 * only fallback. z-[200] clears the toast stack (z-50) and the alert-glow siren
 * (z-100) so this genuinely replaces the whole screen, not just the tab.
 */
export function SuperDashboard({ machineId, onClose }: { machineId: string; onClose: () => void }) {
  const machines = useMachines();
  const { canEditDashboard, routes } = useCompany();
  const [activeMachineId, setActiveMachineId] = useState(machineId);

  const machine = machines.find((m) => m.id === activeMachineId);

  const { data } = useSWR("/api/company/machine-dashboard-template/super", (p: string) =>
    apiFetch<{ template: { source: string } | null }>(p)
  );
  const source = data?.template?.source ?? DEFAULT_MACHINE_TEMPLATES.super;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-surface-2">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-hairline bg-surface px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${machine?.online ? "pulse-dot" : ""}`}
            style={{ backgroundColor: machine?.online ? "var(--status-good)" : "var(--text-muted)" }}
          />
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-primary">{machine?.name ?? activeMachineId}</h1>
            <p className="truncate text-xs text-muted">
              {machine?.location ?? "Unknown location"} · Integrated maintenance dashboard
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {machines.length > 1 && (
            <select
              value={activeMachineId}
              onChange={(e) => setActiveMachineId(e.target.value)}
              aria-label="Switch machine"
              className="rounded-lg border border-hairline bg-surface px-2.5 py-1.5 text-sm text-primary outline-none focus:border-accent"
            >
              {machines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          )}
          {canEditDashboard && (
            <Link
              href={`${routes.dashboardPreview()}?view=super`}
              aria-label="Edit super dashboard"
              title="Edit super dashboard"
              className="rounded-lg border border-hairline p-1.5 text-secondary transition-colors hover:bg-surface-2 hover:text-primary"
            >
              <IconEdit className="h-4 w-4" />
            </Link>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close super dashboard"
            className="rounded-lg border border-hairline p-1.5 text-secondary transition-colors hover:bg-surface-2 hover:text-primary"
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        <DashboardTemplateRenderer source={source} machineId={activeMachineId} />
      </div>
    </div>
  );
}
