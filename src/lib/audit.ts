import { prisma } from "./prisma";

type Actor = { id: string; name: string } | null;

/** Record a back-office action. Never throws: an audit hiccup must not undo the action. */
export async function audit(
  actor: Actor,
  action: string,
  target: { registrationId?: string; targetUserId?: string } = {},
  details?: Record<string, unknown>,
) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: actor?.id ?? null,
        actorName: actor?.name ?? "System",
        action,
        registrationId: target.registrationId ?? null,
        targetUserId: target.targetUserId ?? null,
        details: details ? JSON.stringify(details) : null,
      },
    });
  } catch (err) {
    console.error("[audit] failed to record", action, err);
  }
}

export const AUDIT_LABELS: Record<string, string> = {
  "registration.edit": "Edited details",
  "registration.cancel": "Cancelled registration",
  "registration.reinstate": "Reinstated registration",
  "registration.link_regenerated": "Issued a new pass link (old QR stops working)",
  "payment.verified": "Re-checked payment with Paystack",
  "payment.offline": "Confirmed offline payment",
  "pass.resend": "Re-sent pass",
  "registration.export": "Exported registrations (CSV)",
  "checkin.medical": "Medically cleared",
  "checkin.medical.undo": "Undid medical clearance",
  "checkin.muster": "Checked in for ascent",
  "checkin.muster.undo": "Undid ascent check-in",
  "user.create": "Created user",
  "user.update": "Updated user",
  "user.reset_password": "Reset password",
  "user.password_changed": "Changed own password",
  "user.login": "Signed in",
};
