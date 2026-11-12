import { NextResponse } from "next/server";
import { confirmRegistration } from "@/lib/confirm";
import { verifyTransaction } from "@/lib/paystack";

export const runtime = "nodejs";

/**
 * Called by the browser right after Paystack reports success, so the climber
 * sees their pass immediately instead of waiting for the webhook. The result
 * is still checked with Paystack server-side — the browser is never trusted.
 */
export async function GET(request: Request) {
  const reference = new URL(request.url).searchParams.get("reference");
  if (!reference) return NextResponse.json({ error: "Missing reference." }, { status: 400 });

  const tx = await verifyTransaction(reference);
  if (!tx) {
    return NextResponse.json({ error: "We couldn't verify this payment yet." }, { status: 502 });
  }
  if (tx.status !== "success" || tx.currency !== "NGN") {
    return NextResponse.json({ status: tx.status, error: "Payment has not been completed." }, { status: 402 });
  }

  const result = await confirmRegistration(reference, { transactionId: tx.id, amountKobo: tx.amountKobo });
  if (!result.ok) {
    const message =
      result.reason === "amount_mismatch"
        ? "The amount paid does not match this ticket. Please contact the organisers."
        : "We couldn't find this registration. Please contact the organisers with your payment reference.";
    return NextResponse.json({ error: message }, { status: 409 });
  }

  return NextResponse.json({ passId: result.passId, passUrl: `/pass/${result.passId}?t=${result.accessToken}` });
}
