"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Footprints, HeartPulse, House, Loader2, MailWarning, MountainSnow, Printer, Search, TriangleAlert } from "lucide-react";
import type { RegistrationListItem } from "@/lib/registrations";
import { Button } from "@/components/ui/button";
import { StatusBadge, STATUS_LABELS } from "./status-badge";
import { cn, displayPhone, formatWAT } from "@/lib/utils";

type Stats = {
  byStatus: Record<string, number>;
  byKit: Record<string, number>;
  medical: number;
  muster: number;
  summit: number;
  descent: number;
  onMountain: number;
  deliveryProblems: number;
};

type Data = {
  registrations: RegistrationListItem[];
  page: number;
  pageSize: number;
  matching: number;
  stats: Stats;
};

const KITS = ["S", "M", "L", "XL", "XXL"];

export function RegistrationsTable({ canExport }: { canExport: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadedQuery, setLoadedQuery] = useState<string | null>(null);
  const [q, setQ] = useState(params.get("q") ?? "");
  const requestId = useRef(0);

  const query = params.toString();
  const loading = loadedQuery !== query;

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  // Debounce the search box into the URL.
  useEffect(() => {
    const timer = setTimeout(() => {
      if ((params.get("q") ?? "") !== q) setParam("q", q.trim() || null);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  useEffect(() => {
    const id = ++requestId.current;
    fetch(`/api/admin/registrations?${query}`, { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 401) return router.replace("/admin/login?next=/admin/registrations");
        const json = await res.json();
        if (id !== requestId.current) return;
        if (!res.ok) setError(json.error ?? "Couldn't load registrations.");
        else {
          setData(json);
          setError(null);
        }
      })
      .catch(() => id === requestId.current && setError("Could not reach the server."))
      .finally(() => id === requestId.current && setLoadedQuery(query));
  }, [query, router]);

  const stats = data?.stats;
  const registered = stats?.byStatus.REGISTERED ?? 0;
  const unconfirmed = stats?.byStatus.PENDING ?? 0;
  const pages = data ? Math.max(1, Math.ceil(data.matching / data.pageSize)) : 1;

  const cards: [string, string | number, string?][] = stats
    ? [
        ["Registered climbers", registered],
        ["Medically cleared", `${stats.medical} / ${registered}`],
        ["Started ascent", `${stats.muster} / ${registered}`],
        ["Summited", `${stats.summit} / ${stats.muster}`],
        ["On the mountain", stats.onMountain],
        ["Pass not delivered", stats.deliveryProblems, stats.deliveryProblems ? "warn" : undefined],
      ]
    : [];

  // Slips follow the same search and check-in filters as the table.
  const slipParams = new URLSearchParams(params.toString());
  slipParams.delete("page");
  slipParams.delete("status");

  return (
    <main className="container py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-forest-900">Registrations</h1>
          <p className="mt-1 text-sm text-forest-900/70">Every climber who has registered. Click one to see details, fix mistakes, resend their pass or print their slip.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <a href={`/admin/slips?${slipParams.toString()}`} target="_blank" rel="noopener">
              <Printer className="h-4 w-4" /> Print slips
            </a>
          </Button>
          {canExport && (
            <Button asChild variant="outline" size="sm">
              <a href={`/api/admin/registrations/export?${query}`}>
                <Download className="h-4 w-4" /> Export CSV
              </a>
            </Button>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {(stats ? cards : Array.from({ length: 6 }, () => ["", "–"] as [string, string])).map(([label, value, tone], i) => (
          <div key={label || i} className={cn("rounded-2xl border bg-white p-4", tone === "warn" ? "border-clay-500/40" : "border-sand-200")}>
            <p className={cn("font-display text-2xl font-semibold tabular-nums", tone === "warn" ? "text-clay-600" : "text-forest-900")}>{value}</p>
            <p className="text-[11px] font-bold uppercase tracking-wider text-forest-900/55">{label || " "}</p>
          </div>
        ))}
      </div>

      {stats && registered > 0 && (
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-forest-900/70">
          <span>
            <strong>Kit sizes:</strong> {KITS.map((k) => `${k} ${stats.byKit[k] ?? 0}`).join(" · ")}
          </span>
          <span>
            <strong>Back at base:</strong> {stats.descent} of {stats.muster} who started
          </span>
          {unconfirmed > 0 && (
            <span>
              <strong>Not confirmed:</strong> {unconfirmed} from before registration became free — open one to confirm it
            </span>
          )}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-2 lg:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-forest-900/40" />
          <input
            type="search"
            aria-label="Search by name, pass ID, phone, email or reference"
            placeholder="Name, pass ID, phone, email or reference"
            className="field-input pl-12"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select aria-label="Status" className="field-input" value={params.get("status") ?? ""} onChange={(e) => setParam("status", e.target.value || null)}>
            <option value="">All statuses</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select aria-label="Check-in" className="field-input" value={params.get("checkin") ?? ""} onChange={(e) => setParam("checkin", e.target.value || null)}>
            <option value="">Any check-in</option>
            <option value="none">Registered, not yet cleared</option>
            <option value="medical">Medically cleared</option>
            <option value="muster">Started the ascent</option>
            <option value="summit">Reached the summit</option>
            <option value="descent">Back at base</option>
            <option value="mountain">Still on the mountain</option>
          </select>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 flex items-center gap-2 rounded-xl bg-clay-500/10 p-4 text-sm font-bold text-clay-600">
          <TriangleAlert className="h-4 w-4" /> {error}
        </p>
      )}

      <p className="mt-5 flex items-center gap-2 text-sm font-semibold text-forest-900/60" aria-live="polite">
        {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Loading…</> : data && `${data.matching} registration${data.matching === 1 ? "" : "s"}`}
      </p>

      {data && data.registrations.length === 0 && !loading ? (
        <p className="mt-3 rounded-2xl border-2 border-dashed border-sand-300 p-8 text-center text-forest-900/70">
          No registrations match. Try clearing the filters.
        </p>
      ) : (
        <div className="mt-3 overflow-hidden rounded-2xl border border-sand-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="hidden bg-sand-50 text-[11px] font-bold uppercase tracking-wider text-forest-900/55 md:table-header-group">
              <tr>
                <th className="px-4 py-3">Climber</th>
                <th className="px-4 py-3">Pass / status</th>
                <th className="px-4 py-3">Kit</th>
                <th className="px-4 py-3">Checkpoints</th>
                <th className="px-4 py-3">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-200">
              {(data?.registrations ?? []).map((r) => (
                <tr key={r.id} className="relative block hover:bg-sand-50 md:table-row">
                  <td className="block px-4 pt-3 md:table-cell md:py-3">
                    <Link href={`/admin/registrations/${r.id}`} className="font-bold text-forest-900 after:absolute after:inset-0 hover:underline">
                      {r.fullName}
                    </Link>
                    <p className="text-xs text-forest-900/60">{displayPhone(r.phone)} · {r.email}</p>
                  </td>
                  <td className="block px-4 py-1 md:table-cell md:py-3">
                    <span className="flex flex-wrap items-center gap-2">
                      {r.passId && <span className="font-mono text-xs font-bold text-forest-700">{r.passId}</span>}
                      <StatusBadge status={r.status} />
                      {r.deliveryProblem && (
                        <span title="Pass email or SMS not delivered" className="text-clay-600">
                          <MailWarning className="h-4 w-4" aria-label="Pass not delivered" />
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="block px-4 py-1 text-forest-900/80 md:table-cell md:py-3">
                    {r.kitSize}
                  </td>
                  <td className="block px-4 py-1 md:table-cell md:py-3">
                    <span className="flex gap-2">
                      <HeartPulse className={cn("h-4 w-4", r.medicalCheckedAt ? "text-forest-600" : "text-sand-300")} aria-label={r.medicalCheckedAt ? "Medically cleared" : "Not medically cleared"} />
                      <Footprints className={cn("h-4 w-4", r.musterCheckedAt ? "text-amber-600" : "text-sand-300")} aria-label={r.musterCheckedAt ? "Started the ascent" : "Not started"} />
                      <MountainSnow className={cn("h-4 w-4", r.summitReachedAt ? "text-forest-600" : "text-sand-300")} aria-label={r.summitReachedAt ? "Reached the summit" : "Not at summit"} />
                      <House className={cn("h-4 w-4", r.descentCheckedAt ? "text-forest-600" : "text-sand-300")} aria-label={r.descentCheckedAt ? "Back at base" : "Not back at base"} />
                    </span>
                  </td>
                  <td className="block px-4 pb-3 pt-1 text-xs text-forest-900/60 md:table-cell md:py-3">{formatWAT(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <Button variant="ghost" size="sm" disabled={data.page <= 1} onClick={() => setParam("page", String(data.page - 1))}>
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          <span className="text-sm font-semibold text-forest-900/70">Page {data.page} of {pages}</span>
          <Button variant="ghost" size="sm" disabled={data.page >= pages} onClick={() => setParam("page", String(data.page + 1))}>
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </main>
  );
}
