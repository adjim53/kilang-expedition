import { z } from "zod";
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
  tierId: z.string().min(1, "Choose a ticket"),
  fullName: z.string().trim().min(3, "Enter your full name").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  phone,
  nextOfKinName: z.string().trim().min(3, "Enter your next of kin's name").max(100),
  nextOfKinPhone: phone,
  bloodGroup: z.enum(BLOOD_GROUPS, { errorMap: () => ({ message: "Select your blood group" }) }),
  genotype: z.enum(GENOTYPES, { errorMap: () => ({ message: "Select your genotype" }) }),
  experience: z.enum(EXPERIENCE_LEVELS, { errorMap: () => ({ message: "Select your experience" }) }),
  medicalNotes: z.string().trim().max(1000, "Keep this under 1,000 characters").optional().default(""),
  kitSize: z.enum(KIT_SIZES, { errorMap: () => ({ message: "Select a kit size" }) }),
  waiverAccepted: z.literal(true, {
    errorMap: () => ({ message: "You must accept the safety waiver to register" }),
  }),
});

export type RegistrationInput = z.input<typeof registrationSchema>;
export type RegistrationData = z.output<typeof registrationSchema>;
