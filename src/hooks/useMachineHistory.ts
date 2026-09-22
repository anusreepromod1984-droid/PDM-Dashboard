"use client";

import useSWR from "swr";
import { useNow } from "@/hooks/useNow";
import { apiFetch } from "@/lib/api";
import { HISTORY_MAX_POINTS } from "@/lib/constants";
import { normalizeTelemetry } from "@/lib/telemetry";
import type { CustomRange, Telemetry, TimeRangeKey } from "@/lib/types";

async function fetcher(path: string): Promise<Telemetry[]> {
  const body = await apiFetch<{ rows: unknown[] }>(path);
  return body.rows.map(normalizeTelemetry).filter((t): t is Telemetry => t !== null);
}

/**
 * "live" never hits the network — the socket-fed ring buffer (RealtimeProvider's
 * `history`) already covers that window, and skipping the fetch keeps the default view
 * (every machine page, most of the time) at zero backend load.
 *
 * The key is quantized to the current minute rather than a raw `Date.now()` `to` value,
 * so re-renders don't change the SWR key on every tick — SWR would otherwise treat every
 * render as a new request. `keepPreviousData` is what makes switching ranges never blank
 * the chart while the new range loads, which is the literal point of this feature.
 *
 * "custom" bypasses `duration` entirely and hits the backend's explicit `from`/`to`
 * query params (backend/src/http/queryParams.ts already supports these) — the key embeds
 * the exact bounds instead of the minute bucket, since a custom range doesn't track "now".
 */
export function useMachineHistory(
  machineId: string | undefined,
  rangeKey: TimeRangeKey,
  customRange?: CustomRange | null
) {
  // Re-renders at most once/30s (not a live-data path) — just often enough to advance
  // the minute bucket below without re-rendering on every 1Hz tick app-wide.
  const now = useNow(30_000);
  const minuteBucket = Math.floor(now / 60_000);
  const key =
    !machineId || rangeKey === "live"
      ? null
      : rangeKey === "custom"
        ? customRange
          ? `/api/machines/${machineId}/history?from=${customRange.from}&to=${customRange.to}&maxPoints=${HISTORY_MAX_POINTS}&format=telemetry`
          : null
        : `/api/machines/${machineId}/history?duration=${rangeKey}&maxPoints=${HISTORY_MAX_POINTS}&format=telemetry&_bucket=${minuteBucket}`;

  return useSWR(key, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
    dedupingInterval: 30_000,
    errorRetryCount: 3,
  });
}
