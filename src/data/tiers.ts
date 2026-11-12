/**
 * Default ticket tiers. `npm run db:seed` writes these to the database, and the
 * site falls back to them if the database is unreachable.
 *
 * PRICES ARE PLACEHOLDERS — set the real fees here (in kobo: ₦1 = 100 kobo),
 * then run `npm run db:seed` again.
 */

export type Tier = {
  id: string;
  name: string;
  tagline: string;
  priceKobo: number;
  perks: string[];
  featured: boolean;
  sortOrder: number;
};

export const DEFAULT_TIERS: Tier[] = [
  {
    id: "student",
    name: "Student / Youth Pass",
    tagline: "Subsidised entry for students and young climbers",
    priceKobo: 5_000_00,
    perks: [
      "Expedition registration",
      "Medical screening",
      "Climber bib",
      "Guided ascent",
      "Valid student or youth ID required at check-in",
    ],
    featured: false,
    sortOrder: 1,
  },
  {
    id: "standard",
    name: "Standard Climber",
    tagline: "Everything you need to reach the summit",
    priceKobo: 10_000_00,
    perks: ["Expedition registration", "Medical screening", "Climber bib", "Guided ascent"],
    featured: true,
    sortOrder: 2,
  },
  {
    id: "vip",
    name: "VIP / Cultural Explorer",
    tagline: "The full heritage experience",
    priceKobo: 50_000_00,
    perks: [
      "Everything in Standard Climber",
      "Official expedition kit",
      "Branded merchandise",
      "Priority seating at the Expedition Lecture",
      "Royal photo session at the palace",
    ],
    featured: false,
    sortOrder: 3,
  },
];
