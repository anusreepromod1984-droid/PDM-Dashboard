import { NextResponse } from "next/server";

const FASTAPI_URL = process.env.BACKEND_INTERNAL_URL || process.env.BACKEND_FASTAPI_URL || (process.env.NODE_ENV === "production" ? "https://predictivemaintenance-production-e27a.up.railway.app" : "http://localhost:8004");

export async function GET() {
  try {
    const res = await fetch(`${FASTAPI_URL}/api/v1/fleet/watchlist`, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json({ error: `Watchlist backend ${res.status}` }, { status: 502 });
    }
    return NextResponse.json(await res.json());
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Watchlist unavailable" }, { status: 502 });
  }
}
