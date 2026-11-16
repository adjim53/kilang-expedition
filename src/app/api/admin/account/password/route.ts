import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminUser, isSameOrigin, revokeSessions } from "@/lib/admin-auth";
import { hashPassword, passwordProblem, verifyPassword } from "@/lib/auth/password";
import { homeFor } from "@/lib/auth/roles";
import { audit } from "@/lib/audit";
import { hit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const schema = z.object({ current: z.string().min(1).max(200), next: z.string().min(1).max(200) });

/** Change your own password. Signs you out on every other device. */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Request blocked." }, { status: 403 });
  const me = await getAdminUser();
  if (!me) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Fill in both password fields." }, { status: 400 });

  if (!(await hit(`pwchange:${me.id}`, 10, 15 * 60 * 1000))) {
    return NextResponse.json({ error: "Too many attempts. Wait 15 minutes." }, { status: 429 });
  }

  const user = await prisma.adminUser.findUnique({ where: { id: me.id } });
  if (!user || !(await verifyPassword(parsed.data.current, user.passwordHash))) {
    return NextResponse.json({ error: "Your current password is wrong.", field: "current" }, { status: 400 });
  }
  if (parsed.data.next === parsed.data.current) {
    return NextResponse.json({ error: "Choose a password different from the current one.", field: "next" }, { status: 400 });
  }
  const problem = passwordProblem(parsed.data.next, { email: user.email, name: user.name });
  if (problem) return NextResponse.json({ error: problem, field: "next" }, { status: 400 });

  await prisma.adminUser.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(parsed.data.next), mustChangePassword: false },
  });
  await revokeSessions(user.id, me.sessionId);
  await audit({ id: user.id, name: user.name }, "user.password_changed", { targetUserId: user.id });

  return NextResponse.json({ ok: true, next: homeFor(user.role) });
}
