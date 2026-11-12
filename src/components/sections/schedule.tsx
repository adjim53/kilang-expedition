import { Clock, MapPin, Users } from "lucide-react";
import { SCHEDULE } from "@/data/event";
import { LOCATIONS, googleMapsLink } from "@/data/locations";
import { Reveal } from "@/components/reveal";
import { Badge } from "@/components/ui/badge";

export function Schedule() {
  return (
    <section id="schedule" className="section bg-sand-100">
      <div className="container">
        <Reveal>
          <p className="eyebrow text-clay-500">Schedule &amp; itinerary</p>
          <h2 className="section-title mt-3 text-forest-900">Two days. Four stops.</h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-forest-900/70">
            Get cleared, get briefed, climb, and close with a royal welcome. Every stop is required for climbers.
          </p>
        </Reveal>

        <ol className="relative mt-12">
          <span aria-hidden="true" className="absolute bottom-6 left-[19px] top-6 w-0.5 bg-forest-700/20 sm:left-[27px]" />
          {SCHEDULE.map((item, i) => {
            const location = LOCATIONS.find((l) => l.id === item.locationId);
            const newDay = i === 0 || SCHEDULE[i - 1].day !== item.day;
            return (
              <li key={item.id} className="relative pb-8 pl-14 last:pb-0 sm:pl-20">
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-1 grid h-10 w-10 place-items-center rounded-full bg-forest-700 font-display text-lg font-semibold text-amber-400 ring-4 ring-sand-100 sm:h-14 sm:w-14 sm:text-2xl"
                >
                  {i + 1}
                </span>
                <Reveal delay={i * 0.05}>
                  {newDay && (
                    <Badge variant="gold" className="mb-3">
                      {item.date}
                    </Badge>
                  )}
                  <article className="rounded-2xl border border-sand-200 bg-white p-6 shadow-sm sm:p-7">
                    <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-clay-500">
                      <Clock className="h-4 w-4" /> {item.time}
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold text-forest-900 sm:text-3xl">{item.title}</h3>
                    <p className="mt-3 text-base leading-relaxed text-forest-900/75">{item.note}</p>
                    <dl className="mt-5 grid gap-3 border-t border-sand-200 pt-5 text-sm sm:grid-cols-2">
                      <div className="flex gap-2.5">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-forest-700" />
                        <div>
                          <dt className="sr-only">Venue</dt>
                          <dd className="font-semibold text-forest-900">{item.venue}</dd>
                          {location && (
                            <a
                              href={googleMapsLink(location)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold text-forest-600 underline underline-offset-4 hover:text-forest-800"
                            >
                              Open in Maps
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2.5">
                        <Users className="mt-0.5 h-4 w-4 shrink-0 text-forest-700" />
                        <div>
                          <dt className="sr-only">Who attends</dt>
                          <dd className="text-forest-900/80">{item.audience}</dd>
                        </div>
                      </div>
                    </dl>
                  </article>
                </Reveal>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
