import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registrationSchema } from "@/lib/validation";
import { getTiers } from "@/lib/tiers";
import { generateAccessToken, generateReference } from "@/lib/ids";
import { demoPaymentsEnabled, paystackConfigured, paystackPublicKey } from "@/lib/paystack";
import { normalizeNigerianPhone } from "@/lib/utils";

export const runtime = "nodejs";

/**
 * Step 1 of checkout: validate the form, store a PENDING registration and hand
 * the browser a payment reference. The price always comes from the server.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = registrationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }
  const data = parsed.data;

  const tier = (await getTiers()).find((t) => t.id === data.tierId);
  if (!tier) {
    return NextResponse.json(
      { error: "That ticket is not available.", fieldErrors: { tierId: ["Choose a ticket"] } },
      { status: 422 },
    );
  }

  if (!paystackConfigured() && !demoPaymentsEnabled()) {
    return NextResponse.json(
      { error: "Online payment is not available right now. Please contact the organisers." },
      { status: 503 },
    );
  }

  try {
    const registration = await prisma.registration.create({
      data: {
        reference: generateReference(),
        accessToken: generateAccessToken(),
        tierId: tier.id,
        amountKobo: tier.priceKobo,
        fullName: data.fullName,
        email: data.email,
        phone: normalizeNigerianPhone(data.phone)!,
        nextOfKinName: data.nextOfKinName,
        nextOfKinPhone: normalizeNigerianPhone(data.nextOfKinPhone)!,
        bloodGroup: data.bloodGroup,
        genotype: data.genotype,
        experience: data.experience,
        medicalNotes: data.medicalNotes || null,
        kitSize: data.kitSize,
        waiverAcceptedAt: new Date(),
      },
    });

    return NextResponse.json({
      reference: registration.reference,
      email: registration.email,
      amountKobo: registration.amountKobo,
      tierName: tier.name,
      mode: paystackConfigured() ? "paystack" : "demo",
      // Sent from the server so the key can change without rebuilding the site.
      publicKey: paystackConfigured() ? paystackPublicKey() : null,
    });
  } catch (err) {
    console.error("[register] failed to create registration", err);
    return NextResponse.json(
      { error: "We couldn't save your registration. Please try again." },
      { status: 500 },
    );
  }
}
