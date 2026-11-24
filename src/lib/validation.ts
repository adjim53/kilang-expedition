import { z } from "zod";
import { DONATION_MAX_KOBO, DONATION_MIN_KOBO, DONOR_TYPES } from "@/data/donations";
import { normalizeNigerianPhone } from "./utils";

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Not sure"] as const;
export const GENOTYPES = ["AA", "AS", "AC", "SS", "SC", "Not sure"] as const;
export const EXPERIENCE_LEVELS = ["BEGINNER", "INTERMEDIATE", "PRO"] as const;
export const KIT_SIZES = ["S", "M", "L", "XL", "XXL"] as const;

export const EXPERIENCE_LABELS: Record<(typeof EXPERIENCE_LEVELS)[number], string> = {
  BEGINNER: "Beginner — first real hike",
  INTERMEDIATE: "Intermediate — a few climbs done",
  PRO: "Pro — regular hiker or climber",
};

const phone = z
  .string()
  .trim()
  .min(1, "Phone number is required")
  .refine((v) => normalizeNigerianPhone(v) !== null, "Enter a valid Nigerian mobile number, e.g. 0803 190 7825");

export const registrationSchema = z.object({
  fullName: z.string().trim().min(3, "Enter your full name").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  phone,
  nextOfKinName: z.string().trim().min(3, "Enter your next of kin's name").max(100),
  nextOfKinPhone: phone,
  bloodGroup: z.enum(BLOOD_GROUPS, { error: "Select your blood group" }),
  genotype: z.enum(GENOTYPES, { error: "Select your genotype" }),
  experience: z.enum(EXPERIENCE_LEVELS, { error: "Select your experience" }),
  medicalNotes: z.string().trim().max(1000, "Keep this under 1,000 characters").optional().default(""),
  kitSize: z.enum(KIT_SIZES, { error: "Select a kit size" }),
  waiverAccepted: z.literal(true, { error: "You must accept the safety waiver to register" }),
});

export type RegistrationInput = z.input<typeof registrationSchema>;
export type RegistrationData = z.output<typeof registrationSchema>;

// ── Donations ───────────────────────────────────────────────────────────────

const naira = (kobo: number) => `₦${(kobo / 100).toLocaleString("en-NG")}`;

const optionalPhone = z
  .string()
  .trim()
  .optional()
  .default("")
  .refine((v) => v === "" || normalizeNigerianPhone(v) !== null, "Enter a valid Nigerian mobile number, or leave this blank");

export const donationSchema = z
  .object({
    /** Whole naira, as typed. The server converts to kobo. */
    amountNaira: z.coerce
      .number({ error: "Enter an amount" })
      .int("Enter a whole number of naira")
      .min(DONATION_MIN_KOBO / 100, `The smallest donation is ${naira(DONATION_MIN_KOBO)}`)
      .max(DONATION_MAX_KOBO / 100, `For donations above ${naira(DONATION_MAX_KOBO)}, please contact the organisers`),
    donorType: z.enum(DONOR_TYPES, { error: "Tell us who is giving" }),
    donorName: z.string().trim().min(3, "Enter your name").max(100),
    organisation: z.string().trim().max(150).optional().default(""),
    email: z.string().trim().toLowerCase().email("Enter a valid email address").max(200),
    phone: optionalPhone,
    message: z.string().trim().max(500, "Keep this under 500 characters").optional().default(""),
  })
  .refine((d) => d.donorType !== "PARTNER" || d.organisation.length >= 2, {
    path: ["organisation"],
    message: "Enter the organisation's name",
  });

export type DonationInput = z.input<typeof donationSchema>;
export type DonationData = z.output<typeof donationSchema>;
