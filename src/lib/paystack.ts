import crypto from "crypto";
import { runtimeEnv } from "./utils";

const PAYSTACK_BASE = "https://api.paystack.co";

/** "test" | "live" | null, from the secret key prefix. */
export function paystackMode() {
  const key = process.env.PAYSTACK_SECRET_KEY ?? "";
  if (key.startsWith("sk_live_")) return "live" as const;
  if (key.startsWith("sk_test_")) return "test" as const;
  return null;
}

export function paystackPublicKey() {
  return runtimeEnv("NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY") ?? "";
}

export function paystackConfigured() {
  return Boolean(process.env.PAYSTACK_SECRET_KEY && paystackPublicKey());
}

/**
 * Demo mode lets you walk through the whole flow locally without Paystack keys.
 * It can never be active in production.
 */
export function demoPaymentsEnabled() {
  return !paystackConfigured() && process.env.NODE_ENV !== "production";
}

export type VerifiedTransaction = {
  id: string;
  reference: string;
  status: string;
  amountKobo: number;
  currency: string;
};

/** Ask Paystack directly for the state of a transaction. Never trust the browser. */
export async function verifyTransaction(reference: string): Promise<VerifiedTransaction | null> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return null;

  let res: Response;
  try {
    res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secret}` },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch (err) {
    console.error("[paystack] verify request failed", err);
    return null;
  }
  if (!res.ok) return null;

  const json = (await res.json()) as {
    status: boolean;
    data?: { id: number; reference: string; status: string; amount: number; currency: string };
  };
  if (!json.status || !json.data) return null;

  return {
    id: String(json.data.id),
    reference: json.data.reference,
    status: json.data.status,
    amountKobo: json.data.amount,
    currency: json.data.currency,
  };
}

/** Paystack signs webhook bodies with HMAC-SHA512 using your secret key. */
export function isValidWebhookSignature(rawBody: string, signature: string | null) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !signature) return false;
  const expected = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
