import type { Registration } from "@prisma/client";
import { prisma } from "./prisma";
import { tokensMatch } from "./ids";
import { parseScannedPass } from "./pass-id";
import { toParticipant, type Participant } from "./participants";

export type Verdict = "valid" | "id_only" | "not_genuine" | "cancelled" | "unconfirmed" | "unknown";

export type VerifyResult = { verdict: Verdict; message: string; participant: Participant | null };

const MESSAGES: Record<Verdict, string> = {
  valid: "Genuine pass. Registration confirmed.",
  id_only:
    "Found by pass ID only — this does not prove the pass is genuine. Check the climber's photo ID matches the name.",
  not_genuine:
    "This QR code does not match the pass on record. It may be a copy, a fake, or an old link that was replaced. Do not admit without checking with registration staff.",
  cancelled: "This registration has been cancelled. Do not admit.",
  unconfirmed: "This registration has not been confirmed. Send the climber to registration staff.",
  unknown: "Not a Kilang Expedition 2026 pass, or the pass ID does not exist.",
};

/** Check a scanned QR (pass URL) or a typed pass ID against the database. */
export async function verifyScanRecord(
  scanned: string,
): Promise<{ verdict: Verdict; registration: Registration | null }> {
  const { passId, token } = parseScannedPass(scanned);
  if (!passId) return { verdict: "unknown", registration: null };

  const registration = await prisma.registration.findUnique({ where: { passId } });
  if (!registration) return { verdict: "unknown", registration: null };

  let verdict: Verdict;
  if (token && !tokensMatch(token, registration.accessToken)) verdict = "not_genuine";
  else if (registration.status === "CANCELLED") verdict = "cancelled";
  else if (registration.status !== "REGISTERED") verdict = "unconfirmed";
  else verdict = token ? "valid" : "id_only";

  return { verdict, registration };
}

export async function verifyScan(scanned: string): Promise<VerifyResult> {
  const { verdict, registration } = await verifyScanRecord(scanned);
  return { verdict, message: MESSAGES[verdict], participant: registration ? toParticipant(registration) : null };
}

export function verdictMessage(verdict: Verdict) {
  return MESSAGES[verdict];
}
