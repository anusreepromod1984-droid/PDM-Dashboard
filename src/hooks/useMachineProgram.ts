"use client";

import useSWR from "swr";
import { apiFetch } from "@/lib/api";

export type RulMarker = {
  x: number;
  kind: "call" | "repair" | string;
  label: string;
};

export type MachineProgram = {
  machine_id: string;
  points: { x: number; y: number }[];
  markers: RulMarker[];
  pm_tasks: {
    id: string;
    name: string;
    due_at: string;
    due_in_days: number;
    overdue: boolean;
  }[];
  repair_window: {
    start: string;
    end: string;
    crew: string;
    kind: string;
    label: string;
  };
  latest_rul_days: number | null;
  defect_code: string;
};

export function useMachineProgram(machineId: string | undefined) {
  return useSWR(
    machineId ? `/api/machines/${encodeURIComponent(machineId)}/rul-history` : null,
    (p) => apiFetch<MachineProgram>(p),
    { refreshInterval: 12000 },
  );
}
