import { NextResponse } from "next/server";

const FASTAPI_URL = process.env.BACKEND_INTERNAL_URL || process.env.BACKEND_FASTAPI_URL || "http://localhost:8004";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await fetch(`${FASTAPI_URL}/api/v1/oem-mail/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const payload = await res.json().catch(() => ({ error: `OEM mail backend ${res.status}` }));
    if (!res.ok) {
      return NextResponse.json(
        { error: payload.detail || payload.error || `OEM mail backend ${res.status}` },
        { status: res.status >= 400 ? res.status : 502 },
      );
    }
    return NextResponse.json(payload);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "OEM mail unavailable" },
      { status: 502 },
    );
  }
}
