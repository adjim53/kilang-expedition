"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LEGEND } from "@/data/content";
import { Reveal } from "@/components/reveal";
import { cn } from "@/lib/utils";

export function Legend() {
  const [active, setActive] = useState(LEGEND[0].id);
  const index = LEGEND.findIndex((c) => c.id === active);
  const chapter = LEGEND[index];

  return (
    <section id="legend" className="section bg-sand-50">
      <div className="container">
        <Reveal>
          <p className="eyebrow text-clay-500">Folklore &amp; geology</p>
          <h2 className="section-title mt-3 max-w-2xl text-forest-900">The Legend of Pan Kilang</h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-forest-900/70">
            Before it was a trail, it was a refuge, a shrine and a landmark. Four chapters of the mountain&apos;s
            story, as the Tangale people tell it.
          </p>
        </Reveal>

        <Reveal delay={0.1} className="mt-10">
          <div
            role="tablist"
            aria-label="Chapters of the legend"
            className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-2 sm:mx-0 sm:px-0"
          >
            {LEGEND.map((c, i) => (
              <button
                key={c.id}
                role="tab"
                id={`legend-tab-${c.id}`}
                aria-selected={c.id === active}
                aria-controls="legend-panel"
                onClick={() => setActive(c.id)}
                className={cn(
                  "shrink-0 rounded-full border-2 px-5 py-2.5 text-sm font-bold transition",
                  c.id === active
                    ? "border-forest-700 bg-forest-700 text-white"
                    : "border-sand-300 bg-white text-forest-800 hover:border-forest-700",
                )}
              >
                <span className="mr-2 text-amber-500">{String(i + 1).padStart(2, "0")}</span>
                {c.label}
              </button>
            ))}
          </div>

          <div
            id="legend-panel"
            role="tabpanel"
            aria-labelledby={`legend-tab-${chapter.id}`}
            className="mt-6 overflow-hidden rounded-2xl bg-forest-700 text-white shadow-lift"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={chapter.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="grid md:grid-cols-[1.6fr_1fr]"
              >
                <div className="p-7 sm:p-12">
                  <p className="eyebrow text-amber-400">
                    Chapter {index + 1} of {LEGEND.length}
                  </p>
                  <h3 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">{chapter.title}</h3>
                  {chapter.body.map((p) => (
                    <p key={p} className="mt-4 text-base leading-relaxed text-forest-100 sm:text-lg">
                      {p}
                    </p>
                  ))}
                </div>
                <div className="flex flex-col justify-center border-t border-white/10 bg-forest-800 p-7 sm:p-12 md:border-l md:border-t-0">
                  <p className="font-display text-5xl font-semibold leading-none text-amber-400 sm:text-6xl">
                    {chapter.fact.value}
                  </p>
                  <p className="mt-3 text-sm font-semibold uppercase tracking-wider text-forest-200">
                    {chapter.fact.caption}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
