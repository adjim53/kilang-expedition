import { Prisma, type Registration } from "@prisma/client";
import { prisma } from "./prisma";
import { generateAccessToken, generatePassId, generateReference } from "./ids";
import { sendPassEmail } from "./email";
import { passConfirmationSms, sendSms } from "./sms";

const isCollision = (err: unknown) =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";

export type NewRegistration = Omit<
  Prisma.RegistrationCreateInput,
  "reference" | "accessToken" | "passId" | "status"
>;

/**
 * Registration is free and instant: store the climber as REGISTERED with a
 * KIL-2026-XXXX pass ID straight away. Retries if a random ID is already taken.
 */
export async function createRegistration(data: NewRegistration): Promise<Registration> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await prisma.registration.create({
        data: {
          ...data,
          reference: generateReference(),
          accessToken: generateAccessToken(),
          passId: generatePassId(),
          status: "REGISTERED",
        },
      });
    } catch (err) {
      if (!isCollision(err) || attempt >= 7) throw err;
    }
  }
}

export type ConfirmResult = { ok: true; passId: string } | { ok: false; reason: "not_found" | "not_pending" | "error" };

/**
 * For rows left PENDING from before registration became free (checkout was
 * started but never paid): confirm the place, assign the pass ID and send the
 * pass. Atomic — if two staff click at once, exactly one wins.
 */
export async function confirmPendingRegistration(id: string): Promise<ConfirmResult> {
  const existing = await prisma.registration.findUnique({ where: { id } });
  if (!existing) return { ok: false, reason: "not_found" };
  if (existing.status !== "PENDING") return { ok: false, reason: "not_pending" };

  let won = false;
  for (let attempt = 0; attempt < 8 && !won; attempt++) {
    try {
      const result = await prisma.registration.updateMany({
        where: { id, status: "PENDING" },
        data: { status: "REGISTERED", passId: existing.passId ?? generatePassId() },
      });
      if (result.count === 0) break; // someone else confirmed it first
      won = true;
    } catch (err) {
      if (!isCollision(err)) {
        console.error("[confirm] failed to confirm registration", err);
        return { ok: false, reason: "error" };
      }
    }
  }

  const confirmed = await prisma.registration.findUnique({ where: { id } });
  if (!confirmed || confirmed.status !== "REGISTERED" || !confirmed.passId) return { ok: false, reason: "error" };
  if (won) await dispatchPass(confirmed.id);
  return { ok: true, passId: confirmed.passId };
}

/** Sends (or re-sends) the pass email and SMS, recording what was delivered. */
export async function dispatchPass(registrationId: string) {
  const reg = await prisma.registration.findUnique({ where: { id: registrationId } });
  if (!reg || !reg.passId || reg.status !== "REGISTERED") {
    return { email: false, sms: false, emailError: null, smsError: null };
  }

  const [email, sms] = await Promise.all([
    sendPassEmail({
      fullName: reg.fullName,
      email: reg.email,
      passId: reg.passId,
      accessToken: reg.accessToken,
    }),
    sendSms(reg.phone, passConfirmationSms(reg.passId)),
  ]);

  const emailError = email.ok ? null : email.skipped ? "Email is not configured on the server" : (email.error ?? "Email failed");
  const smsError = sms.ok ? null : sms.skipped ? "SMS is not configured on the server" : (sms.error ?? "SMS failed");

  await prisma.registration.update({
    where: { id: reg.id },
    data: {
      ...(email.ok ? { emailSentAt: new Date() } : {}),
      ...(sms.ok ? { smsSentAt: new Date() } : {}),
      emailError: emailError?.slice(0, 300) ?? null,
      smsError: smsError?.slice(0, 300) ?? null,
    },
  });

  return { email: email.ok, sms: sms.ok, emailError, smsError };
}
