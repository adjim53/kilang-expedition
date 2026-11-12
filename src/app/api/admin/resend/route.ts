import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin-auth";
import { dispatchPass } from "@/lib/confirm";

export const runtime = "nodejs";

/** Re-send a participant's pass email and SMS (e.g. they lost it or it never arrived). */
export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

  const { passId } = (await request.json().catch(() => ({}))) as { passId?: string };
  if (!passId) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const registration = await prisma.registration.findUnique({ where: { passId: passId.toUpperCase() } });
  if (!registration) return NextResponse.json({ error: "Participant not found." }, { status: 404 });

  const sent = await dispatchPass(registration.id);
  return NextResponse.json({ sent });
}
