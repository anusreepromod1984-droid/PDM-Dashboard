"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCompany } from "@/context/CompanyProvider";
import { useMachines } from "@/context/RealtimeProvider";
import { DashboardTemplateRenderer } from "@/components/dashboardTemplate/DashboardTemplateRenderer";
import { OutlineSidebar } from "@/components/dashboardTemplate/outlineEditor/OutlineSidebar";
import { parseOutline } from "@/lib/dashboardTemplate/outlineParser";
import {
  TEMPLATE_VIEW_TABS,
  useDashboardTemplateDraft,
  type TemplateView,
} from "@/lib/dashboardTemplate/useDashboardTemplateDraft";
import { IconX } from "@/components/icons";

/**
 * Full-screen by design (see CompanyGate's isFullScreenPath) — the tenant equivalent
 * of /gbotz/dashboard-preview/[companyId]. Simpler than the Gbotz version: this
 * always has a real authenticated tenant session, so DashboardTemplateRenderer is
 * called without the `preview` prop and reads live company/machine data straight
 * from context — no StaticCompanyProvider/StaticRealtimeProvider or polled
 * /machines/live endpoint needed, both of which exist only because Gbotz has no
 * tenant session of its own.
 */
export default function DashboardPreviewPage() {
  const { company, canEditDashboard, routes } = useCompany();
  const machines = useMachines();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!canEditDashboard) router.replace(routes.home());
  }, [canEditDashboard, routes, router]);

  const { view, setView, source, dirty, submitting, error, setDraft, discard, save } = useDashboardTemplateDraft();

  // Lets callers (e.g. Super Dashboard's "Edit" button) deep-link straight to a
  // specific tab instead of always landing on "fleet" — read once on mount, same
  // pattern as TenantShell's localStorage-read-on-mount.
  useEffect(() => {
    const requested = searchParams.get("view");
    if (requested && TEMPLATE_VIEW_TABS.some((t) => t.key === requested)) {
      setView(requested as TemplateView);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally only on mount
  }, []);

  const outline = useMemo(() => parseOutline(source), [source]);

  const [machineId, setMachineId] = useState<string | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing local selection once the machine list arrives from the realtime socket, not deriving state from a prop
    if (machineId === null && machines.length > 0) setMachineId(machines[0]!.id);
  }, [machineId, machines]);

  if (!canEditDashboard) {
    return <div className="flex h-full items-center justify-center bg-surface-2 text-sm text-muted">Loading…</div>;
  }

  return (
    <div className="flex h-full flex-col bg-surface-2">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-hairline bg-surface px-4 py-3">
        <div className="flex min-w-0 items-center gap-1.5 text-sm">
          <span className="font-medium text-primary">Dashboard editor</span>
          <span className="text-muted">· {company.name}</span>
          {dirty && (
            <span className="ml-1 rounded-full px-2 py-0.5 text-xs" style={{ color: "var(--status-warning)" }}>
              Unsaved changes
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {view !== "fleet" && (
            <select
              value={machineId ?? ""}
              onChange={(e) => setMachineId(e.target.value)}
              aria-label="Preview against machine"
              className="rounded-lg border border-hairline bg-surface px-2 py-1.5 text-xs text-primary outline-none focus:border-accent"
            >
              {machines.length === 0 && <option value="">No machines</option>}
              {machines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          )}
          <Link
            href={routes.dashboardEditor()}
            className="rounded-lg border border-hairline px-3 py-1.5 text-sm font-medium text-secondary hover:bg-surface-2"
          >
            Code editor
          </Link>
          {dirty && (
            <button
              type="button"
              onClick={discard}
              className="rounded-lg border border-hairline px-3 py-1.5 text-sm font-medium text-secondary hover:bg-surface-2"
            >
              Discard
            </button>
          )}
          <button
            type="button"
            onClick={save}
            disabled={!dirty || submitting}
            className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Saving…" : "Save changes"}
          </button>
          <Link
            href={routes.admin("views")}
            aria-label="Close dashboard editor"
            title="Close"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-hairline text-secondary hover:bg-surface-2 hover:text-primary"
          >
            <IconX className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-hairline bg-surface px-4 py-2">
        {TEMPLATE_VIEW_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setView(tab.key)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              view === tab.key ? "bg-surface-2 text-primary" : "text-muted hover:text-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <p
          className="shrink-0 px-4 py-2 text-sm"
          style={{ color: "var(--status-critical)", backgroundColor: "color-mix(in srgb, var(--status-critical) 8%, transparent)" }}
        >
          {error}
        </p>
      )}

      <div className="flex min-h-0 flex-1">
        <OutlineSidebar outline={outline} source={source} view={view} onChange={setDraft} />
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          <DashboardTemplateRenderer source={source} machineId={view === "fleet" ? undefined : machineId ?? undefined} />
        </div>
      </div>
    </div>
  );
}
