import {
  IconActivity,
  IconAlertTriangle,
  IconDroplet,
  IconGauge,
  IconGrid,
  IconVolume,
  IconZap,
  type IconComponent,
} from "@/components/icons";
import type { MachineViewKey } from "@/lib/types";

export interface MachineViewDef {
  key: MachineViewKey;
  /** URL segment under /machines/[machineId]/ — "" for overview (the index route). */
  slug: string;
  /** Full label, used in MachineTabs and the admin views-toggle page. */
  label: string;
  /** Compact label, used in Sidebar's sub-nav. */
  shortLabel: string;
  icon: IconComponent;
  description: string;
}

/**
 * The single canonical list of the six fixed dashboard views — previously declared
 * three times with drifting labels (Sidebar's old MACHINE_TABS, MachineTabs' old
 * TABS, Topbar's old TAB_LABELS). Sidebar, MachineTabs, the breadcrumb, and the new
 * company-admin views-toggle page all derive from this one array. Matches the
 * backend's DashboardView enum via `key` (backend/src/domain/views.ts) — "overview"
 * is the only entry the backend clamps to always-enabled.
 */
export const MACHINE_VIEWS: readonly MachineViewDef[] = [
  {
    key: "overview",
    slug: "",
    label: "Overview",
    shortLabel: "Overview",
    icon: IconGrid,
    description: "Stat cards and charts summarizing this machine's current condition.",
  },
  {
    key: "vibration",
    slug: "vibration",
    label: "Vibration",
    shortLabel: "Vibration",
    icon: IconActivity,
    description: "IMU acceleration, spectrum, and rotational speed trends.",
  },
  {
    key: "faults",
    slug: "faults",
    label: "Motor Faults",
    shortLabel: "Faults",
    icon: IconAlertTriangle,
    description: "Fault-confidence gauges for overheating, overcurrent, imbalance, bearing wear, and winding faults.",
  },
  {
    key: "energy",
    slug: "energy",
    label: "Energy Meter",
    shortLabel: "Energy",
    icon: IconZap,
    description: "Currents, voltages, power, energy, and power-quality readings.",
  },
  {
    key: "environment",
    slug: "environment",
    label: "Environment",
    shortLabel: "Environment",
    icon: IconDroplet,
    description: "Temperature and humidity readings.",
  },
  {
    key: "pressure",
    slug: "pressure",
    label: "Pressure",
    shortLabel: "Pressure",
    icon: IconGauge,
    description: "Pressure level and trend over time.",
  },
  {
    key: "acoustic",
    slug: "acoustic",
    label: "Acoustic",
    shortLabel: "Acoustic",
    icon: IconVolume,
    description: "Sound level and acoustic spectrum.",
  },
];

export function findMachineView(slug: string): MachineViewDef | undefined {
  return MACHINE_VIEWS.find((v) => v.slug === slug);
}

export function machineViewLabel(slug: string): string {
  return findMachineView(slug)?.label ?? slug;
}
