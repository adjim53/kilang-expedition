import { prisma } from "@/lib/prisma";
import { requireApi } from "@/lib/admin-auth";
import { donationFiltersFromSearchParams, donationsToCsv, donationWhere } from "@/lib/donations";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

/** CSV of the donations matching the current filters. */
export async function GET(request: Request) {
  const guard = await requireApi(request, "donations.view");
  if (guard.error) return guard.error;

  const filters = donationFiltersFromSearchParams(new URL(request.url).searchParams);
  const rows = await prisma.donation.findMany({
    where: donationWhere(filters),
    orderBy: { createdAt: "asc" },
    take: 10_000,
  });
  await audit(guard.user, "donation.export", {}, { count: rows.length, filters });

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(donationsToCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kilang-donations-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
