import type { Telemetry } from "@/lib/types";

/**
 * Resolves a dot-path field name (e.g. "temperature.motor", "energyMeter.power", or
 * "vibration.harmonics.0.frequency" — numeric segments index into arrays) a template
 * author picked against a live Telemetry snapshot. Returns null rather than throwing
 * on an unknown/malformed path — an authoring mistake should render "--", not crash
 * the tenant dashboard.
 */
export function resolveTelemetryField(telemetry: Telemetry | null, field: string): number | null {
  if (!telemetry) return null;
  let value: unknown = telemetry;
  for (const segment of field.split(".")) {
    if (Array.isArray(value)) {
      const index = Number(segment);
      value = Number.isInteger(index) ? value[index] : undefined;
    } else if (typeof value === "object" && value !== null) {
      value = (value as Record<string, unknown>)[segment];
    } else {
      return null;
    }
  }
  return typeof value === "number" ? value : null;
}
