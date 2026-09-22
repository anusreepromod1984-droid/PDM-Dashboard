import type { CompanyRole, MachineViewKey } from "@/lib/types";

/**
 * Gbotz-only types — deliberately NOT merged into the tenant MachineMeta/CompanySummary
 * types. The tenant surface never has a companyId field (everything arrives
 * pre-scoped); adding one there would invite tenant-side filtering logic that must
 * never exist (the backend does all scoping).
 */

export interface GbotzCompany {
  id: string;
  slug: string;
  name: string;
  active: boolean;
  logoUrl: string | null;
  accentColor: string | null;
  floorPlanImageUrl: string | null;
  updatedAt: string;
  enabledViews: MachineViewKey[];
  userCount: number;
  machineCount: number;
  createdAt: string;
}

export interface GbotzMachine {
  id: string;
  name: string;
  location: string | null;
  ratedRpm: number | null;
  advertised: boolean;
  liveness: string;
  lastSeenAt: string | null;
  nextMaintenanceAt: string | null;
  triggersEnabled: boolean;
  companyId: string | null;
  companySlug: string | null;
  companyName: string | null;
  mqttUrl: string | null;
  mqttTopic: string | null;
  mqttClientId: string | null;
  mqttUsername: string | null;
  /** Never the raw password — just whether one is currently saved. */
  mqttHasPassword: boolean;
  mapX: number | null;
  mapY: number | null;
}

/** Re-exported from lib/alertProfile/types.ts — shared with the tenant Thresholds page,
 *  not Gbotz-specific, so it lives outside this file's "never merged into tenant" scope. */
export type {
  AlertDirection,
  AlertThreshold,
  AlertParameterDef,
  AlertParameterGroup,
  AlertProfile,
} from "@/lib/alertProfile/types";

export interface GbotzUser {
  id: string;
  email: string;
  name: string | null;
  role: CompanyRole;
  mustChangePassword: boolean;
  createdAt: string;
}
