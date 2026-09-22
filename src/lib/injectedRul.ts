import type { FaultScenario } from "@/lib/faultStore";
import { formatHours } from "@/lib/format";
import type { MotorFault, Severity, Telemetry } from "@/lib/types";

/** Injected-demo remaining life. Nominal keeps the live Gamma RUL. */
export const INJECTED_REMAINING_HOURS: Record<FaultScenario, number | null> = {
  nominal: null,
  cable_cut: 0,
  bearing_bpfi: 159,
  misalignment: 528,
  voltage_unbalance: 4486,
};

export const INJECTED_MAINTENANCE_HINT: Record<FaultScenario, string> = {
  nominal: "Gamma remaining life — leak inspect window when PF001 is active",
  cable_cut: "Inspect cable — do not wait for a planned window",
  bearing_bpfi: "Inner-race BPFI — replace the bearing this week",
  misalignment: "2X misalignment — plan coupling / alignment within the window",
  voltage_unbalance: "Phase unbalance — correct supply before winding damage",
};

function withField(fields: string[], key: string): string[] {
  return fields.includes(key) ? fields : [...fields, key];
}

function runningElectrics(telemetry: Telemetry): Telemetry["energyMeter"] {
  const em = telemetry.energyMeter;
  if ((em.power ?? 0) >= 0.5) return em;
  return {
    ...em,
    Ir: 14.5,
    Iy: 14.2,
    Ib: 14.4,
    power: 8.6,
    machineLoad: 42,
  };
}

function scenarioFault(code: string, description: string, confidence: number): MotorFault {
  return { fault_code: code, description, confidence, active: true };
}

/**
 * Overlay the live-test scenario onto a telemetry frame so gauges, charts, and
 * RUL match the button the operator pressed. Live MQTT PF001 must not leak through.
 */
export function applyFaultPrognostics(
  telemetry: Telemetry | null,
  scenario: FaultScenario,
): Telemetry | null {
  if (!telemetry || scenario === "nominal") return telemetry;
  const hours = INJECTED_REMAINING_HOURS[scenario] ?? telemetry.runtime.remainingHours;
  const rpm = telemetry.rpm > 0 ? telemetry.rpm : 1480;
  const f1 = +(rpm / 60).toFixed(1);
  const base: Telemetry = {
    ...telemetry,
    rpm,
    availableFields: withField(
      withField(withField(telemetry.availableFields, "remainingHours"), "imuAcceleration"),
      "rpm",
    ),
    runtime: { ...telemetry.runtime, remainingHours: hours },
  };

  if (scenario === "cable_cut") {
    return {
      ...base,
      imuAcceleration: 0,
      vibration: { harmonics: [] },
      energyMeter: runningElectrics(base),
      motorFaults: [scenarioFault("HARDWARE_CABLE_FAULT", "Sensor cable disconnect (0.0 mm/s while motor running)", 1)],
      sensorStatus: { ok: false, message: INJECTED_MAINTENANCE_HINT.cable_cut },
    };
  }

  if (scenario === "misalignment") {
    return {
      ...base,
      imuAcceleration: 6.2,
      xAxisVibration: 6.2,
      yAxisVibration: 6.2,
      zAxisVibration: 6.2,
      vibration: {
        harmonics: [
          { frequency: f1, amplitude: -22.0 },
          { frequency: +(2 * f1).toFixed(1), amplitude: -2.0 },
        ],
      },
      energyMeter: runningElectrics(base),
      motorFaults: [scenarioFault("MF002", "Shaft Angular Misalignment (2X)", 0.94)],
      sensorStatus: { ok: true, message: INJECTED_MAINTENANCE_HINT.misalignment },
    };
  }

  if (scenario === "bearing_bpfi") {
    return {
      ...base,
      imuAcceleration: 8.5,
      xAxisVibration: 8.5,
      yAxisVibration: 8.5,
      zAxisVibration: 8.5,
      temperature: { ...base.temperature, motor: 74 },
      vibration: {
        harmonics: [
          { frequency: f1, amplitude: -18.0 },
          { frequency: +(5.43 * f1).toFixed(1), amplitude: -4.0 },
        ],
      },
      energyMeter: runningElectrics(base),
      motorFaults: [scenarioFault("BPFI", "Bearing Inner Race Flaw (BPFI)", 0.96)],
      sensorStatus: { ok: true, message: INJECTED_MAINTENANCE_HINT.bearing_bpfi },
    };
  }

  if (scenario === "voltage_unbalance") {
    return {
      ...base,
      imuAcceleration: 1.8,
      temperature: { ...base.temperature, motor: Math.max(base.temperature.motor, 66.5) },
      vibration: { harmonics: [] },
      energyMeter: {
        ...runningElectrics(base),
        Vr: 432,
        Vy: 368,
        Vb: 401,
        voltageImbalance: 4.8,
        Ir: 14.5,
        Iy: 13.1,
        Ib: 14.0,
        power: 8.6,
        machineLoad: 42,
      },
      motorFaults: [scenarioFault("EF001", "3-Phase Voltage Unbalance (VUF 4.8%)", 0.93)],
      sensorStatus: { ok: true, message: INJECTED_MAINTENANCE_HINT.voltage_unbalance },
    };
  }

  return base;
}

export function nextMaintenanceDisplay(
  hours: number | undefined | null,
  scenario: FaultScenario,
  hasRemainingHours: boolean,
): { value: string; hint: string; severity?: Severity } {
  if (scenario === "cable_cut" || hours === 0) {
    return {
      value: "Immediate",
      hint: INJECTED_MAINTENANCE_HINT.cable_cut,
      severity: "critical",
    };
  }
  if (!hasRemainingHours || hours === undefined || hours === null || Number.isNaN(hours)) {
    return { value: "N/A", hint: "Awaiting a valid prognostic input" };
  }
  return {
    value: formatHours(hours),
    hint: INJECTED_MAINTENANCE_HINT[scenario],
    severity: hours < 24 * 14 ? "warning" : undefined,
  };
}
