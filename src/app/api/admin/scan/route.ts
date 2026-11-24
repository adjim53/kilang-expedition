import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApi } from "@/lib/admin-auth";
import { verdictMessage, verifyScanRecord } from "@/lib/pass-verify";
import { toParticipant } from "@/lib/participants";
import { recordCheckpoint } from "@/lib/checkin";
import { CHECKPOINT_INFO, CHECKPOINTS } from "@/lib/checkpoints";

export const runtime = "nodejs";

const schema = z.object({
  code: z.string().min(1).max(500),
  /** The checkpoint this marshal is working at. With it, a genuine scan is recorded automatically. */
  stage: z.enum(CHECKPOINTS).optional(),
});

/**
 * Validate a scanned pass QR (or a typed pass ID) and return the climber with a verdict.
 *
 * Automatic recording: when the scan is a genuine pass QR (its secret token
 * matches) and the marshal's checkpoint is the ascent start, the summit or the
 * return to base, the checkpoint is recorded in the same request — no second
 * tap. Medical clearance is never automatic, and neither is a pass found by
 * typed ID only: both need a person to confirm.
 */
export async function POST(request: Request) {
  const guard = await requireApi(request, "checkin");
  if (guard.error) return guard.error;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Nothing scanned." }, { status: 400 });
  const { code, stage } = parsed.data;

  const { verdict, registration } = await verifyScanRecord(code);
  let current = registration;
  let auto: { stage: string; recorded: boolean; already: boolean; blocked: string | null } | null = null;

  if (current && verdict === "valid" && stage && CHECKPOINT_INFO[stage].auto) {
    const result = await recordCheckpoint(current, stage, guard.user);
    if (result.ok) {
      current = result.registration;
      auto = { stage, recorded: result.changed, already: !result.changed, blocked: null };
    } else {
      auto = { stage, recorded: false, already: false, blocked: result.error };
    }
  }

  return NextResponse.json({
    verdict,
    message: verdictMessage(verdict),
    participant: current ? toParticipant(current) : null,
    auto,
  });
}
