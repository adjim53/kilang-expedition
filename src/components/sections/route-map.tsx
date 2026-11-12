"use client";

import dynamic from "next/dynamic";
import { Car, MapPin, Plane, TriangleAlert } from "lucide-react";
import { LOCATIONS, googleMapsLink } from "@/data/locations";
import { Reveal } from "@/components/reveal";

// Leaflet touches `window`, so the map only loads in the browser.
const MapInner = dynamic(() => import("./map-inner"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center bg-forest-100 text-sm font-semibold text-forest-700">
      Loading map…
    </div>
  ),
});

export function RouteMap() {
  const venues = LOCATIONS.filter((l) => l.kind === "venue");
  const anyUnverified = venues.some((v) => !v.verified);

  return (
    <section id="route" className="section bg-sand-50">
      <div className="container">
        <Reveal>
          <p className="eyebrow text-clay-500">Route &amp; logistics</p>
          <h2 className="section-title mt-3 text-forest-900">Getting to Kaltungo</h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-forest-900/70">
            Fly into Gombe or drive in, then follow the Gombe–Yola highway south through Billiri to Kaltungo.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-10 grid gap-5 lg:grid-cols-[1.7fr_1fr]">
            <div className="h-[420px] overflow-hidden rounded-2xl border border-sand-200 shadow-sm sm:h-[540px]">
              <MapInner />
            </div>

            <div className="flex flex-col gap-4">
              <div className="rounded-2xl bg-forest-700 p-6 text-white">
                <p className="eyebrow text-amber-400">Map key</p>
                <ul className="mt-4 space-y-3 text-sm font-semibold">
                  <li className="flex items-center gap-3">
                    <Plane className="h-5 w-5 text-amber-400" /> Airport link — GMO to Gombe town
                  </li>
                  <li className="flex items-center gap-3">
                    <Car className="h-5 w-5 text-amber-400" /> Drive — Gombe → Billiri → Kaltungo
                  </li>
                  <li className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-amber-400" /> Expedition venues
                  </li>
                </ul>
              </div>

              <ul className="divide-y divide-sand-200 rounded-2xl border border-sand-200 bg-white">
                {venues.map((v) => (
                  <li key={v.id} className="p-4">
                    <p className="font-bold text-forest-900">{v.name}</p>
                    <p className="mt-0.5 text-sm text-forest-900/70">{v.description}</p>
                    <a
                      href={googleMapsLink(v)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1.5 inline-block text-sm font-bold text-forest-600 underline underline-offset-4 hover:text-forest-800"
                    >
                      Find in Google Maps
                    </a>
                  </li>
                ))}
              </ul>

              {anyUnverified && (
                <p className="flex gap-2.5 rounded-2xl bg-amber-500/15 p-4 text-sm font-medium text-forest-900">
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                  Venue pins on the map are approximate. Confirm exact locations with the organisers before you
                  travel.
                </p>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
