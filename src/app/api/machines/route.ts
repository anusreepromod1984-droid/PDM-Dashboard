import { NextResponse } from "next/server";

const FASTAPI_URL = process.env.BACKEND_INTERNAL_URL || "http://localhost:8004";

const COORDS = [
  { mapX: 25, mapY: 35 },
  { mapX: 55, mapY: 45 },
  { mapX: 75, mapY: 65 },
];

export async function GET() {
  try {
    const res = await fetch(`${FASTAPI_URL}/api/v1/assets`, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`FastAPI returned ${res.status}`);
    }
    const data = await res.json();
    const assetList = Array.isArray(data) ? data : (data.assets || []);

    const machines = assetList.map((a: any, idx: number) => ({
      id: a.id || a.machine_id,
      name: a.name || a.id || a.machine_id,
      location: a.location || "Factory Floor 1",
      ratedRpm: a.rated_rpm || a.rpm || 1480,
      mapX: COORDS[idx % COORDS.length].mapX,
      mapY: COORDS[idx % COORDS.length].mapY,
    }));

    return NextResponse.json({ machines });
  } catch (err) {
    return NextResponse.json({ machines: [] });
  }
}
