import { prisma } from "./prisma";

const REGISTERED = { status: "REGISTERED" } as const;

/** How many registered climbers have passed each checkpoint. */
export async function checkpointCounts() {
  const [total, medical, muster, summit, descent, onMountain] = await Promise.all([
    prisma.registration.count({ where: REGISTERED }),
    prisma.registration.count({ where: { ...REGISTERED, medicalCheckedAt: { not: null } } }),
    prisma.registration.count({ where: { ...REGISTERED, musterCheckedAt: { not: null } } }),
    prisma.registration.count({ where: { ...REGISTERED, summitReachedAt: { not: null } } }),
    prisma.registration.count({ where: { ...REGISTERED, descentCheckedAt: { not: null } } }),
    prisma.registration.count({ where: { ...REGISTERED, musterCheckedAt: { not: null }, descentCheckedAt: null } }),
  ]);
  return { total, medical, muster, summit, descent, onMountain };
}
export type CheckpointCounts = Awaited<ReturnType<typeof checkpointCounts>>;
