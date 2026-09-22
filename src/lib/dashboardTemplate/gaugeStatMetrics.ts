/** Kept in a plain module (no "use client") rather than alongside TemplateGaugeStatCard
 *  itself — elementRegistry.tsx is pulled into server-rendered pages too (e.g. gbotz/docs
 *  via docsContent.tsx), and a value exported from a client component module resolves
 *  there as an opaque client reference, not the real array. Same reason
 *  MAINTENANCE_METRIC_KEYS lives in maintenanceMetrics.ts instead of TemplateMaintenanceCard.tsx. */
export const GAUGE_STAT_METRICS = [
  "rpm",
  "vibration",
  "motorTemp",
  "humidity",
  "machineLoad",
  "pressure",
] as const;

export type GaugeStatMetric = (typeof GAUGE_STAT_METRICS)[number];
