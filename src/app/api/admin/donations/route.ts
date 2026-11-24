import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApi } from "@/lib/admin-auth";
import { donationFiltersFromSearchParams, donationWhere, toDonationItem } from "@/lib/donations";

export const runtime = "nodejs";

const PAGE_SIZE = 50;

/** Donations list with filters, paging and totals. */
export async function GET(request: Request) {
  const guard = await requireApi(request, "donations.view");
  if (guard.error) return guard.error;

  const params = new URL(request.url).searchParams;
  const where = donationWhere(donationFiltersFromSearchParams(params));
  const page = Math.max(1, Math.min(1000, Number(params.get("page")) || 1));

  const [rows, matching, received, byType, pending] = await Promise.all([
    prisma.donation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.donation.count({ where }),
    prisma.donation.aggregate({ where: { status: "PAID" }, _sum: { amountKobo: true }, _count: true }),
    prisma.donation.groupBy({ by: ["donorType"], where: { status: "PAID" }, _sum: { amountKobo: true }, _count: true }),
    prisma.donation.count({ where: { status: "PENDING" } }),
  ]);

  const typeTotals = Object.fromEntries(
    byType.map((t) => [t.donorType, { count: t._count, amountKobo: t._sum.amountKobo ?? 0 }]),
  );

  return NextResponse.json({
    donations: rows.map(toDonationItem),
    page,
    pageSize: PAGE_SIZE,
    matching,
    stats: {
      receivedKobo: received._sum.amountKobo ?? 0,
      receivedCount: received._count,
      individuals: typeTotals.INDIVIDUAL ?? { count: 0, amountKobo: 0 },
      partners: typeTotals.PARTNER ?? { count: 0, amountKobo: 0 },
      pending,
    },
  });
}
