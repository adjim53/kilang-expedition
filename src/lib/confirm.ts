import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { generatePassId } from "./ids";
import { sendPassEmail } from "./email";
import { passConfirmationSms, sendSms } from "./sms";

export type ConfirmResult =
  | { ok: true; passId: string; accessToken: string; alreadyConfirmed: boolean }
  | { ok: false; reason: "not_found" | "amount_mismatch" | "error" };

/**
 * Marks a registration as paid, assigns its KIL-2026-XXXX pass ID and sends
 * the email + SMS. Safe to call more than once for the same reference: the
 * webhook and the browser's verify call often race, and only one of them wins.
 */
export async function confirmRegistration(
  reference: string,
  payment: { transactionId: string; amountKobo: number },
): Promise<ConfirmResult> {
  const existing = await prisma.registration.findUnique({ where: { reference } });
  if (!existing) return { ok: false, reason: "not_found" };

  if (existing.status === "PAID" && existing.passId) {
    return { ok: true, passId: existing.passId, accessToken: existing.accessToken, alreadyConfirmed: true };
  }

  if (payment.amountKobo < existing.amountKobo) {
    console.error(
      `[confirm] amount mismatch for ${reference}: paid ${payment.amountKobo}, expected ${existing.amountKobo}`,
    );
    return { ok: false, reason: "amount_mismatch" };
  }

  // Claim the registration. The `status: "PENDING"` filter makes this atomic:
  // if two requests race, exactly one updates a row. Retry on pass-ID collision.
  let won = false;
  for (let attempt = 0; attempt < 8 && !won; attempt++) {
    try {
      const result = await prisma.registration.updateMany({
        where: { reference, status: "PENDING" },
        data: {
          status: "PAID",
          passId: generatePassId(),
          paidAt: new Date(),
          paystackTxId: payment.transactionId,
        },
      });
      if (result.count === 0) break; // someone else confirmed it first
      won = true;
    } catch (err) {
      const collision = err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
      if (!collision) {
        console.error("[confirm] failed to confirm registration", err);
        return { ok: false, reason: "error" };
      }
    }
  }

  const confirmed = await prisma.registration.findUnique({
    where: { reference },
    include: { tier: true },
  });
  if (!confirmed || confirmed.status !== "PAID" || !confirmed.passId) {
    return { ok: false, reason: "error" };
  }

  if (won) await dispatchPass(confirmed.id);

  return {
    ok: true,
    passId: confirmed.passId,
    accessToken: confirmed.accessToken,
    alreadyConfirmed: !won,
  };
}

/** Sends (or re-sends) the pass email and SMS, recording what was delivered. */
export async function dispatchPass(registrationId: string) {
  const reg = await prisma.registration.findUnique({
    where: { id: registrationId },
    include: { tier: true },
  });
  if (!reg || !reg.passId) return { email: false, sms: false };

  const [email, sms] = await Promise.all([
    sendPassEmail({
      fullName: reg.fullName,
      email: reg.email,
      passId: reg.passId,
      accessToken: reg.accessToken,
      tierName: reg.tier.name,
    }),
    sendSms(reg.phone, passConfirmationSms(reg.passId)),
  ]);

  await prisma.registration.update({
    where: { id: reg.id },
    data: {
      ...(email.ok ? { emailSentAt: new Date() } : {}),
      ...(sms.ok ? { smsSentAt: new Date() } : {}),
    },
  });

  return { email: email.ok, sms: sms.ok };
}
