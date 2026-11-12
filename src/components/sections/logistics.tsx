import { Bed, Car, Check, Plane, ShieldCheck, Tent } from "lucide-react";
import { PACKING_LIST, SAFETY_RULES, TRAVEL_GUIDE } from "@/data/content";
import { CONTACT } from "@/data/event";
import { Reveal } from "@/components/reveal";
import { Topo } from "@/components/topo";

const ICONS: Record<string, React.ElementType> = { fly: Plane, drive: Car, stay: Bed, camp: Tent };

export function TravelGuide() {
  return (
    <section className="bg-sand-50 pb-20 sm:pb-28">
      <div className="container grid gap-5 md:grid-cols-2">
        {TRAVEL_GUIDE.map((g, i) => {
          const Icon = ICONS[g.id];
          return (
            <Reveal key={g.id} delay={i * 0.05}>
              <article className="h-full rounded-2xl border border-sand-200 bg-white p-6 shadow-sm sm:p-7">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-forest-100 text-forest-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-2xl font-semibold leading-none text-forest-900">{g.title}</h3>
                    <p className="mt-1 text-sm font-semibold text-clay-500">{g.summary}</p>
                  </div>
                </div>
                <ul className="mt-5 space-y-2.5 text-[15px] leading-relaxed text-forest-900/80">
                  {g.points.map((p) => (
                    <li key={p} className="flex gap-2.5">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                      {p}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          );
        })}
        <p className="text-sm text-forest-900/70 md:col-span-2">
          Need help with transport or lodging? Call {CONTACT.phones.join(", ")} or email{" "}
          <a href={`mailto:${CONTACT.email}`} className="font-bold text-forest-700 underline underline-offset-4">
            {CONTACT.email}
          </a>
          .
        </p>
      </div>
    </section>
  );
}

export function Packing() {
  return (
    <section id="packing" className="section relative overflow-hidden bg-forest-800 text-white">
      <Topo className="text-white/[0.05]" />
      <div className="container relative">
        <Reveal>
          <p className="eyebrow text-amber-400">Safety &amp; gear</p>
          <h2 className="section-title mt-3">Pack for a 4:00 AM start.</h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-forest-100">
            You begin in darkness and harmattan cold, and descend in full sun. Pack for both.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-5 lg:grid-cols-[2fr_1fr]">
          <div className="grid gap-5 sm:grid-cols-2">
            {PACKING_LIST.map((g, i) => (
              <Reveal key={g.group} delay={i * 0.05}>
                <div className="h-full rounded-2xl border border-white/10 bg-white/[0.06] p-6">
                  <h3 className="text-xl font-semibold text-amber-400">{g.group}</h3>
                  <ul className="mt-4 space-y-2.5 text-[15px] leading-snug text-forest-50">
                    {g.items.map((item) => (
                      <li key={item} className="flex gap-2.5">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" strokeWidth={3} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.15}>
            <div className="h-full rounded-2xl bg-amber-500 p-6 text-ink sm:p-7">
              <ShieldCheck className="h-9 w-9" />
              <h3 className="mt-3 text-2xl font-semibold">Mountain rules</h3>
              <ol className="mt-4 space-y-3 text-[15px] font-medium leading-snug">
                {SAFETY_RULES.map((rule, i) => (
                  <li key={rule} className="flex gap-3">
                    <span className="font-display text-lg font-semibold leading-none">{i + 1}</span>
                    {rule}
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
