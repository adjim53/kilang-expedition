import crypto from "crypto";
import { promisify } from "util";

/**
 * Password hashing with Node's built-in scrypt (memory-hard, no extra
 * dependency). Stored format: scrypt$N$r$p$saltBase64$hashBase64
 */
const scrypt = promisify(crypto.scrypt) as (
  password: crypto.BinaryLike,
  salt: crypto.BinaryLike,
  keylen: number,
  options: crypto.ScryptOptions,
) => Promise<Buffer>;

const N = 16384;
const R = 8;
const P = 1;
const KEY_LENGTH = 64;
const MAX_MEMORY = 64 * 1024 * 1024;

export const MIN_PASSWORD_LENGTH = 10;

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const hash = await scrypt(password.normalize("NFKC"), salt, KEY_LENGTH, { N, r: R, p: P, maxmem: MAX_MEMORY });
  return ["scrypt", N, R, P, salt.toString("base64"), hash.toString("base64")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, n, r, p, saltB64, hashB64] = stored.split("$");
  if (scheme !== "scrypt" || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64");
  const actual = await scrypt(password.normalize("NFKC"), Buffer.from(saltB64, "base64"), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: MAX_MEMORY,
  });
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

/** A hash to verify against when the email is unknown, so timing doesn't reveal which accounts exist. */
let dummyHash: Promise<string> | null = null;
export function dummyPasswordHash() {
  dummyHash ??= hashPassword(crypto.randomBytes(16).toString("hex"));
  return dummyHash;
}

/** Readable temporary password, e.g. "kilang-7QF4-MX2P-9RTD". The user must change it on first sign-in. */
export function generateTemporaryPassword() {
  const alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  const bytes = crypto.randomBytes(12);
  const chars = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  return `kilang-${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}`;
}

/** Returns an error message, or null if the new password is acceptable. */
export function passwordProblem(password: string, context: { email?: string; name?: string } = {}): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  if (password.length > 200) return "That password is too long.";
  const lower = password.toLowerCase();
  if (/^(.)\1+$/.test(password)) return "Don't repeat one character.";
  const banned = ["password", "kilang2026", "kilangexpedition", "1234567890", "qwertyuiop"];
  if (banned.some((b) => lower.includes(b))) return "That password is too easy to guess.";
  const local = context.email?.split("@")[0]?.toLowerCase();
  if (local && local.length >= 4 && lower.includes(local)) return "Don't use your email address in your password.";
  return null;
}
