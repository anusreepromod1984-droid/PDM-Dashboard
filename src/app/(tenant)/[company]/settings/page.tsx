"use client";

import { useState } from "react";
import { useRealtime } from "@/context/RealtimeProvider";
import { Card } from "@/components/Card";
import { ConnectionBadge } from "@/components/ConnectionBadge";

export default function SettingsPage() {
  const { serverUrl, lastConnectedAt, schema, machines, reconnect } = useRealtime();
  const [showSchema, setShowSchema] = useState(false);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-primary">Settings</h1>
        <p className="mt-1 text-sm text-muted">Backend connection and data source information.</p>
      </div>

      <Card title="Backend connection" subtitle="The dashboard talks to the PDM backend over Socket.IO and REST — it no longer connects to MQTT directly.">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">Backend URL</dt>
            <dd className="mt-1 font-mono text-sm text-primary">{serverUrl}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">Status</dt>
            <dd className="mt-1">
              <ConnectionBadge />
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">Last connected</dt>
            <dd className="mt-1 text-sm text-primary">
              {lastConnectedAt ? new Date(lastConnectedAt).toLocaleString() : "Never"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">Machines discovered</dt>
            <dd className="mt-1 text-sm text-primary">{machines.length}</dd>
          </div>
        </dl>
        <button
          type="button"
          onClick={reconnect}
          className="mt-4 w-fit rounded-lg border border-hairline px-3 py-1.5 text-sm font-medium text-secondary transition-colors hover:bg-surface-2 hover:text-primary"
        >
          Force reconnect
        </button>
      </Card>

      <Card
        title="Architecture"
        subtitle="MQTT now terminates at the backend, not in the browser."
      >
        <p className="text-sm text-secondary">
          The <code className="rounded bg-surface-2 px-1.5 py-0.5 text-xs">backend/</code> service is the
          one persistent MQTT client — it ingests every telemetry tick, stores it in PostgreSQL, and
          re-serves live updates to this dashboard over Socket.IO plus historical time-range queries over
          REST. Point{" "}
          <code className="rounded bg-surface-2 px-1.5 py-0.5 text-xs">NEXT_PUBLIC_API_URL</code> at a
          different backend deployment to switch data sources; the backend itself is what gets pointed at
          the real factory broker.
        </p>
      </Card>

      <Card
        title="Sensor parameter schema"
        subtitle="Published once (retained) by the broker on connect — describes every field this dashboard renders."
        actions={
          <button
            type="button"
            onClick={() => setShowSchema((s) => !s)}
            className="rounded-lg border border-hairline px-3 py-1.5 text-xs font-medium text-secondary hover:bg-surface-2 hover:text-primary"
          >
            {showSchema ? "Hide" : "Show"} raw JSON
          </button>
        }
      >
        {!schema && <p className="text-sm text-muted">Schema not received yet.</p>}
        {schema && showSchema && (
          <pre className="max-h-96 overflow-auto rounded-lg bg-surface-2 p-4 text-xs text-secondary">
            {JSON.stringify(schema, null, 2)}
          </pre>
        )}
        {schema && !showSchema && (
          <p className="text-sm text-secondary">{schema.parameters.length} parameters loaded.</p>
        )}
      </Card>
    </div>
  );
}
