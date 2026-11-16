import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE, createSession, isSameOrigin, sessionCookieOptions } from "@/lib/admin-auth";
import { dummyPasswordHash, verifyPassword } from "@/lib/auth/password";
import { homeFor } from "@/lib/auth/roles";
import { clearLimit, clientIp, hit, isLimited } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(1).max(200),
});

const WINDOW = 15 * 60 * 1000;
const PER_ACCOUNT = 5; // wrong passwords per account per 15 min
const PER_IP = 20; // attempts per address per 15 min

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Request blocked." }, { status: 403 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
  const { email, password } = parsed.data;

  const ipKey = `login:ip:${clientIp(request)}`;
  const accountKey = `login:acct:${email}`;
  const tooMany = NextResponse.json(
    { error: "Too many sign-in attempts. Wait 15 minutes and try again." },
    { status: 429 },
  );
  if (!(await hit(ipKey, PER_IP, WINDOW))) return tooMany;
  if (await isLimited(accountKey, PER_ACCOUNT)) return tooMany;

  const user = await prisma.adminUser.findUnique({ where: { email } });
  // Always run one hash check, so response time doesn't reveal whether the email exists.
  const ok = await verifyPassword(password, user?.passwordHash ?? (await dummyPasswordHash()));

  if (!user || !ok || !user.active) {
    await hit(accountKey, PER_ACCOUNT, WINDOW);
    return NextResponse.json({ error: "Wrong email or password." }, { status: 401 });
  }

  await clearLimit(accountKey);
  await prisma.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  const token = await createSession(user.id, request);
  await audit({ id: user.id, name: user.name }, "user.login", { targetUserId: user.id });

  const response = NextResponse.json({
    ok: true,
    next: user.mustChangePassword ? "/admin/account?first=1" : homeFor(user.role),
  });
  response.cookies.set(ADMIN_COOKIE, token, sessionCookieOptions());
  return response;
}
