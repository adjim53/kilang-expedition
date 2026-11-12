/**
 * Checks every external integration with read-only API calls. Sends no email,
 * no SMS and creates no transaction.
 *
 *   npm run check:integrations            → report
 *   npm run check:integrations -- --strict → exit 1 on any failure (pre-launch gate)
 */
import "dotenv/config";
import { TERMII_DEFAULT_BASE_URL } from "../src/lib/sms";

type Status = "pass" | "warn" | "fail";
const results: { name: string; status: Status; detail: string }[] = [];
const report = (name: string, status: Status, detail: string) => results.push({ name, status, detail });

async function getJson(url: string, init?: RequestInit) {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(15_000) });
  const text = await res.text();
  let body: unknown = text;
  try {
    body = JSON.parse(text);
  } catch {
    // keep text
  }
  return { status: res.status, ok: res.ok, body: body as Record<string, unknown> };
}

async function checkPaystack() {
  const secret = process.env.PAYSTACK_SECRET_KEY ?? "";
  const pub = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ?? "";
  if (!secret || !pub) return report("Paystack", "fail", "PAYSTACK_SECRET_KEY / NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY not set (demo mode in dev, registration disabled in production)");

  const secretMode = secret.startsWith("sk_live_") ? "live" : secret.startsWith("sk_test_") ? "test" : "unknown";
  const pubMode = pub.startsWith("pk_live_") ? "live" : pub.startsWith("pk_test_") ? "test" : "unknown";
  if (secretMode !== pubMode) return report("Paystack", "fail", `key modes differ (secret: ${secretMode}, public: ${pubMode})`);

  const res = await getJson("https://api.paystack.co/balance", { headers: { Authorization: `Bearer ${secret}` } });
  if (!res.ok) return report("Paystack", "fail", `secret key rejected (HTTP ${res.status})`);
  report("Paystack", secretMode === "live" ? "pass" : "warn", `${secretMode} keys valid${secretMode === "test" ? " — switch to live keys before launch" : ""}`);
}

async function checkResend() {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "";
  if (!key || !from) return report("Resend", "fail", "RESEND_API_KEY / EMAIL_FROM not set — pass emails are skipped");

  const fromDomain = from.match(/@([^>\s]+)/)?.[1]?.toLowerCase();
  if (!fromDomain) return report("Resend", "fail", `EMAIL_FROM "${from}" has no email address`);

  const res = await getJson("https://api.resend.com/domains", { headers: { Authorization: `Bearer ${key}` } });
  if (!res.ok) return report("Resend", "fail", `API key rejected (HTTP ${res.status})`);

  const domains = (res.body.data as { name: string; status: string }[] | undefined) ?? [];
  const domain = domains.find((d) => d.name.toLowerCase() === fromDomain);
  if (!domain) {
    const known = domains.map((d) => d.name).join(", ") || "none";
    return report("Resend", "fail", `EMAIL_FROM domain ${fromDomain} is not added in Resend (added: ${known})`);
  }
  if (domain.status !== "verified") {
    return report("Resend", "fail", `domain ${fromDomain} is "${domain.status}" — add its DNS records and verify it in Resend`);
  }
  report("Resend", "pass", `sending from verified domain ${fromDomain}`);
}

async function checkTermii() {
  const key = process.env.TERMII_API_KEY;
  const sender = process.env.TERMII_SENDER_ID;
  if (!key || !sender) return report("Termii", "fail", "TERMII_API_KEY / TERMII_SENDER_ID not set — SMS are skipped");
  const base = (process.env.TERMII_BASE_URL || TERMII_DEFAULT_BASE_URL).replace(/\/$/, "");

  const bal = await getJson(`${base}/api/get-balance?api_key=${encodeURIComponent(key)}`);
  if (!bal.ok) return report("Termii", "fail", `API key rejected (HTTP ${bal.status})`);
  const balance = Number(bal.body.balance ?? 0);

  const ids = await getJson(`${base}/api/sender-id?api_key=${encodeURIComponent(key)}`);
  const list = ((ids.body.content ?? ids.body.data) as { sender_id: string; status: string }[] | undefined) ?? [];
  const match = list.find((s) => s.sender_id?.toLowerCase() === sender.toLowerCase());

  if (!match) report("Termii", "fail", `sender ID "${sender}" is not registered on this account — request it in the Termii dashboard`);
  else if (!/^(active|approved)$/i.test(match.status)) report("Termii", "fail", `sender ID "${sender}" is "${match.status}" — wait for Termii approval`);
  else report("Termii", "pass", `sender ID "${sender}" approved`);

  // One SMS costs roughly ₦4–₦6; warn below ~100 messages.
  report("Termii balance", balance >= 500 ? "pass" : "warn", `₦${balance.toLocaleString("en-NG")} — top up before launch (≈₦5 per SMS)`);
}

function checkConfig() {
  const admin = process.env.ADMIN_SECRET_KEY ?? "";
  if (!admin || admin === "change-me") report("Admin PIN", "fail", "ADMIN_SECRET_KEY missing or placeholder — check-in portal is locked");
  else if (admin.length < 12) report("Admin PIN", "warn", "ADMIN_SECRET_KEY is short — use 12+ characters");
  else report("Admin PIN", "pass", "set");

  const url = process.env.NEXT_PUBLIC_APP_URL ?? "";
  if (!url) report("App URL", "fail", "NEXT_PUBLIC_APP_URL not set — links in emails and QR codes will point to localhost");
  else if (!url.startsWith("https://")) report("App URL", "warn", `${url} — must be your public https:// URL in production (QR codes and email links use it)`);
  else report("App URL", "pass", url);
}

async function main() {
  checkConfig();
  for (const [name, fn] of [
    ["Paystack", checkPaystack],
    ["Resend", checkResend],
    ["Termii", checkTermii],
  ] as const) {
    try {
      await fn();
    } catch (err) {
      report(name, "fail", `request failed: ${(err as Error).message}`);
    }
  }

  const icon = { pass: "✔", warn: "!", fail: "✖" };
  for (const r of results) console.log(`${icon[r.status]} ${r.name.padEnd(15)} ${r.detail}`);

  const failed = results.some((r) => r.status === "fail");
  if (process.argv.includes("--strict") && failed) process.exit(1);
}

void main();
