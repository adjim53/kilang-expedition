import { NextResponse } from "next/server";
import { ADMIN_COOKIE, destroyCurrentSession, isSameOrigin, sessionCookieOptions } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Request blocked." }, { status: 403 });
  await destroyCurrentSession().catch(() => {});
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, "", sessionCookieOptions(0));
  return response;
}
