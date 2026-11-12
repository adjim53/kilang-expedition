import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  adminConfigured,
  checkPin,
  clearFailedLogins,
  createSessionValue,
  loginAllowed,
  recordFailedLogin,
  sessionCookieOptions,
} from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!adminConfigured()) {
    return NextResponse.json(
      { error: "The admin PIN has not been set. Add ADMIN_SECRET_KEY to the server environment." },
      { status: 503 },
    );
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!loginAllowed(ip)) {
    return NextResponse.json({ error: "Too many attempts. Try again in 10 minutes." }, { status: 429 });
  }

  const { pin } = (await request.json().catch(() => ({}))) as { pin?: string };
  if (!pin || !checkPin(pin)) {
    recordFailedLogin(ip);
    return NextResponse.json({ error: "Incorrect PIN." }, { status: 401 });
  }

  clearFailedLogins(ip);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, createSessionValue()!, sessionCookieOptions());
  return response;
}
