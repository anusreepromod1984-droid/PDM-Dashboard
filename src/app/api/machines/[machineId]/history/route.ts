import { NextRequest, NextResponse } from "next/server";
import { getFaultState } from "@/lib/faultStore";
import { INJECTED_REMAINING_HOURS } from "@/lib/injectedRul";

const FASTAPI_URL = process.env.BACKEND_INTERNAL_URL || process.env.BACKEND_FASTAPI_URL || (process.env.NODE_ENV === "production" ? "https://predictivemaintenance-production-e27a.up.railway.app" : "http://localhost:8004");

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ machineId: string }> }
) {
  const { machineId } = await params;
  const faultState = getFaultState(machineId);

  try {
    if (faultState.scenario === "nominal") {
      try {
        const historyRes = await fetch(
          `${FASTAPI_URL}/api/v1/assets/${encodeURIComponent(machineId)}/history?limit=600`,
          { cache: "no-store", signal: AbortSignal.timeout(2000) }
        );
        if (historyRes.ok) {
          const hist = await historyRes.json();
          if (Array.isArray(hist?.rows) && hist.rows.length > 0) {
            return NextResponse.json(hist);
          }
        }
      } catch {}
    }

    let t: any = {};
    try {
      const telemRes = await fetch(`${FASTAPI_URL}/api/v1/assets/${encodeURIComponent(machineId)}/telemetry`, {
        cache: "no-store",
        signal: AbortSignal.timeout(2000),
      });
      if (telemRes.ok) {
        t = await telemRes.json();
      }
    } catch {}

    const now = Date.now();
    const rows = [];
    let baseVib = t.imuAcceleration ?? 0.12;
    let baseMotor = t.tempMotor ?? 28.9;
    const healthyMotor = baseMotor;
    let baseComp = t.tempCompressor ?? 28.6;
    let harmonics = t.vibrationHarmonics || [];
    let motorFaults: any[] = [];
    let vr = t.emVr ?? 400;
    let vy = t.emVy ?? 400;
    let vb = t.emVb ?? 400;
    let vuf = t.emVoltageImbalance ?? 0;

    const rpm = t.rpm > 0 ? t.rpm : 1480;
    const f1 = +(rpm / 60).toFixed(1);
    const overlayRunningElec = faultState.scenario === "cable_cut"
      || ((faultState.scenario === "misalignment" || faultState.scenario === "bearing_bpfi" || faultState.scenario === "voltage_unbalance") && (t.emPower ?? 0) < 0.5);

    // Apply active fault injection scenario
    const healthyVib = baseVib;
    if (faultState.scenario === "cable_cut") {
      baseVib = 0.0;
      motorFaults = [{
        fault_code: "HARDWARE_CABLE_FAULT",
        description: "Sensor cable disconnect (0.0 mm/s while motor running)",
        confidence: 1.0,
        active: true,
      }];
    } else if (faultState.scenario === "misalignment") {
      baseVib = 6.2;
      harmonics = [
        { frequency: f1, amplitude: -22.0 },
        { frequency: +(2 * f1).toFixed(1), amplitude: -2.0 },
        { frequency: +(3 * f1).toFixed(1), amplitude: -22.5 },
      ];
      motorFaults = [{ fault_code: "MISALIGNMENT", description: "Shaft Angular Misalignment (2X)", confidence: 0.94, active: true }];
    } else if (faultState.scenario === "bearing_bpfi") {
      baseVib = 8.5;
      baseMotor = 74.0;
      harmonics = [
        { frequency: f1, amplitude: -18.0 },
        { frequency: +(5.43 * f1).toFixed(1), amplitude: -4.0 }, // SKF 6208 BPFI
      ];
      motorFaults = [{ fault_code: "BEARING_BPFI", description: "Bearing Inner Race Flaw (BPFI)", confidence: 0.96, active: true }];
    } else if (faultState.scenario === "voltage_unbalance") {
      baseVib = 1.8;
      vr = 432.0;
      vy = 368.0;
      vb = 401.0;
      vuf = 4.8;
      baseMotor = 66.5;
      motorFaults = [{ fault_code: "VOLTAGE_UNBALANCE", description: "Phase Voltage Unbalance (>3%)", confidence: 0.92, active: true }];
    }

    const steppedInject = faultState.scenario === "cable_cut"
      || faultState.scenario === "misalignment"
      || faultState.scenario === "bearing_bpfi";

    // Generate 30 points of baseline historical context
    for (let i = 25; i >= 0; i--) {
      const preInjectVib = steppedInject ? healthyVib : baseVib;
      rows.push({
        machineId,
        timestamp: now - i * 4000,
        imuAcceleration: i === 0
          ? baseVib
          : Math.max(0.0, +(
              preInjectVib
              + (preInjectVib > 0 ? Math.sin(i * 0.3) * 0.04 : 0)
            ).toFixed(2)),
        rpm,
        vibration: { harmonics },
        motorFaults,
        temperature: {
          motor: +(
            (i === 0 ? baseMotor : (faultState.scenario === "bearing_bpfi" || faultState.scenario === "voltage_unbalance" ? healthyMotor : baseMotor))
            + Math.sin(i * 0.2) * 0.2
          ).toFixed(1),
          compressor: +(baseComp + Math.cos(i * 0.2) * 0.1).toFixed(1),
        },
        energyMeter: {
          Ir: overlayRunningElec && (faultState.scenario === "cable_cut" || i === 0) ? 14.5 : (t.emIr ?? 0),
          Iy: overlayRunningElec && (faultState.scenario === "cable_cut" || i === 0) ? 14.2 : (t.emIy ?? 0),
          Ib: overlayRunningElec && (faultState.scenario === "cable_cut" || i === 0) ? 14.4 : (t.emIb ?? 0),
          machineLoad: overlayRunningElec && (faultState.scenario === "cable_cut" || i === 0) ? 42 : (t.emMachineLoad ?? 0),
          Vr: vr,
          Vy: vy,
          Vb: vb,
          voltageImbalance: vuf,
          power: overlayRunningElec && (faultState.scenario === "cable_cut" || i === 0) ? 8.6 : (t.emPower ?? 0),
          energy: t.emEnergy ?? 0,
          averagePowerFactor: t.emPowerFactor ?? 0.92,
          thdVr: t.emThdVr ?? 1.8,
          thdVy: t.emThdVy ?? 1.5,
          thdVb: t.emThdVb ?? 1.5,
          frequency: t.emFrequency ?? 50,
          frequencyDeviation: 0,
        },
        pressure: t.pressure ?? 6.43,
        microphone: { soundLevel: t.soundLevel ?? 6.28, harmonics: [] },
        humidity: t.humidity ?? 52.7,
        sensorStatus: {
          ok: faultState.scenario !== "cable_cut",
          message: faultState.scenario === "cable_cut" ? "Sensor cable disconnect" : "",
        },
        magnetometer: { roll: 0, pitch: 0, yaw: 0 },
        runtime: {
          machineRunHours: t.runHours ?? 46.5,
          remainingHours: INJECTED_REMAINING_HOURS[faultState.scenario] ?? t.remainingHours ?? 4745.7,
        },
      });
    }

    return NextResponse.json({ rows });
  } catch (err: any) {
    return NextResponse.json({ rows: [] });
  }
}
