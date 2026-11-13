import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin-auth";
import { extractPassId } from "@/lib/pass-id";
import { toParticipant } from "@/lib/participants";

export const runtime = "nodejs";

/** Search paid participants by name, pass ID, phone or email. Also returns headline counts. */
export async function GET(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

  const q = (new URL(request.url).searchParams.get("q") || "").trim();
  const passId = extractPassId(q);
  const digits = q.replace(/\D/g, "");

  // Postgres `contains` is case-sensitive unless mode is "insensitive".
  const where: Prisma.RegistrationWhereInput = {
    status: "PAID",
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

  const [rows, total, medical, muster] = await Promise.all([
    prisma.registration.findMany({
      where,
      include: { tier: true },
      orderBy: q ? { fullName: "asc" } : { paidAt: "desc" },
      take: 40,
    }),
    prisma.registration.count({ where: { status: "PAID" } }),
    prisma.registration.count({ where: { status: "PAID", medicalCheckedAt: { not: null } } }),
    prisma.registration.count({ where: { status: "PAID", musterCheckedAt: { not: null } } }),
  ]);

  return NextResponse.json({
    participants: rows.map(toParticipant),
    stats: { total, medical, muster },
  });
}
