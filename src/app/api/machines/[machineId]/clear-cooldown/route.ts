import { NextRequest, NextResponse } from "next/server";

const FASTAPI_URL =
  process.env.BACKEND_INTERNAL_URL ||
  process.env.BACKEND_FASTAPI_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://predictivemaintenance-production-e27a.up.railway.app"
    : "http://localhost:8004");

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ machineId: string }> }
) {
  const { machineId } = await params;
  try {
    const res = await fetch(`${FASTAPI_URL}/api/v1/alerts/clear`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ machine_id: machineId }),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to clear alert cooldown" },
      { status: 500 }
    );
  }
}
