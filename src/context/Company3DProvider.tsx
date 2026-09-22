"use client";

import { useMemo } from "react";
import { useAuth } from "@/context/AuthProvider";
import { CompanyContext, type CompanyContextValue } from "@/context/CompanyProvider";
import { ROUTES_3D } from "@/lib/routes";

/**
 * Feeds the same CompanyContext the regular tenant flow uses, so components shared
 * between the two flows (MachineCard, MachineOverviewView, AiFaultAssistant, ...) work
 * unmodified — only `routes` differs, bound to /3d/<slug>/... instead of /<slug>/....
 * Mirrors lib/dashboardTemplate/StaticCompanyProvider.tsx's same "reuse the context,
 * swap the routes" trick. Settings/admin/dashboard-editor have no /3d equivalent (out
 * of scope — see plan), so those route builders just point back at the /3d overview.
 */
export function Company3DProvider({ slug, children }: { slug: string; children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) throw new Error("Company3DProvider requires an authenticated user — mount it inside ThreeDCompanyGate");

  const value = useMemo<CompanyContextValue>(() => {
    const isAdmin = user.role === "COMPANY_ADMIN";
    return {
      slug,
      company: user.company,
      role: user.role,
      isAdmin,
      canEditDashboard: isAdmin || user.canEditDashboard,
      enabledViews: user.company.enabledViews,
      routes: {
        home: () => ROUTES_3D.company(slug),
        settings: () => ROUTES_3D.company(slug),
        profile: () => ROUTES_3D.company(slug),
        machine: (machineId: string) => ROUTES_3D.companyMachine(slug, machineId),
        machineView: (machineId: string, viewSlug: string) => ROUTES_3D.companyMachineView(slug, machineId, viewSlug),
        admin: () => ROUTES_3D.company(slug),
        crm: () => ROUTES_3D.company(slug),
        calendar: () => ROUTES_3D.company(slug),
        dashboardEditor: () => ROUTES_3D.company(slug),
        dashboardPreview: () => ROUTES_3D.company(slug),
      },
    };
  }, [slug, user]);

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}
