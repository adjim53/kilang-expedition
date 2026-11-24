import type { Donation, Prisma } from "@prisma/client";
import { DONOR_TYPE_LABELS, type DonorType } from "@/data/donations";
import { prisma } from "./prisma";
import { sendDonationReceipt } from "./email";
import { csvCell } from "./registrations";

export type DonationConfirmResult =
  | { ok: true; donation: Donation; alreadyConfirmed: boolean }
  | { ok: false; reason: "not_found" | "error" };

/**
 * Marks a donation as received and emails the thank-you receipt. Safe to call
 * more than once for the same reference: the Paystack webhook and the browser's
 * verify call often race, and only one of them wins.
 *
 * The amount stored is what Paystack actually received, whatever was pledged.
 */
export async function confirmDonation(
  reference: string,
  payment: { transactionId: string; amountKobo: number },
): Promise<DonationConfirmResult> {
  const existing = await prisma.donation.findUnique({ where: { reference } });
  if (!existing) return { ok: false, reason: "not_found" };
  if (existing.status === "PAID") return { ok: true, donation: existing, alreadyConfirmed: true };

  let won = false;
  try {
    const result = await prisma.donation.updateMany({
      where: { reference, status: "PENDING" },
      data: {
        status: "PAID",
        paidAt: new Date(),
        paystackTxId: payment.transactionId,
        amountKobo: payment.amountKobo,
      },
    });
    won = result.count > 0;
  } catch (err) {
    console.error("[donation] failed to confirm", err);
    return { ok: false, reason: "error" };
  }

  const confirmed = await prisma.donation.findUnique({ where: { reference } });
  if (!confirmed || confirmed.status !== "PAID") return { ok: false, reason: "error" };
  if (won) await dispatchReceipt(confirmed.id);
  return { ok: true, donation: confirmed, alreadyConfirmed: !won };
}

/** Sends (or re-sends) the thank-you receipt, recording the outcome. */
export async function dispatchReceipt(donationId: string) {
  const d = await prisma.donation.findUnique({ where: { id: donationId } });
  if (!d || d.status !== "PAID") return { email: false, emailError: null as string | null };

  const email = await sendDonationReceipt({
    donorName: d.donorName,
    organisation: d.organisation,
    email: d.email,
    amountKobo: d.amountKobo,
    reference: d.reference,
    paidAt: d.paidAt ?? new Date(),
  });
  const emailError = email.ok ? null : email.skipped ? "Email is not configured on the server" : (email.error ?? "Email failed");
  await prisma.donation.update({
    where: { id: d.id },
    data: { ...(email.ok ? { receiptSentAt: new Date() } : {}), receiptError: emailError?.slice(0, 300) ?? null },
  });
  return { email: email.ok, emailError };
}

// ── Back office ─────────────────────────────────────────────────────────────

export const DONATION_STATUSES = ["PAID", "PENDING"] as const;

export type DonationFilters = { q?: string; status?: string; donorType?: string };

export function donationFiltersFromSearchParams(params: URLSearchParams): DonationFilters {
  return {
    q: params.get("q")?.trim().slice(0, 100) || undefined,
    status: params.get("status") || undefined,
    donorType: params.get("type") || undefined,
  };
}

export function donationWhere(f: DonationFilters): Prisma.DonationWhereInput {
  const and: Prisma.DonationWhereInput[] = [];
  if (f.status && (DONATION_STATUSES as readonly string[]).includes(f.status)) and.push({ status: f.status });
  if (f.donorType && f.donorType in DONOR_TYPE_LABELS) and.push({ donorType: f.donorType });
  if (f.q) {
    and.push({
      OR: [
        { donorName: { contains: f.q, mode: "insensitive" } },
        { organisation: { contains: f.q, mode: "insensitive" } },
        { email: { contains: f.q, mode: "insensitive" } },
        { reference: { contains: f.q, mode: "insensitive" } },
      ],
    });
  }
  return and.length ? { AND: and } : {};
}

export function donorTypeLabel(type: string) {
  return DONOR_TYPE_LABELS[type as DonorType] ?? type;
}

export function toDonationItem(d: Donation) {
  return {
    id: d.id,
    reference: d.reference,
    status: d.status,
    amountKobo: d.amountKobo,
    donorType: d.donorType,
    donorName: d.donorName,
    organisation: d.organisation,
    email: d.email,
    phone: d.phone,
    message: d.message,
    createdAt: d.createdAt.toISOString(),
    paidAt: d.paidAt?.toISOString() ?? null,
    paystackTxId: d.paystackTxId,
    receiptSent: Boolean(d.receiptSentAt),
    receiptError: d.receiptError,
  };
}
export type DonationItem = ReturnType<typeof toDonationItem>;

export function donationsToCsv(rows: Donation[]): string {
  const header = [
    "Status", "Amount (NGN)", "Donor", "Organisation", "Type", "Email", "Phone", "Message",
    "Started", "Received", "Paystack reference", "Paystack transaction", "Receipt emailed",
  ];
  const lines = rows.map((d) =>
    [
      d.status === "PAID" ? "Received" : "Not completed", d.amountKobo / 100, d.donorName, d.organisation,
      donorTypeLabel(d.donorType), d.email, d.phone, d.message, d.createdAt.toISOString(),
      d.paidAt?.toISOString(), d.reference, d.paystackTxId, d.receiptSentAt?.toISOString(),
    ]
      .map(csvCell)
      .join(","),
  );
  // BOM so Excel opens it as UTF-8.
  return "﻿" + [header.map(csvCell).join(","), ...lines].join("\r\n");
}
