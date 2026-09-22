import { useState } from "react";
import useSWR from "swr";
import { apiFetch, ApiError } from "@/lib/api";
import { MACHINE_VIEWS } from "@/lib/machineViews";
import {
  DEFAULT_FLEET_TEMPLATE,
  DEFAULT_MACHINE_TEMPLATES,
  type MachineTemplateView,
} from "@/lib/dashboardTemplate/defaultTemplates";

export type { MachineTemplateView };
export type TemplateView = "fleet" | MachineTemplateView;

export const TEMPLATE_VIEW_TABS: { key: TemplateView; label: string }[] = [
  { key: "fleet", label: "Fleet Overview" },
  ...MACHINE_VIEWS.map((v) => ({ key: v.key as TemplateView, label: `Machine: ${v.label}` })),
  { key: "super", label: "Super Dashboard" },
];

/** Gbotz staff edit any company by id (URL param); a company editing its own
 *  dashboard has no id to pass — the backend derives the target company from the
 *  session instead (see /api/company/dashboard-template). */
function baseUrlFor(companyId?: string): string {
  return companyId ? `/api/gbotz/companies/${companyId}` : "/api/company";
}

function saveEndpointFor(companyId: string | undefined, view: TemplateView): string {
  const base = baseUrlFor(companyId);
  return view === "fleet" ? `${base}/dashboard-template` : `${base}/machine-dashboard-template/${view}`;
}

function defaultFor(view: TemplateView): string {
  return view === "fleet" ? DEFAULT_FLEET_TEMPLATE : DEFAULT_MACHINE_TEMPLATES[view];
}

/**
 * Shared by dashboard-editor (raw textarea) and dashboard-preview (visual outline
 * sidebar) so the two surfaces can never drift apart on save/dirty/discard semantics
 * even though they present drafts completely differently. Per-view drafts so
 * switching tabs never silently discards an in-progress edit on another one —
 * `undefined` in `drafts` means "nothing edited yet for this view" (distinct from "the
 * draft happens to read like the saved value"), which is what makes explicitly saving
 * back the default possible even when the source already matches it.
 */
export function useDashboardTemplateDraft(companyId?: string) {
  const base = baseUrlFor(companyId);
  const { data: fleetData, mutate: mutateFleet } = useSWR(
    `${base}/dashboard-template`,
    (p) => apiFetch<{ template: { source: string; updatedAt: string } | null }>(p)
  );
  const { data: machineData, mutate: mutateMachine } = useSWR(
    `${base}/machine-dashboard-templates`,
    (p) => apiFetch<{ templates: Record<MachineTemplateView, { source: string; updatedAt: string } | null> }>(p)
  );

  const [view, setView] = useState<TemplateView>("fleet");
  const [drafts, setDrafts] = useState<Partial<Record<TemplateView, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function savedFor(v: TemplateView): string | undefined {
    return v === "fleet" ? fleetData?.template?.source : machineData?.templates?.[v]?.source;
  }

  const saved = savedFor(view);
  const draft = drafts[view] ?? null;
  const source = draft ?? saved ?? defaultFor(view);
  const dirty = draft !== null && draft !== saved;
  const loading = !fleetData || !machineData;

  function setDraft(next: string) {
    setDrafts((prev) => ({ ...prev, [view]: next }));
  }

  function discard() {
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[view];
      return next;
    });
  }

  function loadDefault() {
    setDraft(defaultFor(view));
  }

  async function save() {
    if (draft === null) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch(saveEndpointFor(companyId, view), { method: "PUT", body: { source: draft } });
      await (view === "fleet" ? mutateFleet() : mutateMachine());
      discard();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save template");
    } finally {
      setSubmitting(false);
    }
  }

  return {
    view,
    setView,
    drafts,
    savedFor,
    source,
    saved,
    dirty,
    loading,
    submitting,
    error,
    setDraft,
    discard,
    save,
    loadDefault,
  };
}
