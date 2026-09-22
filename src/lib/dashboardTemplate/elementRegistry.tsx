import type { ComponentType } from "react";
import { STAT_ICONS } from "@/lib/dashboardTemplate/statIcons";
import { TemplateStatCard } from "@/components/dashboardTemplate/elements/TemplateStatCard";
import { TemplateGaugeStatCard } from "@/components/dashboardTemplate/elements/TemplateGaugeStatCard";
import { GAUGE_STAT_METRICS } from "@/lib/dashboardTemplate/gaugeStatMetrics";
import { TemplateTrendChart } from "@/components/dashboardTemplate/elements/TemplateTrendChart";
import { TemplateFaultGauge } from "@/components/dashboardTemplate/elements/TemplateFaultGauge";
import { TemplateStatusBadge } from "@/components/dashboardTemplate/elements/TemplateStatusBadge";
import { TemplateMachineCard } from "@/components/dashboardTemplate/elements/TemplateMachineCard";
import { TemplateFleetStat } from "@/components/dashboardTemplate/elements/TemplateFleetStat";
import { TemplateFleetBubbleChart } from "@/components/dashboardTemplate/elements/TemplateFleetBubbleChart";
import { TemplateFleetPlantMap } from "@/components/dashboardTemplate/elements/TemplateFleetPlantMap";
import { TemplateScatterChart } from "@/components/dashboardTemplate/elements/TemplateScatterChart";
import { TemplateSpectrumChart } from "@/components/dashboardTemplate/elements/TemplateSpectrumChart";
import { TemplateFaultGaugeGrid } from "@/components/dashboardTemplate/elements/TemplateFaultGaugeGrid";
import { TemplateFaultConfidenceTrend } from "@/components/dashboardTemplate/elements/TemplateFaultConfidenceTrend";
import { TemplateSensorHealth } from "@/components/dashboardTemplate/elements/TemplateSensorHealth";
import { TemplateBarChart } from "@/components/dashboardTemplate/elements/TemplateBarChart";
import { TemplatePieChart } from "@/components/dashboardTemplate/elements/TemplatePieChart";
import { TemplateRadarChart } from "@/components/dashboardTemplate/elements/TemplateRadarChart";
import { TemplateMaintenanceCard } from "@/components/dashboardTemplate/elements/TemplateMaintenanceCard";
import { TemplateMaintenanceKpiStrip } from "@/components/dashboardTemplate/elements/TemplateMaintenanceKpiStrip";
import { MAINTENANCE_METRIC_KEYS } from "@/lib/dashboardTemplate/maintenanceMetrics";

export type SettingsField =
  | { key: string; kind: "text"; label: string; placeholder?: string }
  | { key: string; kind: "number"; label: string }
  | { key: string; kind: "select"; label: string; options: { value: string; label: string }[] };

export interface ElementDefinition {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: ComponentType<any>;
  /** Turns the JSON parsed out of a `data-gbotz-props` attribute into real props. */
  parseProps: (raw: Record<string, unknown>) => Record<string, unknown>;
  /** Shown verbatim in the Gbotz editor's reference panel. */
  usage: string;
  description: string;
  /** Drives the dashboard-preview sidebar's settings form for this block — every key
   *  here round-trips through outlineParser's updateBlockArgs, so it must cover every
   *  arg documented in `usage` or an edit through the form will silently drop it.
   *  Omitted (or empty) means the block has nothing configurable beyond its fixed
   *  `machine` binding. */
  settingsFields?: SettingsField[];
  /** Which page(s) this block makes sense on, for the "add block" picker: "fleet"
   *  for fleet-wide aggregates (fleet_stat, fleet_bubble_chart) and machine_card (a
   *  tile *about* a machine, meant for the fleet overview, not that machine's own
   *  page); "both" for anything describing one machine's own telemetry — equally at
   *  home directly on that machine's page, or looped once per machine on fleet's
   *  page. Nothing is "machine"-exclusive today, but the type allows for it. */
  pageScope: "fleet" | "machine" | "both";
  /** Whether the tag itself needs `machine: machine`. Independent of `pageScope`:
   *  on the fleet page this determines HOW a block gets inserted, not WHETHER —
   *  see AddBlockPicker, which binds directly when the target is already inside a
   *  `{% for machine in machines %}` loop (isInsideRepeater), or wraps a fresh one
   *  around it otherwise. On a machine page `machine` is always already in scope
   *  (buildMachineTemplateContext in buildTemplateContext.ts), so this always binds
   *  directly there. */
  bindsMachine: boolean;
  /** Starting args for a freshly-inserted block, so it renders something sensible
   *  before its settings are configured. Omitted keys are fine — parseProps already
   *  falls back gracefully for every element. */
  defaultArgs?: Record<string, string | number>;
}

const ICON_OPTIONS = [
  { value: "", label: "None" },
  ...Object.keys(STAT_ICONS).map((name) => ({ value: name, label: name })),
];

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function num(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

/** Every element takes `machine: machine` (or a literal `machineId: "..."`) — the
 *  Liquid Hash resolves `machine` to the actual context object, so we read `.id` off
 *  it; a literal id string is accepted too for one-off, non-looped invocations. */
function machineIdOf(raw: Record<string, unknown>): string {
  const machine = raw.machine as Record<string, unknown> | undefined;
  return str(machine?.id, str(raw.machineId));
}

const STAT_SEVERITY_FROM = new Set(["vibration", "motorTemp", "voltageImbalance", "soundLevel", "pressure"]);

export const ELEMENT_REGISTRY: Record<string, ElementDefinition> = {
  stat_card: {
    component: TemplateStatCard,
    usage:
      '{% stat_card machine: machine, field: "rpm", label: "RPM", unit: "rpm", icon: "gauge" %} — icon: gauge|activity|thermometer|zap|droplet|volume|cpu|alert-triangle; severityFrom: vibration|motorTemp|voltageImbalance|soundLevel|pressure; format: number|hours; hint: "..."',
    description: "A live numeric readout for one machine/field.",
    parseProps: (raw) => ({
      machineId: machineIdOf(raw),
      field: str(raw.field),
      label: str(raw.label, str(raw.field)),
      unit: raw.unit !== undefined ? str(raw.unit) : undefined,
      decimals: num(raw.decimals),
      icon: raw.icon !== undefined ? str(raw.icon) : undefined,
      hint: raw.hint !== undefined ? str(raw.hint) : undefined,
      format: raw.format === "hours" ? "hours" : "number",
      severityFrom: typeof raw.severityFrom === "string" && STAT_SEVERITY_FROM.has(raw.severityFrom) ? raw.severityFrom : undefined,
    }),
    settingsFields: [
      { key: "field", kind: "text", label: "Field path" },
      { key: "label", kind: "text", label: "Label" },
      { key: "unit", kind: "text", label: "Unit" },
      { key: "decimals", kind: "number", label: "Decimals" },
      { key: "icon", kind: "select", label: "Icon", options: ICON_OPTIONS },
      { key: "hint", kind: "text", label: "Hint" },
      { key: "format", kind: "select", label: "Format", options: [{ value: "number", label: "Number" }, { value: "hours", label: "Hours" }] },
      {
        key: "severityFrom",
        kind: "select",
        label: "Severity from",
        options: [{ value: "", label: "None" }, ...Array.from(STAT_SEVERITY_FROM).map((v) => ({ value: v, label: v }))],
      },
    ],
    pageScope: "both",
    bindsMachine: true,
    defaultArgs: { field: "rpm", label: "New stat", icon: "gauge" },
  },
  gauge_stat_card: {
    component: TemplateGaugeStatCard,
    usage:
      '{% gauge_stat_card machine: machine, metric: "rpm", label: "RPM", icon: "gauge" %} — metric: ' +
      GAUGE_STAT_METRICS.join(", "),
    description:
      "A dial-gauge readout for one machine/metric — same MiniArcGauge/MiniRadialProgress visual as the hardcoded Overview and Pressure views, with the metric's real severity zones baked in.",
    parseProps: (raw) => ({
      machineId: machineIdOf(raw),
      metric: GAUGE_STAT_METRICS.includes(str(raw.metric) as (typeof GAUGE_STAT_METRICS)[number]) ? raw.metric : "rpm",
      label: str(raw.label, "Gauge"),
      icon: raw.icon !== undefined ? str(raw.icon) : undefined,
    }),
    settingsFields: [
      { key: "label", kind: "text", label: "Label" },
      { key: "metric", kind: "select", label: "Metric", options: GAUGE_STAT_METRICS.map((k) => ({ value: k, label: k })) },
      { key: "icon", kind: "select", label: "Icon", options: ICON_OPTIONS },
    ],
    pageScope: "both",
    bindsMachine: true,
    defaultArgs: { metric: "rpm", label: "New gauge", icon: "gauge" },
  },
  trend_chart: {
    component: TemplateTrendChart,
    usage:
      '{% trend_chart machine: machine, field: "energyMeter.power", label: "Power draw", unit: "kW" %} — or multi-series: fields: "energyMeter.Ir,energyMeter.Iy,energyMeter.Ib", labels: "Ir,Iy,Ib"',
    description:
      "A live trend line for one machine, over the currently loaded history (respects the time-range picker on machine pages). Single field, or multiple as one combined chart.",
    parseProps: (raw) => ({
      machineId: machineIdOf(raw),
      field: raw.field !== undefined ? str(raw.field) : undefined,
      label: raw.label !== undefined ? str(raw.label) : undefined,
      colorIndex: num(raw.colorIndex),
      fields: raw.fields !== undefined ? str(raw.fields) : undefined,
      labels: raw.labels !== undefined ? str(raw.labels) : undefined,
      unit: raw.unit !== undefined ? str(raw.unit) : undefined,
      yTitle: raw.yTitle !== undefined ? str(raw.yTitle) : undefined,
    }),
    settingsFields: [
      { key: "field", kind: "text", label: "Field path" },
      { key: "label", kind: "text", label: "Label" },
      { key: "fields", kind: "text", label: "Fields (comma-separated, multi-series)" },
      { key: "labels", kind: "text", label: "Labels (comma-separated, multi-series)" },
      { key: "unit", kind: "text", label: "Unit" },
      { key: "yTitle", kind: "text", label: "Y-axis title" },
      { key: "colorIndex", kind: "number", label: "Color index" },
    ],
    pageScope: "both",
    bindsMachine: true,
    defaultArgs: { field: "rpm", label: "New trend" },
  },
  area_chart: {
    component: TemplateTrendChart,
    usage:
      '{% area_chart machine: machine, field: "energyMeter.power", label: "Power draw", unit: "kW" %} — or multi-series: fields: "energyMeter.Ir,energyMeter.Iy,energyMeter.Ib", labels: "Ir,Iy,Ib"',
    description:
      "The same live trend as trend_chart, filled under the line — same history window, same single/multi-series modes.",
    parseProps: (raw) => ({
      machineId: machineIdOf(raw),
      field: raw.field !== undefined ? str(raw.field) : undefined,
      label: raw.label !== undefined ? str(raw.label) : undefined,
      colorIndex: num(raw.colorIndex),
      fields: raw.fields !== undefined ? str(raw.fields) : undefined,
      labels: raw.labels !== undefined ? str(raw.labels) : undefined,
      unit: raw.unit !== undefined ? str(raw.unit) : undefined,
      yTitle: raw.yTitle !== undefined ? str(raw.yTitle) : undefined,
      filled: true,
    }),
    settingsFields: [
      { key: "field", kind: "text", label: "Field path" },
      { key: "label", kind: "text", label: "Label" },
      { key: "fields", kind: "text", label: "Fields (comma-separated, multi-series)" },
      { key: "labels", kind: "text", label: "Labels (comma-separated, multi-series)" },
      { key: "unit", kind: "text", label: "Unit" },
      { key: "yTitle", kind: "text", label: "Y-axis title" },
      { key: "colorIndex", kind: "number", label: "Color index" },
    ],
    pageScope: "both",
    bindsMachine: true,
    defaultArgs: { field: "rpm", label: "New trend" },
  },
  fault_gauge: {
    component: TemplateFaultGauge,
    usage: "{% fault_gauge machine: machine %}",
    description: 'The machine\'s worst active motor fault as a gauge (add faultCode: "..." to pin a specific one).',
    parseProps: (raw) => ({
      machineId: machineIdOf(raw),
      faultCode: raw.faultCode !== undefined ? str(raw.faultCode) : undefined,
    }),
    settingsFields: [{ key: "faultCode", kind: "text", label: "Fault code (optional, pins a specific one)" }],
    pageScope: "both",
    bindsMachine: true,
  },
  status_badge: {
    component: TemplateStatusBadge,
    usage: "{% status_badge machine: machine %}",
    description: "A colored severity pill (Normal/Watch/Critical) for one machine.",
    parseProps: (raw) => ({ machineId: machineIdOf(raw) }),
    pageScope: "both",
    bindsMachine: true,
  },
  machine_card: {
    component: TemplateMachineCard,
    usage: "{% machine_card machine: machine %}",
    description: "The full fleet-overview tile (mini stats, status, link to the machine page) for one machine.",
    parseProps: (raw) => ({ machineId: machineIdOf(raw) }),
    pageScope: "fleet",
    bindsMachine: true,
  },
  fleet_stat: {
    component: TemplateFleetStat,
    usage: '{% fleet_stat metric: "online", label: "Machines online", icon: "cpu" %}',
    description:
      'A fleet-wide aggregate stat, not scoped to one machine. metric: "online" | "activeFaults" | "power" | "avgVibration".',
    parseProps: (raw) => ({
      metric: str(raw.metric, "online"),
      label: str(raw.label),
      unit: raw.unit !== undefined ? str(raw.unit) : undefined,
      decimals: num(raw.decimals),
      icon: raw.icon !== undefined ? str(raw.icon) : undefined,
    }),
    settingsFields: [
      {
        key: "metric",
        kind: "select",
        label: "Metric",
        options: [
          { value: "online", label: "Machines online" },
          { value: "activeFaults", label: "Active fault flags" },
          { value: "power", label: "Fleet power draw" },
          { value: "avgVibration", label: "Avg vibration" },
        ],
      },
      { key: "label", kind: "text", label: "Label" },
      { key: "unit", kind: "text", label: "Unit" },
      { key: "decimals", kind: "number", label: "Decimals" },
      { key: "icon", kind: "select", label: "Icon", options: ICON_OPTIONS },
    ],
    pageScope: "fleet",
    bindsMachine: false,
    defaultArgs: { metric: "online", label: "New stat" },
  },
  fleet_bubble_chart: {
    component: TemplateFleetBubbleChart,
    usage: "{% fleet_bubble_chart %}",
    description:
      "The fleet health map — vibration vs motor temperature, bubble size = power draw, across every machine.",
    parseProps: (raw) => ({
      title: raw.title !== undefined ? str(raw.title) : undefined,
      subtitle: raw.subtitle !== undefined ? str(raw.subtitle) : undefined,
    }),
    settingsFields: [
      { key: "title", kind: "text", label: "Title" },
      { key: "subtitle", kind: "text", label: "Subtitle" },
    ],
    pageScope: "fleet",
    bindsMachine: false,
  },
  plant_map: {
    component: TemplateFleetPlantMap,
    usage: "{% plant_map %}",
    description:
      "The plant floor map — every machine placed on the uploaded floor plan image, colored by live health (worst of fault/vibration/motor-temp), linking to each machine's page.",
    parseProps: (raw) => ({
      title: raw.title !== undefined ? str(raw.title) : undefined,
      subtitle: raw.subtitle !== undefined ? str(raw.subtitle) : undefined,
    }),
    settingsFields: [
      { key: "title", kind: "text", label: "Title" },
      { key: "subtitle", kind: "text", label: "Subtitle" },
    ],
    pageScope: "fleet",
    bindsMachine: false,
  },
  scatter_chart: {
    component: TemplateScatterChart,
    usage:
      '{% scatter_chart machine: machine, xField: "temperature.motor", yField: "imuAcceleration", xLabel: "Motor temp", yLabel: "Vibration", xUnit: "°C", yUnit: "mm/s" %}',
    description: "A live XY scatter of two fields for one machine, one dot per reading, older dots fading.",
    parseProps: (raw) => ({
      machineId: machineIdOf(raw),
      xField: str(raw.xField),
      yField: str(raw.yField),
      xLabel: str(raw.xLabel),
      yLabel: str(raw.yLabel),
      xUnit: raw.xUnit !== undefined ? str(raw.xUnit) : undefined,
      yUnit: raw.yUnit !== undefined ? str(raw.yUnit) : undefined,
      colorIndex: num(raw.colorIndex),
    }),
    settingsFields: [
      { key: "xField", kind: "text", label: "X field path" },
      { key: "yField", kind: "text", label: "Y field path" },
      { key: "xLabel", kind: "text", label: "X label" },
      { key: "yLabel", kind: "text", label: "Y label" },
      { key: "xUnit", kind: "text", label: "X unit" },
      { key: "yUnit", kind: "text", label: "Y unit" },
      { key: "colorIndex", kind: "number", label: "Color index" },
    ],
    pageScope: "both",
    bindsMachine: true,
    defaultArgs: {
      xField: "temperature.motor",
      yField: "imuAcceleration",
      xLabel: "Motor temp",
      yLabel: "Vibration",
    },
  },
  spectrum_chart: {
    component: TemplateSpectrumChart,
    usage: '{% spectrum_chart machine: machine, source: "vibration", unit: "mm/s" %}',
    description: 'A live harmonics bar chart for one machine. source: "vibration" | "acoustic".',
    parseProps: (raw) => ({
      machineId: machineIdOf(raw),
      source: str(raw.source, "vibration") === "acoustic" ? "acoustic" : "vibration",
      unit: str(raw.unit),
      colorIndex: num(raw.colorIndex),
    }),
    settingsFields: [
      {
        key: "source",
        kind: "select",
        label: "Source",
        options: [{ value: "vibration", label: "Vibration" }, { value: "acoustic", label: "Acoustic" }],
      },
      { key: "unit", kind: "text", label: "Unit" },
      { key: "colorIndex", kind: "number", label: "Color index" },
    ],
    pageScope: "both",
    bindsMachine: true,
    defaultArgs: { source: "vibration" },
  },
  bar_chart: {
    component: TemplateBarChart,
    usage: '{% bar_chart machine: machine, fields: "energyMeter.Ir,energyMeter.Iy,energyMeter.Ib", labels: "Ir,Iy,Ib", unit: "A" %}',
    description: "A live bar comparison of several fields for one machine, at the current instant.",
    parseProps: (raw) => ({
      machineId: machineIdOf(raw),
      fields: str(raw.fields),
      labels: raw.labels !== undefined ? str(raw.labels) : undefined,
      unit: raw.unit !== undefined ? str(raw.unit) : undefined,
    }),
    settingsFields: [
      { key: "fields", kind: "text", label: "Fields (comma-separated)" },
      { key: "labels", kind: "text", label: "Labels (comma-separated)" },
      { key: "unit", kind: "text", label: "Unit" },
    ],
    pageScope: "both",
    bindsMachine: true,
    defaultArgs: { fields: "energyMeter.Ir,energyMeter.Iy,energyMeter.Ib", labels: "Ir,Iy,Ib" },
  },
  pie_chart: {
    component: TemplatePieChart,
    usage:
      '{% pie_chart machine: machine, fields: "energyMeter.Ir,energyMeter.Iy,energyMeter.Ib", labels: "Ir,Iy,Ib", unit: "A" %} — add donut: false for a plain pie',
    description:
      "A live proportional breakdown of several fields for one machine — donut by default, or a plain pie with donut: false.",
    parseProps: (raw) => ({
      machineId: machineIdOf(raw),
      fields: str(raw.fields),
      labels: raw.labels !== undefined ? str(raw.labels) : undefined,
      unit: raw.unit !== undefined ? str(raw.unit) : undefined,
      donut: raw.donut === false || raw.donut === "false" ? false : true,
    }),
    settingsFields: [
      { key: "fields", kind: "text", label: "Fields (comma-separated)" },
      { key: "labels", kind: "text", label: "Labels (comma-separated)" },
      { key: "unit", kind: "text", label: "Unit" },
      {
        key: "donut",
        kind: "select",
        label: "Style",
        options: [{ value: "true", label: "Donut" }, { value: "false", label: "Pie" }],
      },
    ],
    pageScope: "both",
    bindsMachine: true,
    defaultArgs: { fields: "energyMeter.Ir,energyMeter.Iy,energyMeter.Ib", labels: "Ir,Iy,Ib" },
  },
  radar_chart: {
    component: TemplateRadarChart,
    usage:
      '{% radar_chart machine: machine, fields: "magnetometer.roll,magnetometer.pitch,magnetometer.yaw", labels: "Roll,Pitch,Yaw", unit: "°" %}',
    description: "A live radar/polar comparison of several same-unit fields for one machine, at the current instant.",
    parseProps: (raw) => ({
      machineId: machineIdOf(raw),
      fields: str(raw.fields),
      labels: raw.labels !== undefined ? str(raw.labels) : undefined,
      unit: raw.unit !== undefined ? str(raw.unit) : undefined,
      colorIndex: num(raw.colorIndex),
    }),
    settingsFields: [
      { key: "fields", kind: "text", label: "Fields (comma-separated)" },
      { key: "labels", kind: "text", label: "Labels (comma-separated)" },
      { key: "unit", kind: "text", label: "Unit" },
      { key: "colorIndex", kind: "number", label: "Color index" },
    ],
    pageScope: "both",
    bindsMachine: true,
    defaultArgs: { fields: "magnetometer.roll,magnetometer.pitch,magnetometer.yaw", labels: "Roll,Pitch,Yaw" },
  },
  fault_gauge_grid: {
    component: TemplateFaultGaugeGrid,
    usage: "{% fault_gauge_grid machine: machine %}",
    description: "Every currently-reported motor fault for one machine, as a grid of gauges (contrast with fault_gauge, which shows only the worst one).",
    parseProps: (raw) => ({ machineId: machineIdOf(raw) }),
    pageScope: "both",
    bindsMachine: true,
  },
  fault_confidence_trend: {
    component: TemplateFaultConfidenceTrend,
    usage: "{% fault_confidence_trend machine: machine %}",
    description: "One trend line per motor-fault class, confidence over time, for one machine.",
    parseProps: (raw) => ({ machineId: machineIdOf(raw) }),
    pageScope: "both",
    bindsMachine: true,
  },
  sensor_health: {
    component: TemplateSensorHealth,
    usage: "{% sensor_health machine: machine %}",
    description: "The on-device diagnostic status (badge + message) for one machine.",
    parseProps: (raw) => ({ machineId: machineIdOf(raw) }),
    pageScope: "both",
    bindsMachine: true,
  },
  maintenance_card: {
    component: TemplateMaintenanceCard,
    usage: '{% maintenance_card machine: machine, metric: "vibration" %} — one of: ' + MAINTENANCE_METRIC_KEYS.join(", "),
    description:
      "One Super Dashboard metric card for one machine — gauge/sparkline/waveform/etc appropriate to the metric, plus its status pill, current/normal readout, location, and recommendation.",
    parseProps: (raw) => ({
      machineId: machineIdOf(raw),
      metric: MAINTENANCE_METRIC_KEYS.includes(str(raw.metric) as (typeof MAINTENANCE_METRIC_KEYS)[number])
        ? raw.metric
        : "vibration",
    }),
    settingsFields: [
      {
        key: "metric",
        kind: "select",
        label: "Metric",
        options: MAINTENANCE_METRIC_KEYS.map((k) => ({ value: k, label: k })),
      },
    ],
    pageScope: "both",
    bindsMachine: true,
    defaultArgs: { metric: "vibration" },
  },
  maintenance_kpi_strip: {
    component: TemplateMaintenanceKpiStrip,
    usage: "{% maintenance_kpi_strip machine: machine %}",
    description:
      "The Super Dashboard's health-summary strip for one machine — overall health %, sensors monitored, healthy/warning/critical counts across its 15 metric cards, and open maintenance alerts.",
    parseProps: (raw) => ({ machineId: machineIdOf(raw) }),
    pageScope: "both",
    bindsMachine: true,
  },
};

export type ElementName = keyof typeof ELEMENT_REGISTRY;
