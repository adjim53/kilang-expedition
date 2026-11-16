import type { Prisma, Registration, TicketTier } from "@prisma/client";
import { extractPassId } from "./pass-id";

export const STATUSES = ["PENDING", "PAID", "FAILED", "CANCELLED"] as const;

export type RegistrationFilters = {
  q?: string;
  status?: string;
  tier?: string;
  checkin?: string; // "medical" | "muster" | "none"
};

export function filtersFromSearchParams(params: URLSearchParams): RegistrationFilters {
  return {
    q: params.get("q")?.trim().slice(0, 100) || undefined,
    status: params.get("status") || undefined,
    tier: params.get("tier") || undefined,
    checkin: params.get("checkin") || undefined,
  };
}

export function whereFor(f: RegistrationFilters): Prisma.RegistrationWhereInput {
  const and: Prisma.RegistrationWhereInput[] = [];
  if (f.status && (STATUSES as readonly string[]).includes(f.status)) and.push({ status: f.status });
  if (f.tier) and.push({ tierId: f.tier });
  if (f.checkin === "medical") and.push({ medicalCheckedAt: { not: null } });
  if (f.checkin === "muster") and.push({ musterCheckedAt: { not: null } });
  if (f.checkin === "none") and.push({ status: "PAID", medicalCheckedAt: null });
  if (f.q) {
    const passId = extractPassId(f.q);
    const digits = f.q.replace(/\D/g, "");
    and.push({
      OR: [
        ...(passId ? [{ passId }] : []),
        { passId: { contains: f.q, mode: "insensitive" } },
        { reference: { contains: f.q, mode: "insensitive" } },
        { fullName: { contains: f.q, mode: "insensitive" } },
        { email: { contains: f.q, mode: "insensitive" } },
        ...(digits.length >= 4 ? [{ phone: { contains: digits.replace(/^0/, "") } }] : []),
      ],
    });
  }
  return and.length ? { AND: and } : {};
}

type Row = Registration & { tier: TicketTier };

/** One line in the registrations table. */
export function toListItem(r: Row) {
  return {
    id: r.id,
    passId: r.passId,
    reference: r.reference,
    status: r.status,
    fullName: r.fullName,
    email: r.email,
    phone: r.phone,
    tierName: r.tier.name,
    amountKobo: r.amountKobo,
    kitSize: r.kitSize,
    createdAt: r.createdAt.toISOString(),
    paidAt: r.paidAt?.toISOString() ?? null,
    medicalCheckedAt: r.medicalCheckedAt?.toISOString() ?? null,
    musterCheckedAt: r.musterCheckedAt?.toISOString() ?? null,
    emailSent: Boolean(r.emailSentAt),
    smsSent: Boolean(r.smsSentAt),
    deliveryProblem: r.status === "PAID" && (!r.emailSentAt || !r.smsSentAt),
  };
}
export type RegistrationListItem = ReturnType<typeof toListItem>;

/** Everything staff can see about one registration. The pass access token is never sent. */
export function toDetail(r: Row) {
  return {
    ...toListItem(r),
    tierId: r.tierId,
    nextOfKinName: r.nextOfKinName,
    nextOfKinPhone: r.nextOfKinPhone,
    bloodGroup: r.bloodGroup,
    genotype: r.genotype,
    experience: r.experience,
    medicalNotes: r.medicalNotes,
    waiverAcceptedAt: r.waiverAcceptedAt.toISOString(),
    paystackTxId: r.paystackTxId,
    emailSentAt: r.emailSentAt?.toISOString() ?? null,
    smsSentAt: r.smsSentAt?.toISOString() ?? null,
    emailError: r.emailError,
    smsError: r.smsError,
    medicalCheckedBy: r.medicalCheckedBy,
    musterCheckedBy: r.musterCheckedBy,
    cancelledAt: r.cancelledAt?.toISOString() ?? null,
    cancelReason: r.cancelReason,
    updatedAt: r.updatedAt.toISOString(),
  };
}
export type RegistrationDetail = ReturnType<typeof toDetail>;

/**
 * One CSV cell. Quotes everything, and defuses values a spreadsheet would run
 * as a formula (=, +, -, @, tab, CR) — a climber could type "=HYPERLINK(...)" as their name.
 */
export function csvCell(value: unknown): string {
  let s = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export function toCsv(rows: Row[]): string {
  const header = [
    "Pass ID", "Status", "Full name", "Email", "Phone", "Ticket", "Amount (NGN)", "Kit size",
    "Blood group", "Genotype", "Experience", "Medical notes", "Next of kin", "Next of kin phone",
    "Registered", "Paid", "Medical cleared", "Muster check-in", "Paystack reference",
  ];
  const lines = rows.map((r) =>
    [
      r.passId, r.status, r.fullName, r.email, r.phone, r.tier.name, r.amountKobo / 100, r.kitSize,
      r.bloodGroup, r.genotype, r.experience, r.medicalNotes, r.nextOfKinName, r.nextOfKinPhone,
      r.createdAt.toISOString(), r.paidAt?.toISOString(), r.medicalCheckedAt?.toISOString(),
      r.musterCheckedAt?.toISOString(), r.reference,
    ]
      .map(csvCell)
      .join(","),
  );
  // BOM so Excel opens it as UTF-8 (names with accents, ₦).
  return "﻿" + [header.map(csvCell).join(","), ...lines].join("\r\n");
}
