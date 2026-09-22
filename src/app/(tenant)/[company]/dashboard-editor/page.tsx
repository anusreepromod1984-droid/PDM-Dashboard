"use client";

import { useEffect, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCompany } from "@/context/CompanyProvider";
import { IconX } from "@/components/icons";
import { TEMPLATE_VIEW_TABS, useDashboardTemplateDraft } from "@/lib/dashboardTemplate/useDashboardTemplateDraft";

/**
 * Full-screen by design (see CompanyGate's isFullScreenPath) — the tenant equivalent
 * of /gbotz/dashboard-editor/[companyId], minus the company-name breadcrumb (a
 * company editing its own dashboard doesn't need to be told whose it is) and the
 * Gbotz docs link. `useDashboardTemplateDraft()` with no id hits /api/company/... ,
 * which the backend scopes to the caller's own company — never a URL param.
 */
export default function DashboardEditorPage() {
  const { company, canEditDashboard, routes } = useCompany();
  const router = useRouter();

  useEffect(() => {
    if (!canEditDashboard) router.replace(routes.home());
  }, [canEditDashboard, routes, router]);

  const {
    view,
    setView,
    drafts,
    savedFor,
    source,
    dirty,
    submitting,
    error,
    setDraft,
    discard,
    save,
    loadDefault,
  } = useDashboardTemplateDraft();

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Tab") return;
    e.preventDefault();
    const target = e.currentTarget;
    const { selectionStart, selectionEnd, value } = target;
    const next = value.slice(0, selectionStart) + "  " + value.slice(selectionEnd);
    setDraft(next);
    requestAnimationFrame(() => {
      target.selectionStart = target.selectionEnd = selectionStart + 2;
    });
  }

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
          <Link
            href={routes.dashboardPreview()}
            className="rounded-lg border border-hairline px-3 py-1.5 text-sm font-medium text-secondary hover:bg-surface-2"
          >
            Visual editor
          </Link>
          <button
            type="button"
            onClick={loadDefault}
            className="rounded-lg border border-hairline px-3 py-1.5 text-sm font-medium text-secondary hover:bg-surface-2"
          >
            Load default
          </button>
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
            {drafts[tab.key] !== undefined && drafts[tab.key] !== savedFor(tab.key) && (
              <span className="ml-1 text-accent">•</span>
            )}
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

      <textarea
        key={view}
        value={source}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        spellCheck={false}
        className="min-h-0 flex-1 resize-none border-0 bg-surface p-4 font-mono text-sm text-primary outline-none"
      />
    </div>
  );
}
