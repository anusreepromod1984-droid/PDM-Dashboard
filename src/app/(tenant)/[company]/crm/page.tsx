"use client";

import Link from "next/link";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import { useCompany } from "@/context/CompanyProvider";
import { Card } from "@/components/Card";

type CrmTicket = {
  work_order_id: string;
  machine_id: string;
  machine_name: string;
  defect_code: string;
  title: string;
  status: string;
  priority: string;
  part: string;
  bin: string;
  sourcing: string;
  source: string;
  pm_due_date?: string | null;
  repair_window?: string | null;
  repair_crew?: string | null;
  ticket_type?: string | null;
};

type CrmBin = {
  part_key: string;
  part: string;
  bin: string;
  qty: number;
  min_qty: number;
  available: boolean;
  below_min: boolean;
};

type CrmVendor = {
  part_key: string;
  part: string;
  name: string;
  city: string;
  phone: string;
  oem_line: string;
  qty_on_hand: number;
  lead_time_days: number;
  unit_inr: number;
  available: boolean;
};

type CrmBoard = {
  demo: boolean;
  notice: string;
  plant: {
    name: string;
    city: string;
    pin: string;
    crm_system: string;
    crm_connected: boolean;
    sap_client: string;
    sap_plant: string;
    planner_group: string;
    planner_name: string;
  };
  tickets: CrmTicket[];
  stores: CrmBin[];
  vendors: CrmVendor[];
};

function tone(ok: boolean): string {
  return ok
    ? "border-emerald-800/50 bg-emerald-950/30 text-emerald-300"
    : "border-hairline bg-surface-2 text-muted";
}

export default function DemoCrmPage() {
  const { routes } = useCompany();
  const { data, error, isLoading } = useSWR("/api/crm", (p) => apiFetch<CrmBoard>(p), {
    refreshInterval: 8000,
  });

  return (
    <div className="flex max-w-6xl flex-col gap-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">Greenbotz Demo SAP PM</p>
        <h1 className="mt-1 text-lg font-semibold text-primary">CRM</h1>
        <p className="mt-1 text-sm text-muted">
          Dummy plant CRM for ladder tests. Not a live SAP system — tickets, bins, and vendors come from the plant file.
        </p>
      </div>

      {isLoading && <p className="text-sm text-muted">Loading demo CRM…</p>}
      {error && <p className="text-sm text-rose-400">{error.message}</p>}

      {data && (
        <>
          <Card title="Notifications / orders" subtitle="REL = released · CRTD = created. Live Delta tickets replace the seed row for the same defect.">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-left text-[12px]">
                <thead className="text-[10px] uppercase tracking-wider text-muted">
                  <tr>
                    <th className="pb-2 pr-3 font-semibold">Order</th>
                    <th className="pb-2 pr-3 font-semibold">Machine</th>
                    <th className="pb-2 pr-3 font-semibold">Defect</th>
                    <th className="pb-2 pr-3 font-semibold">PM due</th>
                    <th className="pb-2 pr-3 font-semibold">Window</th>
                    <th className="pb-2 pr-3 font-semibold">Part</th>
                    <th className="pb-2 pr-3 font-semibold">Bin</th>
                    <th className="pb-2 pr-3 font-semibold">Sourcing</th>
                    <th className="pb-2 font-semibold">St</th>
                  </tr>
                </thead>
                <tbody>
                  {data.tickets.map((row) => (
                    <tr key={`${row.work_order_id}-${row.defect_code}`} className="border-t border-hairline">
                      <td className="py-2 pr-3 font-mono text-primary">{row.work_order_id}</td>
                      <td className="py-2 pr-3">
                        <Link href={routes.machine(row.machine_id)} className="text-accent hover:underline">
                          {row.machine_name}
                        </Link>
                      </td>
                      <td className="py-2 pr-3 font-mono text-secondary">{row.defect_code}</td>
                      <td className="py-2 pr-3 tabular-nums text-secondary">{row.pm_due_date || "—"}</td>
                      <td className="py-2 pr-3 text-muted">{row.repair_window || "—"}</td>
                      <td className="py-2 pr-3 text-secondary">{row.part}</td>
                      <td className="py-2 pr-3 font-mono text-muted">{row.bin}</td>
                      <td className="py-2 pr-3 text-muted">{row.sourcing.replaceAll("_", " ")}</td>
                      <td className="py-2">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${row.status === "REL" ? "bg-emerald-950 text-emerald-300" : "bg-amber-950 text-amber-300"}`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Stores" subtitle="ATP-style stock: in hand vs empty. Empty is a shortage, not a machine fault — Delta then checks vendor / buy.">
              <ul className="flex flex-col gap-1.5">
                {data.stores.map((row) => (
                  <li key={row.part_key} className={`flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 ${tone(row.available)}`}>
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-semibold">{row.part}</p>
                      <p className="font-mono text-[10px] opacity-80">{row.bin}</p>
                    </div>
                    <span className="shrink-0 text-[12px] font-bold tabular-nums">
                      {row.qty} {row.available ? "on hand" : "empty"}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card title="Tagged vendors" subtitle="Named stockists. 0 on hand is a shortage (same as SAP MSPT), not a failed diagnosis.">
              <ul className="flex flex-col gap-1.5">
                {data.vendors.map((row) => (
                  <li key={`${row.part_key}-${row.name}`} className={`flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 ${tone(row.available)}`}>
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-semibold">{row.name}</p>
                      <p className="truncate text-[10px] opacity-80">
                        {row.oem_line} · {row.part} · {row.city}
                      </p>
                    </div>
                    <span className="shrink-0 text-[12px] font-bold tabular-nums">
                      {row.qty_on_hand} pcs
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
