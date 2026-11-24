import type { Prisma, Registration } from "@prisma/client";
import { extractPassId } from "./pass-id";

/** PENDING only exists on rows from before registration became free. */
export const STATUSES = ["REGISTERED", "PENDING", "CANCELLED"] as const;

export type RegistrationFilters = {
  q?: string;
  status?: string;
  checkin?: string; // "none" | "medical" | "muster" | "summit" | "descent" | "mountain"
};

export function filtersFromSearchParams(params: URLSearchParams): RegistrationFilters {
  return {
    q: params.get("q")?.trim().slice(0, 100) || undefined,
    status: params.get("status") || undefined,
    checkin: params.get("checkin") || undefined,
  };
}

export function whereFor(f: RegistrationFilters): Prisma.RegistrationWhereInput {
  const and: Prisma.RegistrationWhereInput[] = [];
  if (f.status && (STATUSES as readonly string[]).includes(f.status)) and.push({ status: f.status });
  if (f.checkin === "medical") and.push({ medicalCheckedAt: { not: null } });
  if (f.checkin === "muster") and.push({ musterCheckedAt: { not: null } });
  if (f.checkin === "summit") and.push({ summitReachedAt: { not: null } });
  if (f.checkin === "descent") and.push({ descentCheckedAt: { not: null } });
  if (f.checkin === "mountain") and.push({ status: "REGISTERED", musterCheckedAt: { not: null }, descentCheckedAt: null });
  if (f.checkin === "none") and.push({ status: "REGISTERED", medicalCheckedAt: null });
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

/** One line in the registrations table. */
export function toListItem(r: Registration) {
  return {
    id: r.id,
    passId: r.passId,
    reference: r.reference,
    status: r.status,
    fullName: r.fullName,
    email: r.email,
    phone: r.phone,
    kitSize: r.kitSize,
    createdAt: r.createdAt.toISOString(),
    medicalCheckedAt: r.medicalCheckedAt?.toISOString() ?? null,
    musterCheckedAt: r.musterCheckedAt?.toISOString() ?? null,
    summitReachedAt: r.summitReachedAt?.toISOString() ?? null,
    descentCheckedAt: r.descentCheckedAt?.toISOString() ?? null,
    emailSent: Boolean(r.emailSentAt),
    smsSent: Boolean(r.smsSentAt),
    deliveryProblem: r.status === "REGISTERED" && (!r.emailSentAt || !r.smsSentAt),
  };
}
export type RegistrationListItem = ReturnType<typeof toListItem>;

/** Everything staff can see about one registration. The pass access token is never sent. */
export function toDetail(r: Registration) {
  return {
    ...toListItem(r),
    nextOfKinName: r.nextOfKinName,
    nextOfKinPhone: r.nextOfKinPhone,
    bloodGroup: r.bloodGroup,
    genotype: r.genotype,
    experience: r.experience,
    medicalNotes: r.medicalNotes,
    waiverAcceptedAt: r.waiverAcceptedAt.toISOString(),
    emailSentAt: r.emailSentAt?.toISOString() ?? null,
    smsSentAt: r.smsSentAt?.toISOString() ?? null,
    emailError: r.emailError,
    smsError: r.smsError,
    medicalCheckedBy: r.medicalCheckedBy,
    musterCheckedBy: r.musterCheckedBy,
    summitReachedBy: r.summitReachedBy,
    descentCheckedBy: r.descentCheckedBy,
    cancelledAt: r.cancelledAt?.toISOString() ?? null,
    cancelReason: r.cancelReason,
    updatedAt: r.updatedAt.toISOString(),
    // Only present on registrations paid for before registration became free.
    earlierPayment: r.paidAt
      ? {
          amountKobo: r.amountKobo,
          paidAt: r.paidAt.toISOString(),
          ticket: r.legacyTicket,
          transaction: r.paystackTxId,
        }
      : null,
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

export function toCsv(rows: Registration[]): string {
  const header = [
    "Pass ID", "Status", "Full name", "Email", "Phone", "Kit size",
    "Blood group", "Genotype", "Experience", "Medical notes", "Next of kin", "Next of kin phone",
    "Registered", "Medical cleared", "Ascent start", "Summit reached", "Back at base", "Reference",
  ];
  const lines = rows.map((r) =>
    [
      r.passId, r.status, r.fullName, r.email, r.phone, r.kitSize,
      r.bloodGroup, r.genotype, r.experience, r.medicalNotes, r.nextOfKinName, r.nextOfKinPhone,
      r.createdAt.toISOString(), r.medicalCheckedAt?.toISOString(), r.musterCheckedAt?.toISOString(),
      r.summitReachedAt?.toISOString(), r.descentCheckedAt?.toISOString(), r.reference,
    ]
      .map(csvCell)
      .join(","),
  );
  // BOM so Excel opens it as UTF-8 (names with accents).
  return "﻿" + [header.map(csvCell).join(","), ...lines].join("\r\n");
}
