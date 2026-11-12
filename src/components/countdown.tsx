"use client";

import { useEffect, useState } from "react";

function remaining(target: number) {
  const diff = Math.max(0, target - Date.now());
  return {
    done: diff === 0,
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export function Countdown({ to, doneLabel }: { to: string; doneLabel: string }) {
  const target = new Date(to).getTime();
  // Rendered after mount only, so server and browser clocks never disagree.
  const [time, setTime] = useState<ReturnType<typeof remaining> | null>(null);

  useEffect(() => {
    setTime(remaining(target));
    const id = setInterval(() => setTime(remaining(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (time?.done) {
    return <p className="font-display text-2xl font-semibold text-amber-400">{doneLabel}</p>;
  }

  const cells: [string, number | undefined][] = [
    ["Days", time?.days],
    ["Hours", time?.hours],
    ["Minutes", time?.minutes],
    ["Seconds", time?.seconds],
  ];

  return (
    <div className="grid max-w-md grid-cols-4 gap-2 sm:gap-3" role="timer" aria-label="Countdown to the expedition">
      {cells.map(([label, value]) => (
        <div
          key={label}
          className="rounded-2xl border border-white/15 bg-white/[0.07] px-1 py-3 text-center backdrop-blur-sm sm:py-4"
        >
          <span className="block font-display text-3xl font-semibold tabular-nums text-white sm:text-4xl">
            {value === undefined ? "––" : String(value).padStart(2, "0")}
          </span>
          <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.18em] text-amber-400 sm:text-xs">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
