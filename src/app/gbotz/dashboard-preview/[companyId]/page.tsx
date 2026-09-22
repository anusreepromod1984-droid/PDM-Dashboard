"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import { GBOTZ } from "@/lib/routes";
import { IconChevronRight } from "@/components/icons";
import { DashboardTemplateRenderer } from "@/components/dashboardTemplate/DashboardTemplateRenderer";
import { OutlineSidebar } from "@/components/dashboardTemplate/outlineEditor/OutlineSidebar";
import { parseOutline } from "@/lib/dashboardTemplate/outlineParser";
import {
  TEMPLATE_VIEW_TABS,
  useDashboardTemplateDraft,
  type TemplateView,
} from "@/lib/dashboardTemplate/useDashboardTemplateDraft";
import type { GbotzCompany } from "@/lib/gbotzTypes";
import type { MachineMeta, MachineRecord, Telemetry } from "@/lib/types";

interface LiveMachine extends MachineMeta {
  liveness: string;
  lastSeenAt: number | null;
  latest: Telemetry | null;
  history: Telemetry[];
}

/**
 * Full-screen by design (see GbotzGate's isFullScreenPath) — a separate screen from
 * the editor (dashboard-editor/) so staff can see the dashboard at real size instead
 * of squeezed into half a screen next to the source. The left sidebar (see
 * OutlineSidebar) is what makes this screen more than read-only: it lists every
 * section/block in the current draft so staff can drag one to reorder it or click its
 * name to edit its settings, without hand-editing Liquid. Edits land in an in-memory
 * draft — same dirty/Save/Discard contract as the code editor (useDashboardTemplateDraft)
 * — nothing reaches the backend until Save, and the raw-source editor stays the
 * fallback for anything the outline parser can't confidently represent.
 */
export default function GbotzDashboardPreviewPage({
  params,
}: PageProps<"/gbotz/dashboard-preview/[companyId]">) {
  const { companyId } = use(params);
  const searchParams = useSearchParams();

  const { data: companyData } = useSWR(`/api/gbotz/companies/${companyId}`, (p) =>
    apiFetch<{ company: GbotzCompany }>(p)
  );
  const { data: liveData } = useSWR(
    `/api/gbotz/companies/${companyId}/machines/live`,
    (p) => apiFetch<{ machines: LiveMachine[] }>(p),
    { refreshInterval: 5000 }
  );

  const { view, setView, source, dirty, submitting, error, setDraft, discard, save, loading } =
    useDashboardTemplateDraft(companyId);

  // Lets callers deep-link straight to a specific tab instead of always landing on
  // "fleet" — read once on mount.
  useEffect(() => {
    const requested = searchParams.get("view");
    if (requested && TEMPLATE_VIEW_TABS.some((t) => t.key === requested)) {
      setView(requested as TemplateView);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally only on mount
  }, []);

  const outline = useMemo(() => parseOutline(source), [source]);

  const [machineId, setMachineId] = useState<string | null>(null);

  const liveMachines = liveData?.machines ?? [];
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing local selection once the live machine list arrives from the polled preview endpoint, not deriving state from a prop
    if (machineId === null && liveMachines.length > 0) setMachineId(liveMachines[0]!.id);
  }, [machineId, liveMachines]);

  const machines: MachineMeta[] = liveMachines.map((m) => ({
    id: m.id,
    name: m.name,
    location: m.location,
    ratedRpm: m.ratedRpm,
    mapX: m.mapX,
    mapY: m.mapY,
  }));
  const records: Record<string, MachineRecord> = Object.fromEntries(
    liveMachines.map((m) => [m.id, { latest: m.latest, history: m.history, status: null }])
  );

  const stillLoading = loading || !companyData || !liveData;

  return (
    <div className="flex h-full flex-col bg-surface-2">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-hairline bg-surface px-4 py-3">
        <div className="flex min-w-0 items-center gap-1.5 text-sm">
          <Link href={GBOTZ.company(companyId)} className="text-muted hover:text-primary">
            {companyData?.company.name ?? "Company"}
          </Link>
          <IconChevronRight className="h-3.5 w-3.5 shrink-0 text-muted" />
          <span className="font-medium text-primary">Dashboard preview</span>
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
              className="rounded-lg border border-hairline bg-surface px-2 py-1.5 text-xs text-primary outline-none focus:border-accent"
            >
              {liveMachines.length === 0 && <option value="">No machines</option>}
              {liveMachines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          )}
          <Link
            href={GBOTZ.companyDashboardEditor(companyId)}
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
          {stillLoading ? (
            <p className="text-sm text-muted">Loading…</p>
          ) : (
            <DashboardTemplateRenderer
              source={outline.annotatedSource}
              machineId={view === "fleet" ? undefined : machineId ?? undefined}
              preview={{ company: companyData.company, machines, records }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
