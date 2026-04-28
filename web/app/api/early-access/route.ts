import { NextResponse } from "next/server";

export const runtime = "nodejs";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { detail: "Invalid request body." },
      { status: 400 },
    );
  }

  // Capture client metadata for the backend
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null;
  const userAgent = request.headers.get("user-agent") || null;

  const enriched = {
    ...(typeof payload === "object" && payload !== null ? payload : {}),
    ip,
    user_agent: userAgent,
  };

  try {
    const res = await fetch(`${API_BASE_URL}/early-access`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(enriched),
      // Don't cache; we want each submit to hit the backend.
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[early-access] proxy error:", err);
    return NextResponse.json(
      { detail: "We couldn't reach the server. Try again in a minute." },
      { status: 503 },
    );
  }
}
