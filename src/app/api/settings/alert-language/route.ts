/**
 * Proxy: forwards the frontend language preference to the FastAPI backend
 * so WhatsApp/Email alerts are sent in the operator's chosen language.
 */
import { NextRequest, NextResponse } from "next/server";

const FASTAPI_URL =
  process.env.BACKEND_INTERNAL_URL ||
  process.env.BACKEND_FASTAPI_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://predictivemaintenance-production-e27a.up.railway.app"
    : "http://localhost:8004");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(`${FASTAPI_URL}/api/v1/settings/alert-language`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update alert language" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const res = await fetch(`${FASTAPI_URL}/api/v1/settings/alert-language`, {
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ alert_language: "en" }, { status: 200 });
  }
}
