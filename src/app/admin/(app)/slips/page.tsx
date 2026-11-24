import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { passUrl, qrSvg } from "@/lib/qr";
import { filtersFromSearchParams, whereFor } from "@/lib/registrations";
import { RegistrationSlip } from "@/components/registration-slip";
import { PrintButton } from "@/components/auto-print";

export const metadata: Metadata = { title: "Print registration slips" };

/** Slips per print run. Big enough for a desk session, small enough for any browser to print. */
const BATCH = 100;

/**
 * Staff bulk printing: every registered climber matching the filters from the
 * registrations page, one slip per A4 page, with the print dialog opened
 * automatically. `?id=` prints a single climber's slip.
 */
export default async function SlipsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) if (typeof value === "string") params.set(key, value);

  const user = await requirePage("registrations.view", `/admin/slips?${params.toString()}`);

  const id = params.get("id");
  const batch = Math.max(1, Math.min(1000, Number(params.get("batch")) || 1));
  const where = id
    ? { id, status: "REGISTERED" }
    : { AND: [whereFor(filtersFromSearchParams(params)), { status: "REGISTERED" }] };

  const [rows, total] = await Promise.all([
    prisma.registration.findMany({
      where,
      orderBy: [{ fullName: "asc" }, { id: "asc" }],
      skip: (batch - 1) * BATCH,
      take: BATCH,
    }),
    prisma.registration.count({ where }),
  ]);
  const slips = await Promise.all(
    rows.map(async (r) => ({ r, qr: await qrSvg(passUrl(r.passId ?? "", r.accessToken)) })),
  );
  if (rows.length > 0) {
    await audit(user, "registration.slips_printed", id ? { registrationId: id } : {}, { count: rows.length, batch });
  }

  const batches = Math.max(1, Math.ceil(total / BATCH));
  const batchLink = (n: number) => {
    const next = new URLSearchParams(params);
    next.set("batch", String(n));
    return `/admin/slips?${next.toString()}`;
  };
  const back = id ? `/admin/registrations/${id}` : "/admin/registrations";

  return (
    <main className="container py-8 print:max-w-none print:p-0">
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href={back} className="inline-flex items-center gap-1 text-sm font-bold text-forest-700 hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <h1 className="mt-2 text-3xl font-semibold text-forest-900">Registration slips</h1>
          <p className="mt-1 text-sm text-forest-900/70">
            {total === 0
              ? "No registered climbers match."
              : `${rows.length} slip${rows.length === 1 ? "" : "s"}, one per A4 page, in name order` +
                (batches > 1 ? ` — batch ${batch} of ${batches} (${total} climbers in all).` : ".")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {batches > 1 && batch > 1 && (
            <Link href={batchLink(batch - 1)} className="text-sm font-bold text-forest-700 underline underline-offset-4">
              Previous batch
            </Link>
          )}
          {batches > 1 && batch < batches && (
            <Link href={batchLink(batch + 1)} className="text-sm font-bold text-forest-700 underline underline-offset-4">
              Next batch
            </Link>
          )}
          {rows.length > 0 && <PrintButton auto label={`Print ${rows.length === 1 ? "slip" : `${rows.length} slips`}`} />}
        </div>
      </div>

      <div className="space-y-8 print:space-y-0">
        {slips.map(({ r, qr }) => (
          <RegistrationSlip key={r.id} registration={r} qrSvg={qr} />
        ))}
      </div>
    </main>
  );
}
