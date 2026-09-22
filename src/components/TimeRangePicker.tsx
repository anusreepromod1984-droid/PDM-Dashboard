"use client";

import { useEffect, useRef, useState } from "react";
import { useTimeRange } from "@/context/TimeRangeProvider";
import { TIME_RANGES } from "@/lib/constants";

/** epoch ms -> the "yyyy-MM-ddTHH:mm" shape <input type="datetime-local"> expects, in
 *  the viewer's local timezone (matching how the chart itself renders timestamps). */
function toLocalInputValue(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInputValue(value: string): number | null {
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

/**
 * Time-range selector for the machine-detail charts — fixed presets (Live/1h/6h/24h/7d)
 * plus a "Custom" option that opens a from/to date-range popover, per the dataviz
 * skill's filter convention (presets first, custom range tucked behind a hairline).
 */
export function TimeRangePicker() {
  const { range, setRange, customRange, setCustomRange } = useTimeRange();
  const [open, setOpen] = useState(false);
  const [fromValue, setFromValue] = useState("");
  const [toValue, setToValue] = useState("");
  // Captured once when the panel opens (not read at render time) — "now" is a valid
  // upper bound for "To" at the moment the user opens the picker, not a value that
  // should keep advancing and reflowing the form while they're filling it in.
  const [maxToValue, setMaxToValue] = useState("");
  const popoverRef = useRef<HTMLFormElement>(null);

  function openCustomPanel() {
    const now = Date.now();
    setFromValue(toLocalInputValue(customRange?.from ?? now - 24 * 3_600_000));
    setToValue(toLocalInputValue(customRange?.to ?? now));
    setMaxToValue(toLocalInputValue(now));
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const from = fromLocalInputValue(fromValue);
  const to = fromLocalInputValue(toValue);
  const isValidRange = from !== null && to !== null && from < to;

  function applyCustomRange(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidRange || from === null || to === null) return;
    setCustomRange({ from, to });
    setRange("custom");
    setOpen(false);
  }

  return (
    <div className="relative flex w-fit gap-1 rounded-lg border border-hairline p-1">
      {TIME_RANGES.map((r) => (
        <button
          key={r.key}
          type="button"
          onClick={() => setRange(r.key)}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
            range === r.key ? "bg-surface-2 text-primary" : "text-muted hover:text-primary"
          }`}
        >
          {r.label}
        </button>
      ))}
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openCustomPanel())}
        className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
          range === "custom" ? "bg-surface-2 text-primary" : "text-muted hover:text-primary"
        }`}
      >
        {range === "custom" && customRange
          ? `${new Date(customRange.from).toLocaleDateString()} – ${new Date(customRange.to).toLocaleDateString()}`
          : "Custom"}
      </button>

      {open && (
        <form
          ref={popoverRef}
          onSubmit={applyCustomRange}
          className="absolute right-0 top-full z-20 mt-2 flex w-[min(90vw,22rem)] flex-col gap-3 rounded-lg border border-hairline bg-surface p-4 text-left shadow-lg"
        >
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-secondary">From</span>
            <input
              autoFocus
              type="datetime-local"
              value={fromValue}
              max={toValue || undefined}
              onChange={(e) => setFromValue(e.target.value)}
              className="rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-accent"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-secondary">To</span>
            <input
              type="datetime-local"
              value={toValue}
              min={fromValue || undefined}
              max={maxToValue || undefined}
              onChange={(e) => setToValue(e.target.value)}
              className="rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-accent"
            />
          </label>
          {!isValidRange && (
            <p className="text-xs" style={{ color: "var(--status-critical)" }}>
              Pick a &quot;from&quot; time before &quot;to&quot;.
            </p>
          )}
          <div className="mt-1 flex flex-wrap gap-2 border-t border-hairline pt-3">
            <button
              type="submit"
              disabled={!isValidRange}
              className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
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
