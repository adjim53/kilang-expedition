import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApi } from "@/lib/admin-auth";
import { confirmDonation, toDonationItem } from "@/lib/donations";
import { verifyTransaction } from "@/lib/paystack";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

/**
 * Re-check a donation that shows as "not completed" with Paystack — e.g. the
 * donor paid but closed the page before it could confirm and the webhook was
 * missed. Only ever confirms what Paystack itself reports as received.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireApi(request, "donations.view");
  if (guard.error) return guard.error;
  const { id } = await params;

  const donation = await prisma.donation.findUnique({ where: { id } });
  if (!donation) return NextResponse.json({ error: "Donation not found." }, { status: 404 });
  if (donation.status === "PAID") {
    return NextResponse.json({ ok: true, message: "Already received.", donation: toDonationItem(donation) });
  }

  const tx = await verifyTransaction(donation.reference);
  if (!tx || tx.status !== "success" || tx.currency !== "NGN") {
    const result = tx ? tx.status : "not found at Paystack";
    await audit(guard.user, "donation.verified", {}, { reference: donation.reference, result });
    return NextResponse.json({
      ok: false,
      message: tx ? `Paystack says this payment is "${tx.status}".` : "Paystack has no payment for this donation.",
      donation: toDonationItem(donation),
    });
  }

  const result = await confirmDonation(donation.reference, { transactionId: tx.id, amountKobo: tx.amountKobo });
  await audit(guard.user, "donation.verified", {}, { reference: donation.reference, result: result.ok ? "received" : result.reason });
  if (!result.ok) return NextResponse.json({ error: "Couldn't confirm this donation." }, { status: 500 });
  return NextResponse.json({
    ok: true,
    message: "Paystack confirms this donation was received. Receipt emailed.",
    donation: toDonationItem(result.donation),
  });
}
