"use client";

import { useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api";
import type { GbotzMachine } from "@/lib/gbotzTypes";

/** ISO datetime -> the yyyy-mm-dd shape <input type="date"> expects, without going
 * through a Date object (avoids shifting the day across the local/UTC boundary). */
function toDateInputValue(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "";
}

function isOverdue(iso: string | null): boolean {
  if (!iso) return false;
  return new Date(iso).getTime() < Date.now();
}

/**
 * Inline editor for a machine's next-maintenance reminder date — a manual note set by
 * Gbotz staff, independent of any device-reported "remaining hours" telemetry alert
 * (see backend/src/domain/defaultAlertProfile.ts). Same click-to-open popover
 * convention as EditLocationForm.tsx.
 */
export function EditNextMaintenanceForm({
  machine,
  onSave,
}: {
  machine: GbotzMachine;
  onSave: (machineId: string, nextMaintenanceAt: string | null) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const popoverRef = useRef<HTMLFormElement>(null);

  function openForm() {
    setDate(toDateInputValue(machine.nextMaintenanceAt));
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

  async function submit(value: string | null) {
    setSubmitting(true);
    setError(null);
    try {
      await onSave(machine.id, value);
      close();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update next maintenance date");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit(date || null);
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => (open ? close() : openForm())}
        className="text-left transition-colors hover:text-primary"
        style={isOverdue(machine.nextMaintenanceAt) ? { color: "var(--status-critical)" } : undefined}
      >
        {machine.nextMaintenanceAt ? (
          new Date(machine.nextMaintenanceAt).toLocaleDateString()
        ) : (
          <span className="text-muted">— set date</span>
        )}
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
            <span className="text-secondary">Next maintenance date</span>
            <input
              autoFocus
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
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
              disabled={submitting}
              onClick={() => submit(null)}
              className="rounded-lg border border-hairline px-3 py-1.5 text-sm font-medium text-secondary hover:bg-surface-2 disabled:opacity-60"
            >
              Clear
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
