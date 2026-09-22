"use client";

import { useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api";
import type { GbotzMachine } from "@/lib/gbotzTypes";

/**
 * Inline editor for a machine's free-text location label — distinct from its floor-plan
 * bay/row (edited from the Floor map page instead; see lib/floorLocation.ts). Same
 * click-to-open popover convention as ConfigureMqttForm.tsx.
 */
export function EditLocationForm({
  machine,
  onSave,
}: {
  machine: GbotzMachine;
  onSave: (machineId: string, location: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const popoverRef = useRef<HTMLFormElement>(null);

  function openForm() {
    setLocation(machine.location ?? "");
    setError(null);
    setOpen(true);
  }

  function close() {
    setOpen(false);
    setError(null);
  }

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        close();
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
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
    const trimmed = location.trim();
    if (!trimmed) {
      setError("Location must not be empty");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSave(machine.id, trimmed);
      close();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update location");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => (open ? close() : openForm())}
        className="text-left text-secondary transition-colors hover:text-primary"
      >
        {machine.location ?? <span className="text-muted">— set location</span>}
      </button>
      {open && (
        <form
          ref={popoverRef}
          onSubmit={handleSubmit}
          className="absolute left-0 top-full z-20 mt-2 flex w-[min(90vw,20rem)] flex-col gap-3 rounded-lg border border-hairline bg-surface p-4 text-left shadow-lg"
        >
          {error && (
            <p className="text-sm" style={{ color: "var(--status-critical)" }}>
              {error}
            </p>
          )}
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-secondary">Location</span>
            <input
              autoFocus
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Plant 2 — Compressor room"
              className="rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-accent"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={close}
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
