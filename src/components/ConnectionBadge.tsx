"use client";

import { useRealtime } from "@/context/RealtimeProvider";

const STATUS_CONFIG: Record<
  string,
  { label: string; dot: string; pulse: boolean }
> = {
  connected: { label: "Live", dot: "var(--status-good)", pulse: true },
  connecting: { label: "Connecting…", dot: "var(--status-warning)", pulse: true },
  reconnecting: { label: "Reconnecting… showing last known", dot: "var(--status-warning)", pulse: true },
  disconnected: { label: "Offline — last known values", dot: "var(--status-critical)", pulse: false },
  error: { label: "Connection error", dot: "var(--status-critical)", pulse: false },
};

export function ConnectionBadge() {
  const { connectionStatus, serverUrl, upstream, reconnect } = useRealtime();
  const needsAction = connectionStatus === "disconnected" || connectionStatus === "error";

  // Distinguish "our socket to the backend is down" (needs the user to retry) from
  // "the backend is fine but ITS upstream MQTT feed is down" (nothing the frontend can
  // do — the backend is already retrying, and its own cached last-known values are
  // still being served correctly).
  const feedPaused =
    connectionStatus === "connected" && upstream !== null && upstream.state !== "connected";

  const config = feedPaused
    ? { label: "Feed paused — showing last known", dot: "var(--status-warning)", pulse: false }
    : STATUS_CONFIG[connectionStatus] ?? STATUS_CONFIG.disconnected;

  return (
    <button
      type="button"
      onClick={needsAction ? reconnect : undefined}
      title={`Server: ${serverUrl}${needsAction ? " — click to retry" : ""}`}
      className={`flex items-center gap-2 rounded-full border border-hairline px-3 py-1.5 text-xs font-medium text-secondary ${
        needsAction ? "cursor-pointer hover:bg-surface-2" : "cursor-default"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${config.pulse ? "pulse-dot" : ""}`}
        style={{ backgroundColor: config.dot }}
      />
      {config.label}
    </button>
  );
}
