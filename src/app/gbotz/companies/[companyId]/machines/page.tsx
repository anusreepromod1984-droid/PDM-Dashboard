"use client";

import { use } from "react";
import Link from "next/link";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import { Card } from "@/components/Card";
import { StatusBadge } from "@/components/StatusBadge";
import { GBOTZ } from "@/lib/routes";
import type { GbotzMachine } from "@/lib/gbotzTypes";

const LIVENESS_SEVERITY = { ONLINE: "good", STALE: "warning", OFFLINE: "critical", UNKNOWN: "warning" } as const;

export default function GbotzCompanyMachinesPage({
  params,
}: PageProps<"/gbotz/companies/[companyId]/machines">) {
  const { companyId } = use(params);
  const { data: allMachines, mutate } = useSWR("/api/gbotz/machines", (p) =>
    apiFetch<{ machines: GbotzMachine[] }>(p)
  );

  const assigned = (allMachines?.machines ?? []).filter((m) => m.companyId === companyId);
  const unassigned = (allMachines?.machines ?? []).filter((m) => !m.companyId);

  async function assign(machineId: string, targetCompanyId: string | null) {
    await apiFetch(`/api/gbotz/machines/${machineId}`, { method: "PATCH", body: { companyId: targetCompanyId } });
    await mutate();
  }

  return (
    <div className="flex flex-col gap-4">
      <Card title="Assigned machines">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-hairline text-[11px] font-semibold uppercase tracking-wider text-muted">
              <th className="py-2 pr-3">Machine</th>
              <th className="py-2 pr-3">Location</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3" />
            </tr>
          </thead>
          <tbody>
            {assigned.map((m) => (
              <tr key={m.id} className="border-b border-hairline last:border-0">
                <td className="py-2.5 pr-3 font-medium text-primary">
                  <Link href={GBOTZ.machine(m.id)} className="hover:text-accent">
                    {m.name}
                  </Link>
                </td>
                <td className="py-2.5 pr-3 text-secondary">{m.location ?? "—"}</td>
                <td className="py-2.5 pr-3">
                  <StatusBadge severity={LIVENESS_SEVERITY[m.liveness as keyof typeof LIVENESS_SEVERITY] ?? "warning"} />
                </td>
                <td className="py-2.5 pr-3 text-right">
                  <button type="button" onClick={() => assign(m.id, null)} className="text-xs font-medium text-accent">
                    Unassign
                  </button>
                </td>
              </tr>
            ))}
            {assigned.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-sm text-muted">
                  No machines assigned yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <Card title="Unassigned machines" subtitle="Discovered by MQTT but not assigned to any company yet.">
        <table className="w-full text-left text-sm">
          <tbody>
            {unassigned.map((m) => (
              <tr key={m.id} className="border-b border-hairline last:border-0">
                <td className="py-2.5 pr-3 font-medium text-primary">
                  <Link href={GBOTZ.machine(m.id)} className="hover:text-accent">
                    {m.name}
                  </Link>
                </td>
                <td className="py-2.5 pr-3 text-right">
                  <button type="button" onClick={() => assign(m.id, companyId)} className="text-xs font-medium text-accent">
                    Assign to this company
                  </button>
                </td>
              </tr>
            ))}
            {unassigned.length === 0 && (
              <tr>
                <td className="py-6 text-center text-sm text-muted">Nothing unassigned right now.</td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
