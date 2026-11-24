import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApi } from "@/lib/admin-auth";
import { filtersFromSearchParams, toListItem, whereFor } from "@/lib/registrations";
import { checkpointCounts } from "@/lib/tracker";

export const runtime = "nodejs";

const PAGE_SIZE = 50;

/** Registrations list with filters, paging and headline numbers. */
export async function GET(request: Request) {
  const guard = await requireApi(request, "registrations.view");
  if (guard.error) return guard.error;

  const params = new URL(request.url).searchParams;
  const where = whereFor(filtersFromSearchParams(params));
  const page = Math.max(1, Math.min(1000, Number(params.get("page")) || 1));

  const [rows, matching, byStatus, byKit, checkpoints, deliveryProblems] = await Promise.all([
    prisma.registration.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.registration.count({ where }),
    prisma.registration.groupBy({ by: ["status"], _count: true }),
    prisma.registration.groupBy({ by: ["kitSize"], where: { status: "REGISTERED" }, _count: true }),
    checkpointCounts(),
    prisma.registration.count({
      where: { status: "REGISTERED", OR: [{ emailSentAt: null }, { smsSentAt: null }] },
    }),
  ]);

  return NextResponse.json({
    registrations: rows.map(toListItem),
    page,
    pageSize: PAGE_SIZE,
    matching,
    stats: {
      byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count])),
      byKit: Object.fromEntries(byKit.map((k) => [k.kitSize, k._count])),
      medical: checkpoints.medical,
      muster: checkpoints.muster,
      summit: checkpoints.summit,
      descent: checkpoints.descent,
      onMountain: checkpoints.onMountain,
      deliveryProblems,
    },
  });
}
