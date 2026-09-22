"use client";

import Link from "next/link";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import { useCompany } from "@/context/CompanyProvider";
import { Card } from "@/components/Card";

export type WatchStatus = "severe" | "warning" | "watch" | "healthy";

export type WatchItem = {
  machine_id: string;
  name: string;
  line: string;
  criticality: number;
  rul_days: number | null;
  defect_code: string;
  watch_status: WatchStatus;
  watch_score: number;
  pm_task: string | null;
  pm_due_date: string | null;
  pm_due_in_days: number | null;
  pm_overdue: boolean;
  repair_window: string;
};

type WatchlistResponse = {
  items: WatchItem[];
  open_count: number;
  severe_count: number;
};

const STATUS_CLASS: Record<WatchStatus, string> = {
  severe: "text-rose-300",
  warning: "text-amber-300",
  watch: "text-sky-300",
  healthy: "text-emerald-300",
};

export function PlantWatchList() {
  const { routes } = useCompany();
  const { data, error } = useSWR("/api/fleet/watchlist", (p) => apiFetch<WatchlistResponse>(p), {
    refreshInterval: 8000,
  });

  const items = data?.items ?? [];

  return (
    <Card
      title="Watch list"
      subtitle="Ranked by remaining life × criticality — who to act on first, not a gauge wall."
    >
      {error && <p className="text-sm text-rose-400">{error.message}</p>}
      {!error && items.length === 0 && <p className="text-sm text-muted">No registered assets yet.</p>}
      {items.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-[12px]">
            <thead className="text-[10px] uppercase tracking-wider text-muted">
              <tr>
                <th className="pb-2 pr-3 font-semibold">Asset</th>
                <th className="pb-2 pr-3 font-semibold">Status</th>
                <th className="pb-2 pr-3 font-semibold">RUL</th>
                <th className="pb-2 pr-3 font-semibold">Crit</th>
                <th className="pb-2 pr-3 font-semibold">PM due</th>
                <th className="pb-2 font-semibold">Repair window</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.machine_id} className="border-t border-hairline">
                  <td className="py-2 pr-3">
                    <Link href={routes.machine(row.machine_id)} className="font-semibold text-accent hover:underline">
                      {row.name}
                    </Link>
                    <p className="text-[10px] text-muted">
                      {row.line}
                      {row.defect_code && row.defect_code !== "NORMAL" ? ` · ${row.defect_code}` : ""}
                    </p>
                  </td>
                  <td className={`py-2 pr-3 font-bold uppercase ${STATUS_CLASS[row.watch_status]}`}>
                    {row.watch_status}
                  </td>
                  <td className="py-2 pr-3 tabular-nums text-secondary">
                    {row.rul_days != null ? `${row.rul_days.toFixed(1)}d` : "—"}
                  </td>
                  <td className="py-2 pr-3 tabular-nums text-muted">{row.criticality}</td>
                  <td className="py-2 pr-3 text-secondary">
                    {row.pm_task ? (
                      <>
                        <span className={row.pm_overdue ? "text-amber-300" : ""}>
                          {row.pm_due_date}
                          {row.pm_overdue ? " overdue" : ""}
                        </span>
                        <p className="text-[10px] text-muted">{row.pm_task}</p>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-2 text-muted">{row.repair_window}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
