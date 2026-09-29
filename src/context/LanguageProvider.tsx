"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { LangCode } from "@/lib/i18n";
import { t as translate, LANGUAGES } from "@/lib/i18n";

/* ─────────────────────────────── Types ─────────────────────────────── */
interface LanguageContextValue {
  lang: LangCode;
  setLang: (lang: LangCode) => void;
  /** Shorthand translate helper bound to current lang. */
  t: (key: string) => string;
}

/* ─────────────────────────────── Context ───────────────────────────── */
const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "pdm-language";
const DEFAULT_LANG: LangCode = "en";

/**
 * POST the selected language to the backend so that WhatsApp/Email alert
 * notifications are dispatched in the operator's chosen language.
 * Fire-and-forget — a failure here must never break the UI.
 */
function syncLanguageToBackend(lang: LangCode) {
  fetch("/api/settings/alert-language", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ language: lang }),
  }).catch(() => {
    // Backend unreachable — alerts will fall back to English, which is fine.
  });
}

/* ─────────────────────────────── Provider ──────────────────────────── */
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Start with DEFAULT_LANG to ensure SSR and initial client hydration match identically
  const [lang, setLangState] = useState<LangCode>(DEFAULT_LANG);

  // Restore persisted preference on mount after hydration completes
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) as LangCode | null;
      if (stored && LANGUAGES.some((l) => l.code === stored) && stored !== DEFAULT_LANG) {
        setLangState(stored);
        syncLanguageToBackend(stored);
      }
    } catch {
      // Storage unavailable
    }
  }, []);

  const setLang = useCallback((newLang: LangCode) => {
    setLangState(newLang);
    try {
      window.localStorage.setItem(STORAGE_KEY, newLang);
    } catch {
      // Storage unavailable
    }
    syncLanguageToBackend(newLang);
  }, []);

  const t = useCallback(
    (key: string) => translate(lang, key),
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

/* ─────────────────────────────── Hook ──────────────────────────────── */
export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
