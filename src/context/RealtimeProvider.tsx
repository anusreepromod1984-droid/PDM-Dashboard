"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";
import { LIVE_TAIL_LENGTH, SOCKET_PATH, SOCKET_URL } from "@/lib/constants";
import { normalizeTelemetry } from "@/lib/telemetry";
import { computeFreshness } from "@/lib/freshness";
import { useNow } from "@/hooks/useNow";
import type {
  AlertBreach,
  ConnectionStatus,
  Freshness,
  MachineActivity,
  MachineMeta,
  MachineRecord,
  MachineStatus,
  Schema,
  Telemetry,
  UpstreamStatus,
  FaultDiagnosis,
} from "@/lib/types";

const emptyRecord: MachineRecord = { latest: null, history: [], status: null };
const emptyActivity: MachineActivity = { idle: false, zeroFields: [] };

export interface RealtimeContextValue {
  serverUrl: string;
  connectionStatus: ConnectionStatus;
  lastConnectedAt: number | null;
  /** True once the socket's initial "bootstrap" payload has been received at least
   *  once — distinct from connectionStatus === "connected", which fires on the
   *  socket's own "connect" event, strictly before bootstrap arrives. `schema` alone
   *  isn't a substitute: it mirrors a global MQTT-derived value that can stay null
   *  independent of whether this company's own bootstrap (with its own possibly-empty
   *  `machines` array) has landed. See components/tour/TourLauncher.tsx for the
   *  consumer this was added for. */
  hasBootstrapped: boolean;
  schema: Schema | null;
  machines: MachineMeta[];
  records: Record<string, MachineRecord>;
  upstream: UpstreamStatus | null;
  activeAlerts: Record<string, AlertBreach[]>;
  activeActivity: Record<string, MachineActivity>;
  /** Latest 4-agent card pushed with each integrated_data diagnosis. */
  latestDiagnosis: Record<string, FaultDiagnosis>;
  reconnect: () => void;
}

// Exported so dashboardTemplate/StaticRealtimeProvider.tsx can feed the same context
// with REST-polled data (no socket) for the Gbotz preview pane — every hook/component
// below (and MachineCard, which self-subscribes) then works unmodified there too.
export const RealtimeContext = createContext<RealtimeContextValue | null>(null);

interface BootstrapPayload {
  upstream: UpstreamStatus;
  schema: Schema | null;
  machines: MachineMeta[];
  records: Record<string, MachineRecord & { liveness?: string; lastSeenAt?: number | null; activity?: MachineActivity; diagnosis?: FaultDiagnosis }>;
  activeAlerts: Record<string, AlertBreach[]>;
}

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting");
  const [lastConnectedAt, setLastConnectedAt] = useState<number | null>(null);
  const [hasBootstrapped, setHasBootstrapped] = useState(false);
  const [schema, setSchema] = useState<Schema | null>(null);
  const [machines, setMachines] = useState<MachineMeta[]>([]);
  const [records, setRecords] = useState<Record<string, MachineRecord>>({});
  const [upstream, setUpstream] = useState<UpstreamStatus | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<Record<string, AlertBreach[]>>({});
  const [activeActivity, setActiveActivity] = useState<Record<string, MachineActivity>>({});
  const [latestDiagnosis, setLatestDiagnosis] = useState<Record<string, FaultDiagnosis>>({});
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // SOCKET_URL can be "" (NEXT_PUBLIC_API_URL left blank for same-origin/LAN
    // deployments) — io("") parses as a malformed empty-host URL rather than
    // same-origin, so pass undefined instead to get socket.io's real same-origin default.
    const socket = io(SOCKET_URL || undefined, {
      path: SOCKET_PATH,
      // Required cross-origin (localhost:3000 -> localhost:4000): without this the
      // browser won't attach the pdm_session cookie to the handshake, and the
      // backend's socketAuthMiddleware (backend/src/realtime/auth.ts) rejects every
      // connection attempt as unauthorized — which just looks like an endless "waiting
      // for the backend" hang from here, with no visible error.
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
      timeout: 8000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnectionStatus("connected");
      setLastConnectedAt(Date.now());
    });

    socket.on("disconnect", (reason) => {
      // A server-initiated disconnect does not auto-reconnect on its own; everything
      // else (transport drop, ping timeout) is mid-retry via the manager.
      setConnectionStatus(reason === "io server disconnect" ? "disconnected" : "reconnecting");
    });

    socket.io.on("reconnect_attempt", () => setConnectionStatus("reconnecting"));
    socket.io.on("reconnect_failed", () => setConnectionStatus("disconnected"));
    socket.on("connect_error", () => {
      setConnectionStatus(socket.active ? "reconnecting" : "error");
    });

    socket.on("bootstrap", (payload: BootstrapPayload) => {
      setHasBootstrapped(true);
      setSchema(payload.schema);
      setMachines(payload.machines);
      setUpstream(payload.upstream);
      setActiveAlerts(payload.activeAlerts ?? {});
      const nextRecords: Record<string, MachineRecord> = {};
      const nextActivity: Record<string, MachineActivity> = {};
      for (const [machineId, record] of Object.entries(payload.records)) {
        nextRecords[machineId] = {
          latest: record.latest ? normalizeTelemetry(record.latest) : null,
          history: (record.history ?? []).map(normalizeTelemetry).filter((t) => t !== null),
          status: record.status ?? null,
        };
        nextActivity[machineId] = record.activity ?? emptyActivity;
      }
      setRecords((prev) => ({ ...prev, ...nextRecords }));
      setActiveActivity((prev) => ({ ...prev, ...nextActivity }));
      const nextDiagnosis: Record<string, FaultDiagnosis> = {};
      for (const [machineId, record] of Object.entries(payload.records)) {
        if (record.diagnosis && typeof record.diagnosis.headline === "string") {
          nextDiagnosis[machineId] = record.diagnosis;
        }
      }
      if (Object.keys(nextDiagnosis).length > 0) {
        setLatestDiagnosis((prev) => ({ ...prev, ...nextDiagnosis }));
      }
    });

    socket.on(
      "telemetry",
      (payload: { machineId: string; telemetry: unknown }) => {
        const telemetry = normalizeTelemetry(payload.telemetry);
        if (!telemetry) return;
        setRecords((prev) => {
          const existing = prev[payload.machineId] ?? emptyRecord;
          const history = [...existing.history, telemetry].slice(-LIVE_TAIL_LENGTH);
          return {
            ...prev,
            [payload.machineId]: {
              ...existing,
              latest: telemetry,
              history,
              status: {
                machineId: payload.machineId,
                status: "online",
                timestamp: telemetry.timestamp,
              },
            },
          };
        });
      }
    );

    socket.on(
      "diagnosis",
      (payload: { machineId?: string; diagnosis?: FaultDiagnosis }) => {
        const diagnosis = payload?.diagnosis;
        const machineId = payload?.machineId || diagnosis?.machineId;
        if (!machineId || !diagnosis || typeof diagnosis.headline !== "string") return;
        setLatestDiagnosis((prev) => ({ ...prev, [machineId]: diagnosis }));
      }
    );

    socket.on("machine:status", (payload: { machineId: string; reportedStatus: MachineStatus["status"] | null; at: number }) => {
      setRecords((prev) => {
        const existing = prev[payload.machineId] ?? emptyRecord;
        const status: MachineStatus | null = payload.reportedStatus
          ? { machineId: payload.machineId, status: payload.reportedStatus, timestamp: payload.at }
          : existing.status;
        return { ...prev, [payload.machineId]: { ...existing, status } };
      });
    });

    socket.on("machines:update", (nextMachines: MachineMeta[]) => setMachines(nextMachines));
    socket.on("schema:update", (nextSchema: Schema) => setSchema(nextSchema));
    socket.on("upstream:status", (status: UpstreamStatus) => setUpstream(status));

    socket.on("alert", (payload: { machineId: string; breaches: AlertBreach[]; activity?: MachineActivity }) => {
      setActiveAlerts((prev) => ({ ...prev, [payload.machineId]: payload.breaches }));
      if (payload.activity) {
        setActiveActivity((prev) => ({ ...prev, [payload.machineId]: payload.activity! }));
      }
    });

    return () => {
      socket.removeAllListeners();
      socket.close();
      socketRef.current = null;
    };
  }, []);

  // FastAPI REST Polling fallback: feeds RealtimeProvider directly from Python 4-Agent backend
  useEffect(() => {
    let active = true;

    async function pollRest() {
      try {
        const res = await fetch("/api/machines");
        if (!res.ok) return;
        const data = await res.json();
        const machineMetas: MachineMeta[] = data.machines || [];
        if (!active) return;
        // Socket.IO owns the live roster. REST polling used to overwrite it every 2.5s
        // (including with []) and stamp status=offline via bootstrap, so the floor never
        // showed Live even after MQTT was connected.
        if (socketRef.current?.connected) return;
        setMachines(machineMetas);
        if (machineMetas.length === 0) return;

        setHasBootstrapped(true);
        setConnectionStatus("connected");

        for (const m of machineMetas) {
          try {
            const tRes = await fetch(`/api/machines/${encodeURIComponent(m.id)}/history`);
            if (!tRes.ok) continue;
            const tData = await tRes.json();
            const rows: Telemetry[] = (tData.rows || []).map(normalizeTelemetry).filter((t: any): t is Telemetry => t !== null);
            if (rows.length === 0) continue;
            const latest = rows[rows.length - 1];

            if (active) {
              setRecords((prev) => {
                return {
                  ...prev,
                  [m.id]: {
                    latest,
                    history: rows.sort((a, b) => a.timestamp - b.timestamp).slice(-LIVE_TAIL_LENGTH),
                    status: null,
                  },
                };
              });

              // Derive active alert breaches so AiFaultAssistant and status badges respond immediately
              const breaches: AlertBreach[] = [];
              if (latest.imuAcceleration >= 4.5) {
                breaches.push({
                  key: "Vibration::imuAcceleration",
                  groupName: "Vibration",
                  paramName: "imuAcceleration",
                  unit: "mm/s",
                  value: latest.imuAcceleration,
                  min: null,
                  max: 4.5,
                  threshold: 4.5,
                  direction: "high",
                });
              }
              for (const f of latest.motorFaults) {
                if (f.active && f.confidence >= 0.5) {
                  breaches.push({
                    key: `Motor faults::${f.fault_code}`,
                    groupName: "Motor faults",
                    paramName: f.fault_code,
                    unit: null,
                    value: f.confidence,
                    min: null,
                    max: 0.5,
                    threshold: 0.5,
                    direction: "high",
                  });
                }
              }
              const alreadyCableFault = latest.motorFaults.some(
                (f) => f.active && f.fault_code === "HARDWARE_CABLE_FAULT"
              );
              if (latest.sensorStatus && !latest.sensorStatus.ok && !alreadyCableFault) {
                breaches.push({
                  key: "Sensors::HARDWARE_CABLE_FAULT",
                  groupName: "Sensors",
                  paramName: "HARDWARE_CABLE_FAULT",
                  unit: null,
                  value: 0,
                  min: null,
                  max: null,
                  threshold: null,
                  direction: "none",
                });
              }

              setActiveAlerts((prev) => ({
                ...prev,
                [m.id]: breaches,
              }));
            }
          } catch {
            // ignore
          }
        }
      } catch {
        // ignore
      }
    }

    pollRest();
    const interval = setInterval(pollRest, 2500);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const reconnect = useCallback(() => {
    socketRef.current?.disconnect().connect();
  }, []);

  const value = useMemo<RealtimeContextValue>(
    () => ({
      serverUrl: SOCKET_URL,
      connectionStatus,
      lastConnectedAt,
      hasBootstrapped,
      schema,
      machines,
      records,
      upstream,
      activeAlerts,
      activeActivity,
      latestDiagnosis,
      reconnect,
    }),
    [
      connectionStatus,
      lastConnectedAt,
      hasBootstrapped,
      schema,
      machines,
      records,
      upstream,
      activeAlerts,
      activeActivity,
      latestDiagnosis,
      reconnect,
    ]
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime(): RealtimeContextValue {
  const ctx = useContext(RealtimeContext);
  if (!ctx) throw new Error("useRealtime must be used within RealtimeProvider");
  return ctx;
}

export function useMachines(): (MachineMeta & { online: boolean; lastSeen: number | null; freshness: Freshness })[] {
  const { machines, records, connectionStatus } = useRealtime();
  const now = useNow(1000);
  const socketConnected = connectionStatus === "connected";
  return useMemo(
    () =>
      machines.map((m) => {
        const record = records[m.id];
        const freshness = computeFreshness({
          latest: record?.latest ?? null,
          status: record?.status ?? null,
          now,
          socketConnected,
        });
        return {
          ...m,
          // Redefines "online": the old `status === "online" && !!latest` never
          // re-evaluated once a retained status message arrived, so a machine that
          // silently stopped publishing still showed as online forever. This is now
          // freshness-derived, so it actually reflects recency.
          online: freshness === "live",
          lastSeen: record?.latest?.timestamp ?? null,
          freshness,
        };
      }),
    [machines, records, now, socketConnected]
  );
}

export function useMachineTelemetry(
  machineId: string | undefined
): MachineRecord & { freshness: Freshness; lastUpdatedAt: number | null } {
  const { records, connectionStatus } = useRealtime();
  const now = useNow(1000);
  const record = (machineId && records[machineId]) || emptyRecord;
  const freshness = computeFreshness({
    latest: record.latest,
    status: record.status,
    now,
    socketConnected: connectionStatus === "connected",
  });
  return { ...record, freshness, lastUpdatedAt: record.latest?.timestamp ?? null };
}
