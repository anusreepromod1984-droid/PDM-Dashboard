import { OFFLINE_AFTER_MS, STALE_AFTER_MS } from "@/lib/constants";
import type { Freshness, MachineStatus, Telemetry } from "@/lib/types";

export interface FreshnessInput {
  latest: Telemetry | null;
  status: MachineStatus | null;
  now: number;
  /** Whether OUR socket to the backend is currently connected — if not, we can't tell
   *  whether the data is still fresh, so treat it as stale rather than claiming "live". */
  socketConnected: boolean;
}

export function computeFreshness({ latest, status, now, socketConnected }: FreshnessInput): Freshness {
  if (!latest) return "nodata";
  if (!socketConnected) return "stale";
  if (status?.status === "offline") return "offline";

  const age = now - latest.timestamp;
  if (age > OFFLINE_AFTER_MS) return "offline";
  if (age > STALE_AFTER_MS) return "stale";
  return "live";
}
