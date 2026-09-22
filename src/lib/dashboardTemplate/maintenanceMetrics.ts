import type { Telemetry, Severity } from "@/lib/types";
import { resolveTelemetryField } from "@/lib/dashboardTemplate/resolveField";
import { vibrationSeverity, motorTempSeverity, pressureSeverity, worstSeverity, faultSeverity } from "@/lib/constants";

export type MaintenanceMetricKey =
  | "vibration"
  | "temperature"
  | "current"
  | "voltageImbalance"
  | "power"
  | "rpm"
  | "flowPressure"
  | "viscosity"
  | "noise"
  | "leakage"
  | "humidityDust"
  | "plcFaults"
  | "frequency"
  | "alignment"
  | "toolWear";

export const MAINTENANCE_METRIC_KEYS: MaintenanceMetricKey[] = [
  "vibration",
  "temperature",
  "current",
  "voltageImbalance",
  "power",
  "rpm",
  "flowPressure",
  "viscosity",
  "noise",
  "leakage",
  "humidityDust",
  "plcFaults",
  "frequency",
  "alignment",
  "toolWear",
];

export interface MaintenanceMetricMeta {
  title: string;
  iconName: string;
  recommendation: string;
  normal: string;
}

export const MAINTENANCE_METRIC_META: Record<MaintenanceMetricKey, MaintenanceMetricMeta> = {
  vibration: {
    title: "Vibration",
    iconName: "activity",
    recommendation: "Inspect bearings and balance rotor",
    normal: "0–2.5 mm/s RMS",
  },
  temperature: {
    title: "Temperature",
    iconName: "thermometer",
    recommendation: "Check cooling fan and airflow",
    normal: "45–70 °C",
  },
  current: {
    title: "Current (Load)",
    iconName: "zap",
    recommendation: "Review load and motor condition",
    normal: "40–60 A",
  },
  voltageImbalance: {
    title: "Voltage Imbalance",
    iconName: "zap",
    recommendation: "Rebalance phases and inspect connections",
    normal: "< 1.0 %",
  },
  power: {
    title: "Power Consumption Pattern",
    iconName: "zap",
    recommendation: "Check efficiency and load pattern",
    normal: "Baseline comparison unavailable — no baseline sensor",
  },
  rpm: {
    title: "RPM",
    iconName: "gauge",
    recommendation: "Inspect drive coupling if deviation persists",
    normal: "Setpoint ± 2%",
  },
  flowPressure: {
    title: "Flow Rate / Pressure",
    iconName: "droplet",
    recommendation: "Inspect lines, seals, and pump for leakage",
    normal: "5.0 bar (flow sensor unavailable)",
  },
  viscosity: {
    title: "Lubricant Oil Viscosity",
    iconName: "droplet",
    recommendation: "Sample oil and review lubrication",
    normal: "Sensor not installed",
  },
  noise: {
    title: "Noise (Acoustic & Ultrasonic)",
    iconName: "volume",
    recommendation: "Inspect for abnormal friction or leakage",
    normal: "< 75 dB (ultrasonic sensor unavailable)",
  },
  leakage: {
    title: "Leakage Detection",
    iconName: "droplet",
    recommendation: "Repair leak points and verify pressure recovery",
    normal: "Sensor not installed",
  },
  humidityDust: {
    title: "Humidity / Dust",
    iconName: "droplet",
    recommendation: "Improve dust extraction and humidity control",
    normal: "40–60% RH (PM sensor unavailable)",
  },
  plcFaults: {
    title: "Sensor Failures via PLC Code",
    iconName: "cpu",
    recommendation: "Replace faulty sensors and clear PLC faults",
    normal: "0 active fault codes",
  },
  frequency: {
    title: "Frequency Deviation",
    iconName: "activity",
    recommendation: "Verify power stability and drive stress",
    normal: "50.0 Hz",
  },
  alignment: {
    title: "Orientation / Alignment",
    iconName: "alignment",
    recommendation: "Re-align shaft and coupling",
    normal: "< 5.0° offset",
  },
  toolWear: {
    title: "Tool Wear",
    iconName: "wrench",
    recommendation: "Replace worn tool soon",
    normal: "Sensor not installed",
  },
};

export const SEVERITY_COLOR: Record<Severity, string> = {
  good: "var(--status-good)",
  warning: "var(--status-warning)",
  critical: "var(--status-critical)",
};

export interface Point {
  x: number;
  y: number;
}

export interface MaintenanceMetricResult {
  severity: Severity;
  current: string;
  value?: number;
  secondaryValue?: number;
  series?: Point[];
  secondarySeries?: Point[];
  threshold?: number;
  min?: number;
  max?: number;
  gaugeMax?: number;
  setpoint?: number;
  bars?: { label: string; value: number; color: string }[];
  limit?: number;
  faults?: { code: string; description: string }[];
  /** No backing sensor exists in the telemetry payload at all — the whole card is a "no data" state. */
  unavailable?: boolean;
  /** The primary `value`/`series` has no backing sensor, even though the card overall does. */
  valueUnavailable?: boolean;
  /** The `secondaryValue`/`secondarySeries` has no backing sensor, even though the primary does. */
  secondaryUnavailable?: boolean;
}

function seriesOf(history: Telemetry[], field: string): Point[] {
  return history
    .map((t) => {
      const y = resolveTelemetryField(t, field);
      return y === null ? null : { x: t.timestamp, y };
    })
    .filter((p): p is Point => p !== null);
}

function avg(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

/** value >= critical -> critical, >= warning -> warning, else good. */
function highSeverity(value: number, warning: number, critical: number): Severity {
  if (value >= critical) return "critical";
  if (value >= warning) return "warning";
  return "good";
}

function absSeverity(value: number, warning: number, critical: number): Severity {
  return highSeverity(Math.abs(value), warning, critical);
}

export interface MaintenanceMetricContext {
  machineId: string;
  latest: Telemetry | null;
  history: Telemetry[];
  ratedRpm: number;
  now: number;
}

export function resolveMaintenanceMetric(key: MaintenanceMetricKey, ctx: MaintenanceMetricContext): MaintenanceMetricResult {
  const { latest, history, ratedRpm } = ctx;

  switch (key) {
    case "vibration": {
      const value = latest?.imuAcceleration ?? 0;
      return {
        severity: vibrationSeverity(value),
        current: `${value.toFixed(1)} mm/s RMS`,
        value,
        series: seriesOf(history, "imuAcceleration"),
        min: 0,
        max: 12,
        threshold: 4.5,
      };
    }
    case "temperature": {
      const value = latest?.temperature.motor ?? 0;
      return {
        severity: motorTempSeverity(value),
        current: `${value.toFixed(0)} °C`,
        value,
        series: seriesOf(history, "temperature.motor"),
        min: 0,
        max: 100,
        threshold: 70,
      };
    }
    case "current": {
      const latestAvg = latest ? avg([latest.energyMeter.Ir, latest.energyMeter.Iy, latest.energyMeter.Ib]) : 0;
      const load = latest?.energyMeter.machineLoad ?? 0;
      const series = history.map((t) => ({ x: t.timestamp, y: avg([t.energyMeter.Ir, t.energyMeter.Iy, t.energyMeter.Ib]) }));
      return {
        severity: highSeverity(load, 80, 97),
        current: `${latestAvg.toFixed(0)} A at ${load.toFixed(0)}% load`,
        value: latestAvg,
        secondaryValue: load,
        series,
        min: 0,
        max: 100,
        threshold: 60,
      };
    }
    case "voltageImbalance": {
      const imbalance = latest?.energyMeter.voltageImbalance ?? 0;
      const bars = latest
        ? [
            { label: "L1", value: latest.energyMeter.Vr, color: "var(--series-8)" },
            { label: "L2", value: latest.energyMeter.Vy, color: "var(--series-1)" },
            { label: "L3", value: latest.energyMeter.Vb, color: "var(--series-3)" },
          ]
        : [];
      return {
        severity: highSeverity(imbalance, 0.5, 1.0),
        current: `${imbalance.toFixed(1)}%`,
        value: imbalance,
        bars,
        min: 200,
        max: 260,
        limit: 230,
      };
    }
    case "power": {
      const actual = latest?.energyMeter.power ?? 0;
      return {
        // No baseline sensor/model exists yet to compare against, so severity can't be assessed.
        severity: "good",
        current: `${actual.toFixed(1)} kW`,
        value: actual,
        series: seriesOf(history, "energyMeter.power"),
        secondaryUnavailable: true,
      };
    }
    case "rpm": {
      const value = latest?.rpm ?? 0;
      const setpoint = ratedRpm || 1500;
      const deviation = Math.abs(value - setpoint) / setpoint;
      return {
        severity: highSeverity(deviation, 0.05, 0.2),
        current: `${value.toFixed(0)} RPM`,
        value,
        setpoint,
        min: 0,
        max: Math.max(2500, Math.round((setpoint * 1.6) / 100) * 100),
      };
    }
    case "flowPressure": {
      const pressure = latest?.pressure ?? 0;
      return {
        severity: pressureSeverity(pressure),
        current: `${pressure.toFixed(1)} bar`,
        secondaryValue: pressure,
        valueUnavailable: true,
      };
    }
    case "viscosity": {
      return {
        severity: "good",
        current: "No sensor data",
        unavailable: true,
        min: 10,
        max: 70,
      };
    }
    case "noise": {
      const acoustic = latest?.microphone.soundLevel ?? 0;
      return {
        severity: highSeverity(acoustic, 75, 100),
        current: `${acoustic.toFixed(0)} dB`,
        value: acoustic,
        secondaryUnavailable: true,
      };
    }
    case "leakage": {
      return {
        severity: "good",
        current: "No sensor data",
        unavailable: true,
      };
    }
    case "humidityDust": {
      const humidity = latest?.humidity ?? 0;
      const humiditySeverity = humidity < 40 || humidity > 60 ? "warning" : "good";
      return {
        severity: humiditySeverity,
        current: `${humidity.toFixed(0)}% RH`,
        value: humidity,
        max: 200,
        secondaryUnavailable: true,
      };
    }
    case "plcFaults": {
      const active = (latest?.motorFaults ?? []).filter((f) => f.active);
      const severity = active.length === 0 ? "good" : worstSeverity(active.map((f) => faultSeverity(f.confidence)));
      return {
        severity,
        current: `${active.length} failed sensor${active.length === 1 ? "" : "s"}`,
        faults: active.slice(0, 3).map((f) => ({ code: f.fault_code, description: f.description })),
      };
    }
    case "frequency": {
      const value = latest?.energyMeter.frequency ?? 50;
      const deviation = latest?.energyMeter.frequencyDeviation ?? 0;
      return {
        severity: absSeverity(deviation, 0.3, 1.0),
        current: `${value.toFixed(1)} Hz`,
        value,
        series: seriesOf(history, "energyMeter.frequency"),
        min: 48,
        max: 51,
        threshold: 50,
      };
    }
    case "alignment": {
      // No dedicated alignment sensor exists — derived as the magnetometer's angular
      // deviation from level (vector magnitude of roll/pitch/yaw), the closest real signal.
      const m = latest?.magnetometer;
      const offsetDeg = m ? Math.sqrt(m.roll ** 2 + m.pitch ** 2 + m.yaw ** 2) : 0;
      return {
        severity: highSeverity(offsetDeg, 5, 15),
        current: `${offsetDeg.toFixed(1)}° offset`,
        value: offsetDeg,
        limit: 5,
      };
    }
    case "toolWear": {
      return {
        severity: "good",
        current: "No sensor data",
        unavailable: true,
        max: 0.4,
      };
    }
  }
}
