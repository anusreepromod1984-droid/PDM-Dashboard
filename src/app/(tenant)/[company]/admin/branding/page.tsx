"use client";

import { useState, type CSSProperties } from "react";
import { useAuth } from "@/context/AuthProvider";
import { useCompany } from "@/context/CompanyProvider";
import { apiFetch, ApiError } from "@/lib/api";
import { CHART_COLORS } from "@/lib/constants";
import { Card } from "@/components/Card";
import { useTheme } from "@/context/ThemeProvider";
import type { CompanySummary } from "@/lib/types";

export default function AdminBrandingPage() {
  const { company } = useCompany();
  const { refresh } = useAuth();
  const { theme } = useTheme();
  const [name, setName] = useState(company.name);
  const [logoUrl, setLogoUrl] = useState(company.logoUrl ?? "");
  const [accentColor, setAccentColor] = useState(company.accentColor);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const swatches = CHART_COLORS[theme].series;

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await apiFetch<{ company: CompanySummary }>("/api/company/branding", {
        method: "PATCH",
        body: { name, logoUrl: logoUrl || null, accentColor },
      });
      await refresh();
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const previewStyle: CSSProperties = accentColor ? ({ "--accent": accentColor } as CSSProperties) : {};

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

      <Card title="Branding" subtitle="Your accent color applies to buttons and navigation. Chart colors stay fixed to keep readings legible.">
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-secondary">Display name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-accent"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-secondary">Logo URL</span>
            <input
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://…"
              className="rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-accent"
            />
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- arbitrary external URL, next/image would need a remotePatterns entry for every customer's logo host
              <img src={logoUrl} alt="Logo preview" className="mt-1 h-6 w-auto object-contain" />
            )}
          </label>

          <div className="flex flex-col gap-1 text-sm">
            <span className="text-secondary">Accent color</span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setAccentColor(null)}
                className={`h-8 w-8 rounded-full border-2 text-[10px] font-medium ${
                  accentColor === null ? "border-primary" : "border-transparent"
                }`}
                style={{ backgroundColor: "var(--surface-2)" }}
                title="Default"
              >
                Def
              </button>
              {swatches.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setAccentColor(color)}
                  className={`h-8 w-8 rounded-full border-2 ${accentColor === color ? "border-primary" : "border-transparent"}`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          <Card title="Preview">
            <div style={previewStyle} className="flex items-center gap-3">
              <button type="button" className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white">
                Primary button
              </button>
              <span className="rounded-lg bg-accent/10 px-3 py-1.5 text-sm font-medium text-accent">Active nav item</span>
            </div>
          </Card>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-fit rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </Card>
    </div>
  );
}
