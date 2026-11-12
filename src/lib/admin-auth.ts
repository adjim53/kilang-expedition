import crypto from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "kil_admin";
const SESSION_HOURS = 18; // covers a full check-in shift

function secret() {
  const key = process.env.ADMIN_SECRET_KEY;
  // Refuse to run the portal with a missing or placeholder PIN.
  if (!key || key === "change-me") return null;
  return key;
}

function sign(payload: string, key: string) {
  return crypto.createHmac("sha256", key).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

export function adminConfigured() {
  return secret() !== null;
}

export function checkPin(pin: string) {
  const key = secret();
  if (!key) return false;
  // Hash both sides so the comparison is constant-time regardless of length.
  const a = crypto.createHash("sha256").update(pin).digest("hex");
  const b = crypto.createHash("sha256").update(key).digest("hex");
  return safeEqual(a, b);
}

export function createSessionValue() {
  const key = secret();
  if (!key) return null;
  const expires = String(Date.now() + SESSION_HOURS * 60 * 60 * 1000);
  return `${expires}.${sign(expires, key)}`;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_HOURS * 60 * 60,
  };
}

export async function isAdmin() {
  const key = secret();
  if (!key) return false;
  const value = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!value) return false;
  const [expires, signature] = value.split(".");
  if (!expires || !signature) return false;
  if (!safeEqual(signature, sign(expires, key))) return false;
  return Number(expires) > Date.now();
}

// ── Brute-force guard for the PIN form (per server instance) ───────────────
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000;

export function loginAllowed(ip: string) {
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt < Date.now()) return true;
  return entry.count < MAX_ATTEMPTS;
}

export function recordFailedLogin(ip: string) {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt < now) attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  else entry.count += 1;
}

export function clearFailedLogins(ip: string) {
  attempts.delete(ip);
}
