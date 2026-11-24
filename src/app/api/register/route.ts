import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registrationSchema } from "@/lib/validation";
import { createRegistration, dispatchPass } from "@/lib/confirm";
import { normalizeNigerianPhone } from "@/lib/utils";
import { clientIp, hit } from "@/lib/rate-limit";
import { z } from "zod";

export const runtime = "nodejs";

/**
 * Registration is free and automatic: validate the form, store the climber,
 * assign the KIL-2026-XXXX pass ID and QR code, send the pass by email and SMS,
 * and hand the browser the pass link — all in one request.
 */
export async function POST(request: Request) {
  // Each attempt stores a row and sends an SMS; cap how fast one address can
  // create them. Generous because Nigerian mobile networks put many customers
  // behind one shared address; this only stops scripted floods.
  if (!(await hit(`register:${clientIp(request)}`, 100, 10 * 60 * 1000))) {
    return NextResponse.json(
      { error: "Too many registrations from this connection. Please wait a few minutes and try again." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = registrationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors },
      { status: 422 },
    );
  }
  const data = parsed.data;
  const phone = normalizeNigerianPhone(data.phone)!;

  try {
    // One registration per climber. A second submission with the same name,
    // email and phone gets the existing pass re-sent, not a second pass. The
    // pass link is never returned here: it goes only to the email and phone on record.
    const existing = await prisma.registration.findFirst({
      where: {
        status: "REGISTERED",
        email: data.email,
        phone,
        fullName: { equals: data.fullName, mode: "insensitive" },
      },
    });
    if (existing) {
      if (await hit(`resend:${existing.id}`, 5, 60 * 60 * 1000)) await dispatchPass(existing.id);
      return NextResponse.json(
        {
          error:
            "You are already registered. We have sent your pass again to the email address and phone number you registered with.",
        },
        { status: 409 },
      );
    }

    const registration = await createRegistration({
      fullName: data.fullName,
      email: data.email,
      phone,
      nextOfKinName: data.nextOfKinName,
      nextOfKinPhone: normalizeNigerianPhone(data.nextOfKinPhone)!,
      bloodGroup: data.bloodGroup,
      genotype: data.genotype,
      experience: data.experience,
      medicalNotes: data.medicalNotes || null,
      kitSize: data.kitSize,
      waiverAcceptedAt: new Date(),
    });

    // Email + SMS. A delivery failure never fails the registration: the pass
    // is on screen, and staff see the failure in the back office and can resend.
    const sent = await dispatchPass(registration.id).catch((err) => {
      console.error("[register] pass dispatch failed", err);
      return { email: false, sms: false };
    });

    return NextResponse.json({
      passId: registration.passId,
      passUrl: `/pass/${registration.passId}?t=${registration.accessToken}&new=1`,
      sent: { email: sent.email, sms: sent.sms },
    });
  } catch (err) {
    console.error("[register] failed to create registration", err);
    return NextResponse.json(
      { error: "We couldn't save your registration. Please try again." },
      { status: 500 },
    );
  }
}
