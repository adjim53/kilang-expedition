import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApi } from "@/lib/admin-auth";
import { checkpointCounts } from "@/lib/tracker";

export const runtime = "nodejs";

/**
 * Live summit tracker: headline counts plus everyone who has started the
 * ascent, with the time at each checkpoint. The page polls this.
 */
export async function GET(request: Request) {
  const guard = await requireApi(request, "checkin");
  if (guard.error) return guard.error;

  const [stats, rows] = await Promise.all([
    checkpointCounts(),
    prisma.registration.findMany({
      where: { status: "REGISTERED", musterCheckedAt: { not: null } },
      orderBy: { musterCheckedAt: "asc" },
      take: 2000,
      select: {
        id: true,
        passId: true,
        fullName: true,
        phone: true,
        nextOfKinName: true,
        nextOfKinPhone: true,
        medicalNotes: true,
        medicalCheckedAt: true,
        musterCheckedAt: true,
        summitReachedAt: true,
        descentCheckedAt: true,
      },
    }),
  ]);

  return NextResponse.json({
    stats,
    updatedAt: new Date().toISOString(),
    climbers: rows.map((r) => ({
      id: r.id,
      passId: r.passId ?? "",
      fullName: r.fullName,
      phone: r.phone,
      nextOfKinName: r.nextOfKinName,
      nextOfKinPhone: r.nextOfKinPhone,
      hasMedicalNotes: Boolean(r.medicalNotes),
      medicalCheckedAt: r.medicalCheckedAt?.toISOString() ?? null,
      musterCheckedAt: r.musterCheckedAt?.toISOString() ?? null,
      summitReachedAt: r.summitReachedAt?.toISOString() ?? null,
      descentCheckedAt: r.descentCheckedAt?.toISOString() ?? null,
    })),
  });
}
