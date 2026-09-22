"use client";

import { useRef, useState } from "react";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import { API_URL } from "@/lib/constants";
import { FloorCanvas, MachineTile, clampPercent } from "@/components/FloorCanvas";
import { FloorPlanUploader } from "@/components/gbotz/FloorPlanUploader";
import { StatusBadge } from "@/components/StatusBadge";
import type { GbotzCompany, GbotzMachine } from "@/lib/gbotzTypes";

const LIVENESS_SEVERITY = { ONLINE: "good", STALE: "warning", OFFLINE: "critical", UNKNOWN: "warning" } as const;

interface DragPos {
  id: string;
  x: number;
  y: number;
}

/**
 * Drag-and-drop floor-plan placement for one company's machines. Repositioning a
 * placed machine uses pointer events (smooth, continuous feedback while dragging);
 * placing an unplaced machine from the tray uses native HTML5 drag-and-drop, matching
 * the no-library DnD convention already used in dashboardTemplate/OutlineSidebar.tsx.
 * Both end the same way: PATCH /api/gbotz/machines/:id/placement with {x, y} as a
 * percentage (0-100) of the floor canvas.
 */
export function PlantMapEditor({ companyId }: { companyId: string }) {
  const { data, mutate } = useSWR("/api/gbotz/machines", (p) => apiFetch<{ machines: GbotzMachine[] }>(p));
  const machines = (data?.machines ?? []).filter((m) => m.companyId === companyId);
  const placed = machines.filter((m) => m.mapX !== null && m.mapY !== null);
  const unplaced = machines.filter((m) => m.mapX === null || m.mapY === null);

  const { data: companyData, mutate: mutateCompany } = useSWR(`/api/gbotz/companies/${companyId}`, (p) =>
    apiFetch<{ company: GbotzCompany }>(p)
  );
  const company = companyData?.company;
  const backgroundImageUrl = company?.floorPlanImageUrl
    ? `${API_URL}${company.floorPlanImageUrl}?v=${encodeURIComponent(company.updatedAt)}`
    : null;

  const surfaceRef = useRef<HTMLDivElement>(null);
  const [dragOverride, setDragOverride] = useState<DragPos | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  function percentFromPoint(clientX: number, clientY: number): { x: number; y: number } {
    const rect = surfaceRef.current?.getBoundingClientRect();
    if (!rect) return { x: 50, y: 50 };
    return {
      x: clampPercent(((clientX - rect.left) / rect.width) * 100),
      y: clampPercent(((clientY - rect.top) / rect.height) * 100),
    };
  }

  async function place(machineId: string, x: number | null, y: number | null) {
    setPendingId(machineId);
    try {
      await apiFetch(`/api/gbotz/machines/${machineId}/placement`, { method: "PATCH", body: { x, y } });
      await mutate();
    } finally {
      setPendingId(null);
      // Only released once fresh server data has landed — clearing it right after the
      // PATCH resolves (before mutate() above) would flash the node back to its old
      // position for one frame while the refetch is still in flight.
      setDragOverride((cur) => (cur?.id === machineId ? null : cur));
    }
  }

  function handleNodePointerDown(machineId: string, e: React.PointerEvent<HTMLDivElement>) {
    // Stops the floor canvas's own pan-drag (FloorCanvas.tsx) from also starting —
    // dragging a machine repositions it, it never pans the camera underneath it.
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragOverride({ id: machineId, ...percentFromPoint(e.clientX, e.clientY) });
  }

  function handleNodePointerMove(machineId: string, e: React.PointerEvent<HTMLDivElement>) {
    if (dragOverride?.id !== machineId) return;
    setDragOverride({ id: machineId, ...percentFromPoint(e.clientX, e.clientY) });
  }

  function handleNodePointerUp(machineId: string, e: React.PointerEvent<HTMLDivElement>) {
    if (dragOverride?.id !== machineId) return;
    const pos = percentFromPoint(e.clientX, e.clientY);
    setDragOverride({ id: machineId, ...pos });
    place(machineId, pos.x, pos.y);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const machineId = e.dataTransfer.getData("text/plain");
    if (!machineId) return;
    const pos = percentFromPoint(e.clientX, e.clientY);
    place(machineId, pos.x, pos.y);
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="min-w-0 flex-1">
        <FloorPlanUploader
          companyId={companyId}
          imageUrl={backgroundImageUrl}
          onChange={() => mutateCompany()}
        />
        <FloorCanvas
          backgroundImageUrl={backgroundImageUrl}
          surfaceRef={surfaceRef}
          surfaceProps={{ onDragOver: (e) => e.preventDefault(), onDrop: handleDrop }}
        >
          {placed.map((m) => {
            const pos = dragOverride?.id === m.id ? dragOverride : { x: m.mapX!, y: m.mapY! };
            const severity = LIVENESS_SEVERITY[m.liveness as keyof typeof LIVENESS_SEVERITY] ?? "warning";
            return (
              <div
                key={m.id}
                className="group absolute flex -translate-x-1/2 -translate-y-1/2 cursor-grab flex-col items-center [touch-action:none]"
                style={{ left: `${clampPercent(pos.x)}%`, top: `${clampPercent(pos.y)}%`, opacity: pendingId === m.id ? 0.6 : 1 }}
                onPointerDown={(e) => handleNodePointerDown(m.id, e)}
                onPointerMove={(e) => handleNodePointerMove(m.id, e)}
                onPointerUp={(e) => handleNodePointerUp(m.id, e)}
              >
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    place(m.id, null, null);
                  }}
                  className="absolute -right-1.5 -top-1.5 z-10 flex h-4 w-4 items-center justify-center rounded-full border border-hairline bg-surface text-[10px] leading-none text-muted hover:text-primary"
                  aria-label={`Unplace ${m.name}`}
                >
                  ×
                </button>
                <MachineTile severity={severity} online={m.liveness === "ONLINE"} />
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-max -translate-x-1/2 rounded-lg border border-hairline bg-surface px-3 py-2 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                  <p className="text-xs font-semibold text-primary">{m.name}</p>
                  <div className="mt-1">
                    <StatusBadge severity={severity} />
                  </div>
                </div>
              </div>
            );
          })}
        </FloorCanvas>
      </div>

      <div className="flex w-full flex-col gap-5 lg:w-64">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">Placed ({placed.length})</span>
          <p className="text-xs text-muted">Drag a machine on the map to reposition it.</p>
          <div className="flex flex-col gap-1.5">
            {placed.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-hairline bg-surface px-3 py-2"
              >
                <span className="min-w-0 truncate text-sm font-medium text-secondary">{m.name}</span>
              </div>
            ))}
            {placed.length === 0 && <p className="text-xs text-muted">Nothing placed yet.</p>}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">Unplaced ({unplaced.length})</span>
          <p className="text-xs text-muted">Drag a machine onto the floor to place it.</p>
          <div className="flex flex-col gap-1.5">
            {unplaced.map((m) => (
              <div
                key={m.id}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/plain", m.id)}
                className="flex cursor-grab items-center justify-between gap-2 rounded-lg border border-hairline bg-surface px-3 py-2 transition-colors hover:border-baseline"
              >
                <span className="min-w-0 truncate text-sm font-medium text-secondary">{m.name}</span>
              </div>
            ))}
            {unplaced.length === 0 && <p className="text-xs text-muted">Everything&rsquo;s placed.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
