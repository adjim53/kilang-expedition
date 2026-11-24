import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApi } from "@/lib/admin-auth";
import type { Permission } from "@/lib/auth/roles";
import { confirmPendingRegistration, dispatchPass } from "@/lib/confirm";
import { generateAccessToken } from "@/lib/ids";
import { audit } from "@/lib/audit";
import { hit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("resend") }),
  z.object({ action: z.literal("confirm") }),
  z.object({ action: z.literal("regenerate_link") }),
  z.object({ action: z.literal("cancel"), reason: z.string().trim().min(3, "Give a reason").max(300) }),
  z.object({ action: z.literal("reinstate") }),
]);

const NEEDS: Record<z.infer<typeof schema>["action"], Permission> = {
  resend: "passes.resend",
  confirm: "registrations.edit",
  regenerate_link: "registrations.edit",
  cancel: "registrations.cancel",
  reinstate: "registrations.cancel",
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
      if (reg.status !== "REGISTERED") return fail("Only confirmed registrations have a pass to send.");
      if (!(await hit(`resend:${id}`, 5, 60 * 60 * 1000))) return fail("Re-sent several times in the last hour. Try later.", 429);
      const sent = await dispatchPass(id);
      await audit(user, "pass.resend", target, sent);
      return NextResponse.json({ ok: sent.email || sent.sms, sent, message: describeSend(sent) });
    }

    // Only for rows left over from before registration became free: the
    // climber started checkout and never paid. New registrations confirm themselves.
    case "confirm": {
      if (reg.status !== "PENDING") return fail("This registration is already confirmed.");
      const result = await confirmPendingRegistration(id);
      await audit(user, "registration.confirm", target, { ok: result.ok });
      if (!result.ok) return fail("Couldn't confirm this registration.", 500);
      return NextResponse.json({ ok: true, message: `Confirmed. Pass ${result.passId} issued and sent.` });
    }

    case "regenerate_link": {
      if (reg.status !== "REGISTERED") return fail("Only confirmed registrations have a pass link.");
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
        message: reg.status === "REGISTERED" ? "Cancelled. The pass now shows as cancelled when scanned." : "Cancelled.",
      });
    }

    case "reinstate": {
      if (reg.status !== "CANCELLED") return fail("This registration is not cancelled.");
      const status = reg.passId ? "REGISTERED" : "PENDING";
      await prisma.registration.update({ where: { id }, data: { status, cancelledAt: null, cancelReason: null } });
      await audit(user, "registration.reinstate", target, { status });
      return NextResponse.json({
        ok: true,
        message: status === "REGISTERED" ? "Reinstated. The pass works again." : "Reinstated. Confirm it to issue a pass.",
      });
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
