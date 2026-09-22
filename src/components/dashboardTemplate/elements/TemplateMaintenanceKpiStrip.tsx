"use client";

import { useMaintenanceMetrics } from "@/lib/dashboardTemplate/useMaintenanceMetrics";
import { MAINTENANCE_METRIC_KEYS, SEVERITY_COLOR } from "@/lib/dashboardTemplate/maintenanceMetrics";
import { IconAlertTriangle, IconCpu, IconHeartPulse, IconShield } from "@/components/icons";
import { KpiTile } from "@/components/KpiTile";

export interface TemplateMaintenanceKpiStripProps {
  machineId: string;
}

/**
 * The mockup's fleet-wide KPI strip, re-scoped to this one machine — Super Dashboard
 * opens per-machine, so "assets monitored" becomes "sensors monitored" and healthy/
 * warning/critical count this machine's own cards rather than a fleet. Cards with no
 * backing sensor (`unavailable`) are excluded from every count here — they're neither
 * healthy nor unhealthy, they're just not measured yet.
 */
export function TemplateMaintenanceKpiStrip({ machineId }: TemplateMaintenanceKpiStripProps) {
  const results = useMaintenanceMetrics(machineId);
  const monitoredKeys = MAINTENANCE_METRIC_KEYS.filter((k) => !results[k].unavailable);
  const severities = monitoredKeys.map((k) => results[k].severity);
  const healthy = severities.filter((s) => s === "good").length;
  const warning = severities.filter((s) => s === "warning").length;
  const critical = severities.filter((s) => s === "critical").length;
  const health = Math.max(
    0,
    Math.round(100 - severities.reduce((penalty, s) => penalty + (s === "warning" ? 4 : s === "critical" ? 15 : 0), 0))
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Machine Health + Sensors Monitored on their own row, Healthy/Warning/Critical
          grouped on the row below — those three are the metrics users scan first, so
          they stay together rather than spreading across a wider row. */}
      <div className="grid grid-cols-2 gap-3">
        <KpiTile icon={IconHeartPulse} label="Machine Health" value={`${health}%`} color="var(--accent)" />
        <KpiTile icon={IconCpu} label="Sensors Monitored" value={String(monitoredKeys.length)} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <KpiTile icon={IconShield} label="Healthy" value={String(healthy)} color="var(--status-good)" />
        <KpiTile icon={IconAlertTriangle} label="Warning" value={String(warning)} color="var(--status-warning)" />
        <KpiTile icon={IconAlertTriangle} label="Critical" value={String(critical)} color="var(--status-critical)" />
      </div>
      <div className="flex flex-wrap items-center gap-2 px-1 text-xs text-muted">
        {(["good", "warning", "critical"] as const).map((s) => (
          // three-d-legend-item: no-op here — gives the /3d flow's globals.css a hook
          // to paint a background behind this text, since that flow's page background
          // is transparent (the 3D scene shows through) and this row would otherwise
          // be illegible over an arbitrary scene.
          <div key={s} className="three-d-legend-item flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: SEVERITY_COLOR[s] }} />
            {s === "good" ? "Normal" : s === "warning" ? "Warning" : "Abnormal / Critical"}
          </div>
        ))}
      </div>
    </div>
  );
}
