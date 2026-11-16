import Image from "next/image";
import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { CONTACT, EVENT } from "@/data/event";
import { BRAND } from "@/data/brand";
import { Topo } from "@/components/topo";

export function SiteFooter() {
  return (
    <footer className="no-print relative overflow-hidden bg-forest-950 text-forest-100">
      <Topo className="text-white/[0.04]" />
      <div className="container relative grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-4">
            <Image
              src={BRAND.badge.src}
              alt={BRAND.badge.alt}
              width={72}
              height={72}
              className="h-[72px] w-[72px] shrink-0 rounded-full ring-2 ring-white/10"
            />
            <p className="font-display text-3xl font-semibold leading-tight text-white">
              Kilang Mountain <span className="text-amber-400">Expedition</span>
            </p>
          </div>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-forest-200">
            {EVENT.theme}. {EVENT.tagline}.
          </p>
          <p className="mt-6 text-sm font-semibold text-amber-400">{CONTACT.handle}</p>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {CONTACT.socials.map((s) => (
              <li key={s.name}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:text-white hover:underline">
                  {s.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="eyebrow text-amber-400">Contact</p>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <a href={`mailto:${CONTACT.email}`} className="inline-flex items-center gap-2 hover:text-white">
                <Mail className="h-4 w-4 text-amber-400" /> {CONTACT.email}
              </a>
            </li>
            {CONTACT.phones.map((p) => (
              <li key={p}>
                <a href={`tel:${p}`} className="inline-flex items-center gap-2 hover:text-white">
                  <Phone className="h-4 w-4 text-amber-400" /> {p}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="eyebrow text-amber-400">Expedition</p>
          <ul className="mt-4 space-y-3 text-sm">
            <li><Link href="/#register" className="hover:text-white">Register to climb</Link></li>
            <li><Link href="/#schedule" className="hover:text-white">Schedule</Link></li>
            <li><Link href="/#route" className="hover:text-white">Getting there</Link></li>
            <li><Link href="/waiver" className="hover:text-white">Safety waiver</Link></li>
            <li><Link href="/admin/checkin" className="hover:text-white">Marshal check-in</Link></li>
          </ul>
        </div>
      </div>
      <div className="relative border-t border-white/10">
        <div className="container flex flex-col items-center gap-4 py-8 sm:flex-row sm:justify-center sm:gap-6">
          <p className="eyebrow text-forest-200">In partnership with</p>
          <ul className="flex flex-wrap items-center justify-center gap-4">
            {BRAND.partners.map((p) => (
              <li key={p.name} className="rounded-xl bg-white px-4 py-3 shadow-md">
                <Image src={p.src} alt={p.alt} width={p.width} height={p.height} sizes="180px" className="h-auto w-[180px]" />
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="relative border-t border-white/10">
        <p className="container py-5 text-xs text-forest-300">
          © {EVENT.year} Kilang Mountain Expedition · {EVENT.location}
        </p>
      </div>
    </footer>
  );
}
