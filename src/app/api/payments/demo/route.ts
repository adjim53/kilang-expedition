import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { confirmDonation } from "@/lib/donations";
import { demoPaymentsEnabled } from "@/lib/paystack";

export const runtime = "nodejs";

/**
 * DEVELOPMENT ONLY. Simulates a successful donation so the full flow can be
 * tested without Paystack keys. Returns 404 in production or once keys are set.
 */
export async function POST(request: Request) {
  if (!demoPaymentsEnabled()) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const { reference } = (await request.json().catch(() => ({}))) as { reference?: string };
  if (!reference) return NextResponse.json({ error: "Missing reference." }, { status: 400 });

  const donation = await prisma.donation.findUnique({ where: { reference } });
  if (!donation) return NextResponse.json({ error: "Donation not found." }, { status: 404 });

  const result = await confirmDonation(reference, {
    transactionId: `demo-${Date.now()}`,
    amountKobo: donation.amountKobo,
  });
  if (!result.ok) return NextResponse.json({ error: "Could not confirm." }, { status: 500 });

  return NextResponse.json({
    received: true,
    reference: result.donation.reference,
    amountKobo: result.donation.amountKobo,
    receiptSent: Boolean(result.donation.receiptSentAt),
  });
}
