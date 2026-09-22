"use client";

import { createContext, useContext, useMemo } from "react";
import { useAuth } from "@/context/AuthProvider";
import { routes as rawRoutes } from "@/lib/routes";
import type { CompanyRole, CompanySummary, MachineViewKey } from "@/lib/types";

interface CompanyRoutes {
  home: () => string;
  settings: () => string;
  profile: () => string;
  machine: (machineId: string) => string;
  machineView: (machineId: string, viewSlug: string) => string;
  admin: (section?: string) => string;
  crm: () => string;
  calendar: () => string;
  dashboardEditor: () => string;
  dashboardPreview: () => string;
}

export interface CompanyContextValue {
  slug: string;
  company: CompanySummary;
  role: CompanyRole;
  isAdmin: boolean;
  /** Admins always have this implicitly; other users need it granted (see /admin Users page). */
  canEditDashboard: boolean;
  enabledViews: MachineViewKey[];
  routes: CompanyRoutes;
}

// Exported so dashboardTemplate/StaticCompanyProvider.tsx can feed the same context
// with Gbotz-side data (no authenticated tenant user) for the dashboard-template
// preview pane — MachineCard (used by the machine_card template element) reads
// `routes` from here.
export const CompanyContext = createContext<CompanyContextValue | null>(null);

/**
 * Mounted inside CompanyGate, which has already confirmed the URL's slug matches the
 * authenticated user's own company — so every consumer here can trust `slug` without
 * re-deriving or re-checking it against the URL. This is also why every href in the
 * app is built through `routes` here rather than `useParams()` in each component: one
 * place resolves "which company," everywhere else just consumes the result.
 */
export function CompanyProvider({ slug, children }: { slug: string; children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) throw new Error("CompanyProvider requires an authenticated user — mount it inside CompanyGate");

  const routes = useMemo<CompanyRoutes>(
    () => ({
      home: () => rawRoutes.company(slug),
      settings: () => rawRoutes.companySettings(slug),
      profile: () => rawRoutes.companyProfile(slug),
      machine: (machineId: string) => rawRoutes.companyMachine(slug, machineId),
      machineView: (machineId: string, viewSlug: string) => rawRoutes.companyMachineView(slug, machineId, viewSlug),
      admin: (section?: string) => rawRoutes.companyAdmin(slug, section),
      crm: () => rawRoutes.companyCrm(slug),
      calendar: () => rawRoutes.companyCalendar(slug),
      dashboardEditor: () => rawRoutes.companyDashboardEditor(slug),
      dashboardPreview: () => rawRoutes.companyDashboardPreview(slug),
    }),
    [slug]
  );

  const isAdmin = user.role === "COMPANY_ADMIN";
  const value: CompanyContextValue = {
    slug,
    company: user.company,
    role: user.role,
    isAdmin,
    canEditDashboard: isAdmin || user.canEditDashboard,
    enabledViews: user.company.enabledViews,
    routes,
  };

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}

export function useCompany(): CompanyContextValue {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error("useCompany must be used within CompanyProvider");
  return ctx;
}
