import { NextRequest, NextResponse } from "next/server";
import { getFaultState } from "@/lib/faultStore";

const FASTAPI_URL = process.env.BACKEND_INTERNAL_URL || process.env.BACKEND_FASTAPI_URL || (process.env.NODE_ENV === "production" ? "https://predictivemaintenance-production-e27a.up.railway.app" : "http://localhost:8004");

type HistorianRow = {
  trace_id?: string;
  machine_id?: string;
  timestamp?: string;
  health_status?: string;
  defect_code?: string;
  failing_component?: string;
  rul_days?: number;
  skip_reason?: string | null;
};

function historianToRun(row: HistorianRow, machineId: string) {
  const defect = row.defect_code || "NORMAL";
  const sensorHalt = row.health_status === "SENSOR_FAULT";
  const healthy = !sensorHalt && (defect === "NORMAL" || row.health_status === "HEALTHY");
  const verdict = sensorHalt ? "sensor" : healthy ? "nominal" : "machine";
  return {
    id: row.trace_id || `run_${row.timestamp || Date.now()}`,
    machineId,
    breachKeys: healthy || sensorHalt ? [] : [defect],
    status: "COMPLETE" as const,
    sourceCheck: {
      verdict,
      confidence: sensorHalt ? 1 : healthy ? 0.9 : 0.85,
      reasoning: sensorHalt
        ? "Agent Alpha halted on a sensor-quality fault."
        : healthy
          ? `Nominal diagnosis (${row.health_status || "HEALTHY"}). ${row.failing_component || "No active defect"}.`
          : `${defect} on ${row.failing_component || "unknown component"}${row.rul_days != null ? ` · RUL ${row.rul_days}d` : ""}.`,
    },
    faultPredictions: healthy || sensorHalt
      ? []
      : [
          {
            faultCode: defect,
            description: row.failing_component || defect,
            predictedWindowDays: row.rul_days ?? null,
            confidence: 0.85,
            reasoning: row.skip_reason ? `Skip: ${row.skip_reason}` : "LangGraph Gamma diagnosis.",
          },
        ],
    remediation: null,
    error: null,
    createdAt: row.timestamp || new Date().toISOString(),
    completedAt: row.timestamp || new Date().toISOString(),
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ machineId: string }> }
) {
  const { machineId } = await params;
  const limit = Number(req.nextUrl.searchParams.get("limit") || "20");
  const faultState = getFaultState(machineId);

  let runs: ReturnType<typeof historianToRun>[] = [];
  try {
    // Fetch a larger window so after filtering NORMAL rows we still have enough fault events.
    const fetchLimit = Math.max(limit * 5, 100);
    const res = await fetch(
      `${FASTAPI_URL}/api/v1/predict/history/${encodeURIComponent(machineId)}?limit=${fetchLimit}`,
      { cache: "no-store" }
    );
    if (res.ok) {
      const rows = (await res.json()) as HistorianRow[];
      if (Array.isArray(rows)) {
        runs = rows
          .map((row) => historianToRun(row, machineId))
          // Only keep Fault and Sensor-fault events — suppress NORMAL/HEALTHY rows
          .filter((run) => run.sourceCheck.verdict !== "nominal");
      }
    }
  } catch {
    runs = [];
  }

  // Injected demo scenarios only — never invent a "machine fault" for Nominal Stream.
  if (faultState.scenario === "cable_cut") {
    runs = [
      {
        id: `inject_cable_${Date.now()}`,
        machineId,
        breachKeys: ["cable_halt"],
        status: "COMPLETE",
        sourceCheck: {
          verdict: "sensor",
          confidence: 1,
          reasoning: "Agent Alpha HALT: injected sensor cable-cut scenario.",
        },
        faultPredictions: [],
        remediation: null,
        error: null,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      },
      ...runs,
    ];
  }

  return NextResponse.json({ machineId, runs: runs.slice(0, limit) });
}
