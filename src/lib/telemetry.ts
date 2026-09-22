import { faultConfidenceFraction } from "@/lib/constants";
import type { HarmonicPoint, MotorFault, Telemetry } from "@/lib/types";

/**
 * Applied to every inbound telemetry object from both the socket and the REST history
 * endpoint. Coerces `timestamp` to epoch-ms (the backend's Prisma layer round-trips
 * Date objects — defend against ISO-string serialization even though the backend's
 * mapper currently returns numbers, since every chart does numeric math on this field)
 * and defaults missing arrays rather than crashing on a malformed payload.
 */
export function normalizeTelemetry(raw: unknown): Telemetry | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  const timestamp = coerceTimestamp(r.timestamp);
  if (timestamp === null || typeof r.machineId !== "string") return null;

  return {
    machineId: r.machineId,
    timestamp,
    availableFields: asStrings(r.availableFields),
    missingFields: asStrings(r.missingFields),
    imuAcceleration: asNumber(r.imuAcceleration),
    xAxisVibration: optionalNumber(r.xAxisVibration),
    yAxisVibration: optionalNumber(r.yAxisVibration),
    zAxisVibration: optionalNumber(r.zAxisVibration),
    rpm: asNumber(r.rpm),
    vibration: { harmonics: asHarmonics((r.vibration as { harmonics?: unknown })?.harmonics) },
    motorFaults: asMotorFaults(r.motorFaults),
    temperature: {
      motor: asNumber((r.temperature as { motor?: unknown })?.motor),
      compressor: asNumber((r.temperature as { compressor?: unknown })?.compressor),
    },
    energyMeter: normalizeEnergyMeter(r.energyMeter),
    pressure: asNumber(r.pressure),
    microphone: {
      soundLevel: asNumber((r.microphone as { soundLevel?: unknown })?.soundLevel),
      harmonics: asHarmonics((r.microphone as { harmonics?: unknown })?.harmonics),
    },
    humidity: asNumber(r.humidity),
    sensorStatus: (r.sensorStatus as Telemetry["sensorStatus"]) ?? { ok: true, message: "" },
    magnetometer: (r.magnetometer as Telemetry["magnetometer"]) ?? { roll: 0, pitch: 0, yaw: 0 },
    runtime: (r.runtime as Telemetry["runtime"]) ?? { machineRunHours: 0, remainingHours: 0 },
  };
}

const EMPTY_ENERGY_METER: Telemetry["energyMeter"] = {
  Ir: 0, Iy: 0, Ib: 0, machineLoad: 0, Vr: 0, Vy: 0, Vb: 0, voltageImbalance: 0,
  power: 0, energy: 0, averagePowerFactor: 0, thdVr: 0, thdVy: 0, thdVb: 0,
  frequency: 0, frequencyDeviation: 0,
};

function coerceTimestamp(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return null;
}

function asNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function optionalNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asHarmonics(value: unknown): HarmonicPoint[] {
  return Array.isArray(value) ? (value as HarmonicPoint[]) : [];
}

function asMotorFaults(value: unknown): MotorFault[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const fault = item as MotorFault;
    return { ...fault, confidence: faultConfidenceFraction(fault.confidence) };
  });
}

function normalizeEnergyMeter(value: unknown): Telemetry["energyMeter"] {
  const meter = (value as Telemetry["energyMeter"] | undefined) ?? EMPTY_ENERGY_METER;
  return {
    ...EMPTY_ENERGY_METER,
    ...meter,
    powerEstimated: Boolean(meter.powerEstimated),
    estimatedPower: optionalNumber(meter.estimatedPower) ?? undefined,
  };
}

function asStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

/** Empty means a legacy frame with no presence metadata; otherwise require a real sensor field. */
export function hasTelemetryField(telemetry: Telemetry, ...aliases: string[]): boolean {
  if (telemetry.availableFields.length === 0) return true;
  const normalized = new Set(telemetry.availableFields.map((key) => key.replaceAll("_", "").toLowerCase()));
  return aliases.some((key) => normalized.has(key.replaceAll("_", "").toLowerCase()));
}
