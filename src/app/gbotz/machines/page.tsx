"use client";

import { useState } from "react";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import { Card } from "@/components/Card";
import { StatusBadge } from "@/components/StatusBadge";
import Link from "next/link";
import { AddMachineForm, type CreateMachineInput } from "@/components/gbotz/AddMachineForm";
import { ConfigureMqttForm, type MqttConfigInput } from "@/components/gbotz/ConfigureMqttForm";
import { EditLocationForm } from "@/components/gbotz/EditLocationForm";
import { EditNextMaintenanceForm } from "@/components/gbotz/EditNextMaintenanceForm";
import { GBOTZ } from "@/lib/routes";
import type { GbotzCompany, GbotzMachine } from "@/lib/gbotzTypes";

const LIVENESS_SEVERITY = { ONLINE: "good", STALE: "warning", OFFLINE: "critical", UNKNOWN: "warning" } as const;

type Filter = "all" | "assigned" | "unassigned";

export default function GbotzMachinesPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { data: machinesData, mutate } = useSWR("/api/gbotz/machines", (p) =>
    apiFetch<{ machines: GbotzMachine[] }>(p)
  );
  const { data: companiesData } = useSWR("/api/gbotz/companies", (p) =>
    apiFetch<{ companies: GbotzCompany[] }>(p)
  );

  const companies = companiesData?.companies ?? [];
  const machines = (machinesData?.machines ?? []).filter((m) => {
    if (filter === "assigned") return !!m.companyId;
    if (filter === "unassigned") return !m.companyId;
    return true;
  });

  async function reassign(machineId: string, companyId: string) {
    await apiFetch(`/api/gbotz/machines/${machineId}`, {
      method: "PATCH",
      body: { companyId: companyId || null },
    });
    await mutate();
  }

  async function updateLocation(machineId: string, location: string) {
    await apiFetch(`/api/gbotz/machines/${machineId}/location`, {
      method: "PATCH",
      body: { location },
    });
    await mutate();
  }

  async function updateNextMaintenance(machineId: string, nextMaintenanceAt: string | null) {
    await apiFetch(`/api/gbotz/machines/${machineId}/next-maintenance`, {
      method: "PATCH",
      body: { nextMaintenanceAt },
    });
    await mutate();
  }

  async function configureMqtt(machineId: string, input: MqttConfigInput) {
    await apiFetch(`/api/gbotz/machines/${machineId}/mqtt`, {
      method: "PATCH",
      body: input,
    });
    await mutate();
  }

  async function toggleTriggers(machineId: string, triggersEnabled: boolean) {
    await apiFetch(`/api/gbotz/machines/${machineId}/triggers`, {
      method: "PATCH",
      body: { triggersEnabled },
    });
    await mutate();
  }

  async function handleCreate(input: CreateMachineInput): Promise<GbotzMachine> {
    const result = await apiFetch<{ machine: GbotzMachine }>("/api/gbotz/machines", {
      method: "POST",
      body: input,
    });
    await mutate();
    return result.machine;
  }

  async function handleDelete(machineId: string) {
    setBusyId(machineId);
    try {
      await apiFetch(`/api/gbotz/machines/${machineId}`, { method: "DELETE" });
      await mutate();
    } finally {
      setBusyId(null);
      setConfirmingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-primary">Machines</h1>
          <p className="mt-1 text-sm text-muted">Every sensor MQTT has discovered, across every company.</p>
        </div>
        <AddMachineForm companies={companies} onCreate={handleCreate} />
      </div>

      <div className="flex gap-1 rounded-lg border border-hairline p-1 w-fit">
        {(["all", "unassigned", "assigned"] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
              filter === f ? "bg-surface-2 text-primary" : "text-muted hover:text-primary"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <Card>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-hairline text-[11px] font-semibold uppercase tracking-wider text-muted">
              <th className="py-2 pr-3">Machine</th>
              <th className="py-2 pr-3">Location</th>
              <th className="py-2 pr-3">Next Maintenance</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Company</th>
              <th className="py-2 pr-3">Placement</th>
              <th className="py-2 pr-3">MQTT</th>
              <th className="py-2 pr-3">Triggers</th>
              <th className="py-2 pr-3 text-right">Remove</th>
            </tr>
          </thead>
          <tbody>
            {machines.map((m) => (
              <tr key={m.id} className="border-b border-hairline last:border-0">
                <td className="py-2.5 pr-3 font-medium text-primary">
                  <Link href={GBOTZ.machine(m.id)} className="hover:text-accent">
                    {m.name}
                  </Link>
                </td>
                <td className="py-2.5 pr-3">
                  <EditLocationForm machine={m} onSave={updateLocation} />
                </td>
                <td className="py-2.5 pr-3">
                  <EditNextMaintenanceForm machine={m} onSave={updateNextMaintenance} />
                </td>
                <td className="py-2.5 pr-3">
                  <StatusBadge severity={LIVENESS_SEVERITY[m.liveness as keyof typeof LIVENESS_SEVERITY] ?? "warning"} />
                </td>
                <td className="py-2.5 pr-3">
                  <select
                    value={m.companyId ?? ""}
                    onChange={(e) => reassign(m.id, e.target.value)}
                    className="rounded-lg border border-hairline bg-surface px-2 py-1 text-xs text-primary outline-none focus:border-accent"
                  >
                    <option value="">— Unassigned —</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-2.5 pr-3">
                  {m.mapX !== null && m.mapY !== null ? (
                    m.companyId ? (
                      <Link href={`${GBOTZ.companyFloorMap(m.companyId)}`} className="text-xs font-medium text-accent">
                        Placed
                      </Link>
                    ) : (
                      <span className="text-xs text-secondary">Placed</span>
                    )
                  ) : m.companyId ? (
                    <Link href={`${GBOTZ.companyFloorMap(m.companyId)}`} className="text-xs font-medium text-accent">
                      Place on map
                    </Link>
                  ) : (
                    <span className="text-xs text-muted">Unplaced</span>
                  )}
                </td>
                <td className="py-2.5 pr-3">
                  <ConfigureMqttForm machine={m} onSave={configureMqtt} />
                </td>
                <td className="py-2.5 pr-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={m.triggersEnabled}
                    onClick={() => toggleTriggers(m.id, !m.triggersEnabled)}
                    title={m.triggersEnabled ? "Alerts enabled — click to disable" : "Alerts disabled — click to enable"}
                    className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
                    style={{ backgroundColor: m.triggersEnabled ? "var(--status-good)" : "var(--hairline)" }}
                  >
                    <span
                      className="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform"
                      style={{ transform: m.triggersEnabled ? "translateX(18px)" : "translateX(2px)" }}
                    />
                  </button>
                </td>
                <td className="py-2.5 pr-3 text-right">
                  {confirmingId === m.id ? (
                    <span className="inline-flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleDelete(m.id)}
                        disabled={busyId === m.id}
                        className="text-xs font-medium disabled:opacity-50"
                        style={{ color: "var(--status-critical)" }}
                      >
                        {busyId === m.id ? "Removing…" : "Confirm?"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingId(null)}
                        disabled={busyId === m.id}
                        className="text-xs text-muted disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmingId(m.id)}
                      className="text-xs font-medium"
                      style={{ color: "var(--status-critical)" }}
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {machines.length === 0 && (
              <tr>
                <td colSpan={9} className="py-6 text-center text-sm text-muted">
                  No machines match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
