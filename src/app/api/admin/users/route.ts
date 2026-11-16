import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApi } from "@/lib/admin-auth";
import { generateTemporaryPassword, hashPassword } from "@/lib/auth/password";
import { ROLES } from "@/lib/auth/roles";
import { audit } from "@/lib/audit";
import { USER_SELECT } from "@/lib/admin-users";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const guard = await requireApi(request, "users.manage");
  if (guard.error) return guard.error;

  const users = await prisma.adminUser.findMany({
    select: USER_SELECT,
    orderBy: [{ active: "desc" }, { role: "asc" }, { name: "asc" }],
  });
  return NextResponse.json({ users, me: guard.user.id });
}

const createSchema = z.object({
  name: z.string().trim().min(2, "Enter their name").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(200),
  role: z.enum(ROLES),
});

/** Create an account. The temporary password is returned once and never stored in plain text. */
export async function POST(request: Request) {
  const guard = await requireApi(request, "users.manage");
  if (guard.error) return guard.error;

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the form." }, { status: 400 });
  }

  const exists = await prisma.adminUser.findUnique({ where: { email: parsed.data.email } });
  if (exists) return NextResponse.json({ error: "There is already an account with that email." }, { status: 409 });

  const temporaryPassword = generateTemporaryPassword();
  const user = await prisma.adminUser.create({
    data: { ...parsed.data, passwordHash: await hashPassword(temporaryPassword), mustChangePassword: true },
    select: USER_SELECT,
  });
  await audit(guard.user, "user.create", { targetUserId: user.id }, { email: user.email, role: user.role });

  return NextResponse.json({ user, temporaryPassword });
}
