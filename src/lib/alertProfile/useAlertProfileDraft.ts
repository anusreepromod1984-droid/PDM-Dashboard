import { useState } from "react";
import useSWR from "swr";
import { apiFetch, ApiError } from "@/lib/api";
import type { AlertParameterDef, AlertProfile } from "@/lib/alertProfile/types";
import { applyThresholdEdit } from "@/lib/alertProfile/mapping";

/**
 * Dirty/save/discard draft state for one machine's alert profile — modeled on
 * frontend/src/lib/dashboardTemplate/useDashboardTemplateDraft.ts's idiom, simplified
 * to a single profile (no per-view draft map). Both the structured Min/Max form and the
 * raw-JSON textarea read/write the same `draftProfile`, so switching between the two
 * modes never loses or duplicates an edit.
 *
 * `endpoint` defaults to the Gbotz staff editor's route so that call site needs no
 * change; the tenant company-admin Thresholds page passes its own
 * `/api/company/machines/:id/alert-config` endpoint instead — both routes speak the
 * identical `{ machine, alertProfile }` GET / whole-profile-replace PATCH contract.
 */
export function useAlertProfileDraft(
  machineId: string,
  endpoint: string = `/api/gbotz/machines/${machineId}/alert-config`
) {
  const { data, mutate } = useSWR(endpoint, (p) =>
    apiFetch<{ machine: { id: string; name: string }; alertProfile: AlertProfile }>(p)
  );
  const savedProfile = data?.alertProfile ?? null;

  const [draftProfile, setDraftProfile] = useState<AlertProfile | null>(null);
  // Exactly what the raw-JSON textarea shows — kept separate from draftProfile so an
  // in-progress invalid edit stays visible (with its error) instead of snapping back to
  // the last valid content the instant it fails to parse. Cleared to null whenever the
  // profile changes some other way (a structured edit, discard, save, machine switch)
  // so reopening JSON mode re-derives fresh text instead of showing stale raw input.
  const [rawJsonDraft, setRawJsonDraft] = useState<string | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Bumped whenever the whole profile is reset from outside a single field edit
  // (discard, a successful save, switching machines) — the structured form's Min/Max
  // inputs are uncontrolled (defaultValue, committed on blur) so typing feels natural;
  // keying their container on this counter forces them to remount and re-sync only on
  // an actual reset, not on every keystroke.
  const [resetCounter, setResetCounter] = useState(0);

  // Re-seed when the machine changes — never on a background SWR revalidation, so an
  // in-progress edit is never silently clobbered. Reset during render (React's
  // documented pattern for "adjust state when a prop changes") rather than in a
  // useEffect, which would cost an extra cascading render for the same result.
  const [prevMachineId, setPrevMachineId] = useState(machineId);
  if (machineId !== prevMachineId) {
    setPrevMachineId(machineId);
    setDraftProfile(null);
    setRawJsonDraft(null);
    setJsonError(null);
    setSubmitError(null);
    setResetCounter((n) => n + 1);
  }

  const profile = draftProfile ?? savedProfile;
  const dirty = draftProfile !== null && JSON.stringify(draftProfile) !== JSON.stringify(savedProfile);
  const jsonText = rawJsonDraft ?? (profile ? JSON.stringify(profile, null, 2) : "");

  function setParamEdit(groupIndex: number, paramIndex: number, edit: { min?: number; max?: number }) {
    if (!profile) return;
    const nextGroups = profile.parameters.map((group, gi) => {
      if (gi !== groupIndex) return group;
      const nextParams = group.parameters.map((def, pi): AlertParameterDef =>
        pi === paramIndex ? applyThresholdEdit(def, edit) : def
      );
      return { ...group, parameters: nextParams };
    });
    setDraftProfile({ ...profile, parameters: nextGroups });
    // A structured edit supersedes whatever raw text was showing — clear it so
    // reopening JSON mode re-derives fresh text that includes this edit.
    setRawJsonDraft(null);
  }

  /**
   * Fault-alert tab's editor — works in whole-percent confidence (0-100) rather than the
   * 0-1 fraction the profile stores, and keeps `max` mirrored to the same value the way
   * applyThresholdEdit does for a "high"-direction parameter (every fault entry is
   * "high"), so the Structured tab's Max column stays consistent with this tab's edits.
   */
  function setFaultTrigger(faultCode: string, edit: { thresholdPercent?: number; enabled?: boolean }) {
    if (!profile) return;
    const nextGroups = profile.parameters.map((group) => {
      if (group.name !== "Motor faults") return group;
      const nextParams = group.parameters.map((def): AlertParameterDef => {
        if (def.fault_code !== faultCode) return def;
        const next = { ...def };
        if (edit.thresholdPercent !== undefined) {
          const threshold = Math.min(100, Math.max(0, edit.thresholdPercent)) / 100;
          next.alert_threshold = threshold;
          next.max = threshold;
        }
        if (edit.enabled !== undefined) next.enabled = edit.enabled;
        return next;
      });
      return { ...group, parameters: nextParams };
    });
    setDraftProfile({ ...profile, parameters: nextGroups });
    setRawJsonDraft(null);
  }

  function setDraftFromJson(text: string) {
    setRawJsonDraft(text);
    try {
      const parsed = JSON.parse(text) as AlertProfile;
      setJsonError(null);
      setDraftProfile(parsed);
    } catch {
      setJsonError("Invalid JSON — fix the syntax before saving.");
    }
  }

  function discard() {
    setDraftProfile(null);
    setRawJsonDraft(null);
    setJsonError(null);
    setSubmitError(null);
    setResetCounter((n) => n + 1);
  }

  async function save() {
    if (!profile) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await apiFetch(endpoint, { method: "PATCH", body: profile });
      await mutate();
      setDraftProfile(null);
      setRawJsonDraft(null);
      setResetCounter((n) => n + 1);
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Failed to save alert thresholds");
    } finally {
      setSubmitting(false);
    }
  }

  return {
    machine: data?.machine ?? null,
    profile,
    dirty,
    jsonText,
    jsonError,
    error: submitError ?? jsonError,
    submitting,
    loading: !data,
    resetCounter,
    setParamEdit,
    setFaultTrigger,
    setDraftFromJson,
    discard,
    save,
  };
}
