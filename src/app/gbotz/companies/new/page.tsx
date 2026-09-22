"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { GBOTZ, isValidSlug } from "@/lib/routes";
import { MACHINE_VIEWS } from "@/lib/machineViews";
import { Card } from "@/components/Card";
import type { MachineViewKey } from "@/lib/types";
import type { GbotzCompany } from "@/lib/gbotzTypes";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export default function NewCompanyPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminName, setAdminName] = useState("");
  const [enabledViews, setEnabledViews] = useState<MachineViewKey[]>(MACHINE_VIEWS.map((v) => v.key));
  const [dashboardMode, setDashboardMode] = useState<"blank" | "default">("blank");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ company: GbotzCompany; initialPassword?: string } | null>(null);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  function toggleView(key: MachineViewKey) {
    if (key === "overview") return; // always enabled, not toggleable
    setEnabledViews((prev) => (prev.includes(key) ? prev.filter((v) => v !== key) : [...prev, key]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const result = await apiFetch<{ company: GbotzCompany; admin?: unknown; initialPassword?: string }>(
        "/api/gbotz/companies",
        {
          method: "POST",
          body: {
            slug,
            name,
            enabledViews,
            dashboardMode,
            ...(adminEmail ? { admin: { email: adminEmail, name: adminName || undefined } } : {}),
          },
        }
      );
      setSuccess({ company: result.company, initialPassword: result.initialPassword });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create company");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="flex max-w-lg flex-col gap-4">
        <h1 className="text-lg font-semibold text-primary">Company created</h1>
        <Card>
          <p className="text-sm text-secondary">
            <span className="font-medium text-primary">{success.company.name}</span> is live at{" "}
            <code className="rounded bg-surface-2 px-1.5 py-0.5 text-xs">/{success.company.slug}</code>.
          </p>
          {success.initialPassword && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-secondary">Admin password:</span>
              <code className="rounded bg-surface-2 px-2 py-1 font-mono text-sm text-primary">
                {success.initialPassword}
              </code>
            </div>
          )}
          <button
            type="button"
            onClick={() => router.push(GBOTZ.company(success.company.id))}
            className="mt-4 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
          >
            Go to company
          </button>
        </Card>
      </div>
    );
  }

  const slugValid = slug.length > 0 && isValidSlug(slug);

  return (
    <div className="flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-primary">New company</h1>
        <p className="mt-1 text-sm text-muted">Creates a tenant and, optionally, its first administrator.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <p className="rounded-lg px-3 py-2 text-sm" style={{ color: "var(--status-critical)" }}>
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="flex flex-col gap-4 lg:col-span-2">
            <Card title="Company">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-secondary">Name</span>
                  <input
                    required
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-accent"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-secondary">Slug — dashboard address will be /{slug || "…"}</span>
                  <input
                    required
                    value={slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setSlug(e.target.value.toLowerCase());
                    }}
                    className="rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-accent"
                  />
                  {slug.length > 0 && !slugValid && (
                    <span className="text-xs" style={{ color: "var(--status-critical)" }}>
                      Lowercase letters, numbers, and hyphens only — and not a reserved word.
                    </span>
                  )}
                </label>
              </div>
            </Card>

            <Card title="First administrator" subtitle="Optional — you can add users later from the company's detail page.">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-secondary">Email</span>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-accent"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-secondary">Name (optional)</span>
                  <input
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-accent"
                  />
                </label>
                <p className="text-xs text-muted sm:col-span-2">
                  A password will be generated and shown once after creation.
                </p>
              </div>
            </Card>
          </div>

          <div className="flex flex-col gap-4">
            <Card title="Enabled views" subtitle="Which of the six dashboard tabs this company starts with.">
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
              <p className="mt-2 text-xs text-muted">Overview is always available.</p>
            </Card>

            <Card
              title="Dashboard"
              subtitle="Either way, it's fully editable later from the company's Dashboard editor."
            >
              <div className="flex flex-col gap-2">
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="radio"
                    name="dashboardMode"
                    checked={dashboardMode === "blank"}
                    onChange={() => setDashboardMode("blank")}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="text-primary">Blank</span>
                    <span className="block text-xs text-muted">
                      Build from scratch in Liquid. Until something is saved, the client sees the built-in
                      default UI.
                    </span>
                  </span>
                </label>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="radio"
                    name="dashboardMode"
                    checked={dashboardMode === "default"}
                    onChange={() => setDashboardMode("default")}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="text-primary">Use default template</span>
                    <span className="block text-xs text-muted">
                      Pre-fills the fleet Overview and all 6 machine tabs with the standard look.
                    </span>
                  </span>
                </label>
              </div>
            </Card>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting || !slugValid || !name}
          className="w-fit rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? "Creating…" : "Create company"}
        </button>
      </form>
    </div>
  );
}
