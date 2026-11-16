import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApi } from "@/lib/admin-auth";
import { dispatchPass } from "@/lib/confirm";
import { audit } from "@/lib/audit";
import { hit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const schema = z.object({ passId: z.string().trim().min(1).max(40) });

/** Re-send a participant's pass email and SMS (e.g. they lost it or it never arrived). */
export async function POST(request: Request) {
  const guard = await requireApi(request, "passes.resend");
  if (guard.error) return guard.error;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const registration = await prisma.registration.findUnique({ where: { passId: parsed.data.passId.toUpperCase() } });
  if (!registration || registration.status !== "PAID") {
    return NextResponse.json({ error: "No paid participant with that pass ID." }, { status: 404 });
  }
  // Each resend costs an SMS; stop a stuck button from draining the Termii balance.
  if (!(await hit(`resend:${registration.id}`, 5, 60 * 60 * 1000))) {
    return NextResponse.json({ error: "This pass was re-sent several times in the last hour. Try again later." }, { status: 429 });
  }

  const sent = await dispatchPass(registration.id);
  await audit(guard.user, "pass.resend", { registrationId: registration.id }, sent);
  return NextResponse.json({ sent });
}
