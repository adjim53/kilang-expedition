/**
 * Donation settings. Registration is free; the expedition is funded by
 * well-wishers and partners. Edit the amounts here (in kobo: ₦1 = 100 kobo).
 */

/** Quick-pick amounts shown on the donation form. */
export const DONATION_PRESETS_KOBO = [5_000_00, 10_000_00, 25_000_00, 50_000_00, 100_000_00] as const;

/** Smallest and largest single donation the form accepts. */
export const DONATION_MIN_KOBO = 500_00;
export const DONATION_MAX_KOBO = 10_000_000_00;

export const DONOR_TYPES = ["INDIVIDUAL", "PARTNER"] as const;
export type DonorType = (typeof DONOR_TYPES)[number];

export const DONOR_TYPE_LABELS: Record<DonorType, string> = {
  INDIVIDUAL: "Well-wisher",
  PARTNER: "Partner / organisation",
};
