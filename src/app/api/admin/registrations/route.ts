import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApi } from "@/lib/admin-auth";
import { filtersFromSearchParams, toListItem, whereFor } from "@/lib/registrations";

export const runtime = "nodejs";

const PAGE_SIZE = 50;

/** Registrations list with filters, paging and headline numbers. */
export async function GET(request: Request) {
  const guard = await requireApi(request, "registrations.view");
  if (guard.error) return guard.error;

  const params = new URL(request.url).searchParams;
  const where = whereFor(filtersFromSearchParams(params));
  const page = Math.max(1, Math.min(1000, Number(params.get("page")) || 1));

  const [rows, matching, byStatus, revenue, byTier, byKit, medical, muster, deliveryProblems] = await Promise.all([
    prisma.registration.findMany({
      where,
      include: { tier: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.registration.count({ where }),
    prisma.registration.groupBy({ by: ["status"], _count: true }),
    prisma.registration.aggregate({ where: { status: "PAID" }, _sum: { amountKobo: true } }),
    prisma.registration.groupBy({ by: ["tierId"], where: { status: "PAID" }, _count: true }),
    prisma.registration.groupBy({ by: ["kitSize"], where: { status: "PAID" }, _count: true }),
    prisma.registration.count({ where: { status: "PAID", medicalCheckedAt: { not: null } } }),
    prisma.registration.count({ where: { status: "PAID", musterCheckedAt: { not: null } } }),
    prisma.registration.count({
      where: { status: "PAID", OR: [{ emailSentAt: null }, { smsSentAt: null }] },
    }),
  ]);

  const tiers = await prisma.ticketTier.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } });

  return NextResponse.json({
    registrations: rows.map(toListItem),
    page,
    pageSize: PAGE_SIZE,
    matching,
    tiers,
    stats: {
      byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count])),
      revenueKobo: revenue._sum.amountKobo ?? 0,
      byTier: Object.fromEntries(byTier.map((t) => [t.tierId, t._count])),
      byKit: Object.fromEntries(byKit.map((k) => [k.kitSize, k._count])),
      medical,
      muster,
      deliveryProblems,
    },
  });
}
