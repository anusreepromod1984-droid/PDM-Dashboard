export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected"
  | "error";

export interface MachineMeta {
  id: string;
  name: string;
  location: string;
  ratedRpm: number;
  /** Freeform floor-plan placement for the Plant Overview map (components/PlantMap.tsx), 0-100 — null until a Gbotz admin drags it onto the map. */
  mapX: number | null;
  mapY: number | null;
}

export interface MachineStatus {
  machineId: string;
  status: "online" | "offline";
  timestamp: number;
}

export interface HarmonicPoint {
  frequency: number;
  amplitude: number;
}

export interface MotorFault {
  fault_code: string;
  description: string;
  confidence: number;
  active: boolean;
}

export interface Telemetry {
  machineId: string;
  timestamp: number;
  /** Canonical backend aliases genuinely observed within the Product A/B/C TTL. */
  availableFields: string[];
  /** Required Product A/B fields absent from the current aggregate. */
  missingFields: string[];
  imuAcceleration: number;
  xAxisVibration?: number | null;
  yAxisVibration?: number | null;
  zAxisVibration?: number | null;
  rpm: number;
  vibration: { harmonics: HarmonicPoint[] };
  motorFaults: MotorFault[];
  temperature: { motor: number; compressor: number };
  energyMeter: {
    Ir: number;
    Iy: number;
    Ib: number;
    machineLoad: number;
    Vr: number;
    Vy: number;
    Vb: number;
    voltageImbalance: number;
    power: number;
    /** True when the kW register is 0 and kWh slope still implies load. */
    powerEstimated?: boolean;
    /** kWh-slope kW; Energy tiles show meter kW and only hint this. */
    estimatedPower?: number;
    energy: number;
    averagePowerFactor: number;
    thdVr: number;
    thdVy: number;
    thdVb: number;
    frequency: number;
    frequencyDeviation: number;
  };
  pressure: number;
  microphone: { soundLevel: number; harmonics: HarmonicPoint[] };
  humidity: number;
  sensorStatus: { ok: boolean; message: string };
  magnetometer: { roll: number; pitch: number; yaw: number };
  runtime: { machineRunHours: number; remainingHours: number };
}

export interface SchemaParameter {
  name: string;
  unit: string | null;
  data: string;
  parameters: unknown;
}

export interface Schema {
  parameters: SchemaParameter[];
}

export type Severity = "good" | "warning" | "critical";

/** Mirrors backend/src/domain/alertEngine.ts's AlertBreach exactly — pushed verbatim over the "alert" socket event. */
export type AlertDirection = "high" | "low" | "both" | "none" | "state";

export interface AlertBreach {
  key: string;
  groupName: string;
  paramName: string;
  unit: string | null;
  value: number | boolean;
  min: number | null;
  max: number | null;
  threshold: number | { low: number; high: number } | string | null;
  direction: AlertDirection;
  message?: string;
}

export interface MachineRecord {
  latest: Telemetry | null;
  history: Telemetry[];
  status: MachineStatus | null;
}

/** Mirrors backend/src/domain/machineActivity.ts's MachineActivity exactly. */
export interface MachineActivity {
  idle: boolean;
  zeroFields: string[];
}

export interface RepairOption {
  title: string;
  category: "Immediate Triage" | "Precision Repair" | "Parts & CMMS";
  urgency: "Immediate" | "Scheduled" | "Preventive";
  steps: string[];
  partsOrTools?: string;
  part?: string;
  estDowntime?: string;
}

export type FaultEvidenceRole = "trigger" | "supporting" | "context" | "notUsed";

export interface FaultEvidence {
  label: string;
  value: string;
  note?: string;
  role: FaultEvidenceRole;
}

export interface FaultExplanation {
  whatIsIt: string;
  whyShowing?: string;
  notThis?: string;
  sparePart?: string;
  evidence?: FaultEvidence[];
  rootCause: string;
  riskImpact: string;
}

/** Mirrors backend/src/http/routes/faultAssistant.ts's FaultDiagnosisResponse. */
export interface FaultDiagnosis {
  machineId: string;
  archetype: string;
  generatedAt: number;
  headline: string;
  severity: Severity;
  summary: string;
  recommendedActions: string[];
  faultExplanation?: FaultExplanation;
  repairOptions?: RepairOption[];
  pipelineDetails?: {
    cable_check?: { status?: string; [key: string]: unknown };
    electrical_health?: { isolated_failure_domain?: string; [key: string]: unknown };
    rul_prediction?: { rul_days?: number; [key: string]: unknown };
    defect_localization?: Record<string, unknown>;
    cmms_work_order?: Record<string, unknown> & {
      sourcing_intelligence?: SourcingIntelligence;
      scheduled_repair_window?: string;
      pm_due_date?: string;
      repair_crew?: string;
      oem_mail?: OemMailDraft;
    };
    [key: string]: unknown;
  };
}

export interface OemMailDraft {
  subject: string;
  message?: string;
  preview?: string;
  warehouse_in_stock?: boolean;
  required_by?: string | null;
  part_number?: string | null;
  sent?: boolean;
  sent_at?: string | null;
}

export interface SourcingStep {
  step: number;
  name: string;
  status: "pass" | "out" | "skip" | "open" | "none" | "fail" | string;
  detail: string;
}

export interface PurchaseOption {
  tier: "oem_locator" | "india_b2b" | "global_mro" | string;
  name: string;
  url: string;
  what_it_finds: string;
  quote_inr?: number | null;
  quote_note?: string;
  lead_note?: string | null;
  genuine_oem?: boolean;
}

export interface SourcingIntelligence {
  oem_part_number?: string;
  oem_supplier_name?: string;
  sourcing_recommendation?: string;
  crm_status?: string;
  stores_qty?: number;
  stores_bin?: string | null;
  tagged_vendor_name?: string | null;
  tagged_vendor_qty?: number;
  winning_source?: string | null;
  ladder?: SourcingStep[];
  purchase_options?: PurchaseOption[];
}

/** Mirrors backend/src/domain/agents/sourceCheckAgent.ts's SourceCheckResult. */
export interface DiagnosisSourceCheck {
  verdict: "machine" | "sensor" | "inconclusive" | "nominal";
  confidence: number;
  reasoning: string;
}

/** Mirrors backend/src/domain/agents/faultPredictionAgent.ts's FaultPrediction. */
export interface DiagnosisFaultPrediction {
  faultCode: string;
  description: string;
  predictedWindowDays: number | null;
  confidence: number;
  reasoning: string;
}

/** Mirrors backend/src/domain/agents/remediationAgent.ts's RemediationReport. */
export interface DiagnosisRemediation {
  sparePartNeeded: string;
  availableInInventory: boolean;
  inventoryDetails: unknown;
  vendorSuggestion: {
    name: string;
    contact?: string;
    source: "company_provided" | "web_search";
    url?: string;
  } | null;
  reasoning: string;
}

/** Mirrors backend/src/http/routes/diagnosis.ts / the MachineDiagnosisRun Prisma model. */
export interface DiagnosisRun {
  id: string;
  machineId: string;
  breachKeys: string[];
  status: "RUNNING" | "COMPLETE" | "FAILED";
  sourceCheck: DiagnosisSourceCheck | null;
  faultPredictions: DiagnosisFaultPrediction[] | null;
  remediation: DiagnosisRemediation | null;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
}

export type UpstreamState = "connecting" | "connected" | "reconnecting" | "offline" | "error";

export interface UpstreamStatus {
  state: UpstreamState;
  lastMessageAt: number | null;
  since: number;
}

/**
 * "live" — fresh data, everything nominal.
 * "stale" — we have a last-known value but it's aging (or we can't currently verify
 *   freshness because our own socket to the backend is down) — show it, annotated.
 * "offline" — explicitly reported offline, or silent long enough to call it offline.
 * "nodata" — never received anything for this machine at all.
 */
export type Freshness = "live" | "stale" | "offline" | "nodata";

export type TimeRangeKey = "live" | "1h" | "6h" | "24h" | "7d" | "custom";

/** Explicit bounds for TimeRangeKey "custom" — epoch ms, inclusive `from`, exclusive-ish `to`. */
export interface CustomRange {
  from: number;
  to: number;
}

// --- multi-tenancy (backend/src/domain/views.ts, backend/prisma/schema.prisma) ---

/** Verbatim Prisma enum values, no translation — see backend plan's reconciliation note. */
export type CompanyRole = "COMPANY_ADMIN" | "COMPANY_MEMBER";

/** Lowercase slugs, matching the /machines/[machineId]/<slug> route segments (frontend/src/lib/machineViews.ts). */
export type MachineViewKey = "overview" | "vibration" | "faults" | "energy" | "environment" | "pressure" | "acoustic";

/**
 * Matches backend/src/db/userRepo.ts's `CompanySummary` exactly — flat fields, not
 * nested under a `branding` object (an earlier design pass sketched a nested shape;
 * this is what the backend actually returns from /api/auth/login, /api/auth/me, and
 * the Socket.IO bootstrap payload).
 */
export interface CompanySummary {
  id: string;
  slug: string;
  name: string;
  active: boolean;
  logoUrl: string | null;
  accentColor: string | null;
  /** Path (not a full URL) to the uploaded floor-plan image backing Plant Map's
   *  background — prefix with API_URL before use. Null until a Gbotz admin uploads one. */
  floorPlanImageUrl: string | null;
  /** ISO timestamp — used as a cache-busting query param on the floor-plan image URL. */
  updatedAt: string;
  /** Always includes "overview" — the backend clamps it there. */
  enabledViews: MachineViewKey[];
}

/** A row in a company's user-management table — never carries passwordHash. */
export interface CompanyUserSummary {
  id: string;
  email: string;
  name: string | null;
  role: CompanyRole;
  mustChangePassword: boolean;
  /** Grants dashboard-edit access without full admin — always true for COMPANY_ADMIN rows. */
  canEditDashboard: boolean;
  createdAt: string;
}
