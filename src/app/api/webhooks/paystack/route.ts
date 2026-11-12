import { NextResponse } from "next/server";
import { confirmRegistration } from "@/lib/confirm";
import { isValidWebhookSignature, verifyTransaction } from "@/lib/paystack";

export const runtime = "nodejs";

/**
 * Paystack webhook. Set this URL in the Paystack dashboard:
 *   https://YOUR-DOMAIN/api/webhooks/paystack
 *
 * 1. Check the x-paystack-signature header (HMAC-SHA512 of the raw body).
 * 2. Re-verify the transaction reference with Paystack's API.
 * 3. Confirm the registration → pass ID, email and SMS.
 *
 * Always answers 200 once the signature is valid so Paystack stops retrying.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();

  if (!isValidWebhookSignature(rawBody, request.headers.get("x-paystack-signature"))) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let event: { event?: string; data?: { reference?: string } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  if (event.event !== "charge.success" || !event.data?.reference) {
    return NextResponse.json({ received: true });
  }

  const reference = event.data.reference;
  const tx = await verifyTransaction(reference);

  if (!tx) {
    // Paystack was unreachable — ask it to retry the webhook later.
    return NextResponse.json({ error: "Verification unavailable." }, { status: 503 });
  }
  if (tx.status !== "success" || tx.currency !== "NGN") {
    return NextResponse.json({ received: true });
  }

  const result = await confirmRegistration(reference, { transactionId: tx.id, amountKobo: tx.amountKobo });
  if (!result.ok) console.error(`[webhook] could not confirm ${reference}: ${result.reason}`);

  return NextResponse.json({ received: true });
}
