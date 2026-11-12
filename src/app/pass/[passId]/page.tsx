import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, CircleCheck, Clock, MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { passUrl, qrSvg } from "@/lib/qr";
import { EVENT, SCHEDULE } from "@/data/event";
import { SiteHeader } from "@/components/site-header";
import { Topo } from "@/components/topo";
import { Badge } from "@/components/ui/badge";
import { PassActions } from "@/components/pass-actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your expedition pass",
  robots: { index: false, follow: false },
};

export default async function PassPage({
  params,
  searchParams,
}: {
  params: Promise<{ passId: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { passId } = await params;
  const { t } = await searchParams;

  const registration = await prisma.registration.findUnique({
    where: { passId: passId.toUpperCase() },
    include: { tier: true },
  });

  // The pass is private: without the secret token from the email link, it does not exist.
  if (!registration || !registration.passId || registration.status !== "PAID" || !t || t !== registration.accessToken) {
    notFound();
  }

  const qr = await qrSvg(passUrl(registration.passId, registration.accessToken));
  const qrDownload = `/api/pass/${registration.passId}/qr?t=${registration.accessToken}`;

  return (
    <>
      <SiteHeader solid />
      <main className="min-h-screen bg-sand-100 px-4 pb-16 pt-24 print:bg-white print:pt-0">
        <div className="mx-auto max-w-md">
          <p className="no-print mb-4 flex items-center gap-2 rounded-xl bg-forest-100 p-4 text-sm font-semibold text-forest-800">
            <CircleCheck className="h-5 w-5 shrink-0 text-forest-600" />
            Payment confirmed. This is your pass — save it or print it.
          </p>

          <article className="overflow-hidden rounded-3xl bg-white shadow-lift print:shadow-none">
            <header className="relative overflow-hidden bg-forest-700 p-6 text-white">
              <Topo className="text-white/10" />
              <div className="relative">
                <p className="eyebrow text-amber-400">Digital expedition pass</p>
                <p className="mt-2 font-display text-2xl font-semibold leading-tight">{EVENT.name}</p>
                <p className="mt-1 text-sm text-forest-100">{EVENT.location}</p>
              </div>
            </header>

            <div className="p-6 text-center">
              <div
                className="mx-auto w-56 [&>svg]:h-auto [&>svg]:w-full"
                role="img"
                aria-label={`QR code for pass ${registration.passId}`}
                dangerouslySetInnerHTML={{ __html: qr }}
              />
              <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-forest-900/50">Pass ID</p>
              <p className="font-display text-4xl font-semibold tracking-wide text-forest-700">
                {registration.passId}
              </p>
            </div>

            {/* ticket perforation */}
            <div className="relative border-t-2 border-dashed border-sand-300">
              <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-sand-100 print:hidden" />
              <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-sand-100 print:hidden" />
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-5 p-6 text-sm">
              <div className="col-span-2">
                <dt className="text-xs font-bold uppercase tracking-wider text-forest-900/50">Climber</dt>
                <dd className="mt-0.5 font-display text-2xl font-semibold text-forest-900">
                  {registration.fullName}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-forest-900/50">Ticket</dt>
                <dd className="mt-0.5 font-bold text-forest-900">{registration.tier.name}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-forest-900/50">Kit size</dt>
                <dd className="mt-0.5 font-bold text-forest-900">{registration.kitSize}</dd>
              </div>
              <div className="col-span-2 flex flex-wrap gap-2">
                <Badge variant={registration.medicalCheckedAt ? "forest" : "sand"}>
                  {registration.medicalCheckedAt ? "Medically cleared" : "Medical checkup pending"}
                </Badge>
                {registration.musterCheckedAt && <Badge variant="gold">Checked in for ascent</Badge>}
              </div>
            </dl>

            <div className="border-t border-sand-200 bg-sand-50 p-6">
              <p className="eyebrow text-clay-500">Where to be</p>
              <ul className="mt-3 space-y-4">
                {SCHEDULE.map((s) => (
                  <li key={s.id} className="text-sm">
                    <p className="font-bold text-forest-900">{s.title}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-forest-900/75">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" /> {s.day}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> {s.time}
                      </span>
                    </p>
                    <p className="mt-0.5 flex items-start gap-1 text-forest-900/75">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {s.venue}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </article>

          <PassActions qrDownloadUrl={qrDownload} passId={registration.passId} />

          <p className="no-print mt-6 text-center text-sm text-forest-900/70">
            Keep this link private — anyone with it can show your pass.{" "}
            <Link href="/#packing" className="font-bold text-forest-700 underline underline-offset-4">
              See the packing list
            </Link>{" "}
            ·{" "}
            <Link href="/waiver" className="font-bold text-forest-700 underline underline-offset-4">
              Safety waiver
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
