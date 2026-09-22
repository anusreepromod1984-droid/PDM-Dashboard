"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";

export interface GbotzUser {
  id: string;
  email: string;
  name: string | null;
}

export type GbotzAuthStatus = "loading" | "authenticated" | "unauthenticated";

export type GbotzLoginResult = { ok: true; admin: GbotzUser } | { ok: false; error: string };

interface GbotzAuthContextValue {
  admin: GbotzUser | null;
  status: GbotzAuthStatus;
  login: (email: string, password: string) => Promise<GbotzLoginResult>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  /** Local-only equivalent of logout(), for when a request has already told us the
   *  session is dead server-side — skips the doomed POST /auth/logout round-trip. */
  sessionExpired: () => void;
}

const GbotzAuthContext = createContext<GbotzAuthContextValue | null>(null);

/**
 * Structurally parallel to context/AuthProvider.tsx but NOT code-shared with it beyond
 * the generic apiFetch wrapper — two independent security domains (own cookie
 * `gbotz_session`, own backend routes under /api/gbotz/*). Deliberately duplicated
 * rather than factored into a shared "createSessionAuth()": a shared factory would
 * couple two systems that need to coexist in one browser (a Gbotz staffer testing
 * their own tenant account) without any cross-talk, and any future behavior added to
 * a shared factory (e.g. "auto-refresh on 401") would silently apply to both.
 */
export function GbotzAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<GbotzUser | null>(null);
  const [status, setStatus] = useState<GbotzAuthStatus>("loading");

  const sessionExpired = useCallback(() => {
    setAdmin(null);
    setStatus("unauthenticated");
  }, []);

  const refresh = useCallback(async () => {
    try {
      const data = await apiFetch<{ admin: GbotzUser }>("/api/gbotz/auth/me");
      setAdmin(data.admin);
      setStatus("authenticated");
    } catch {
      sessionExpired();
    }
  }, [sessionExpired]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- checking an existing session against the backend on mount, not a derived value
    void refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string): Promise<GbotzLoginResult> => {
    try {
      const data = await apiFetch<{ admin: GbotzUser }>("/api/gbotz/auth/login", {
        method: "POST",
        body: { email, password },
      });
      setAdmin(data.admin);
      setStatus("authenticated");
      return { ok: true, admin: data.admin };
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not reach the server";
      return { ok: false, error: message };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch("/api/gbotz/auth/logout", { method: "POST" });
    } finally {
      sessionExpired();
    }
  }, [sessionExpired]);

  return (
    <GbotzAuthContext.Provider value={{ admin, status, login, logout, refresh, sessionExpired }}>
      {children}
    </GbotzAuthContext.Provider>
  );
}

export function useGbotzAuth(): GbotzAuthContextValue {
  const ctx = useContext(GbotzAuthContext);
  if (!ctx) throw new Error("useGbotzAuth must be used within GbotzAuthProvider");
  return ctx;
}
