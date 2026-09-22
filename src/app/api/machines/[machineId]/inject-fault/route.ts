import { NextRequest, NextResponse } from "next/server";
import { getFaultState, setFaultState, FaultScenario } from "@/lib/faultStore";

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
    const updated = setFaultState(machineId, {
      scenario: body.scenario as FaultScenario,
      vibrationThreshold: typeof body.vibrationThreshold === "number" ? body.vibrationThreshold : undefined,
      tempThreshold: typeof body.tempThreshold === "number" ? body.tempThreshold : undefined,
    });
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
