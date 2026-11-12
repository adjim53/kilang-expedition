import { Resend } from "resend";
import { CONTACT, EVENT, SCHEDULE } from "@/data/event";
import { PACKING_LIST } from "@/data/content";
import { passUrl, qrPngBuffer } from "./qr";
import { appUrl } from "./utils";

export type EmailResult = { ok: boolean; skipped?: boolean; error?: string };

type PassEmailInput = {
  fullName: string;
  email: string;
  passId: string;
  accessToken: string;
  tierName: string;
};

function esc(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderPassEmail(input: PassEmailInput) {
  const url = passUrl(input.passId, input.accessToken);
  const waiverUrl = `${appUrl()}/waiver`;
  const firstName = input.fullName.split(" ")[0];

  const scheduleRows = SCHEDULE.map(
    (s) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #EADFC8;vertical-align:top;width:92px;font-weight:700;color:#134E4A;">${esc(s.day)}<br><span style="font-weight:500;color:#5b6b69;font-size:12px;">${esc(s.time)}</span></td>
        <td style="padding:10px 0 10px 12px;border-bottom:1px solid #EADFC8;vertical-align:top;">
          <strong style="color:#0C211F;">${esc(s.title)}</strong><br>
          <span style="color:#5b6b69;font-size:13px;">${esc(s.venue)}</span>
        </td>
      </tr>`,
  ).join("");

  const packing = PACKING_LIST.map(
    (g) => `
      <p style="margin:16px 0 6px;font-weight:700;color:#134E4A;">${esc(g.group)}</p>
      <ul style="margin:0;padding-left:18px;color:#33423f;font-size:14px;line-height:1.6;">
        ${g.items.map((i) => `<li>${esc(i)}</li>`).join("")}
      </ul>`,
  ).join("");

  const html = `<!doctype html>
<html lang="en">
<body style="margin:0;background:#F5EFE2;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0C211F;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5EFE2;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;">
        <tr><td style="background:#134E4A;padding:28px 28px 24px;color:#ffffff;">
          <p style="margin:0;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#F59E0B;font-weight:700;">${esc(EVENT.name)}</p>
          <h1 style="margin:10px 0 0;font-family:Georgia,serif;font-size:28px;line-height:1.2;font-weight:600;">You're on the mountain, ${esc(firstName)}.</h1>
        </td></tr>

        <tr><td style="padding:28px;">
          <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#33423f;">Your payment is confirmed and your place on the expedition is secured. This is your digital expedition pass — show the QR code at the medical checkup on December 30 and again at the 4:00 AM muster on December 31.</p>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:2px dashed #134E4A;border-radius:14px;">
            <tr><td align="center" style="padding:22px;">
              <p style="margin:0;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#5b6b69;">Pass ID</p>
              <p style="margin:4px 0 14px;font-family:Georgia,serif;font-size:30px;font-weight:700;color:#134E4A;letter-spacing:1px;">${esc(input.passId)}</p>
              <img src="cid:pass-qr" width="200" height="200" alt="QR code for pass ${esc(input.passId)}" style="display:block;border:0;">
              <p style="margin:14px 0 0;font-size:14px;color:#0C211F;"><strong>${esc(input.fullName)}</strong><br><span style="color:#5b6b69;">${esc(input.tierName)}</span></p>
            </td></tr>
          </table>

          <p style="margin:22px 0 0;text-align:center;">
            <a href="${url}" style="display:inline-block;background:#F59E0B;color:#0C211F;text-decoration:none;font-weight:700;padding:13px 22px;border-radius:999px;">Open &amp; download your pass</a>
          </p>
          <p style="margin:12px 0 0;text-align:center;font-size:13px;">
            <a href="${waiverUrl}" style="color:#134E4A;">Read the safety waiver you accepted</a>
          </p>

          <h2 style="margin:32px 0 6px;font-family:Georgia,serif;font-size:20px;color:#134E4A;">Your schedule</h2>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;line-height:1.45;">${scheduleRows}</table>

          <h2 style="margin:32px 0 0;font-family:Georgia,serif;font-size:20px;color:#134E4A;">Packing list</h2>
          ${packing}

          <p style="margin:28px 0 0;padding:14px 16px;background:#FBF8F1;border-left:4px solid #F59E0B;font-size:14px;line-height:1.55;color:#33423f;">
            <strong>No medical clearance, no climb.</strong> The checkup on December 30 is mandatory. Ensure you are medically fit. Stay safe.
          </p>
        </td></tr>

        <tr><td style="background:#0A2B29;padding:20px 28px;color:#A9D2CD;font-size:12px;line-height:1.6;">
          Questions? ${esc(CONTACT.email)} · ${CONTACT.phones.map(esc).join(" · ")}<br>
          ${esc(CONTACT.handle)} on X, Instagram, TikTok, Facebook and YouTube
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    `${EVENT.name}`,
    ``,
    `You're on the mountain, ${firstName}. Your payment is confirmed.`,
    ``,
    `Pass ID: ${input.passId}`,
    `Name: ${input.fullName}`,
    `Ticket: ${input.tierName}`,
    `Your pass: ${url}`,
    `Safety waiver: ${waiverUrl}`,
    ``,
    `Schedule`,
    ...SCHEDULE.map((s) => `- ${s.day}, ${s.time}: ${s.title} — ${s.venue}`),
    ``,
    `Packing list`,
    ...PACKING_LIST.flatMap((g) => [`${g.group}:`, ...g.items.map((i) => `  - ${i}`)]),
    ``,
    `Questions? ${CONTACT.email} · ${CONTACT.phones.join(", ")}`,
  ].join("\n");

  return { html, text, subject: `Your Kilang Expedition pass — ${input.passId}` };
}

export async function sendPassEmail(input: PassEmailInput): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    console.info(`[email] Resend not configured — skipped pass email to ${input.email} (${input.passId})`);
    return { ok: false, skipped: true };
  }

  try {
    const { html, text, subject } = renderPassEmail(input);
    const qr = await qrPngBuffer(passUrl(input.passId, input.accessToken));
    const resend = new Resend(apiKey);

    const { error } = await resend.emails.send({
      from,
      to: input.email,
      replyTo: CONTACT.email,
      subject,
      html,
      text,
      attachments: [
        // Shown inline in the email body (cid:pass-qr) and downloadable.
        { filename: `${input.passId}-pass-qr.png`, content: qr, contentId: "pass-qr" },
      ],
    });

    if (error) {
      console.error("[email] Resend error", error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    console.error("[email] send failed", err);
    return { ok: false, error: "Email send failed" };
  }
}
