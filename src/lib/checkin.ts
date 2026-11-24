import type { Registration } from "@prisma/client";
import { prisma } from "./prisma";
import { audit } from "./audit";
import { blockReason, CHECKPOINT_FIELDS, undoBlockReason, type Checkpoint } from "./checkpoints";

type Actor = { id: string; name: string };

export type CheckpointResult =
  | { ok: true; registration: Registration; changed: boolean }
  | { ok: false; status: number; error: string };

/**
 * Record (or undo) one checkpoint for a climber and write it to the audit log.
 * Recording twice is harmless: the first time and the first marshal are kept.
 */
export async function recordCheckpoint(
  registration: Registration,
  stage: Checkpoint,
  actor: Actor,
  undo = false,
): Promise<CheckpointResult> {
  if (registration.status !== "REGISTERED") {
    return {
      ok: false,
      status: 404,
      error: registration.status === "CANCELLED" ? "This registration is cancelled." : "This registration is not confirmed.",
    };
  }

  const reason = undo ? undoBlockReason(registration, stage) : blockReason(registration, stage);
  if (reason) return { ok: false, status: 409, error: reason };

  const { at, by } = CHECKPOINT_FIELDS[stage];
  const already = registration[at];
  if (!undo && already) return { ok: true, registration, changed: false };
  if (undo && !already) return { ok: true, registration, changed: false };

  const updated = await prisma.registration.update({
    where: { id: registration.id },
    data: undo ? { [at]: null, [by]: null } : { [at]: new Date(), [by]: actor.name },
  });
  await audit(actor, `checkin.${stage}${undo ? ".undo" : ""}`, { registrationId: registration.id });
  return { ok: true, registration: updated, changed: true };
}
