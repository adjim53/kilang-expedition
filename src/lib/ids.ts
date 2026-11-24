import crypto from "crypto";
import { EVENT } from "@/data/event";

// No 0/O/1/I/L — easy to read aloud at a 4 AM muster point.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

function randomChars(length: number) {
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

/** KIL-2026-XXXX */
export function generatePassId() {
  return `KIL-${EVENT.year}-${randomChars(4)}`;
}

/** Registration reference, e.g. KIL26-M3K9Q2X7TB4H */
export function generateReference() {
  return `KIL26-${randomChars(12)}`;
}

/** Paystack transaction reference for a donation, e.g. KILD-M3K9Q2X7TB4H */
export function generateDonationReference() {
  return `KILD-${randomChars(12)}`;
}

/** Secret token that unlocks a participant's pass page. */
export function generateAccessToken() {
  return crypto.randomBytes(24).toString("base64url");
}

/** Constant-time comparison for pass tokens. */
export function tokensMatch(given: string | null | undefined, expected: string) {
  if (!given) return false;
  const a = crypto.createHash("sha256").update(given).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}
