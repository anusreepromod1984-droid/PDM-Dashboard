"use client";

import { useNow } from "@/hooks/useNow";
import { formatClock, timeAgo } from "@/lib/format";
import type { Freshness } from "@/lib/types";
import { IconAlertTriangle } from "@/components/icons";

/**
 * Annotates content, never replaces it — the whole point of "show the last recorded
 * data" is that this banner sits ABOVE still-visible (if dimmed, see globals.css
 * [data-stale]) cards and charts, not instead of them. See WaitingForData for the
 * genuinely-different "we have never received anything" case.
 */
export function StaleBanner({ freshness, lastUpdatedAt }: { freshness: Freshness; lastUpdatedAt: number | null }) {
  const now = useNow(1000);
  if (freshness === "live" || freshness === "nodata") return null;

  const label =
    freshness === "offline"
      ? "Machine reported offline"
      : "Live feed paused";

  return (
    <div className="flex items-center gap-2 rounded-lg border border-[color-mix(in_srgb,var(--status-warning)_35%,transparent)] bg-[color-mix(in_srgb,var(--status-warning)_10%,transparent)] px-3 py-2 text-sm text-secondary">
      <IconAlertTriangle className="h-4 w-4 shrink-0" style={{ color: "var(--status-warning)" }} />
      <span>
        {label} — showing last recorded values from{" "}
        <span className="font-medium text-primary">{formatClock(lastUpdatedAt)}</span>
        {" ("}
        {timeAgo(lastUpdatedAt, now)}
        {")"}
      </span>
    </div>
  );
}
