import { prisma } from "@/lib/prisma";
import { requireApi } from "@/lib/admin-auth";
import { filtersFromSearchParams, toCsv, whereFor } from "@/lib/registrations";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

/** CSV of the registrations matching the current filters. Contains medical data — handle with care. */
export async function GET(request: Request) {
  const guard = await requireApi(request, "registrations.export");
  if (guard.error) return guard.error;

  const filters = filtersFromSearchParams(new URL(request.url).searchParams);
  const rows = await prisma.registration.findMany({
    where: whereFor(filters),
    include: { tier: true },
    orderBy: { createdAt: "asc" },
    take: 10_000,
  });
  await audit(guard.user, "registration.export", {}, { count: rows.length, filters });

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kilang-registrations-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
