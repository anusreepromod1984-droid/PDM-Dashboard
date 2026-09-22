"use client";

import Link from "next/link";
import { useCompany } from "@/context/CompanyProvider";
import { useNow } from "@/hooks/useNow";
import { timeAgo } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { FloorCanvas, MachineTile, clampPercent } from "@/components/FloorCanvas";
import { API_URL } from "@/lib/constants";
import type { Freshness, Severity } from "@/lib/types";

export interface PlantMapMachine {
  id: string;
  label: string;
  mapX: number | null;
  mapY: number | null;
  severity: Severity;
  online: boolean;
  freshness: Freshness;
  lastSeen: number | null;
}

export function PlantMap({ machines }: { machines: PlantMapMachine[] }) {
  const { routes, company } = useCompany();
  const now = useNow(1000);
  const backgroundImageUrl = company.floorPlanImageUrl
    ? `${API_URL}${company.floorPlanImageUrl}?v=${encodeURIComponent(company.updatedAt)}`
    : null;

  const placed = machines.filter(
    (m): m is PlantMapMachine & { mapX: number; mapY: number } => m.mapX !== null && m.mapY !== null
  );
  const unassigned = machines.filter((m) => m.mapX === null || m.mapY === null);

  if (placed.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-dashed border-hairline bg-surface-2 p-8 text-center text-sm text-muted">
          No machines have been placed on the floor plan yet. Drag a machine onto the map from{" "}
          <span className="font-medium text-secondary">Gbotz admin → Floor map</span> to see it here.
        </div>
        {unassigned.length > 0 && <UnassignedList machines={unassigned} routes={routes} />}
      </div>
    );
  }

  return (
    <div data-tour="plant-map" className="flex flex-col gap-4">
      <FloorCanvas backgroundImageUrl={backgroundImageUrl}>
        {placed.map((m, i) => {
          const stale = m.freshness === "stale" || m.freshness === "offline";
          return (
            <Link
              key={m.id}
              href={routes.machine(m.id)}
              data-tour={i === 0 ? "plant-map-machine" : undefined}
              className="group absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center focus:outline-none"
              style={{ left: `${clampPercent(m.mapX)}%`, top: `${clampPercent(m.mapY)}%` }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <MachineTile severity={m.severity} online={m.online} stale={stale} />
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-max -translate-x-1/2 rounded-lg border border-hairline bg-surface px-3 py-2 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus:opacity-100">
                <p className="text-xs font-semibold text-primary">{m.label}</p>
                <div className="mt-1 flex items-center gap-2">
                  <StatusBadge severity={m.severity} />
                  <span className="text-[11px] text-muted">
                    {m.online ? "Live" : `Updated ${timeAgo(m.lastSeen, now)}`}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </FloorCanvas>

      {unassigned.length > 0 && <UnassignedList machines={unassigned} routes={routes} />}
    </div>
  );
}

function UnassignedList({
  machines,
  routes,
}: {
  machines: PlantMapMachine[];
  routes: ReturnType<typeof useCompany>["routes"];
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-muted">
        Unassigned machines ({machines.length})
      </span>
      <div className="flex flex-wrap gap-2">
        {machines.map((m) => (
          <Link
            key={m.id}
            href={routes.machine(m.id)}
            className="rounded-full border border-hairline bg-surface-2 px-3 py-1 text-xs font-medium text-secondary transition-colors hover:border-baseline hover:text-primary"
          >
            {m.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
