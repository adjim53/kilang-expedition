import Image from "next/image";
import type { Registration } from "@prisma/client";
import { CONTACT, EVENT, SCHEDULE } from "@/data/event";
import { BRAND } from "@/data/brand";
import { CHECKPOINT_FIELDS, CHECKPOINT_INFO, CHECKPOINTS } from "@/lib/checkpoints";
import { EXPERIENCE_LABELS } from "@/lib/validation";
import { displayPhone, formatWAT } from "@/lib/utils";

function Cell({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2" : undefined}>
      <dt className="text-[10px] font-bold uppercase tracking-wider text-forest-900/55">{label}</dt>
      <dd className="mt-0.5 break-words text-[15px] font-bold leading-snug text-forest-900">{children}</dd>
    </div>
  );
}

/**
 * The printable registration slip: one A4 page per climber, generated from the
 * registration itself — nothing is typed or assembled by hand. `qrSvg` is the
 * same QR as the digital pass, so marshals scan the paper exactly like a phone.
 */
export function RegistrationSlip({ registration: r, qrSvg }: { registration: Registration; qrSvg: string }) {
  const experience = EXPERIENCE_LABELS[r.experience as keyof typeof EXPERIENCE_LABELS]?.split(" — ")[0] ?? r.experience;

  return (
    <article className="slip-sheet mx-auto w-full max-w-[720px] overflow-hidden rounded-2xl border border-sand-300 bg-white text-forest-900 shadow-lift print:max-w-none print:rounded-none print:border-0 print:shadow-none">
      <header className="flex items-center gap-4 border-b-4 border-amber-500 bg-forest-700 p-5 text-white [print-color-adjust:exact] [-webkit-print-color-adjust:exact]">
        <Image src={BRAND.badge.src} alt="" width={72} height={72} className="h-[72px] w-[72px] shrink-0 rounded-full bg-white" />
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-400">Registration slip</p>
          <p className="font-display text-2xl font-semibold leading-tight">{EVENT.name}</p>
          <p className="text-sm text-forest-100">{EVENT.location} · December 30 – 31, 2026</p>
        </div>
      </header>

      <div className="grid gap-6 p-6 sm:grid-cols-[200px_1fr] print:grid-cols-[200px_1fr]">
        <div className="text-center">
          <div
            className="mx-auto w-[190px] [&>svg]:h-auto [&>svg]:w-full"
            role="img"
            aria-label={`QR code for pass ${r.passId}`}
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-forest-900/55">Pass ID</p>
          <p className="whitespace-nowrap font-display text-2xl font-semibold tracking-wide text-forest-700">{r.passId}</p>
        </div>

        <dl className="grid grid-cols-2 content-start gap-x-5 gap-y-4">
          <div className="col-span-2">
            <dt className="text-[10px] font-bold uppercase tracking-wider text-forest-900/55">Climber</dt>
            <dd className="mt-0.5 break-words font-display text-3xl font-semibold leading-tight">{r.fullName}</dd>
          </div>
          <Cell label="Phone">{displayPhone(r.phone)}</Cell>
          <Cell label="Email">{r.email}</Cell>
          <Cell label="Blood group · genotype">
            {r.bloodGroup} · {r.genotype}
          </Cell>
          <Cell label="Experience">{experience}</Cell>
          <Cell label="Kit size">{r.kitSize}</Cell>
          <Cell label="Registered">{formatWAT(r.createdAt)}</Cell>
          <Cell label="Next of kin" wide>
            {r.nextOfKinName} · {displayPhone(r.nextOfKinPhone)}
          </Cell>
        </dl>
      </div>

      <section className="border-t border-sand-300 px-6 py-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-clay-600">
          Checkpoints — a marshal scans your QR code at each one
        </p>
        <ol className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 print:grid-cols-4">
          {CHECKPOINTS.map((stage, i) => {
            const at = r[CHECKPOINT_FIELDS[stage].at];
            return (
              <li key={stage} className="rounded-xl border-2 border-sand-300 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-forest-900/55">
                  {i + 1}. {CHECKPOINT_INFO[stage].label}
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-forest-900/70">{CHECKPOINT_INFO[stage].when}</p>
                <p className="mt-2 flex min-h-[2.25rem] items-end text-sm font-bold">
                  {at ? (
                    <span className="text-forest-700">✓ {formatWAT(at)}</span>
                  ) : (
                    <span className="block h-7 w-full border-b border-dashed border-forest-900/40" />
                  )}
                </p>
              </li>
            );
          })}
        </ol>
        <p className="mt-3 text-xs font-semibold leading-relaxed text-forest-900/75">
          No medical clearance, no climb. The checkup on December 30 is mandatory for every climber.
        </p>
      </section>

      <section className="border-t border-sand-300 bg-sand-50 px-6 py-5 [print-color-adjust:exact] [-webkit-print-color-adjust:exact]">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-clay-600">Where to be</p>
        <ul className="mt-2 grid gap-x-6 gap-y-2 text-[13px] leading-snug sm:grid-cols-2 print:grid-cols-2">
          {SCHEDULE.map((s) => (
            <li key={s.id}>
              <span className="font-bold">
                {s.day}, {s.time}
              </span>{" "}
              — {s.title}
              <span className="block text-forest-900/70">{s.venue}</span>
            </li>
          ))}
        </ul>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-t border-sand-300 px-6 py-3 text-[11px] text-forest-900/70">
        <span>Registration is free. This slip is personal to the climber named on it — bring it with photo ID.</span>
        <span className="font-semibold">
          {CONTACT.email} · {CONTACT.phones[0]}
        </span>
      </footer>
    </article>
  );
}
