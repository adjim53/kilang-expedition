import { prisma } from "./prisma";
import { tokensMatch } from "./ids";
import { parseScannedPass } from "./pass-id";
import { toParticipant, type Participant } from "./participants";

export type Verdict = "valid" | "id_only" | "not_genuine" | "cancelled" | "unpaid" | "unknown";

export type VerifyResult = { verdict: Verdict; message: string; participant: Participant | null };

const MESSAGES: Record<Verdict, string> = {
  valid: "Genuine pass. Payment confirmed.",
  id_only:
    "Found by pass ID only — this does not prove the pass is genuine. Check the climber's photo ID matches the name.",
  not_genuine:
    "This QR code does not match the pass on record. It may be a copy, a fake, or an old link that was replaced. Do not admit without checking with registration staff.",
  cancelled: "This registration has been cancelled. Do not admit.",
  unpaid: "This registration has not been paid. Do not admit.",
  unknown: "Not a Kilang Expedition 2026 pass, or the pass ID does not exist.",
};

/** Check a scanned QR (pass URL) or a typed pass ID against the database. */
export async function verifyScan(scanned: string): Promise<VerifyResult> {
  const { passId, token } = parseScannedPass(scanned);
  if (!passId) return { verdict: "unknown", message: MESSAGES.unknown, participant: null };

  const registration = await prisma.registration.findUnique({ where: { passId }, include: { tier: true } });
  if (!registration) return { verdict: "unknown", message: MESSAGES.unknown, participant: null };

  const participant = toParticipant(registration);
  let verdict: Verdict;
  if (token && !tokensMatch(token, registration.accessToken)) verdict = "not_genuine";
  else if (registration.status === "CANCELLED") verdict = "cancelled";
  else if (registration.status !== "PAID") verdict = "unpaid";
  else verdict = token ? "valid" : "id_only";

  return { verdict, message: MESSAGES[verdict], participant };
}

export function verdictMessage(verdict: Verdict) {
  return MESSAGES[verdict];
}
