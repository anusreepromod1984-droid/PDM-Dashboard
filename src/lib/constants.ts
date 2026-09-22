import type { MotorFault, TimeRangeKey } from "@/lib/types";

// Base origin of the PDM backend (REST history API + Socket.IO) — see .env.example.
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? API_URL;
export const SOCKET_PATH = process.env.NEXT_PUBLIC_SOCKET_PATH ?? "/socket.io";

// Number of telemetry snapshots kept in the live ring buffer per machine (~12-15 min at
// the ~5-6s live-broadcast cadence below) — the socket-fed "tail" that extends past
// whatever the history API returned.
export const LIVE_TAIL_LENGTH = 150;

export const TIME_RANGES: { key: TimeRangeKey; label: string; ms: number }[] = [
  { key: "live", label: "Live", ms: 5 * 60_000 },
  { key: "1h", label: "1h", ms: 3_600_000 },
  { key: "6h", label: "6h", ms: 6 * 3_600_000 },
  { key: "24h", label: "24h", ms: 24 * 3_600_000 },
  { key: "7d", label: "7d", ms: 7 * 86_400_000 },
];
export const DEFAULT_RANGE: TimeRangeKey = "live";
export const HISTORY_MAX_POINTS = 600;

// TELEMETRY_INTERVAL_MS mirrors backend/.env.example's LIVE_BROADCAST_INTERVAL_MS — how
// often a machine's telemetry actually reaches the browser over the socket (throttled
// in backend/src/realtime/io.ts; sensors still sample/ingest every 2s regardless).
// STALE_AFTER_MS must stay comfortably above that broadcast cadence (ticks land on a 2s
// grid, so the realized gap is ~6s, not exactly 5s) or freshness.ts would flicker to
// "stale" right before every update instead of only on an actual dropout.
export const TELEMETRY_INTERVAL_MS = 5_000;
export const STALE_AFTER_MS = 12_000;
export const OFFLINE_AFTER_MS = 60_000;

// Confidence thresholds that map a motor-fault reading onto the status palette.
export const FAULT_THRESHOLDS = {
  warning: 0.3,
  critical: 0.8,
};

/** Gateway sometimes publishes 0-100 percent; gauges expect a 0-1 fraction. */
export function faultConfidenceFraction(confidence: number): number {
  if (!Number.isFinite(confidence) || confidence <= 0) return 0;
  if (confidence > 1) return Math.min(1, confidence / 100);
  return confidence;
}

export function faultSeverity(confidence: number): "good" | "warning" | "critical" {
  const fraction = faultConfidenceFraction(confidence);
  if (fraction >= FAULT_THRESHOLDS.critical) return "critical";
  if (fraction >= FAULT_THRESHOLDS.warning) return "warning";
  return "good";
}

// Below this, the onboard model's confidence is treated as noise — fault classes this
// low are hidden from the fault gauge grids rather than cluttering them with near-zero bars.
export const FAULT_MIN_VISIBLE_CONFIDENCE = 0.1;

export function visibleMotorFaults(faults: MotorFault[]): MotorFault[] {
  return faults.filter((f) => faultConfidenceFraction(f.confidence) >= FAULT_MIN_VISIBLE_CONFIDENCE);
}

/** Motor spinning but vibration is exactly zero — cable/transducer fault, not a healthy machine. */
export function isDeadVibrationSensor(
  mmPerSec: number,
  rpm = 0,
  sensorOk = true
): boolean {
  if (sensorOk === false) return true;
  return rpm > 500 && mmPerSec <= 0;
}

// Simplified ISO 10816-style vibration velocity bands (mm/s RMS).
// Optional rpm / sensorOk: 0.0 mm/s on a running machine is a sensor fault, not "Normal".
export function vibrationSeverity(
  mmPerSec: number,
  rpm?: number,
  sensorOk?: boolean
): "good" | "warning" | "critical" {
  if (rpm !== undefined && isDeadVibrationSensor(mmPerSec, rpm, sensorOk ?? true)) {
    return "critical";
  }
  if (mmPerSec >= 11) return "critical";
  if (mmPerSec >= 4.5) return "warning";
  return "good";
}

export function motorTempSeverity(celsius: number): "good" | "warning" | "critical" {
  if (celsius >= 90) return "critical";
  if (celsius >= 70) return "warning";
  return "good";
}

// Bands from defaultAlertProfile.ts's "Pressure sensor" group: good 2-7 Bar,
// warning below 2 or up to the 7.5 Bar alert_threshold, critical beyond that.
export function pressureSeverity(bar: number): "good" | "warning" | "critical" {
  if (bar > 7.5) return "critical";
  if (bar < 2 || bar > 7) return "warning";
  return "good";
}

const SEVERITY_RANK = { good: 0, warning: 1, critical: 2 } as const;

export function worstSeverity(
  values: Array<"good" | "warning" | "critical">
): "good" | "warning" | "critical" {
  return values.reduce((worst, v) => (SEVERITY_RANK[v] > SEVERITY_RANK[worst] ? v : worst), "good" as const);
}

// Validated categorical palette (dataviz skill reference instance) — fixed hue order, never cycled.
export const CHART_COLORS = {
  light: {
    surface: "#fcfcfb",
    text: "#0b0b0b",
    textSecondary: "#52514e",
    muted: "#898781",
    grid: "#e1e0d9",
    baseline: "#c3c2b7",
    series: ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"],
  },
  dark: {
    surface: "#1a1a19",
    text: "#ffffff",
    textSecondary: "#c3c2b7",
    muted: "#898781",
    grid: "#2c2c2a",
    baseline: "#383835",
    series: ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#008300", "#9085e9", "#e66767"],
  },
};

export const STATUS_COLORS = {
  good: "#0ca30c",
  warning: "#fab219",
  critical: "#d03b3b",
};
