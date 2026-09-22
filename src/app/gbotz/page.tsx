"use client";

import useSWR from "swr";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { GBOTZ } from "@/lib/routes";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/Card";
import { IconAlertTriangle, IconBuilding, IconCpu, IconGrid } from "@/components/icons";
import type { GbotzCompany, GbotzMachine } from "@/lib/gbotzTypes";

export default function GbotzOverviewPage() {
  const { data: companiesData } = useSWR("/api/gbotz/companies", (p) => apiFetch<{ companies: GbotzCompany[] }>(p));
  const { data: machinesData } = useSWR("/api/gbotz/machines", (p) => apiFetch<{ machines: GbotzMachine[] }>(p));

  const companies = companiesData?.companies ?? [];
  const machines = machinesData?.machines ?? [];
  const unassigned = machines.filter((m) => !m.companyId);
  const totalUsers = companies.reduce((sum, c) => sum + c.userCount, 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-primary">Operations Overview</h1>
        <p className="mt-1 text-sm text-muted">Manage companies, users, and machine assignments across every tenant.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Companies" value={String(companies.length)} icon={<IconBuilding className="h-4 w-4" />} />
        <StatCard label="Users" value={String(totalUsers)} icon={<IconGrid className="h-4 w-4" />} />
        <StatCard label="Machines" value={String(machines.length)} icon={<IconCpu className="h-4 w-4" />} />
        <StatCard
          label="Unassigned machines"
          value={String(unassigned.length)}
          icon={<IconAlertTriangle className="h-4 w-4" />}
          severity={unassigned.length > 0 ? "warning" : "good"}
          hint={unassigned.length > 0 ? "Needs assignment" : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card title="Companies" subtitle="Create or manage a tenant.">
          <Link href={GBOTZ.companies()} className="text-sm font-medium text-accent">
            View all companies →
          </Link>
        </Card>
        <Card title="Machine assignment" subtitle="Assign discovered sensors to a company.">
          <Link href={GBOTZ.machines()} className="text-sm font-medium text-accent">
            View all machines →
          </Link>
        </Card>
      </div>
    </div>
  );
}
