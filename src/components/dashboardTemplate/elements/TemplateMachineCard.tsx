"use client";

import { useMachines } from "@/context/RealtimeProvider";
import { MachineCard } from "@/components/MachineCard";

export interface TemplateMachineCardProps {
  machineId: string;
}

/**
 * Looks the machine up fresh from useMachines() rather than trusting a baked
 * `online` value — the roster (and each machine's online/freshness) can change
 * between template re-parses, and MachineCard's dot should track that live.
 */
export function TemplateMachineCard({ machineId }: TemplateMachineCardProps) {
  const machines = useMachines();
  const machine = machines.find((m) => m.id === machineId);
  if (!machine) return null;
  return <MachineCard id={machine.id} name={machine.name} location={machine.location} online={machine.online} />;
}
