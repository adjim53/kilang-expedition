import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApi } from "@/lib/admin-auth";
import { toParticipant } from "@/lib/participants";
import { recordCheckpoint } from "@/lib/checkin";
import { CHECKPOINTS } from "@/lib/checkpoints";

export const runtime = "nodejs";

const schema = z.object({
  passId: z.string().trim().min(1).max(40),
  stage: z.enum(CHECKPOINTS),
  undo: z.boolean().optional(),
});

/** Record (or undo) a checkpoint by hand: medical clearance, ascent start, summit, back at base. */
export async function POST(request: Request) {
  const guard = await requireApi(request, "checkin");
  if (guard.error) return guard.error;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const { passId, stage, undo } = parsed.data;

  const registration = await prisma.registration.findUnique({ where: { passId: passId.toUpperCase() } });
  if (!registration) return NextResponse.json({ error: "No registered climber with that pass ID." }, { status: 404 });

  const result = await recordCheckpoint(registration, stage, guard.user, Boolean(undo));
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

  return NextResponse.json({ participant: toParticipant(result.registration) });
}
