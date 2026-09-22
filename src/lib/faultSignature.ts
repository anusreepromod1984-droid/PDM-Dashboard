import type { AlertBreach, MotorFault } from "@/lib/types";

/**
 * Mirrors backend/src/domain/faultDiagnosis.ts's buildBreachSignature exactly (same
 * rounding) — used here only to decide "did the situation change enough to ask for a
 * fresh diagnosis," not to trust/replace the backend's own cache key.
 *
 * `idle` is folded in (not part of the backend original) so that flipping into/out of
 * "motor not running" always counts as a change worth re-notifying about, even though
 * breaches/motorFaults are both empty on either side of that transition.
 */
/**
 * True once the backend's breach engine (backend/src/domain/alertEngine.ts) reports an
 * active breach for this fault_code — i.e. its confidence has crossed the machine's
 * configured alert_threshold and it isn't disabled. Distinct from FaultGauge's own
 * display-only warning/critical color bands (frontend/src/lib/constants.ts's
 * faultSeverity), which are fixed confidence cutoffs unrelated to the per-machine,
 * per-fault alert configuration set on the /gbotz Fault Alerts tab.
 */
export function isFaultBreached(breaches: AlertBreach[], faultCode: string): boolean {
  return breaches.some((b) => b.key === `Motor faults::${faultCode}`);
}

export function buildBreachSignature(breaches: AlertBreach[], motorFaults: MotorFault[], idle = false): string {
  const breachPart = breaches
    .map((b) => b.key)
    .sort()
    .join(",");
  const faultPart = motorFaults
    .map((f) => `${f.fault_code}:${(Math.round(f.confidence * 20) / 20).toFixed(2)}`)
    .sort()
    .join(",");
  return `${breachPart}|${faultPart}|idle:${idle}`;
}
