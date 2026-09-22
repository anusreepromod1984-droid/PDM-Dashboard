"use client";

import { useMemo, type ReactNode } from "react";
import { CompanyContext, type CompanyContextValue } from "@/context/CompanyProvider";
import type { CompanySummary } from "@/lib/types";

/**
 * Feeds CompanyContext with static data for the Gbotz dashboard-template preview
 * pane, which has no authenticated tenant user (and so no real CompanyProvider) —
 * needed because MachineCard (used by the machine_card template element) reads
 * `routes` from useCompany(). Navigation out of the preview isn't a real use case, so
 * `routes` here are inert (return "#") rather than real tenant URLs.
 */
export function StaticCompanyProvider({ company, children }: { company: CompanySummary; children: ReactNode }) {
  const value = useMemo<CompanyContextValue>(
    () => ({
      slug: company.slug,
      company,
      role: "COMPANY_ADMIN",
      isAdmin: true,
      canEditDashboard: true,
      enabledViews: company.enabledViews,
      routes: {
        home: () => "#",
        settings: () => "#",
        profile: () => "#",
        machine: () => "#",
        machineView: () => "#",
        admin: () => "#",
        crm: () => "#",
        calendar: () => "#",
        dashboardEditor: () => "#",
        dashboardPreview: () => "#",
      },
    }),
    [company]
  );

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}
