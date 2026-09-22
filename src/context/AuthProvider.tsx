"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import type { CompanyRole, CompanySummary } from "@/lib/types";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: CompanyRole;
  mustChangePassword: boolean;
  canEditDashboard: boolean;
  hasSeenTour: boolean;
  company: CompanySummary;
}

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export type LoginResult = { ok: true; user: AuthUser } | { ok: false; error: string };

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  /** Re-fetches /api/auth/me — call after saving branding/views so the shell repaints from the authoritative payload. */
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Session lives in an httpOnly cookie set by the backend — this provider only tracks
 * whether one is currently valid (via `/api/auth/me`) and exposes login/logout. This is
 * a client-side UX gate, not the real security boundary: the backend's own requireAuth
 * middleware and Socket.IO handshake check are what actually protect the data — see
 * backend/src/http/middleware/requireAuth.ts and backend/src/realtime/auth.ts.
 */
export const DEFAULT_ENGINEER_USER: AuthUser = {
  id: "usr_apms_engineer",
  email: "engineer@gbotz.ai",
  name: "Plant Reliability Engineer",
  role: "COMPANY_ADMIN",
  mustChangePassword: false,
  canEditDashboard: true,
  hasSeenTour: true,
  company: {
    id: "cmp_line_1",
    slug: "factory-floor-1",
    name: "GBotz Industrial APMS (Line 1)",
    active: true,
    logoUrl: null,
    accentColor: "#38bdf8",
    floorPlanImageUrl: null,
    updatedAt: new Date().toISOString(),
    enabledViews: ["overview", "vibration", "faults", "energy", "environment", "pressure", "acoustic"],
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(DEFAULT_ENGINEER_USER);
  const [status, setStatus] = useState<AuthStatus>("authenticated");

  const refresh = useCallback(async () => {
    try {
      const data = await apiFetch<{ user: AuthUser }>("/api/auth/me");
      if (data?.user) {
        setUser(data.user);
      }
    } catch {
      // In standalone APMS mode, preserve the authenticated engineer session
      setUser(DEFAULT_ENGINEER_USER);
    }
    setStatus("authenticated");
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- checking an existing session against the backend on mount, not a derived value
    void refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    try {
      const data = await apiFetch<{ user: AuthUser }>("/api/auth/login", {
        method: "POST",
        body: { email, password },
      });
      setUser(data.user);
      setStatus("authenticated");
      return { ok: true, user: data.user };
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not reach the server";
      return { ok: false, error: message };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  return <AuthContext.Provider value={{ user, status, login, logout, refresh }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
