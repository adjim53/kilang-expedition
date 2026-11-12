import Link from "next/link";
import { ArrowDown, CalendarDays, MapPin } from "lucide-react";
import { EVENT } from "@/data/event";
import { Button } from "@/components/ui/button";
import { Countdown } from "@/components/countdown";
import { Topo } from "@/components/topo";

function Ridgeline() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1440 520"
      preserveAspectRatio="xMidYMax slice"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[58%] w-full overflow-visible sm:h-[66%]"
    >
      <defs>
        <radialGradient id="sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FCD34D" stopOpacity="0.95" />
          <stop offset="35%" stopColor="#F59E0B" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="peak" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1F6F69" />
          <stop offset="100%" stopColor="#0E3B38" />
        </linearGradient>
      </defs>

      {/* first light behind the summit */}
      <circle cx="1010" cy="250" r="300" fill="url(#sun)" />
      <circle cx="1010" cy="250" r="46" fill="#FCD34D" />

      {/* far inselbergs */}
      <path
        d="M0 420 L120 372 L210 396 L330 318 L420 362 L520 340 L610 388 L740 352 L860 400 L1440 400 L1440 520 L0 520 Z"
        fill="#175D58"
        opacity="0.55"
      />
      {/* Pan Kilang — the conical peak */}
      <path
        d="M560 520 L760 300 L840 228 L905 150 L948 96 L975 118 L1010 92 L1052 150 L1120 232 L1210 318 L1330 420 L1440 470 L1440 520 Z"
        fill="url(#peak)"
      />
      {/* lit eastern face */}
      <path d="M1010 92 L1052 150 L1120 232 L1210 318 L1330 420 L1180 380 L1090 280 L1030 190 Z" fill="#F59E0B" opacity="0.2" />
      {/* summit trail */}
      <path
        d="M690 520 C760 470 800 430 850 380 S 930 250 962 180 S 990 120 1006 98"
        fill="none"
        stroke="#FCD34D"
        strokeWidth="3"
        strokeDasharray="2 11"
        strokeLinecap="round"
      />
      {/* near ground */}
      <path
        d="M0 520 L0 452 L140 430 L260 462 L400 440 L520 478 L700 458 L900 490 L1100 470 L1300 496 L1440 480 L1440 520 Z"
        fill="#0A2B29"
      />
    </svg>
  );
}

export function Hero() {
  return (
    <section className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-forest-900 text-white">
      <div className="absolute inset-0 bg-gradient-to-b from-forest-950 via-forest-900 to-forest-700" />
      <Topo className="text-white/[0.07]" />
      <Ridgeline />

      <div className="container relative z-10 flex flex-1 flex-col justify-center pb-40 pt-28 sm:pb-52">
        <p className="eyebrow text-amber-400">{EVENT.theme}</p>

        <h1 className="mt-5 max-w-3xl text-[2.9rem] font-semibold leading-[0.98] tracking-tight sm:text-7xl lg:text-[5.4rem]">
          Meet the last sunrise of 2026 from the <em className="font-medium italic text-amber-400">roof of Gombe.</em>
        </h1>

        <p className="mt-6 max-w-xl text-lg leading-relaxed text-forest-100 sm:text-xl">
          The Kilang Mountain Expedition returns to Pan Kilang, Kaltungo. Two days, one summit, and a community
          climbing together.
        </p>

        <ul className="mt-6 flex flex-col gap-2 text-sm font-semibold text-white sm:flex-row sm:gap-6 sm:text-base">
          <li className="inline-flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-amber-400" /> December 30 – 31, 2026
          </li>
          <li className="inline-flex items-center gap-2">
            <MapPin className="h-5 w-5 text-amber-400" /> {EVENT.location}
          </li>
        </ul>

        <div className="mt-9">
          <Countdown to={EVENT.startsAt} doneLabel="The expedition is under way." />
        </div>

        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="#register">Register to climb</Link>
          </Button>
          <Button asChild size="lg" variant="light">
            <Link href="#schedule">See the schedule</Link>
          </Button>
        </div>
      </div>

      <a
        href="#legend"
        className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 animate-drift items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white/70 hover:text-white sm:inline-flex"
      >
        The legend <ArrowDown className="h-4 w-4" />
      </a>
    </section>
  );
}
