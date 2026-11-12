import type { Registration, TicketTier } from "@prisma/client";

/** The shape the check-in portal works with. */
export type Participant = {
  passId: string;
  fullName: string;
  email: string;
  phone: string;
  tierName: string;
  bloodGroup: string;
  genotype: string;
  experience: string;
  medicalNotes: string | null;
  kitSize: string;
  nextOfKinName: string;
  nextOfKinPhone: string;
  medicalCheckedAt: string | null;
  musterCheckedAt: string | null;
  emailSent: boolean;
  smsSent: boolean;
};

export function toParticipant(r: Registration & { tier: TicketTier }): Participant {
  return {
    passId: r.passId ?? "",
    fullName: r.fullName,
    email: r.email,
    phone: r.phone,
    tierName: r.tier.name,
    bloodGroup: r.bloodGroup,
    genotype: r.genotype,
    experience: r.experience,
    medicalNotes: r.medicalNotes,
    kitSize: r.kitSize,
    nextOfKinName: r.nextOfKinName,
    nextOfKinPhone: r.nextOfKinPhone,
    medicalCheckedAt: r.medicalCheckedAt?.toISOString() ?? null,
    musterCheckedAt: r.musterCheckedAt?.toISOString() ?? null,
    emailSent: Boolean(r.emailSentAt),
    smsSent: Boolean(r.smsSentAt),
  };
}
