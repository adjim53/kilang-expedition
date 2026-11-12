"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, Mountain, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/#legend", label: "The Legend" },
  { href: "/#schedule", label: "Schedule" },
  { href: "/#gallery", label: "Gallery" },
  { href: "/#route", label: "Getting There" },
  { href: "/#packing", label: "Packing List" },
];

export function SiteHeader({ solid = false }: { solid?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const filled = solid || scrolled || open;

  return (
    <header
      className={cn(
        "no-print fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        filled ? "bg-forest-900/95 shadow-lg backdrop-blur" : "bg-transparent",
      )}
    >
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 text-white" onClick={() => setOpen(false)}>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-amber-500 text-ink">
            <Mountain className="h-5 w-5" strokeWidth={2.5} />
          </span>
          <span className="font-display text-lg font-semibold leading-none tracking-tight">
            Kilang <span className="text-amber-400">2026</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-semibold text-white/80 transition hover:text-amber-400"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild size="sm">
            <Link href="/#register" onClick={() => setOpen(false)}>
              Register
            </Link>
          </Button>
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full text-white lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="container border-t border-white/10 pb-5 pt-2 lg:hidden" aria-label="Mobile">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block border-b border-white/10 py-3.5 text-base font-semibold text-white"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
