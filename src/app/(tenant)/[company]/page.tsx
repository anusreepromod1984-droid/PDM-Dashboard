"use client";

import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import { useRealtime, useMachines } from "@/context/RealtimeProvider";
import { MachineCard } from "@/components/MachineCard";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/Card";
import { PlantMap } from "@/components/PlantMap";
import { PlantWatchList } from "@/components/PlantWatchList";
import { DashboardTemplateRenderer } from "@/components/dashboardTemplate/DashboardTemplateRenderer";
import { IconAlertTriangle, IconCpu } from "@/components/icons";
import { faultSeverity, motorTempSeverity, vibrationSeverity, worstSeverity } from "@/lib/constants";

export default function OverviewPage() {
  const { data } = useSWR("/api/company/dashboard-template", (p) =>
    apiFetch<{ template: { source: string } | null }>(p)
  );

  // No saved template (or still loading) — show the default hardcoded overview,
  // unchanged. A Gbotz-authored template only takes over once one exists.
  if (data?.template) {
    return <DashboardTemplateRenderer source={data.template.source} />;
  }
  return <DefaultOverview />;
}

function DefaultOverview() {
  const { records, connectionStatus } = useRealtime();
  const machines = useMachines();

  const onlineCount = machines.filter((m) => m.online).length;

  const mapMachines = machines.map((m) => {
    const t = records[m.id]?.latest;
    const worstFault =
      t && t.motorFaults.length > 0
        ? t.motorFaults.reduce((a, b) => (a.confidence > b.confidence ? a : b))
        : null;
    const severity = t
      ? worstSeverity([
          worstFault ? faultSeverity(worstFault.confidence) : "good",
          vibrationSeverity(t.imuAcceleration),
          motorTempSeverity(t.temperature.motor),
        ])
      : "good";
    return {
      id: m.id,
      label: m.name,
      mapX: m.mapX,
      mapY: m.mapY,
      severity,
      online: m.online,
      freshness: m.freshness,
      lastSeen: m.lastSeen,
    };
  });
  const criticalCount = mapMachines.filter((m) => m.severity === "critical").length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-primary">Plant Overview</h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Machines online"
          value={`${onlineCount}/${machines.length}`}
          icon={<IconCpu className="h-4 w-4" />}
        />
        <StatCard
          label="Machines critical"
          value={String(criticalCount)}
          icon={<IconAlertTriangle className="h-4 w-4" />}
          severity={criticalCount > 0 ? "critical" : "good"}
        />
      </div>

      {mapMachines.length > 0 && (
        <Card title="Plant floor map" subtitle="Machines placed on the floor — colored by live health">
          <PlantMap machines={mapMachines} />
        </Card>
      )}

      <PlantWatchList />

      {connectionStatus !== "connected" && machines.length === 0 && (
        <div className="rounded-xl border border-dashed border-hairline bg-surface p-8 text-center text-sm text-muted">
          Waiting for the backend to report the machine list — make sure{" "}
          <code className="rounded bg-surface-2 px-1.5 py-0.5 text-xs">backend/</code> is running and
          reachable.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {machines.map((m, i) => (
          <MachineCard key={m.id} id={m.id} name={m.name} location={m.location} online={m.online} staggerIndex={i} />
        ))}
      </div>
    </div>
  );
}
