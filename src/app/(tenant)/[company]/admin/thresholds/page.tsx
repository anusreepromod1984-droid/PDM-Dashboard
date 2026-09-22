"use client";

import { useState, type KeyboardEvent } from "react";
import { useMachines } from "@/context/RealtimeProvider";
import { Card } from "@/components/Card";
import { useAlertProfileDraft } from "@/lib/alertProfile/useAlertProfileDraft";
import { isFaultParameter, labelOf } from "@/lib/alertProfile/mapping";

/**
 * Company-admin counterpart to the Gbotz staff alert-threshold editor
 * (frontend/src/app/gbotz/machines/[machineId]/page.tsx) — same Structured, Fault
 * Alerts, and Raw JSON tabs, reusing useAlertProfileDraft/mapping.ts as-is against the
 * tenant-scoped `/api/company/machines/:id/alert-config` route instead of the Gbotz one.
 * This page only ever touches machines the backend has already confirmed belong to this
 * company (requireMachineAccess on both routes).
 */
export default function ThresholdsPage() {
  const machines = useMachines();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const machineId = selectedId ?? machines[0]?.id ?? null;

  if (!machineId) {
    return (
      <Card title="Alert thresholds">
        <p className="text-sm text-muted">No machines yet — thresholds appear here once one is assigned to your company.</p>
      </Card>
    );
  }

  return <ThresholdsEditor machineId={machineId} machines={machines} onSelectMachine={setSelectedId} />;
}

function ThresholdsEditor({
  machineId,
  machines,
  onSelectMachine,
}: {
  machineId: string;
  machines: { id: string; name: string }[];
  onSelectMachine: (id: string) => void;
}) {
  const {
    profile,
    dirty,
    jsonText,
    error,
    submitting,
    loading,
    resetCounter,
    setParamEdit,
    setFaultTrigger,
    setDraftFromJson,
    discard,
    save,
  } = useAlertProfileDraft(machineId, `/api/company/machines/${machineId}/alert-config`);

  const [mode, setMode] = useState<"structured" | "faultAlerts" | "json">("structured");
  const [filter, setFilter] = useState("");

  function onJsonKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Tab") return;
    e.preventDefault();
    const target = e.currentTarget;
    const { selectionStart, selectionEnd, value } = target;
    const next = value.slice(0, selectionStart) + "  " + value.slice(selectionEnd);
    setDraftFromJson(next);
    requestAnimationFrame(() => {
      target.selectionStart = target.selectionEnd = selectionStart + 2;
    });
  }

  const query = filter.trim().toLowerCase();
  const filteredGroups = (profile?.parameters ?? [])
    .map((group, groupIndex) => ({ group, groupIndex }))
    .filter(({ group }) => {
      if (!query) return true;
      if (group.name.toLowerCase().includes(query)) return true;
      return group.parameters.some((def) => labelOf(def).toLowerCase().includes(query));
    });

  const faultDefs = (profile?.parameters ?? []).flatMap((group) => group.parameters.filter(isFaultParameter));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={machineId}
              onChange={(e) => onSelectMachine(e.target.value)}
              className="rounded-lg border border-hairline bg-surface px-3 py-1.5 text-sm font-medium text-primary outline-none focus:border-accent"
            >
              {machines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            {dirty && (
              <span className="rounded-full px-2 py-0.5 text-xs" style={{ color: "var(--status-warning)" }}>
                Unsaved changes
              </span>
            )}
          </div>
          <p className="text-sm text-muted">Alert thresholds</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {dirty && (
            <button
              type="button"
              onClick={discard}
              className="rounded-lg border border-hairline px-3 py-1.5 text-sm font-medium text-secondary hover:bg-surface-2"
            >
              Discard
            </button>
          )}
          <button
            type="button"
            onClick={save}
            disabled={!dirty || submitting}
            className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      {error && (
        <p
          className="rounded-lg px-3 py-2 text-sm"
          style={{
            color: "var(--status-critical)",
            backgroundColor: "color-mix(in srgb, var(--status-critical) 8%, transparent)",
          }}
        >
          {error}
        </p>
      )}

      <div className="flex w-fit gap-1 rounded-lg border border-hairline p-1">
        {(["structured", "faultAlerts", "json"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              mode === m ? "bg-surface-2 text-primary" : "text-muted hover:text-primary"
            }`}
          >
            {m === "structured" ? "Structured" : m === "faultAlerts" ? "Fault Alerts" : "Raw JSON"}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-muted">Loading…</p>}

      {!loading && profile && mode === "structured" && (
        <div key={resetCounter} className="flex flex-col gap-4">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by parameter or group name…"
            className="w-full max-w-sm rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-accent"
          />
          {filteredGroups.map(({ group, groupIndex }) => (
            <Card key={group.name} title={group.name} subtitle={group.unit ?? undefined}>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-hairline text-[11px] font-semibold uppercase tracking-wider text-muted">
                    <th className="py-2 pr-3">Parameter</th>
                    <th className="py-2 pr-3">Min</th>
                    <th className="py-2 pr-3">Max</th>
                    <th className="py-2 pr-3">Direction</th>
                  </tr>
                </thead>
                <tbody>
                  {group.parameters.map((def, paramIndex) => {
                    const rowKey = isFaultParameter(def) ? def.fault_code : def.name;
                    return (
                      <tr key={rowKey} className="border-b border-hairline last:border-0">
                        <td className="py-2 pr-3 text-secondary">{labelOf(def)}</td>
                        <td className="py-2 pr-3">
                          {def.direction === "low" || def.direction === "both" ? (
                            <input
                              type="number"
                              defaultValue={def.min ?? ""}
                              onBlur={(e) => {
                                const v = Number(e.target.value);
                                if (Number.isFinite(v)) setParamEdit(groupIndex, paramIndex, { min: v });
                              }}
                              className="w-24 rounded-md border border-hairline bg-surface px-2 py-1 text-sm text-primary outline-none focus:border-accent"
                            />
                          ) : def.direction === "state" ? (
                            <span className="text-xs text-muted">{String(def.alert_threshold)}</span>
                          ) : (
                            <span className="text-xs text-muted">{def.min ?? "—"}</span>
                          )}
                        </td>
                        <td className="py-2 pr-3">
                          {def.direction === "high" || def.direction === "both" ? (
                            <input
                              type="number"
                              defaultValue={def.max ?? ""}
                              onBlur={(e) => {
                                const v = Number(e.target.value);
                                if (Number.isFinite(v)) setParamEdit(groupIndex, paramIndex, { max: v });
                              }}
                              className="w-24 rounded-md border border-hairline bg-surface px-2 py-1 text-sm text-primary outline-none focus:border-accent"
                            />
                          ) : (
                            <span className="text-xs text-muted">{def.direction === "state" ? "—" : (def.max ?? "—")}</span>
                          )}
                        </td>
                        <td className="py-2 pr-3">
                          {def.direction === "none" || def.direction === "state" ? (
                            <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-muted">
                              {def.direction === "none" ? "not alerting — edit via Raw JSON" : "state-based — edit via Raw JSON"}
                            </span>
                          ) : (
                            <span className="text-xs capitalize text-secondary">{def.direction}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          ))}
          {filteredGroups.length === 0 && <p className="text-sm text-muted">No parameters match this filter.</p>}
        </div>
      )}

      {!loading && profile && mode === "faultAlerts" && (
        <div key={resetCounter} className="flex flex-col gap-4">
          <Card title="Motor faults" subtitle="Alert when a fault's confidence crosses this level">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-hairline text-[11px] font-semibold uppercase tracking-wider text-muted">
                  <th className="py-2 pr-3">Fault</th>
                  <th className="py-2 pr-3">Alert threshold</th>
                  <th className="py-2 pr-3">Alert enabled</th>
                </tr>
              </thead>
              <tbody>
                {faultDefs.map((def) => {
                  const faultCode = def.fault_code!;
                  const thresholdPercent =
                    typeof def.alert_threshold === "number" ? Math.round(def.alert_threshold * 100) : "";
                  const isEnabled = def.enabled !== false;
                  return (
                    <tr key={faultCode} className="border-b border-hairline last:border-0">
                      <td className="py-2 pr-3 text-secondary">
                        {def.description} <span className="text-xs text-muted">({faultCode})</span>
                      </td>
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            defaultValue={thresholdPercent}
                            onBlur={(e) => {
                              const v = Number(e.target.value);
                              if (Number.isFinite(v)) setFaultTrigger(faultCode, { thresholdPercent: v });
                            }}
                            className="w-20 rounded-md border border-hairline bg-surface px-2 py-1 text-sm text-primary outline-none focus:border-accent"
                          />
                          <span className="text-xs text-muted">%</span>
                        </div>
                      </td>
                      <td className="py-2 pr-3">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isEnabled}
                          onClick={() => setFaultTrigger(faultCode, { enabled: !isEnabled })}
                          title={isEnabled ? "Alert enabled — click to disable" : "Alert disabled — click to enable"}
                          className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
                          style={{ backgroundColor: isEnabled ? "var(--status-good)" : "var(--hairline)" }}
                        >
                          <span
                            className="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform"
                            style={{ transform: isEnabled ? "translateX(18px)" : "translateX(2px)" }}
                          />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {faultDefs.length === 0 && (
                  <tr>
                    <td className="py-2 text-sm text-muted" colSpan={3}>
                      No fault parameters in this profile.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {!loading && mode === "json" && (
        <textarea
          value={jsonText}
          onChange={(e) => setDraftFromJson(e.target.value)}
          onKeyDown={onJsonKeyDown}
          spellCheck={false}
          className="h-[60vh] w-full resize-none rounded-lg border border-hairline bg-surface p-4 font-mono text-sm text-primary outline-none focus:border-accent"
        />
      )}
    </div>
  );
}
