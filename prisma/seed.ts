/**
 * Seed script.
 *   npm run db:seed        → ticket tiers only (safe for production)
 *   npm run db:seed:demo   → tiers + a few clearly fake participants for testing
 */
import "dotenv/config";
import { createPrismaClient } from "../src/lib/prisma";
import { DEFAULT_TIERS } from "../src/data/tiers";

const prisma = createPrismaClient();

const DEMO_PARTICIPANTS = [
  {
    passId: "KIL-2026-DM01",
    fullName: "Demo Climber One",
    email: "demo.one@example.com",
    phone: "2348030000001",
    tierId: "standard",
    bloodGroup: "O+",
    genotype: "AA",
    experience: "BEGINNER",
    kitSize: "M",
    medicalNotes: "",
    medicalChecked: false,
  },
  {
    passId: "KIL-2026-DM02",
    fullName: "Demo Climber Two",
    email: "demo.two@example.com",
    phone: "2348030000002",
    tierId: "vip",
    bloodGroup: "A+",
    genotype: "AS",
    experience: "INTERMEDIATE",
    kitSize: "L",
    medicalNotes: "Asthma — carries an inhaler",
    medicalChecked: true,
  },
  {
    passId: "KIL-2026-DM03",
    fullName: "Demo Student Three",
    email: "demo.three@example.com",
    phone: "2348030000003",
    tierId: "student",
    bloodGroup: "B+",
    genotype: "AA",
    experience: "PRO",
    kitSize: "S",
    medicalNotes: "Allergic to penicillin",
    medicalChecked: false,
  },
];

async function main() {
  for (const tier of DEFAULT_TIERS) {
    const data = {
      name: tier.name,
      tagline: tier.tagline,
      priceKobo: tier.priceKobo,
      perks: JSON.stringify(tier.perks),
      featured: tier.featured,
      sortOrder: tier.sortOrder,
      active: true,
    };
    await prisma.ticketTier.upsert({ where: { id: tier.id }, update: data, create: { id: tier.id, ...data } });
  }
  console.log(`Seeded ${DEFAULT_TIERS.length} ticket tiers.`);

  if (process.argv.includes("--demo")) {
    for (const [i, p] of DEMO_PARTICIPANTS.entries()) {
      const tier = DEFAULT_TIERS.find((t) => t.id === p.tierId)!;
      const { medicalChecked, passId, ...fields } = p;
      const data = {
        ...fields,
        passId,
        status: "PAID",
        amountKobo: tier.priceKobo,
        nextOfKinName: "Demo Next Of Kin",
        nextOfKinPhone: "2348030000009",
        waiverAcceptedAt: new Date(),
        paidAt: new Date(),
        medicalCheckedAt: medicalChecked ? new Date() : null,
      };
      await prisma.registration.upsert({
        where: { passId },
        update: data,
        create: { ...data, reference: `DEMO-SEED-${i + 1}`, accessToken: `demo-seed-token-${i + 1}` },
      });
    }
    console.log(`Seeded ${DEMO_PARTICIPANTS.length} demo participants.`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
