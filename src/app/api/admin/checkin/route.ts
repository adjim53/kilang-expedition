import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin-auth";
import { toParticipant } from "@/lib/participants";

export const runtime = "nodejs";

/** Mark (or undo) a participant's medical clearance or muster check-in. */
export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

  const { passId, stage, undo } = (await request.json().catch(() => ({}))) as {
    passId?: string;
    stage?: "medical" | "muster";
    undo?: boolean;
  };
  if (!passId || (stage !== "medical" && stage !== "muster")) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const registration = await prisma.registration.findUnique({ where: { passId: passId.toUpperCase() } });
  if (!registration || registration.status !== "PAID") {
    return NextResponse.json({ error: "No paid participant with that pass ID." }, { status: 404 });
  }

  // Safety rule: no medical clearance, no climb.
  if (stage === "muster" && !undo && !registration.medicalCheckedAt) {
    return NextResponse.json(
      { error: "This climber has not been medically cleared and cannot be checked in for the ascent." },
      { status: 409 },
    );
  }

  const field = stage === "medical" ? "medicalCheckedAt" : "musterCheckedAt";
  const updated = await prisma.registration.update({
    where: { id: registration.id },
    data: { [field]: undo ? null : (registration[field] ?? new Date()) },
    include: { tier: true },
  });

  return NextResponse.json({ participant: toParticipant(updated) });
}
