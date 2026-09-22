import type { MachineViewKey } from "@/lib/types";

/** "super" (the Super Dashboard overlay) can have a default/saved template like any of
 *  the 6 machine tabs below, but is deliberately not a MachineViewKey itself — it's
 *  not a nav tab. Defined here (not useDashboardTemplateDraft.ts, which imports the
 *  DEFAULT_* constants from this file) so the two files don't import each other. */
export type MachineTemplateView = MachineViewKey | "super";

/** The fleet-level Overview default — verbatim translation of the hardcoded Plant
 *  Overview (frontend/src/app/(tenant)/[company]/page.tsx's DefaultOverview). */
export const DEFAULT_FLEET_TEMPLATE = `<div class="flex flex-col gap-6">
  <div>
    <h1 class="text-lg font-semibold text-primary">Plant Overview</h1>
  </div>

  <div class="grid grid-cols-2 gap-3">
    {% fleet_stat metric: "online", label: "Machines online", icon: "cpu" %}
    {% fleet_stat metric: "criticalMachines", label: "Machines critical", icon: "alert-triangle" %}
  </div>

  {% fleet_bubble_chart %}

  {% plant_map %}

  <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
    {% for machine in machines %}
      {% machine_card machine: machine %}
    {% endfor %}
  </div>
</div>
`;

/** Verbatim translations of the 6 hardcoded machine-view components
 *  (frontend/src/components/views/*View.tsx) — one default per MACHINE_VIEWS tab. */
export const DEFAULT_MACHINE_TEMPLATES: Record<MachineTemplateView, string> = {
  overview: `<div class="flex flex-col gap-6">
  <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
    {% gauge_stat_card machine: machine, metric: "rpm", label: "RPM", icon: "gauge" %}
    {% gauge_stat_card machine: machine, metric: "vibration", label: "Vibration", icon: "activity" %}
    {% gauge_stat_card machine: machine, metric: "motorTemp", label: "Motor temp", icon: "thermometer" %}
    {% gauge_stat_card machine: machine, metric: "machineLoad", label: "Machine load", icon: "zap" %}
    {% stat_card machine: machine, field: "energyMeter.power", label: "Power", unit: "kW", icon: "zap" %}
    {% gauge_stat_card machine: machine, metric: "humidity", label: "Humidity", icon: "droplet" %}
  </div>

  <div class="rounded-xl border border-hairline bg-surface p-4 sm:p-5">
    <div class="mb-3">
      <h2 class="text-sm font-semibold text-primary">Motor fault indicators</h2>
      <p class="mt-0.5 text-xs text-muted">Model confidence per fault class</p>
    </div>
    {% fault_gauge_grid machine: machine %}
  </div>

  <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
    <div class="rounded-xl border border-hairline bg-surface p-4 sm:p-5">
      <div class="mb-3">
        <h2 class="text-sm font-semibold text-primary">Vibration trend</h2>
        <p class="mt-0.5 text-xs text-muted">IMU acceleration (mm/sec)</p>
      </div>
      {% trend_chart machine: machine, field: "imuAcceleration", label: "Vibration", unit: "mm/s", colorIndex: 0 %}
    </div>
    <div class="rounded-xl border border-hairline bg-surface p-4 sm:p-5">
      <div class="mb-3">
        <h2 class="text-sm font-semibold text-primary">Power draw</h2>
        <p class="mt-0.5 text-xs text-muted">Instantaneous power (kW)</p>
      </div>
      {% trend_chart machine: machine, field: "energyMeter.power", label: "Power", unit: "kW", colorIndex: 1 %}
    </div>
  </div>

  <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
    {% stat_card machine: machine, field: "temperature.compressor", label: "Compressor temp", unit: "°C", decimals: 0 %}
    {% stat_card machine: machine, field: "runtime.machineRunHours", label: "Runtime", format: "hours", hint: "since commissioning" %}
    {% stat_card machine: machine, field: "runtime.remainingHours", label: "Next maintenance", format: "hours" %}
  </div>
</div>
`,

  vibration: `<div class="flex flex-col gap-6">
  <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
    {% stat_card machine: machine, field: "imuAcceleration", label: "Overall vibration", unit: "mm/sec", decimals: 2, severityFrom: "vibration", icon: "activity" %}
    {% stat_card machine: machine, field: "rpm", label: "Rotational speed", unit: "RPM", decimals: 0, icon: "gauge" %}
    {% stat_card machine: machine, field: "vibration.harmonics.0.frequency", label: "Dominant frequency", unit: "Hz" %}
    {% stat_card machine: machine, field: "vibration.harmonics.0.amplitude", label: "Dominant amplitude", unit: "mm/sec", decimals: 2 %}
  </div>

  <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
    <div class="rounded-xl border border-hairline bg-surface p-4 sm:p-5">
      <div class="mb-3">
        <h2 class="text-sm font-semibold text-primary">Vibration spectrum</h2>
        <p class="mt-0.5 text-xs text-muted">Five dominant frequency components</p>
      </div>
      {% spectrum_chart machine: machine, source: "vibration", unit: "mm/s" %}
    </div>
    <div class="rounded-xl border border-hairline bg-surface p-4 sm:p-5">
      <div class="mb-3">
        <h2 class="text-sm font-semibold text-primary">Vibration trend</h2>
        <p class="mt-0.5 text-xs text-muted">Overall acceleration over time</p>
      </div>
      {% trend_chart machine: machine, field: "imuAcceleration", label: "IMU acceleration", unit: "mm/s", colorIndex: 0 %}
    </div>
  </div>

  <div class="rounded-xl border border-hairline bg-surface p-4 sm:p-5">
    <div class="mb-3">
      <h2 class="text-sm font-semibold text-primary">Vibration vs motor temperature</h2>
      <p class="mt-0.5 text-xs text-muted">Each dot is one reading — a cluster drifting up-right signals a developing fault</p>
    </div>
    {% scatter_chart machine: machine, xField: "temperature.motor", yField: "imuAcceleration", xLabel: "Motor temp", yLabel: "Vibration", xUnit: "°C", yUnit: "mm/s", colorIndex: 3 %}
  </div>

  <div class="rounded-xl border border-hairline bg-surface p-4 sm:p-5">
    <div class="mb-3">
      <h2 class="text-sm font-semibold text-primary">Rotational speed trend</h2>
      <p class="mt-0.5 text-xs text-muted">Derived from IMU tachometer (RPM)</p>
    </div>
    {% trend_chart machine: machine, field: "rpm", label: "RPM", colorIndex: 2 %}
  </div>

  <div class="rounded-xl border border-hairline bg-surface p-4 sm:p-5">
    <div class="mb-3">
      <h2 class="text-sm font-semibold text-primary">Mounting orientation</h2>
      <p class="mt-0.5 text-xs text-muted">IMU magnetometer roll / pitch / yaw</p>
    </div>
    {% trend_chart machine: machine, fields: "magnetometer.roll,magnetometer.pitch,magnetometer.yaw", labels: "Roll,Pitch,Yaw", unit: "°", yTitle: "degrees" %}
  </div>
</div>
`,

  faults: `<div class="flex flex-col gap-6">
  <div class="rounded-xl border border-hairline bg-surface p-4 sm:p-5">
    <div class="mb-3 flex items-start justify-between gap-3">
      <div>
        <h2 class="text-sm font-semibold text-primary">Fault model output</h2>
        <p class="mt-0.5 text-xs text-muted">Confidence per fault class from the onboard diagnostic model</p>
      </div>
      {% status_badge machine: machine %}
    </div>
    {% fault_gauge_grid machine: machine %}
  </div>

  <div class="rounded-xl border border-hairline bg-surface p-4 sm:p-5">
    <div class="mb-3">
      <h2 class="text-sm font-semibold text-primary">Confidence trend</h2>
      <p class="mt-0.5 text-xs text-muted">All fault classes over time</p>
    </div>
    {% fault_confidence_trend machine: machine %}
  </div>
</div>
`,

  energy: `<div class="flex flex-col gap-6">
  <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
    {% stat_card machine: machine, field: "energyMeter.power", label: "Power", unit: "kW", icon: "zap" %}
    {% stat_card machine: machine, field: "energyMeter.energy", label: "Energy", unit: "kWh", decimals: 0, hint: "cumulative" %}
    {% stat_card machine: machine, field: "energyMeter.machineLoad", label: "Machine load", unit: "%", decimals: 0 %}
    {% stat_card machine: machine, field: "energyMeter.averagePowerFactor", label: "Avg power factor", unit: "pf", decimals: 2 %}
    {% stat_card machine: machine, field: "energyMeter.frequency", label: "Frequency", unit: "Hz", decimals: 2 %}
    {% stat_card machine: machine, field: "energyMeter.voltageImbalance", label: "Voltage imbalance", unit: "%", decimals: 2, severityFrom: "voltageImbalance" %}
  </div>

  <div class="rounded-xl border border-hairline bg-surface p-4 sm:p-5">
    <div class="mb-3">
      <h2 class="text-sm font-semibold text-primary">Line currents</h2>
      <p class="mt-0.5 text-xs text-muted">Ir / Iy / Ib (Ampere)</p>
    </div>
    {% trend_chart machine: machine, fields: "energyMeter.Ir,energyMeter.Iy,energyMeter.Ib", labels: "Ir,Iy,Ib", unit: "A", yTitle: "Ampere" %}
  </div>

  <div class="rounded-xl border border-hairline bg-surface p-4 sm:p-5">
    <div class="mb-3">
      <h2 class="text-sm font-semibold text-primary">Line voltages</h2>
      <p class="mt-0.5 text-xs text-muted">Vr / Vy / Vb (Volt)</p>
    </div>
    {% trend_chart machine: machine, fields: "energyMeter.Vr,energyMeter.Vy,energyMeter.Vb", labels: "Vr,Vy,Vb", unit: "V", yTitle: "Volt" %}
  </div>

  <div class="rounded-xl border border-hairline bg-surface p-4 sm:p-5">
    <div class="mb-3">
      <h2 class="text-sm font-semibold text-primary">Voltage THD</h2>
      <p class="mt-0.5 text-xs text-muted">Total harmonic distortion per phase (%)</p>
    </div>
    {% trend_chart machine: machine, fields: "energyMeter.thdVr,energyMeter.thdVy,energyMeter.thdVb", labels: "%THD Vr,%THD Vy,%THD Vb", unit: "%", yTitle: "Percentage" %}
  </div>
</div>
`,

  environment: `<div class="flex flex-col gap-6">
  <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
    {% stat_card machine: machine, field: "temperature.motor", label: "Motor temp", unit: "°C", decimals: 1, severityFrom: "motorTemp", icon: "thermometer" %}
    {% stat_card machine: machine, field: "temperature.compressor", label: "Compressor temp", unit: "°C", decimals: 1, icon: "thermometer" %}
    {% stat_card machine: machine, field: "humidity", label: "Humidity", unit: "%RH", decimals: 0, icon: "droplet" %}
  </div>

  {% sensor_health machine: machine %}

  <div class="rounded-xl border border-hairline bg-surface p-4 sm:p-5">
    <div class="mb-3">
      <h2 class="text-sm font-semibold text-primary">Temperature trend</h2>
      <p class="mt-0.5 text-xs text-muted">Motor and compressor (°C)</p>
    </div>
    {% trend_chart machine: machine, fields: "temperature.motor,temperature.compressor", labels: "Motor,Compressor", unit: "°C", yTitle: "degree Celsius" %}
  </div>

  <div class="rounded-xl border border-hairline bg-surface p-4 sm:p-5">
    <div class="mb-3">
      <h2 class="text-sm font-semibold text-primary">Relative humidity</h2>
      <p class="mt-0.5 text-xs text-muted">%RH over time</p>
    </div>
    {% trend_chart machine: machine, field: "humidity", label: "Humidity", unit: "%RH", colorIndex: 2, yTitle: "%RH" %}
  </div>
</div>
`,

  pressure: `<div class="flex flex-col gap-6">
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
    {% gauge_stat_card machine: machine, metric: "pressure", label: "Pressure", icon: "gauge" %}
    {% stat_card machine: machine, field: "pressure", label: "Pressure", unit: "Bar", decimals: 2, severityFrom: "pressure", icon: "gauge", hint: "Normal 2-7 Bar · alert above 7.5 Bar" %}
  </div>

  <div class="rounded-xl border border-hairline bg-surface p-4 sm:p-5">
    <div class="mb-3">
      <h2 class="text-sm font-semibold text-primary">Pressure trend</h2>
      <p class="mt-0.5 text-xs text-muted">Bar over time</p>
    </div>
    {% trend_chart machine: machine, field: "pressure", label: "Pressure", unit: "Bar", yTitle: "Bar" %}
  </div>
</div>
`,

  acoustic: `<div class="flex flex-col gap-6">
  <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
    {% stat_card machine: machine, field: "microphone.soundLevel", label: "Sound level", unit: "dB", decimals: 1, severityFrom: "soundLevel", icon: "volume" %}
    {% stat_card machine: machine, field: "microphone.harmonics.0.frequency", label: "Dominant frequency", unit: "Hz", decimals: 1 %}
    {% stat_card machine: machine, field: "microphone.harmonics.0.amplitude", label: "Dominant amplitude", unit: "dB", decimals: 1 %}
    <div class="flex flex-col gap-2 rounded-xl border border-hairline bg-surface p-4">
      <div class="flex items-center justify-between">
        <span class="text-xs font-medium uppercase tracking-wide text-muted">Harmonics tracked</span>
      </div>
      <div class="flex items-baseline gap-1.5">
        <span class="text-2xl font-semibold tabular-nums text-primary">5</span>
      </div>
    </div>
  </div>

  <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
    <div class="rounded-xl border border-hairline bg-surface p-4 sm:p-5">
      <div class="mb-3">
        <h2 class="text-sm font-semibold text-primary">Acoustic spectrum</h2>
        <p class="mt-0.5 text-xs text-muted">Five dominant frequency components</p>
      </div>
      {% spectrum_chart machine: machine, source: "acoustic", unit: "dB", colorIndex: 4 %}
    </div>
    <div class="rounded-xl border border-hairline bg-surface p-4 sm:p-5">
      <div class="mb-3">
        <h2 class="text-sm font-semibold text-primary">Sound level trend</h2>
        <p class="mt-0.5 text-xs text-muted">Overall SPL over time</p>
      </div>
      {% trend_chart machine: machine, field: "microphone.soundLevel", label: "Sound level", unit: "dB", colorIndex: 4 %}
    </div>
  </div>
</div>
`,

  // "Super Dashboard" fullscreen overlay (frontend/src/components/SuperDashboard.tsx) —
  // no legacy hardcoded fallback component to preserve, so this is the only content it
  // ever renders (saved custom template, or this). Full-bleed by design: no max-w
  // wrapper. The 15-card grid caps at 3 columns (lg:grid-cols-3, nothing wider) even on
  // very wide/high-res screens — a wider grid used to go up to 5 per row, which read as
  // too dense; capped here by request. Mirrors the client-provided "Integrated
  // Maintenance Dashboard" mockup: a machine-scoped KPI strip (maintenance_kpi_strip)
  // followed by all 15 curated metric cards (maintenance_card) — see
  // lib/dashboardTemplate/maintenanceMetrics.ts for what each card shows and where its
  // data comes from. Add/remove cards via the editor if a given screen has room to spare.
  super: `<div class="flex flex-col gap-4">
  {% maintenance_kpi_strip machine: machine %}

  <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
    {% maintenance_card machine: machine, metric: "vibration" %}
    {% maintenance_card machine: machine, metric: "temperature" %}
    {% maintenance_card machine: machine, metric: "current" %}
    {% maintenance_card machine: machine, metric: "voltageImbalance" %}
    {% maintenance_card machine: machine, metric: "power" %}
    {% maintenance_card machine: machine, metric: "rpm" %}
    {% maintenance_card machine: machine, metric: "flowPressure" %}
    {% maintenance_card machine: machine, metric: "viscosity" %}
    {% maintenance_card machine: machine, metric: "noise" %}
    {% maintenance_card machine: machine, metric: "leakage" %}
    {% maintenance_card machine: machine, metric: "humidityDust" %}
    {% maintenance_card machine: machine, metric: "plcFaults" %}
    {% maintenance_card machine: machine, metric: "frequency" %}
    {% maintenance_card machine: machine, metric: "alignment" %}
    {% maintenance_card machine: machine, metric: "toolWear" %}
  </div>
</div>
`,
};
