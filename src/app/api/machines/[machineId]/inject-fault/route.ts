import { NextRequest, NextResponse } from "next/server";
import { getFaultState, setFaultState, FaultScenario } from "@/lib/faultStore";

const FASTAPI_URL =
  process.env.BACKEND_INTERNAL_URL ||
  process.env.BACKEND_FASTAPI_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://predictivemaintenance-production-e27a.up.railway.app"
    : "http://localhost:8004");

const FAULT_ALERT_PAYLOADS: Record<
  Exclude<FaultScenario, "nominal">,
  { severity: string; defect_code: string; defect_name: string }
> = {
  cable_cut: {
    severity: "SEVERE",
    defect_code: "SENSOR_FROZEN_FLATLINE",
    defect_name: "tempCompressor frozen/flatline across consecutive running samples",
  },
  misalignment: {
    severity: "WARNING",
    defect_code: "MF002",
    defect_name: "Angular Misalignment (2X Harmonic Spike)",
  },
  bearing_bpfi: {
    severity: "CRITICAL",
    defect_code: "BPFI",
    defect_name: "Bearing Inner Race Spalling (BPFI at 109.4 Hz)",
  },
  voltage_unbalance: {
    severity: "SEVERE",
    defect_code: "VUF_HIGH",
    defect_name: "Severe 3-Phase Voltage Unbalance (VUF 4.8%)",
  },
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ machineId: string }> }
) {
  const { machineId } = await params;
  const state = getFaultState(machineId);
  return NextResponse.json(state);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ machineId: string }> }
) {
  const { machineId } = await params;
  try {
    const body = await req.json();
    const scenario = body.scenario as FaultScenario;

    const updated = setFaultState(machineId, {
      scenario,
      vibrationThreshold: typeof body.vibrationThreshold === "number" ? body.vibrationThreshold : undefined,
      tempThreshold: typeof body.tempThreshold === "number" ? body.tempThreshold : undefined,
    });

    let alertResult = null;

    if (scenario === "nominal") {
      // Clear alert cooldown so future faults can alert immediately
      try {
        await fetch(`${FASTAPI_URL}/api/v1/alerts/clear`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ machine_id: machineId }),
        });
      } catch (err) {
        console.warn("[inject-fault] Failed to clear cooldown on nominal:", err);
      }
    } else if (FAULT_ALERT_PAYLOADS[scenario]) {
      // Trigger industrial alert dispatch to WhatsApp and Email
      const faultMeta = FAULT_ALERT_PAYLOADS[scenario];
      try {
        const alertRes = await fetch(`${FASTAPI_URL}/api/v1/alerts/test`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            machine_id: machineId,
            severity: faultMeta.severity,
            defect_code: faultMeta.defect_code,
            defect_name: faultMeta.defect_name,
            custom_note: null,
          }),
        });
        if (alertRes.ok) {
          alertResult = await alertRes.json();
        } else {
          const errText = await alertRes.text();
          console.warn("[inject-fault] Backend alert test failed:", errText);
          alertResult = { error: errText };
        }
      } catch (err: any) {
        console.warn("[inject-fault] Failed to trigger alert on backend:", err);
        alertResult = { error: err.message };
      }
    }

    return NextResponse.json({
      ...updated,
      alert: alertResult,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
