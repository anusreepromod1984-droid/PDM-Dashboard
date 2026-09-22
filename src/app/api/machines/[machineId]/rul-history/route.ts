import { NextResponse } from "next/server";

const FASTAPI_URL = process.env.BACKEND_INTERNAL_URL || process.env.BACKEND_FASTAPI_URL || "http://localhost:8004";

export async function GET(_req: Request, { params }: { params: Promise<{ machineId: string }> }) {
  const { machineId } = await params;
  try {
    const res = await fetch(
      `${FASTAPI_URL}/api/v1/predict/rul_history/${encodeURIComponent(machineId)}`,
      { cache: "no-store" },
    );
    if (!res.ok) {
      return NextResponse.json({ error: `RUL history backend ${res.status}` }, { status: 502 });
    }
    return NextResponse.json(await res.json());
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "RUL history unavailable" }, { status: 502 });
  }
}
