import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApi, revokeSessions } from "@/lib/admin-auth";
import { generateTemporaryPassword, hashPassword } from "@/lib/auth/password";
import { ROLES } from "@/lib/auth/roles";
import { audit } from "@/lib/audit";
import { USER_SELECT } from "@/lib/admin-users";

export const runtime = "nodejs";

const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("update"),
    name: z.string().trim().min(2).max(100).optional(),
    role: z.enum(ROLES).optional(),
    active: z.boolean().optional(),
  }),
  z.object({ action: z.literal("reset_password") }),
]);

/** Change a user's name, role or active state, or reset their password. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireApi(request, "users.manage");
  if (guard.error) return guard.error;
  const { id } = await params;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const target = await prisma.adminUser.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });

  if (parsed.data.action === "reset_password") {
    const temporaryPassword = generateTemporaryPassword();
    const user = await prisma.adminUser.update({
      where: { id },
      data: { passwordHash: await hashPassword(temporaryPassword), mustChangePassword: true },
      select: USER_SELECT,
    });
    await revokeSessions(id);
    await audit(guard.user, "user.reset_password", { targetUserId: id });
    return NextResponse.json({ user, temporaryPassword });
  }

  const { name, role, active } = parsed.data;
  const self = id === guard.user.id;
  if (self && (active === false || (role && role !== "ADMIN"))) {
    return NextResponse.json(
      { error: "You can't deactivate or demote your own account. Ask another admin." },
      { status: 400 },
    );
  }

  // Never leave the expedition without an active admin.
  const losesAdmin = target.role === "ADMIN" && target.active && (active === false || (role && role !== "ADMIN"));
  if (losesAdmin) {
    const admins = await prisma.adminUser.count({ where: { role: "ADMIN", active: true } });
    if (admins <= 1) return NextResponse.json({ error: "This is the last active admin." }, { status: 400 });
  }

  const user = await prisma.adminUser.update({
    where: { id },
    data: { ...(name ? { name } : {}), ...(role ? { role } : {}), ...(active !== undefined ? { active } : {}) },
    select: USER_SELECT,
  });
  if (active === false || (role && role !== target.role)) await revokeSessions(id);
  await audit(guard.user, "user.update", { targetUserId: id }, { name, role, active });

  return NextResponse.json({ user });
}
