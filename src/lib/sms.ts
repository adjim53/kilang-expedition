/**
 * Termii SMS wrapper.
 * Docs: https://developers.termii.com/messaging-api
 *
 * TERMII_SENDER_ID must be a sender ID approved on your Termii account
 * (Termii dashboard → Sender ID). Until it is approved, Termii rejects sends.
 * Use channel "dnd" (transactional route) if messages to DND numbers are not
 * arriving — it must be enabled on your account first.
 */

export type SmsResult = { ok: boolean; skipped?: boolean; messageId?: string; error?: string };

export const TERMII_DEFAULT_BASE_URL = "https://api.ng.termii.com";

export function termiiBaseUrl() {
  return (process.env.TERMII_BASE_URL || TERMII_DEFAULT_BASE_URL).replace(/\/$/, "");
}

export function passConfirmationSms(passId: string) {
  return `Welcome to Kilang Expedition 2026! Your Pass ID is ${passId}. See you Dec 30 at Kaleh Infotech for Medicals.`;
}

type TermiiSendResponse = {
  code?: string;
  message_id?: string;
  message?: string;
  balance?: number;
};

export async function sendSms(toNormalized: string, message: string): Promise<SmsResult> {
  const apiKey = process.env.TERMII_API_KEY;
  const senderId = process.env.TERMII_SENDER_ID;

  if (!apiKey || !senderId) {
    console.info(`[sms] Termii not configured — skipped SMS to ${toNormalized}: "${message}"`);
    return { ok: false, skipped: true };
  }

  try {
    const res = await fetch(`${termiiBaseUrl()}/api/sms/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        to: toNormalized,
        from: senderId,
        sms: message,
        type: "plain",
        channel: process.env.TERMII_CHANNEL || "generic",
      }),
      signal: AbortSignal.timeout(15_000),
    });

    const raw = await res.text();
    let body: TermiiSendResponse = {};
    try {
      body = JSON.parse(raw) as TermiiSendResponse;
    } catch {
      // non-JSON error page
    }

    // Termii answers 200 + { code: "ok", message_id } on success. Anything else
    // (unapproved sender ID, low balance, bad number) is a failure.
    if (!res.ok || (body.code !== "ok" && !body.message_id)) {
      const reason = body.message || raw.slice(0, 200) || `HTTP ${res.status}`;
      console.error(`[sms] Termii rejected SMS to ${toNormalized} (${res.status}): ${reason}`);
      return { ok: false, error: reason };
    }

    return { ok: true, messageId: body.message_id };
  } catch (err) {
    console.error("[sms] Termii request failed", err);
    return { ok: false, error: "Termii request failed" };
  }
}
