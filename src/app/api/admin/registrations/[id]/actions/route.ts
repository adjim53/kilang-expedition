import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApi } from "@/lib/admin-auth";
import type { Permission } from "@/lib/auth/roles";
import { confirmRegistration, dispatchPass } from "@/lib/confirm";
import { verifyTransaction } from "@/lib/paystack";
import { generateAccessToken } from "@/lib/ids";
import { audit } from "@/lib/audit";
import { hit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("resend") }),
  z.object({ action: z.literal("verify_payment") }),
  z.object({ action: z.literal("regenerate_link") }),
  z.object({ action: z.literal("cancel"), reason: z.string().trim().min(3, "Give a reason").max(300) }),
  z.object({ action: z.literal("reinstate") }),
  z.object({ action: z.literal("mark_paid_offline"), note: z.string().trim().min(3, "Add a receipt or note").max(300) }),
]);

const NEEDS: Record<z.infer<typeof schema>["action"], Permission> = {
  resend: "passes.resend",
  verify_payment: "payments.verify",
  regenerate_link: "registrations.edit",
  cancel: "registrations.cancel",
  reinstate: "registrations.cancel",
  mark_paid_offline: "payments.offline",
};

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid request.");

  const guard = await requireApi(request, NEEDS[parsed.data.action]);
  if (guard.error) return guard.error;
  const { user } = guard;
  const { id } = await params;

  const reg = await prisma.registration.findUnique({ where: { id } });
  if (!reg) return fail("Registration not found.", 404);
  const target = { registrationId: id };

  switch (parsed.data.action) {
    case "resend": {
      if (reg.status !== "PAID") return fail("Only paid registrations have a pass to send.");
      if (!(await hit(`resend:${id}`, 5, 60 * 60 * 1000))) return fail("Re-sent several times in the last hour. Try later.", 429);
      const sent = await dispatchPass(id);
      await audit(user, "pass.resend", target, sent);
      return NextResponse.json({ ok: sent.email || sent.sms, sent, message: describeSend(sent) });
    }

    case "verify_payment": {
      if (reg.status !== "PENDING") return fail("This registration is not waiting for payment.");
      const tx = await verifyTransaction(reg.reference);
      if (!tx) {
        await audit(user, "payment.verified", target, { result: "not found at Paystack" });
        return NextResponse.json({ ok: false, message: "Paystack has no payment for this registration yet." });
      }
      if (tx.status !== "success" || tx.currency !== "NGN") {
        await audit(user, "payment.verified", target, { result: tx.status });
        return NextResponse.json({ ok: false, message: `Paystack says this payment is "${tx.status}".` });
      }
      const result = await confirmRegistration(reg.reference, { transactionId: tx.id, amountKobo: tx.amountKobo });
      await audit(user, "payment.verified", target, { result: result.ok ? "confirmed" : result.reason });
      if (!result.ok) {
        return NextResponse.json({
          ok: false,
          message:
            result.reason === "amount_mismatch"
              ? "Paystack received less than the ticket price. Not confirmed."
              : "Couldn't confirm this payment.",
        });
      }
      return NextResponse.json({ ok: true, message: `Payment confirmed. Pass ${result.passId} issued and sent.` });
    }

    case "regenerate_link": {
      if (reg.status !== "PAID") return fail("Only paid registrations have a pass link.");
      await prisma.registration.update({ where: { id }, data: { accessToken: generateAccessToken() } });
      const sent = await dispatchPass(id);
      await audit(user, "registration.link_regenerated", target, sent);
      return NextResponse.json({
        ok: true,
        message: `New pass link issued; the old QR code no longer works. ${describeSend(sent)}`,
      });
    }

    case "cancel": {
      if (reg.status === "CANCELLED") return fail("Already cancelled.");
      await prisma.registration.update({
        where: { id },
        data: { status: "CANCELLED", cancelledAt: new Date(), cancelReason: parsed.data.reason },
      });
      await audit(user, "registration.cancel", target, { reason: parsed.data.reason, previousStatus: reg.status });
      return NextResponse.json({
        ok: true,
        message:
          reg.status === "PAID"
            ? "Cancelled. The pass now shows as cancelled when scanned. Refund the payment in the Paystack dashboard if one is due."
            : "Cancelled.",
      });
    }

    case "reinstate": {
      if (reg.status !== "CANCELLED") return fail("This registration is not cancelled.");
      const status = reg.paidAt && reg.passId ? "PAID" : "PENDING";
      await prisma.registration.update({ where: { id }, data: { status, cancelledAt: null, cancelReason: null } });
      await audit(user, "registration.reinstate", target, { status });
      return NextResponse.json({ ok: true, message: `Reinstated as ${status.toLowerCase()}.` });
    }

    case "mark_paid_offline": {
      if (reg.status !== "PENDING") return fail("Only registrations waiting for payment can be marked paid.");
      const result = await confirmRegistration(reg.reference, {
        transactionId: `offline: ${parsed.data.note} (by ${user.name})`.slice(0, 300),
        amountKobo: reg.amountKobo,
      });
      await audit(user, "payment.offline", target, { note: parsed.data.note, ok: result.ok });
      if (!result.ok) return fail("Couldn't confirm this registration.", 500);
      return NextResponse.json({ ok: true, message: `Marked paid. Pass ${result.passId} issued and sent.` });
    }
  }
}

function describeSend(sent: { email: boolean; sms: boolean; emailError?: string | null; smsError?: string | null }) {
  const parts = [
    sent.email ? "Email sent." : `Email not sent (${sent.emailError ?? "unknown error"}).`,
    sent.sms ? "SMS sent." : `SMS not sent (${sent.smsError ?? "unknown error"}).`,
  ];
  return parts.join(" ");
}
