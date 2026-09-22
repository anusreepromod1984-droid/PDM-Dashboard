"use client";

import { useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api";
import type { GbotzCompany, GbotzMachine } from "@/lib/gbotzTypes";

export interface CreateMachineInput {
  id: string;
  name: string;
  location?: string;
  ratedRpm?: number;
  companyId?: string;
}

/**
 * Lets Gbotz staff register a machine directly — e.g. provisioning a sensor for a
 * company before it's physically wired up and publishing over MQTT. If MQTT later
 * publishes telemetry under the same id, ingestion adopts this row transparently.
 */
export function AddMachineForm({
  companies,
  onCreate,
}: {
  companies: GbotzCompany[];
  onCreate: (input: CreateMachineInput) => Promise<GbotzMachine>;
}) {
  const [open, setOpen] = useState(false);
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [ratedRpm, setRatedRpm] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const popoverRef = useRef<HTMLFormElement>(null);

  function reset() {
    setOpen(false);
    setId("");
    setName("");
    setLocation("");
    setRatedRpm("");
    setCompanyId("");
    setError(null);
  }

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        reset();
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") reset();
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onCreate({
        id,
        name,
        location: location || undefined,
        ratedRpm: ratedRpm ? Number(ratedRpm) : undefined,
        companyId: companyId || undefined,
      });
      reset();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create machine");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        Add machine
      </button>
      {open && (
        <form
          ref={popoverRef}
          onSubmit={handleSubmit}
          className="absolute right-0 top-full z-20 mt-2 flex w-[min(90vw,28rem)] flex-col gap-3 rounded-lg border border-hairline bg-surface p-4 shadow-lg"
        >
          {error && (
            <p className="rounded-lg px-3 py-2 text-sm" style={{ color: "var(--status-critical)" }}>
              {error}
            </p>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-secondary">Machine ID</span>
              <input
                required
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="e.g. motor-04"
                className="rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-accent"
              />
              <span className="text-xs text-muted">Must match the MQTT topic segment if this sensor publishes later.</span>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-secondary">Name</span>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-accent"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-secondary">Location (optional)</span>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-accent"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-secondary">Rated RPM (optional)</span>
              <input
                type="number"
                value={ratedRpm}
                onChange={(e) => setRatedRpm(e.target.value)}
                className="rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-accent"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span className="text-secondary">Company (optional)</span>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-accent"
              >
                <option value="">— Unassigned —</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? "Creating…" : "Create machine"}
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-lg border border-hairline px-3 py-1.5 text-sm font-medium text-secondary hover:bg-surface-2"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
