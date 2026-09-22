"use client";

import { use, type KeyboardEvent } from "react";
import Link from "next/link";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import { GBOTZ } from "@/lib/routes";
import { IconChevronRight } from "@/components/icons";
import { TEMPLATE_VIEW_TABS, useDashboardTemplateDraft } from "@/lib/dashboardTemplate/useDashboardTemplateDraft";
import type { GbotzCompany } from "@/lib/gbotzTypes";

/**
 * Full-screen by design (see GbotzGate's isFullScreenPath) — source editing and its
 * live preview are deliberately two separate screens (see dashboard-preview/), so
 * this one only has to make room for the template text, not a preview pane too.
 */
export default function GbotzDashboardEditorPage({
  params,
}: PageProps<"/gbotz/dashboard-editor/[companyId]">) {
  const { companyId } = use(params);

  const { data: companyData } = useSWR(`/api/gbotz/companies/${companyId}`, (p) =>
    apiFetch<{ company: GbotzCompany }>(p)
  );

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
  } = useDashboardTemplateDraft(companyId);

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

  return (
    <div className="flex h-full flex-col bg-surface-2">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-hairline bg-surface px-4 py-3">
        <div className="flex min-w-0 items-center gap-1.5 text-sm">
          <Link href={GBOTZ.company(companyId)} className="text-muted hover:text-primary">
            {companyData?.company.name ?? "Company"}
          </Link>
          <IconChevronRight className="h-3.5 w-3.5 shrink-0 text-muted" />
          <span className="font-medium text-primary">Dashboard editor</span>
          {dirty && (
            <span className="ml-1 rounded-full px-2 py-0.5 text-xs" style={{ color: "var(--status-warning)" }}>
              Unsaved changes
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={GBOTZ.companyDashboardPreview(companyId)}
            className="rounded-lg border border-hairline px-3 py-1.5 text-sm font-medium text-secondary hover:bg-surface-2"
          >
            Preview
          </Link>
          <Link
            href={GBOTZ.docs()}
            className="rounded-lg border border-hairline px-3 py-1.5 text-sm font-medium text-secondary hover:bg-surface-2"
          >
            Docs
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
