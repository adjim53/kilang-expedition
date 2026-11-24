/**
 * Seed script.
 *   npm run db:seed        → nothing to seed (registration is free; there are no ticket tiers)
 *   npm run db:seed:demo   → a few clearly fake participants and donations for testing
 */
import "dotenv/config";
import { createPrismaClient } from "../src/lib/prisma";

const DEMO_PARTICIPANTS = [
  {
    passId: "KIL-2026-DM01",
    fullName: "Demo Climber One",
    email: "demo.one@example.com",
    phone: "2348030000001",
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
    bloodGroup: "B+",
    genotype: "AA",
    experience: "PRO",
    kitSize: "S",
    medicalNotes: "Allergic to penicillin",
    medicalChecked: false,
  },
];

const DEMO_DONATIONS = [
  { reference: "DEMO-DONATION-1", donorType: "INDIVIDUAL", donorName: "Demo Well-Wisher", organisation: null, amountKobo: 10_000_00 },
  { reference: "DEMO-DONATION-2", donorType: "PARTNER", donorName: "Demo Contact", organisation: "Demo Partner Ltd", amountKobo: 250_000_00 },
];

async function main() {
  if (!process.argv.includes("--demo")) {
    console.log("Nothing to seed: registration is free and there are no ticket tiers.");
    return;
  }

  const prisma = createPrismaClient();
  try {
    for (const [i, p] of DEMO_PARTICIPANTS.entries()) {
      const { medicalChecked, passId, ...fields } = p;
      const data = {
        ...fields,
        passId,
        status: "REGISTERED",
        nextOfKinName: "Demo Next Of Kin",
        nextOfKinPhone: "2348030000009",
        waiverAcceptedAt: new Date(),
        medicalCheckedAt: medicalChecked ? new Date() : null,
      };
      await prisma.registration.upsert({
        where: { passId },
        update: data,
        create: { ...data, reference: `DEMO-SEED-${i + 1}`, accessToken: `demo-seed-token-${i + 1}` },
      });
    }
    console.log(`Seeded ${DEMO_PARTICIPANTS.length} demo participants.`);

    for (const d of DEMO_DONATIONS) {
      const data = { ...d, email: "demo.donor@example.com", status: "PAID", paidAt: new Date(), paystackTxId: "demo-seed" };
      await prisma.donation.upsert({ where: { reference: d.reference }, update: data, create: data });
    }
    console.log(`Seeded ${DEMO_DONATIONS.length} demo donations.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
