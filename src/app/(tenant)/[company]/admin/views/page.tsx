"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthProvider";
import { useCompany } from "@/context/CompanyProvider";
import { apiFetch, ApiError } from "@/lib/api";
import { MACHINE_VIEWS } from "@/lib/machineViews";
import { Card } from "@/components/Card";
import type { CompanySummary, MachineViewKey } from "@/lib/types";

export default function AdminViewsPage() {
  const { company, routes } = useCompany();
  const { refresh } = useAuth();
  const [enabledViews, setEnabledViews] = useState<MachineViewKey[]>(company.enabledViews);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function toggle(key: MachineViewKey) {
    if (key === "overview") return;
    setEnabledViews((prev) => (prev.includes(key) ? prev.filter((v) => v !== key) : [...prev, key]));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await apiFetch<{ company: CompanySummary }>("/api/company/views", {
        method: "PUT",
        body: { enabledViews },
      });
      await refresh();
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      {error && (
        <p className="rounded-lg px-3 py-2 text-sm" style={{ color: "var(--status-critical)" }}>
          {error}
        </p>
      )}
      {saved && (
        <p className="rounded-lg px-3 py-2 text-sm" style={{ color: "var(--status-good)" }}>
          Saved.
        </p>
      )}

      <Card
        title="Dashboard layout"
        subtitle="Customize your company's dashboard — add, remove, and rearrange the charts, gauges, and stat cards shown on each tab."
      >
        <Link
          href={routes.dashboardPreview()}
          className="inline-flex w-fit items-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Edit dashboard
        </Link>
      </Card>

      <Card
        title="Dashboard views"
        subtitle="Disabling a view hides it from navigation for everyone in your company. It doesn't restrict access to the underlying data through the API."
      >
        <div className="flex flex-col gap-3">
          {MACHINE_VIEWS.map((view) => {
            const Icon = view.icon;
            const locked = view.key === "overview";
            return (
              <label
                key={view.key}
                className="flex items-center justify-between gap-3 rounded-lg border border-hairline p-3"
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-muted" />
                  <span>
                    <span className="block text-sm font-medium text-primary">{view.label}</span>
                    <span className="block text-xs text-muted">{view.description}</span>
                  </span>
                </span>
                {locked ? (
                  <span className="shrink-0 text-xs text-muted">Always available</span>
                ) : (
                  <input
                    type="checkbox"
                    checked={enabledViews.includes(view.key)}
                    onChange={() => toggle(view.key)}
                    className="shrink-0"
                  />
                )}
              </label>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="mt-4 w-fit rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </Card>
    </div>
  );
}
