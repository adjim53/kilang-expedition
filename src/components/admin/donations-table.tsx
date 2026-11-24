"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Loader2, MailWarning, RefreshCw, Search, TriangleAlert } from "lucide-react";
import { DONOR_TYPE_LABELS, DONOR_TYPES, type DonorType } from "@/data/donations";
import type { DonationItem } from "@/lib/donations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, displayPhone, formatNaira, formatWAT } from "@/lib/utils";

type Group = { count: number; amountKobo: number };
type Data = {
  donations: DonationItem[];
  page: number;
  pageSize: number;
  matching: number;
  stats: { receivedKobo: number; receivedCount: number; individuals: Group; partners: Group; pending: number };
};

export function DonationsTable() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [loadedQuery, setLoadedQuery] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
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
    fetch(`/api/admin/donations?${query}`, { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 401) return router.replace("/admin/login?next=/admin/donations");
        const json = await res.json();
        if (id !== requestId.current) return;
        if (!res.ok) setError(json.error ?? "Couldn't load donations.");
        else {
          setData(json);
          setError(null);
        }
      })
      .catch(() => id === requestId.current && setError("Could not reach the server."))
      .finally(() => id === requestId.current && setLoadedQuery(query));
  }, [query, router, reload]);

  async function recheck(d: DonationItem) {
    setBusyId(d.id);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/donations/${d.id}`, { method: "POST" });
      const json = await res.json();
      setNotice({ ok: res.ok && json.ok !== false, text: json.message ?? json.error ?? "Done." });
      setReload((n) => n + 1);
    } catch {
      setNotice({ ok: false, text: "Could not reach the server. Nothing was changed." });
    }
    setBusyId(null);
  }

  const stats = data?.stats;
  const pages = data ? Math.max(1, Math.ceil(data.matching / data.pageSize)) : 1;
  const cards: [string, string | number, string?][] = stats
    ? [
        ["Total received", formatNaira(stats.receivedKobo)],
        ["Donations received", stats.receivedCount],
        ["From well-wishers", formatNaira(stats.individuals.amountKobo), `${stats.individuals.count} gift${stats.individuals.count === 1 ? "" : "s"}`],
        ["From partners", formatNaira(stats.partners.amountKobo), `${stats.partners.count} gift${stats.partners.count === 1 ? "" : "s"}`],
      ]
    : [];

  return (
    <main className="container py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-forest-900">Donations</h1>
          <p className="mt-1 max-w-2xl text-sm text-forest-900/70">
            Gifts from well-wishers and partners, received through Paystack. A donation counts only once Paystack
            confirms it. Refunds and payouts are handled in the Paystack dashboard.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <a href={`/api/admin/donations/export?${query}`}>
            <Download className="h-4 w-4" /> Export CSV
          </a>
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {(stats ? cards : Array.from({ length: 4 }, () => ["", "–"] as [string, string])).map(([label, value, sub], i) => (
          <div key={label || i} className="rounded-2xl border border-sand-200 bg-white p-4">
            <p className="font-display text-2xl font-semibold tabular-nums text-forest-900">{value}</p>
            <p className="text-[11px] font-bold uppercase tracking-wider text-forest-900/55">{label || " "}</p>
            {sub && <p className="mt-0.5 text-xs text-forest-900/60">{sub}</p>}
          </div>
        ))}
      </div>
      {stats && stats.pending > 0 && (
        <p className="mt-3 text-xs text-forest-900/70">
          <strong>{stats.pending} not completed:</strong> the donor opened the payment window and did not finish. If
          someone says they paid, find them below and use “Re-check with Paystack”.
        </p>
      )}

      <div className="mt-6 flex flex-col gap-2 lg:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-forest-900/40" />
          <input
            type="search"
            aria-label="Search by donor, organisation, email or reference"
            placeholder="Donor, organisation, email or reference"
            className="field-input pl-12"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select aria-label="Status" className="field-input" value={params.get("status") ?? ""} onChange={(e) => setParam("status", e.target.value || null)}>
            <option value="">All statuses</option>
            <option value="PAID">Received</option>
            <option value="PENDING">Not completed</option>
          </select>
          <select aria-label="Donor type" className="field-input" value={params.get("type") ?? ""} onChange={(e) => setParam("type", e.target.value || null)}>
            <option value="">All donors</option>
            {DONOR_TYPES.map((t) => (
              <option key={t} value={t}>{DONOR_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 flex items-center gap-2 rounded-xl bg-clay-500/10 p-4 text-sm font-bold text-clay-600">
          <TriangleAlert className="h-4 w-4" /> {error}
        </p>
      )}
      {notice && (
        <p role="status" className={cn("mt-4 rounded-xl p-4 text-sm font-bold", notice.ok ? "bg-forest-100 text-forest-800" : "bg-clay-500/10 text-clay-600")}>
          {notice.text}
        </p>
      )}

      <p className="mt-5 flex items-center gap-2 text-sm font-semibold text-forest-900/60" aria-live="polite">
        {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Loading…</> : data && `${data.matching} donation${data.matching === 1 ? "" : "s"}`}
      </p>

      {data && data.donations.length === 0 && !loading ? (
        <p className="mt-3 rounded-2xl border-2 border-dashed border-sand-300 p-8 text-center text-forest-900/70">
          {query ? "No donations match. Try clearing the filters." : "No donations yet. They appear here the moment Paystack confirms them."}
        </p>
      ) : (
        <div className="mt-3 overflow-hidden rounded-2xl border border-sand-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="hidden bg-sand-50 text-[11px] font-bold uppercase tracking-wider text-forest-900/55 md:table-header-group">
              <tr>
                <th className="px-4 py-3">Donor</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-200">
              {(data?.donations ?? []).map((d) => {
                const received = d.status === "PAID";
                return (
                  <tr key={d.id} className="block md:table-row">
                    <td className="block px-4 pt-3 md:table-cell md:py-3">
                      <p className="font-bold text-forest-900">{d.organisation || d.donorName}</p>
                      <p className="text-xs text-forest-900/60">
                        {DONOR_TYPE_LABELS[d.donorType as DonorType] ?? d.donorType}
                        {d.organisation && ` · ${d.donorName}`} · {d.email}
                        {d.phone && ` · ${displayPhone(d.phone)}`}
                      </p>
                      {d.message && <p className="mt-1 max-w-md text-xs italic text-forest-900/75">“{d.message}”</p>}
                    </td>
                    <td className="block px-4 py-1 font-display text-lg font-semibold tabular-nums text-forest-900 md:table-cell md:py-3">
                      {formatNaira(d.amountKobo)}
                    </td>
                    <td className="block px-4 py-1 md:table-cell md:py-3">
                      <span className="flex flex-wrap items-center gap-2">
                        <Badge variant={received ? "forest" : "sand"}>{received ? "Received" : "Not completed"}</Badge>
                        {received && !d.receiptSent && (
                          <span title={d.receiptError ?? "Receipt email not sent"} className="text-clay-600">
                            <MailWarning className="h-4 w-4" aria-label="Receipt email not sent" />
                          </span>
                        )}
                        {!received && (
                          <Button variant="ghost" size="sm" disabled={busyId !== null} onClick={() => recheck(d)}>
                            {busyId === d.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                            Re-check with Paystack
                          </Button>
                        )}
                      </span>
                    </td>
                    <td className="block px-4 py-1 font-mono text-xs text-forest-900/80 md:table-cell md:py-3">{d.reference}</td>
                    <td className="block px-4 pb-3 pt-1 text-xs text-forest-900/60 md:table-cell md:py-3">
                      {formatWAT(d.paidAt ?? d.createdAt)}
                    </td>
                  </tr>
                );
              })}
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
