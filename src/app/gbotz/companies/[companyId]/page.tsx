"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { apiFetch, ApiError } from "@/lib/api";
import { Card } from "@/components/Card";
import { MACHINE_VIEWS } from "@/lib/machineViews";
import { GBOTZ } from "@/lib/routes";
import type { MachineViewKey } from "@/lib/types";
import type { GbotzCompany } from "@/lib/gbotzTypes";

export default function GbotzCompanyGeneralPage({
  params,
}: PageProps<"/gbotz/companies/[companyId]">) {
  const { companyId } = use(params);
  const { data, mutate } = useSWR(`/api/gbotz/companies/${companyId}`, (p) =>
    apiFetch<{ company: GbotzCompany }>(p)
  );

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const [accentColor, setAccentColor] = useState("");
  const [enabledViews, setEnabledViews] = useState<MachineViewKey[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!data) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- seeding editable form fields from a freshly fetched record, not a derived value
    setName(data.company.name);
    setSlug(data.company.slug);
    setLogoUrl(data.company.logoUrl ?? "");
    setAccentColor(data.company.accentColor ?? "");
    setEnabledViews(data.company.enabledViews);
  }, [data]);

  function toggleView(key: MachineViewKey) {
    if (key === "overview") return;
    setEnabledViews((prev) => (prev.includes(key) ? prev.filter((v) => v !== key) : [...prev, key]));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await apiFetch(`/api/gbotz/companies/${companyId}`, {
        method: "PATCH",
        body: {
          name,
          slug,
          logoUrl: logoUrl || null,
          accentColor: accentColor || null,
          enabledViews,
        },
      });
      await mutate();
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate() {
    await apiFetch(`/api/gbotz/companies/${companyId}`, { method: "PATCH", body: { active: !data?.company.active } });
    await mutate();
  }

  if (!data) return null;

  return (
    <div className="flex max-w-5xl flex-col gap-4">
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card title="Details">
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-secondary">Name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-accent"
                />
              </label>

              {!advancedOpen ? (
                <button
                  type="button"
                  onClick={() => setAdvancedOpen(true)}
                  className="w-fit text-xs font-medium text-accent"
                >
                  Advanced
                </button>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                    <span className="text-secondary">
                      Slug — changing this immediately changes every URL for this company; existing bookmarks will
                      redirect, but external links may break.
                    </span>
                    <input
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase())}
                      className="rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-accent sm:max-w-xs"
                    />
                  </label>

                  <div className="flex flex-col gap-1 text-sm">
                    <span className="text-secondary">Client dashboard</span>
                    <Link
                      href={GBOTZ.companyDashboardEditor(companyId)}
                      className="w-fit rounded-lg border border-hairline px-3 py-1.5 text-sm font-medium text-secondary hover:bg-surface-2"
                    >
                      Edit dashboard
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card
            title="Branding"
            subtitle="Applies to this company's own dashboard chrome (nav, buttons) — never chart colors."
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-secondary">Logo URL</span>
                <input
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://…"
                  className="rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-accent"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-secondary">Accent color</span>
                <div className="flex items-center gap-2">
                  <span
                    className="h-9 w-9 shrink-0 rounded-lg border border-hairline"
                    style={{ backgroundColor: accentColor || "transparent" }}
                  />
                  <input
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    placeholder="#2a78d6"
                    className="min-w-0 flex-1 rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-accent"
                  />
                </div>
              </label>
            </div>
          </Card>

          <Card title="Danger zone">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-secondary">
                {data.company.active
                  ? "Suspending blocks login and 403s active sessions on their next request. Machines stay assigned."
                  : "This company is suspended — reactivate to restore access."}
              </p>
              <button
                type="button"
                onClick={handleDeactivate}
                className="shrink-0 rounded-lg border px-3 py-1.5 text-sm font-medium"
                style={{ borderColor: "var(--status-critical)", color: "var(--status-critical)" }}
              >
                {data.company.active ? "Suspend" : "Reactivate"}
              </button>
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>

          <Card title="Enabled views" subtitle="Which dashboard tabs this company can see.">
            <div className="grid grid-cols-2 gap-x-3 gap-y-2">
              {MACHINE_VIEWS.map((view) => (
                <label key={view.key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={enabledViews.includes(view.key)}
                    disabled={view.key === "overview"}
                    onChange={() => toggleView(view.key)}
                  />
                  <span className="text-primary">{view.label}</span>
                </label>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
