import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { donationSchema } from "@/lib/validation";
import { generateDonationReference } from "@/lib/ids";
import { demoPaymentsEnabled, paystackConfigured, paystackPublicKey } from "@/lib/paystack";
import { normalizeNigerianPhone } from "@/lib/utils";
import { clientIp, hit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * Step 1 of a donation: validate the form, store a PENDING donation and hand
 * the browser a Paystack reference. Nothing counts as received until Paystack
 * confirms it (see /api/payments/verify and /api/webhooks/paystack).
 */
export async function POST(request: Request) {
  if (!(await hit(`donate:${clientIp(request)}`, 60, 10 * 60 * 1000))) {
    return NextResponse.json(
      { error: "Too many attempts from this connection. Please wait a few minutes and try again." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = donationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors },
      { status: 422 },
    );
  }
  const data = parsed.data;

  if (!paystackConfigured() && !demoPaymentsEnabled()) {
    return NextResponse.json(
      { error: "Online donations are not available right now. Please contact the organisers." },
      { status: 503 },
    );
  }

  try {
    const donation = await prisma.donation.create({
      data: {
        reference: generateDonationReference(),
        amountKobo: data.amountNaira * 100,
        donorType: data.donorType,
        donorName: data.donorName,
        organisation: data.donorType === "PARTNER" ? data.organisation : data.organisation || null,
        email: data.email,
        phone: data.phone ? normalizeNigerianPhone(data.phone) : null,
        message: data.message || null,
      },
    });

    return NextResponse.json({
      reference: donation.reference,
      email: donation.email,
      amountKobo: donation.amountKobo,
      mode: paystackConfigured() ? "paystack" : "demo",
      // Sent from the server so the key can change without rebuilding the site.
      publicKey: paystackConfigured() ? paystackPublicKey() : null,
    });
  } catch (err) {
    console.error("[donations] failed to create donation", err);
    return NextResponse.json({ error: "We couldn't start your donation. Please try again." }, { status: 500 });
  }
}
