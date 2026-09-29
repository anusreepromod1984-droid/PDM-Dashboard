"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/context/LanguageProvider";
import { LANGUAGES } from "@/lib/i18n";

/* ─── Icon ─── */
function GlobeIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

/* ─── European group codes ─── */
const EUROPEAN_CODES = new Set(["de", "fr", "es", "it", "pt", "nl", "pl"]);
const REGIONAL_CODES = new Set(["hi", "ta", "te", "bn", "mr", "gu"]);

function groupLabel(code: string): string {
  if (code === "en") return "Global";
  if (EUROPEAN_CODES.has(code)) return "European";
  if (REGIONAL_CODES.has(code)) return "Regional (India)";
  return "Other";
}

export function LanguageSwitcher() {
  const { lang, setLang, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  // Group languages
  const groups: { label: string; items: typeof LANGUAGES }[] = [];
  const seen = new Set<string>();
  for (const lang of LANGUAGES) {
    const gl = groupLabel(lang.code);
    if (!seen.has(gl)) {
      seen.add(gl);
      groups.push({ label: gl, items: [] });
    }
    groups[groups.length - 1].items.push(lang);
  }
  // Fix: collect by group properly
  const groupMap: Record<string, typeof LANGUAGES> = {};
  for (const l of LANGUAGES) {
    const gl = groupLabel(l.code);
    if (!groupMap[gl]) groupMap[gl] = [];
    groupMap[gl].push(l);
  }
  const orderedGroups = ["Global", "European", "Regional (India)"].map((g) => ({
    label: g,
    items: groupMap[g] ?? [],
  }));

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      {/* Trigger button */}
      <button
        id="language-switcher-btn"
        suppressHydrationWarning
        aria-label={t("selectLanguage")}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 12px",
          borderRadius: "8px",
          border: "1px solid var(--border, rgba(255,255,255,0.12))",
          background: open
            ? "var(--surface-3, rgba(255,255,255,0.08))"
            : "var(--surface-2, rgba(255,255,255,0.04))",
          color: "var(--text-1, #e2e8f0)",
          fontSize: "13px",
          fontWeight: 500,
          cursor: "pointer",
          transition: "background 0.15s, border-color 0.15s",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background =
            "var(--surface-3, rgba(255,255,255,0.08))";
        }}
        onMouseLeave={(e) => {
          if (!open)
            (e.currentTarget as HTMLButtonElement).style.background =
              "var(--surface-2, rgba(255,255,255,0.04))";
        }}
      >
        <GlobeIcon />
        <span style={{ fontSize: "16px", lineHeight: 1 }}>{current.flag}</span>
        <span>{current.label}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="currentColor"
          style={{
            opacity: 0.6,
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.2s",
          }}
          aria-hidden="true"
        >
          <path d="M1 3l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          role="listbox"
          aria-label={t("selectLanguage")}
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            minWidth: "220px",
            maxHeight: "360px",
            overflowY: "auto",
            background: "var(--surface-panel, #1a1f2e)",
            border: "1px solid var(--border, rgba(255,255,255,0.12))",
            borderRadius: "12px",
            boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
            zIndex: 9999,
            padding: "6px 0",
            backdropFilter: "blur(12px)",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "8px 14px 4px",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              color: "var(--text-3, rgba(255,255,255,0.4))",
              textTransform: "uppercase",
            }}
          >
            {t("selectLanguage")}
          </div>

          {orderedGroups.map(({ label, items }) =>
            items.length === 0 ? null : (
              <div key={label}>
                {/* Group divider */}
                <div
                  style={{
                    padding: "6px 14px 2px",
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--accent, #6366f1)",
                    opacity: 0.8,
                  }}
                >
                  {label}
                </div>

                {items.map((l) => {
                  const isSelected = l.code === lang;
                  return (
                    <button
                      key={l.code}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        setLang(l.code);
                        setOpen(false);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        width: "100%",
                        padding: "8px 14px",
                        border: "none",
                        background: isSelected
                          ? "var(--accent-subtle, rgba(99,102,241,0.15))"
                          : "transparent",
                        color: isSelected
                          ? "var(--accent, #6366f1)"
                          : "var(--text-1, #e2e8f0)",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: isSelected ? 600 : 400,
                        textAlign: "left",
                        transition: "background 0.12s",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected)
                          (e.currentTarget as HTMLButtonElement).style.background =
                            "rgba(255,255,255,0.06)";
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected)
                          (e.currentTarget as HTMLButtonElement).style.background =
                            "transparent";
                      }}
                    >
                      <span style={{ fontSize: "18px", lineHeight: 1, flexShrink: 0 }}>
                        {l.flag}
                      </span>
                      <span style={{ flex: 1 }}>{l.label}</span>
                      <span
                        style={{
                          fontSize: "11px",
                          opacity: 0.5,
                          color: isSelected ? "var(--accent, #6366f1)" : "inherit",
                        }}
                      >
                        {l.englishLabel}
                      </span>
                      {isSelected && (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="var(--accent, #6366f1)"
                          style={{ flexShrink: 0 }}
                          aria-hidden="true"
                        >
                          <path d="M2 7l3.5 3.5L12 3" stroke="var(--accent, #6366f1)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
