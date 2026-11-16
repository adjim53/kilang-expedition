import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApi } from "@/lib/admin-auth";
import { toParticipant } from "@/lib/participants";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

const schema = z.object({
  passId: z.string().trim().min(1).max(40),
  stage: z.enum(["medical", "muster"]),
  undo: z.boolean().optional(),
});

/** Mark (or undo) a participant's medical clearance or muster check-in. */
export async function POST(request: Request) {
  const guard = await requireApi(request, "checkin");
  if (guard.error) return guard.error;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const { passId, stage, undo } = parsed.data;

  const registration = await prisma.registration.findUnique({ where: { passId: passId.toUpperCase() } });
  if (!registration || registration.status !== "PAID") {
    return NextResponse.json(
      { error: registration?.status === "CANCELLED" ? "This registration is cancelled." : "No paid participant with that pass ID." },
      { status: 404 },
    );
  }

  // Safety rule: no medical clearance, no climb.
  if (stage === "muster" && !undo && !registration.medicalCheckedAt) {
    return NextResponse.json(
      { error: "This climber has not been medically cleared and cannot be checked in for the ascent." },
      { status: 409 },
    );
  }
  // Undoing medical clearance after the climber is at the muster would leave them checked in uncleared.
  if (stage === "medical" && undo && registration.musterCheckedAt) {
    return NextResponse.json({ error: "Undo the ascent check-in first." }, { status: 409 });
  }

  const at = stage === "medical" ? "medicalCheckedAt" : "musterCheckedAt";
  const by = stage === "medical" ? "medicalCheckedBy" : "musterCheckedBy";
  const already = registration[at];
  const updated = await prisma.registration.update({
    where: { id: registration.id },
    data: undo
      ? { [at]: null, [by]: null }
      : { [at]: already ?? new Date(), [by]: already ? registration[by] : guard.user.name },
    include: { tier: true },
  });
  if (undo || !already) {
    await audit(guard.user, `checkin.${stage}${undo ? ".undo" : ""}`, { registrationId: registration.id });
  }

  return NextResponse.json({ participant: toParticipant(updated) });
}
