/**
 * Plain structural mirror of backend/src/domain/alertProfile.ts's zod-inferred types —
 * not a re-export, since that module lives under backend/src with no shared package
 * reachable from the frontend. Optional name/fault_code (rather than a discriminated
 * union) is good enough for rendering/editing; AlertProfileSchema on the backend
 * remains the sole structural authority on save.
 *
 * Lives here (not gbotzTypes.ts) because it's genuinely shared: both the Gbotz staff
 * editor and the tenant company-admin Thresholds page read/write this exact shape
 * against the same backend AlertProfileSchema. gbotzTypes.ts re-exports these for its
 * existing imports rather than duplicating them.
 */

export type AlertDirection = "high" | "low" | "both" | "none" | "state";
export type AlertThreshold = number | { low: number; high: number } | string | null;

export interface AlertParameterDef {
  name?: string;
  fault_code?: string;
  description?: string;
  min: number | null;
  max: number | null;
  alert_threshold: AlertThreshold;
  direction: AlertDirection;
  enabled: boolean;
}

export interface AlertParameterGroup {
  name: string;
  unit: string | null;
  data: string;
  parameters: AlertParameterDef[];
}

export interface AlertProfile {
  profile_version: string;
  asset_model: string;
  parameters: AlertParameterGroup[];
}
