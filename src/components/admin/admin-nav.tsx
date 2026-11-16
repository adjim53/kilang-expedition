"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ClipboardList, LogOut, Mountain, ScanLine, UserCog, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export type NavLink = { href: string; label: string; icon: "registrations" | "checkin" | "users" | "account" };

const ICONS = { registrations: ClipboardList, checkin: ScanLine, users: Users, account: UserCog };

export function AdminNav({ links, name, roleLabel }: { links: NavLink[]; name: string; roleLabel: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-forest-950 text-white print:hidden" aria-label="Back office">
      <div className="container flex h-14 items-center gap-1">
        <Link href="/admin" className="mr-2 flex items-center gap-2 font-display text-lg font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-amber-500 text-ink">
            <Mountain className="h-4 w-4" strokeWidth={2.5} />
          </span>
          <span className="hidden md:inline">Kilang back office</span>
        </Link>
        <div className="flex flex-1 items-center gap-1 overflow-x-auto">
          {links.map((l) => {
            const Icon = ICONS[l.icon];
            const active = pathname === l.href || pathname.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold transition",
                  active ? "bg-white text-forest-900" : "text-forest-100 hover:bg-white/10",
                )}
              >
                <Icon className="h-4 w-4" />
                <span className={cn(active ? "max-sm:sr-only min-[420px]:not-sr-only" : "sr-only sm:not-sr-only")}>{l.label}</span>
              </Link>
            );
          })}
        </div>
        <span className="hidden text-right text-xs leading-tight text-forest-200 lg:block">
          {name}
          <br />
          <span className="text-forest-300">{roleLabel}</span>
        </span>
        <button
          onClick={signOut}
          className="ml-2 flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold text-forest-100 hover:bg-white/10"
        >
          <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </nav>
  );
}
