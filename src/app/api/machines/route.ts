import { NextResponse } from "next/server";

const FASTAPI_URL = process.env.BACKEND_INTERNAL_URL || process.env.BACKEND_FASTAPI_URL || (process.env.NODE_ENV === "production" ? "https://predictivemaintenance-production-e27a.up.railway.app" : "http://localhost:8004");

const DEFAULT_MACHINES = [
  {
    id: "compressor_unit_01",
    name: "Compressor Unit 01 — Elson EL30 (720 RPM, 3HP, Reciprocating Piston)",
    location: "Factory Floor 1",
    ratedRpm: 1480,
    mapX: 25,
    mapY: 35,
  },
];

export async function GET() {
  try {
    const res = await fetch(`${FASTAPI_URL}/api/v1/assets`, {
      cache: "no-store",
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) {
      return NextResponse.json({ machines: DEFAULT_MACHINES });
    }
    const data = await res.json();
    const assetList = Array.isArray(data) ? data : (data.assets || []);
    if (!assetList.length) {
      return NextResponse.json({ machines: DEFAULT_MACHINES });
    }

    const machines = assetList.map((a: any, idx: number) => ({
      id: a.id || a.machine_id,
      name: a.name || a.id || a.machine_id,
      location: a.location || "Factory Floor 1",
      ratedRpm: a.rated_rpm || a.rpm || 1480,
      mapX: a.mapX ?? (idx === 0 ? 25 : 55),
      mapY: a.mapY ?? (idx === 0 ? 35 : 45),
    }));

    return NextResponse.json({ machines });
  } catch (err) {
    return NextResponse.json({ machines: DEFAULT_MACHINES });
  }
}
