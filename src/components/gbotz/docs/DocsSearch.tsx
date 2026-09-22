"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { DOC_SECTIONS } from "@/components/gbotz/docs/docsContent";
import { GBOTZ } from "@/lib/routes";
import { IconSearch } from "@/components/icons";

export function DocsSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DOC_SECTIONS;
    return DOC_SECTIONS.filter((s) => s.title.toLowerCase().includes(q) || s.group.toLowerCase().includes(q));
  }, [query]);

  // Global Cmd/Ctrl+K toggles the palette from anywhere on the page — the single
  // most important entry point per the docs-UI brief, not just the visible button.
  useEffect(() => {
    function onKeyDown(e: globalThis.KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setSelected(0);
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  function jump(id: string) {
    router.push(GBOTZ.docsSection(id));
    setOpen(false);
  }

  function onInputKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = results[selected];
      if (item) jump(item.id);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-56 shrink-0 items-center justify-between gap-2 rounded-lg border border-hairline bg-surface px-3 py-1.5 text-sm text-muted transition-colors hover:border-baseline hover:text-secondary sm:w-64"
      >
        <span className="flex min-w-0 items-center gap-2">
          <IconSearch className="h-4 w-4 shrink-0" />
          <span className="truncate">Search docs…</span>
        </span>
        <kbd className="shrink-0 rounded border border-hairline bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-muted">
          ⌘K
        </kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-[15vh]"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex w-full max-w-lg flex-col overflow-hidden rounded-xl border border-hairline bg-surface shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-hairline px-3 py-2.5">
              <IconSearch className="h-4 w-4 shrink-0 text-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onInputKeyDown}
                placeholder="Search docs…"
                className="w-full bg-transparent text-sm text-primary outline-none placeholder:text-muted"
              />
              <kbd className="shrink-0 rounded border border-hairline px-1.5 py-0.5 text-[10px] text-muted">Esc</kbd>
            </div>
            <div className="max-h-80 overflow-y-auto p-1.5">
              {results.length === 0 && <p className="px-3 py-6 text-center text-sm text-muted">No results</p>}
              {results.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => jump(item.id)}
                  onMouseEnter={() => setSelected(i)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    i === selected ? "bg-surface-2 text-primary" : "text-secondary"
                  }`}
                >
                  <span className="truncate">{item.title}</span>
                  <span className="ml-3 shrink-0 text-xs text-muted">{item.group}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
