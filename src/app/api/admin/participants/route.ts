import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApi } from "@/lib/admin-auth";
import { extractPassId } from "@/lib/pass-id";
import { toParticipant } from "@/lib/participants";
import { checkpointCounts } from "@/lib/tracker";

export const runtime = "nodejs";

/** Search registered climbers by name, pass ID, phone or email. Also returns headline counts. */
export async function GET(request: Request) {
  const guard = await requireApi(request, "checkin");
  if (guard.error) return guard.error;

  const q = (new URL(request.url).searchParams.get("q") || "").trim().slice(0, 100);
  const passId = extractPassId(q);
  const digits = q.replace(/\D/g, "");

  // Postgres `contains` is case-sensitive unless mode is "insensitive".
  const where: Prisma.RegistrationWhereInput = {
    status: "REGISTERED",
    ...(q
      ? {
          OR: [
            ...(passId ? [{ passId }] : []),
            { passId: { contains: q, mode: "insensitive" as const } },
            { fullName: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
            ...(digits.length >= 4 ? [{ phone: { contains: digits.replace(/^0/, "") } }] : []),
          ],
        }
      : {}),
  };

  const [rows, stats] = await Promise.all([
    prisma.registration.findMany({
      where,
      orderBy: q ? { fullName: "asc" } : { createdAt: "desc" },
      take: 40,
    }),
    checkpointCounts(),
  ]);

  return NextResponse.json({ participants: rows.map(toParticipant), stats });
}
