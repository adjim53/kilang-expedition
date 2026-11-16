import crypto from "crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { prisma } from "./prisma";
import { can, type Permission } from "./auth/roles";

/**
 * Back-office sign-in: one account per person (email + password), stored
 * sessions that can be revoked, and per-role permissions.
 *
 * The cookie holds a random token; the database stores only its SHA-256, so
 * a database leak does not hand out live sessions.
 */

export const ADMIN_COOKIE = process.env.NODE_ENV === "production" ? "__Host-kil_session" : "kil_session";
const SESSION_HOURS = 14; // a full check-in shift, then sign in again

export type AdminUserSummary = {
  id: string;
  email: string;
  name: string;
  role: string;
  mustChangePassword: boolean;
  sessionId: string;
};

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function sessionCookieOptions(maxAgeSeconds = SESSION_HOURS * 60 * 60) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export async function createSession(userId: string, request: Request) {
  const token = crypto.randomBytes(32).toString("base64url");
  await prisma.adminSession.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt: new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000),
      ip: request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0] ?? null,
      userAgent: request.headers.get("user-agent")?.slice(0, 200) ?? null,
    },
  });
  // Housekeeping: drop expired sessions now and then.
  if (Math.random() < 0.1) {
    await prisma.adminSession.deleteMany({ where: { expiresAt: { lt: new Date() } } }).catch(() => {});
  }
  return token;
}

/** The signed-in staff member for this request, or null. Cached per request. */
export const getAdminUser = cache(async (): Promise<AdminUserSummary | null> => {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token || token.length > 100) return null;

  const session = await prisma.adminSession
    .findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } })
    .catch(() => null);
  if (!session || session.expiresAt <= new Date() || !session.user.active) return null;

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    mustChangePassword: session.user.mustChangePassword,
    sessionId: session.id,
  };
});

export async function destroyCurrentSession() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (token) await prisma.adminSession.deleteMany({ where: { tokenHash: hashToken(token) } });
}

/** Sign a user out everywhere (password reset, deactivation). Optionally keep one session. */
export async function revokeSessions(userId: string, exceptSessionId?: string) {
  await prisma.adminSession.deleteMany({
    where: { userId, ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}) },
  });
}

/**
 * Blocks cross-site form posts. SameSite=Lax cookies already stop most of
 * these; this is the second lock on the door.
 */
function sameOrigin(request: Request) {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return true;
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

type Guard = { user: AdminUserSummary; error?: never } | { user?: never; error: NextResponse };

/** For API routes: the user if signed in with the permission, otherwise a ready-made error response. */
export async function requireApi(request: Request, permission: Permission): Promise<Guard> {
  if (!sameOrigin(request)) {
    return { error: NextResponse.json({ error: "Request blocked." }, { status: 403 }) };
  }
  const user = await getAdminUser();
  if (!user) return { error: NextResponse.json({ error: "Please sign in again." }, { status: 401 }) };
  if (user.mustChangePassword) {
    return { error: NextResponse.json({ error: "Change your temporary password first." }, { status: 403 }) };
  }
  if (!can(user.role, permission)) {
    return { error: NextResponse.json({ error: "Your account isn't allowed to do that." }, { status: 403 }) };
  }
  return { user };
}

/** For pages: redirects to sign-in, the password change, or the user's home if not permitted. */
export async function requirePage(permission: Permission | null, path: string) {
  const user = await getAdminUser();
  if (!user) redirect(`/admin/login?next=${encodeURIComponent(path)}`);
  if (user.mustChangePassword && path !== "/admin/account") redirect("/admin/account?first=1");
  if (permission && !can(user.role, permission)) redirect("/admin");
  return user;
}

/** Same-origin check for routes that run before sign-in (login). */
export function isSameOrigin(request: Request) {
  return sameOrigin(request);
}
