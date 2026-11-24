import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApi } from "@/lib/admin-auth";
import { can } from "@/lib/auth/roles";
import { toDetail } from "@/lib/registrations";
import { audit, AUDIT_LABELS } from "@/lib/audit";
import { normalizeNigerianPhone } from "@/lib/utils";
import { BLOOD_GROUPS, EXPERIENCE_LEVELS, GENOTYPES, KIT_SIZES } from "@/lib/validation";

export const runtime = "nodejs";

async function load(id: string) {
  return prisma.registration.findUnique({ where: { id } });
}

async function history(id: string) {
  const rows = await prisma.auditLog.findMany({
    where: { registrationId: id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return rows.map((h) => ({
    id: h.id,
    at: h.createdAt.toISOString(),
    who: h.actorName,
    action: AUDIT_LABELS[h.action] ?? h.action,
    details: h.details,
  }));
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireApi(request, "registrations.view");
  if (guard.error) return guard.error;
  const { id } = await params;

  const registration = await load(id);
  if (!registration) return NextResponse.json({ error: "Registration not found." }, { status: 404 });

  return NextResponse.json({
    registration: toDetail(registration),
    history: await history(id),
    permissions: {
      edit: can(guard.user.role, "registrations.edit"),
      resend: can(guard.user.role, "passes.resend"),
      cancel: can(guard.user.role, "registrations.cancel"),
    },
  });
}

const phone = z
  .string()
  .trim()
  .refine((v) => normalizeNigerianPhone(v) !== null, "Enter a valid Nigerian mobile number")
  .transform((v) => normalizeNigerianPhone(v)!);

const editSchema = z
  .object({
    fullName: z.string().trim().min(3).max(100),
    email: z.string().trim().toLowerCase().email().max(200),
    phone,
    nextOfKinName: z.string().trim().min(3).max(100),
    nextOfKinPhone: phone,
    bloodGroup: z.enum(BLOOD_GROUPS),
    genotype: z.enum(GENOTYPES),
    experience: z.enum(EXPERIENCE_LEVELS),
    medicalNotes: z.string().trim().max(1000),
    kitSize: z.enum(KIT_SIZES),
  })
  .partial();

/** Correct a climber's details (typo in a name, new phone number, kit size swap…). */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireApi(request, "registrations.edit");
  if (guard.error) return guard.error;
  const { id } = await params;

  const parsed = editSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json({ error: `${issue?.path.join(".")}: ${issue?.message}` }, { status: 400 });
  }

  const before = await load(id);
  if (!before) return NextResponse.json({ error: "Registration not found." }, { status: 404 });

  const data = { ...parsed.data, ...(parsed.data.medicalNotes !== undefined ? { medicalNotes: parsed.data.medicalNotes || null } : {}) };
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  for (const [key, value] of Object.entries(data)) {
    const old = before[key as keyof typeof before];
    if (old !== value) changes[key] = { from: old, to: value };
  }
  if (Object.keys(changes).length === 0) {
    return NextResponse.json({ registration: toDetail(before), history: await history(id) });
  }

  const updated = await prisma.registration.update({ where: { id }, data });
  await audit(guard.user, "registration.edit", { registrationId: id }, changes);
  return NextResponse.json({ registration: toDetail(updated), history: await history(id) });
}
