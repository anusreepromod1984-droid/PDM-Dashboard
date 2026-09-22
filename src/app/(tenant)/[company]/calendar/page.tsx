"use client";

import Link from "next/link";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import { useCompany } from "@/context/CompanyProvider";
import { Card } from "@/components/Card";

type CalendarWindow = {
  start: string;
  end: string;
  crew: string;
  kind: string;
  label: string;
};

type CalendarPm = {
  machine_id: string;
  name: string;
  task: string;
  due_at: string;
  overdue: boolean;
  watch_status: string;
};

type CalendarWo = {
  machine_id: string;
  work_order_id: string;
  defect_code: string;
  scheduled_repair_window?: string;
  pm_due_date?: string;
};

type CalendarPayload = {
  timezone: string;
  windows: CalendarWindow[];
  work_orders: CalendarWo[];
  pm_tasks: CalendarPm[];
};

function formatWindow(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function PlantCalendarPage() {
  const { routes } = useCompany();
  const { data, error, isLoading } = useSWR("/api/calendar", (p) => apiFetch<CalendarPayload>(p), {
    refreshInterval: 15000,
  });

  return (
    <div className="flex max-w-5xl flex-col gap-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">Preventive program</p>
        <h1 className="mt-1 text-lg font-semibold text-primary">Shift calendar</h1>
        <p className="mt-1 text-sm text-muted">
          Approved night crew and Saturday outage windows. Fault work orders and standing PM land on the next slot — not a placeholder string.
        </p>
      </div>

      {isLoading && <p className="text-sm text-muted">Loading calendar…</p>}
      {error && <p className="text-sm text-rose-400">{error.message}</p>}

      {data && (
        <>
          <Card title="Approved windows" subtitle={`${data.timezone} · night 22:00–06:00 · Saturday 06:00–14:00`}>
            <ul className="flex flex-col gap-2">
              {data.windows.map((row) => (
                <li key={row.start} className="flex items-center justify-between gap-3 rounded-md border border-hairline bg-surface-2 px-3 py-2">
                  <div>
                    <p className="text-[13px] font-semibold text-primary">{row.label}</p>
                    <p className="text-[11px] text-muted">{formatWindow(row.start)} → {formatWindow(row.end)}</p>
                  </div>
                  <span className="text-[10px] font-bold uppercase text-muted">
                    {row.kind === "night_window" ? "Night" : "Outage"}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Standing PM" subtitle="Calendar jobs that run even when no named fault exists.">
              <ul className="flex flex-col gap-2">
                {data.pm_tasks.map((row) => (
                  <li key={`${row.machine_id}-${row.task}`} className="flex items-start justify-between gap-3 border-t border-hairline pt-2 first:border-t-0 first:pt-0">
                    <div className="min-w-0">
                      <Link href={routes.machine(row.machine_id)} className="text-[12px] font-semibold text-accent hover:underline">
                        {row.name}
                      </Link>
                      <p className="text-[11px] text-secondary">{row.task}</p>
                    </div>
                    <span className={`shrink-0 text-[11px] font-bold tabular-nums ${row.overdue ? "text-amber-300" : "text-muted"}`}>
                      {row.due_at}
                      {row.overdue ? " overdue" : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card title="Open work orders" subtitle="Booked onto the next approved window.">
              {data.work_orders.length === 0 ? (
                <p className="text-sm text-muted">No live Delta tickets open. Seed CRM orders still show on the CRM page.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {data.work_orders.map((row) => (
                    <li key={row.work_order_id} className="border-t border-hairline pt-2 first:border-t-0 first:pt-0">
                      <p className="font-mono text-[12px] text-primary">{row.work_order_id}</p>
                      <p className="text-[11px] text-secondary">
                        {row.defect_code} · due {row.pm_due_date || "—"}
                      </p>
                      <p className="text-[11px] text-muted">{row.scheduled_repair_window}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
