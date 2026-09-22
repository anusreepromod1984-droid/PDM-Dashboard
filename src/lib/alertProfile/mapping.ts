import type { AlertParameterDef } from "@/lib/alertProfile/types";

export function isFaultParameter(def: AlertParameterDef): boolean {
  return def.fault_code !== undefined;
}

export function labelOf(def: AlertParameterDef): string {
  return isFaultParameter(def) ? `${def.description} (${def.fault_code})` : def.name ?? "";
}

/**
 * Applies an edited Min and/or Max to one parameter def, shaping alert_threshold per
 * its EXISTING direction — never changes which edge(s) are editable (see the plan's
 * confirmed decision: a single-sided alert stays single-sided). Only the edge(s)
 * actually passed in `edit` change; the other is left as-is. Keeps min/max in sync with
 * the edited edge(s) since alertEngine's isBreached never reads them (they're purely
 * display/context in AlertBreach) but divergence from alert_threshold in the UI would
 * be confusing.
 */
export function applyThresholdEdit(def: AlertParameterDef, edit: { min?: number; max?: number }): AlertParameterDef {
  const nextMin = edit.min ?? def.min;
  const nextMax = edit.max ?? def.max;
  switch (def.direction) {
    case "high":
      return { ...def, max: nextMax, alert_threshold: nextMax };
    case "low":
      return { ...def, min: nextMin, alert_threshold: nextMin };
    case "both":
      return { ...def, min: nextMin, max: nextMax, alert_threshold: { low: nextMin ?? 0, high: nextMax ?? 0 } };
    default: // "none" | "state" — not editable via the structured form
      return def;
  }
}
