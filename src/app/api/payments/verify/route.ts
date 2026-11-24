import { NextResponse } from "next/server";
import { confirmDonation } from "@/lib/donations";
import { verifyTransaction } from "@/lib/paystack";

export const runtime = "nodejs";

/**
 * Called by the browser right after Paystack reports success, so the donor
 * sees the thank-you immediately instead of waiting for the webhook. The
 * result is still checked with Paystack server-side — the browser is never trusted.
 */
export async function GET(request: Request) {
  const reference = new URL(request.url).searchParams.get("reference");
  if (!reference || reference.length > 100) return NextResponse.json({ error: "Missing reference." }, { status: 400 });

  const tx = await verifyTransaction(reference);
  if (!tx) {
    return NextResponse.json({ error: "We couldn't verify this donation yet." }, { status: 502 });
  }
  if (tx.status !== "success" || tx.currency !== "NGN") {
    return NextResponse.json({ status: tx.status, error: "The payment has not been completed." }, { status: 402 });
  }

  const result = await confirmDonation(reference, { transactionId: tx.id, amountKobo: tx.amountKobo });
  if (!result.ok) {
    return NextResponse.json(
      { error: "We couldn't match this payment to a donation. Please contact the organisers with your payment reference." },
      { status: 409 },
    );
  }

  return NextResponse.json({
    received: true,
    reference: result.donation.reference,
    amountKobo: result.donation.amountKobo,
    receiptSent: Boolean(result.donation.receiptSentAt),
  });
}
