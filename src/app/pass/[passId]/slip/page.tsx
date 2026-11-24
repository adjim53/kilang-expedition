import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { passUrl, qrSvg } from "@/lib/qr";
import { tokensMatch } from "@/lib/ids";
import { RegistrationSlip } from "@/components/registration-slip";
import { PrintButton } from "@/components/auto-print";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your registration slip",
  robots: { index: false, follow: false },
};

/**
 * A climber's printable registration slip. Like the pass, it needs the secret
 * token from the climber's own link. `?print=1` opens the print dialog by itself.
 */
export default async function SlipPage({
  params,
  searchParams,
}: {
  params: Promise<{ passId: string }>;
  searchParams: Promise<{ t?: string; print?: string }>;
}) {
  const { passId } = await params;
  const { t, print } = await searchParams;

  if (passId.length > 40) notFound();
  const registration = await prisma.registration.findUnique({ where: { passId: passId.toUpperCase() } });
  if (
    !registration ||
    !registration.passId ||
    registration.status !== "REGISTERED" ||
    !tokensMatch(t, registration.accessToken)
  ) {
    notFound();
  }

  const qr = await qrSvg(passUrl(registration.passId, registration.accessToken));

  return (
    <main className="min-h-screen bg-sand-100 px-4 py-8 print:bg-white print:p-0">
      <div className="no-print mx-auto mb-5 flex max-w-[720px] flex-wrap items-center justify-between gap-3">
        <Link
          href={`/pass/${registration.passId}?t=${registration.accessToken}`}
          className="inline-flex items-center gap-1 text-sm font-bold text-forest-700 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to my pass
        </Link>
        <PrintButton auto={print === "1"} label="Print / save as PDF" />
      </div>
      <RegistrationSlip registration={registration} qrSvg={qr} />
      <p className="no-print mx-auto mt-5 max-w-[720px] text-center text-sm text-forest-900/70">
        Prints on one A4 page. No printer? Choose “Save as PDF” in the print window and print it later, or show
        the QR code on your phone.
      </p>
    </main>
  );
}
