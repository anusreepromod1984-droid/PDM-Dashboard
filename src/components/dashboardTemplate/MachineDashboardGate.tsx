"use client";

import type { ReactNode } from "react";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import { DashboardTemplateRenderer } from "@/components/dashboardTemplate/DashboardTemplateRenderer";
import type { MachineViewKey } from "@/lib/types";

/**
 * Same pattern as the fleet Overview page's own template-or-fallback check: if this
 * company has a saved template for this machine tab, render it live; otherwise render
 * the existing hardcoded view component unchanged. Zero risk to companies with no
 * saved machine-view template — which is every company today except ones staff
 * explicitly edit.
 */
export function MachineDashboardGate({
  machineId,
  view,
  fallback,
}: {
  machineId: string;
  view: MachineViewKey;
  fallback: ReactNode;
}) {
  const { data } = useSWR(`/api/company/machine-dashboard-template/${view}`, (p: string) =>
    apiFetch<{ template: { source: string } | null }>(p)
  );

  if (data?.template) {
    return <DashboardTemplateRenderer machineId={machineId} source={data.template.source} />;
  }
  return <>{fallback}</>;
}
