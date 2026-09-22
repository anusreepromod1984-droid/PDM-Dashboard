"use client";

import { useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api";
import type { GbotzMachine } from "@/lib/gbotzTypes";

export interface MqttConfigInput {
  mqttUrl: string | null;
  mqttTopic: string | null;
  mqttClientId: string | null;
  mqttUsername: string | null;
  /** Omit to leave the saved password untouched — the API never returns it, so there's
   * nothing previous to resubmit. Pass a string to set it, or null to clear it. */
  mqttPassword?: string | null;
}

/**
 * Per-machine override for the MQTT source a machine is ingested from — for devices
 * that don't publish under the default broker's usual `<prefix>/<machineId>/telemetry`
 * convention (see backend/src/mqtt/connectionManager.ts). Leaving Broker URL and Topic
 * blank falls back to the default broker; takes effect immediately, no backend restart.
 */
export function ConfigureMqttForm({
  machine,
  onSave,
}: {
  machine: GbotzMachine;
  onSave: (machineId: string, input: MqttConfigInput) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [mqttUrl, setMqttUrl] = useState("");
  const [mqttTopic, setMqttTopic] = useState("");
  const [mqttClientId, setMqttClientId] = useState("");
  const [mqttUsername, setMqttUsername] = useState("");
  const [mqttPassword, setMqttPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const popoverRef = useRef<HTMLFormElement>(null);

  function openForm() {
    setMqttUrl(machine.mqttUrl ?? "");
    setMqttTopic(machine.mqttTopic ?? "");
    setMqttClientId(machine.mqttClientId ?? "");
    setMqttUsername(machine.mqttUsername ?? "");
    setMqttPassword("");
    setError(null);
    setOpen(true);
  }

  function close() {
    setOpen(false);
    setError(null);
  }

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        close();
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function submit(input: MqttConfigInput) {
    setSubmitting(true);
    setError(null);
    try {
      await onSave(machine.id, input);
      close();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update MQTT config");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit({
      mqttUrl: mqttUrl.trim() || null,
      mqttTopic: mqttTopic.trim() || null,
      mqttClientId: mqttClientId.trim() || null,
      mqttUsername: mqttUsername.trim() || null,
      // Blank = leave the saved password untouched; only send it when the admin typed one.
      mqttPassword: mqttPassword.trim() ? mqttPassword.trim() : undefined,
    });
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => (open ? close() : openForm())}
        className="text-xs font-medium text-accent"
      >
        {machine.mqttUrl ? "Custom MQTT" : "Configure MQTT"}
      </button>
      {open && (
        <form
          ref={popoverRef}
          onSubmit={handleSubmit}
          className="absolute right-0 top-full z-20 mt-2 flex w-[min(90vw,24rem)] flex-col gap-3 rounded-lg border border-hairline bg-surface p-4 text-left shadow-lg"
        >
          {error && (
            <p className="rounded-lg px-3 py-2 text-sm" style={{ color: "var(--status-critical)" }}>
              {error}
            </p>
          )}
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-secondary">Broker URL</span>
            <input
              value={mqttUrl}
              onChange={(e) => setMqttUrl(e.target.value)}
              placeholder="mqtt://host:1883 — blank = default broker"
              className="rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-accent"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-secondary">Topic</span>
            <input
              value={mqttTopic}
              onChange={(e) => setMqttTopic(e.target.value)}
              placeholder="e.g. pdm/sensor/data"
              className="rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-accent"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-secondary">Client ID (reference only)</span>
            <input
              value={mqttClientId}
              onChange={(e) => setMqttClientId(e.target.value)}
              placeholder="the id the device itself publishes under"
              className="rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-accent"
            />
            <span className="text-xs text-muted">Not used to connect — the backend always uses its own id.</span>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-secondary">Username (optional)</span>
            <input
              value={mqttUsername}
              onChange={(e) => setMqttUsername(e.target.value)}
              placeholder="leave blank if the broker doesn't require auth"
              className="rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-accent"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-secondary">Password (optional)</span>
            <input
              type="password"
              value={mqttPassword}
              onChange={(e) => setMqttPassword(e.target.value)}
              placeholder={machine.mqttHasPassword ? "•••••• — leave blank to keep it" : "leave blank if the broker doesn't require auth"}
              className="rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-accent"
            />
            {machine.mqttHasPassword && (
              <span className="text-xs text-muted">A password is already saved. Leave blank to keep it unchanged.</span>
            )}
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() =>
                submit({
                  mqttUrl: null,
                  mqttTopic: null,
                  mqttClientId: null,
                  mqttUsername: null,
                  mqttPassword: null,
                })
              }
              className="rounded-lg border border-hairline px-3 py-1.5 text-sm font-medium text-secondary hover:bg-surface-2 disabled:opacity-60"
            >
              Use default broker
            </button>
            <button
              type="button"
              onClick={close}
              className="rounded-lg border border-hairline px-3 py-1.5 text-sm font-medium text-secondary hover:bg-surface-2"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
