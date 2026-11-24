"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Footprints, House, Loader2, MountainSnow, Phone, RefreshCw, ScanLine, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { progressOf, PROGRESS_LABELS, type Progress } from "@/lib/checkpoints";
import type { CheckpointCounts } from "@/lib/tracker";
import { cn, displayPhone } from "@/lib/utils";

type Climber = {
  id: string;
  passId: string;
  fullName: string;
  phone: string;
  nextOfKinName: string;
  nextOfKinPhone: string;
  hasMedicalNotes: boolean;
  medicalCheckedAt: string | null;
  musterCheckedAt: string | null;
  summitReachedAt: string | null;
  descentCheckedAt: string | null;
};
type Data = { stats: CheckpointCounts; updatedAt: string; climbers: Climber[] };
type View = "mountain" | "summit" | "returned" | "all";

/** The board refreshes itself; nobody has to reload it. */
const REFRESH_MS = 15_000;

const VIEWS: { id: View; label: string }[] = [
  { id: "mountain", label: "On the mountain" },
  { id: "summit", label: "Summited" },
  { id: "returned", label: "Back at base" },
  { id: "all", label: "Everyone who started" },
];

const PROGRESS_BADGE: Record<Progress, "gold" | "forest" | "soft" | "sand"> = {
  registered: "sand",
  cleared: "sand",
  ascending: "gold",
  summit: "forest",
  returned: "soft",
  turned_back: "sand",
};

function minutesBetween(from: string | null, to: string | null) {
  if (!from || !to) return null;
  const mins = Math.round((new Date(to).getTime() - new Date(from).getTime()) / 60_000);
  if (mins < 0) return null;
  return mins >= 60 ? `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, "0")}m` : `${mins}m`;
}

function timeOnly(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-NG", { timeZone: "Africa/Lagos", hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}

type Loaded = Data | { error: string } | "signed_out";

async function fetchTracker(): Promise<Loaded> {
  try {
    const res = await fetch("/api/admin/tracker", { cache: "no-store" });
    if (res.status === 401) return "signed_out";
    const json = await res.json();
    return res.ok ? json : { error: json.error ?? "Couldn't load the tracker." };
  } catch {
    return { error: "No connection — showing the last numbers received." };
  }
}

export function SummitTracker() {
  const router = useRouter();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("mountain");

  const apply = useCallback(
    (loaded: Loaded) => {
      if (loaded === "signed_out") return router.replace("/admin/login?next=/admin/tracker");
      if ("error" in loaded) setError(loaded.error);
      else {
        setData(loaded);
        setError(null);
      }
      setLoading(false);
    },
    [router],
  );

  useEffect(() => {
    let live = true;
    const refresh = () => void fetchTracker().then((loaded) => live && apply(loaded));
    refresh();
    const timer = setInterval(() => {
      // Don't spend mobile data refreshing a tab nobody is looking at.
      if (document.visibilityState === "visible") refresh();
    }, REFRESH_MS);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, [apply]);

  const stats = data?.stats;
  const climbers = useMemo(() => {
    const all = data?.climbers ?? [];
    if (view === "mountain") return all.filter((c) => !c.descentCheckedAt);
    if (view === "summit") {
      return all
        .filter((c) => c.summitReachedAt)
        .sort((a, b) => a.summitReachedAt!.localeCompare(b.summitReachedAt!));
    }
    if (view === "returned") return all.filter((c) => c.descentCheckedAt);
    return all;
  }, [data, view]);

  const cards: [string, number | undefined, React.ElementType, string?][] = [
    ["Started the ascent", stats?.muster, Footprints],
    ["Reached the summit", stats?.summit, MountainSnow],
    ["Back at base", stats?.descent, House],
    ["Still on the mountain", stats?.onMountain, TriangleAlert, stats?.onMountain ? "watch" : undefined],
  ];

  return (
    <main className="min-h-screen bg-sand-100 pb-16">
      <header className="bg-forest-900 text-white">
        <div className="container flex flex-wrap items-center justify-between gap-3 py-4">
          <div>
            <p className="eyebrow text-amber-400">Kilang Expedition 2026</p>
            <h1 className="text-2xl font-semibold">Summit tracker</h1>
            <p className="mt-0.5 text-xs text-forest-200" aria-live="polite">
              {data ? `Updated ${timeOnly(data.updatedAt)} · refreshes every ${REFRESH_MS / 1000} seconds` : "Loading…"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="light"
              size="sm"
              disabled={loading}
              onClick={() => {
                setLoading(true);
                void fetchTracker().then(apply);
              }}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Refresh
            </Button>
            <Button asChild size="sm">
              <Link href="/admin/checkin">
                <ScanLine className="h-4 w-4" /> Scan passes
              </Link>
            </Button>
          </div>
        </div>
        <div className="container grid grid-cols-2 gap-2 pb-5 lg:grid-cols-4">
          {cards.map(([label, value, Icon, tone]) => (
            <div key={label} className={cn("rounded-xl p-4", tone === "watch" ? "bg-amber-500 text-ink" : "bg-white/10")}>
              <Icon className={cn("h-5 w-5", tone === "watch" ? "text-ink" : "text-amber-400")} />
              <p className="mt-1 font-display text-4xl font-semibold tabular-nums">{value ?? "–"}</p>
              <p className={cn("text-[11px] font-bold uppercase tracking-wider", tone === "watch" ? "text-ink/80" : "text-forest-200")}>
                {label}
              </p>
            </div>
          ))}
        </div>
      </header>

      <div className="container mt-5">
        {stats && (
          <p className="text-sm text-forest-900/70">
            {stats.total} registered · {stats.medical} medically cleared · {stats.muster} started.{" "}
            {stats.muster > 0 && stats.onMountain === 0 && <strong className="text-forest-700">Everyone who started is back at base.</strong>}
          </p>
        )}

        {error && (
          <p role="alert" className="mt-4 flex items-center gap-2 rounded-xl bg-clay-500/10 p-4 text-sm font-bold text-clay-600">
            <TriangleAlert className="h-4 w-4 shrink-0" /> {error}
          </p>
        )}

        <div role="tablist" aria-label="Show" className="mt-4 flex flex-wrap gap-2">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              role="tab"
              aria-selected={view === v.id}
              onClick={() => setView(v.id)}
              className={cn(
                "rounded-full border-2 px-4 py-1.5 text-sm font-bold transition",
                view === v.id ? "border-forest-700 bg-forest-700 text-white" : "border-sand-300 bg-white text-forest-900",
              )}
            >
              {v.label}
            </button>
          ))}
        </div>

        {data && climbers.length === 0 ? (
          <p className="mt-4 rounded-2xl border-2 border-dashed border-sand-300 p-8 text-center text-forest-900/70">
            {view === "mountain"
              ? stats?.muster
                ? "Nobody is on the mountain: everyone who started has been scanned back at base."
                : "Nobody has started the ascent yet. Climbers appear here as marshals scan them at the ascent start."
              : "Nobody yet."}
          </p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-sand-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="hidden bg-sand-50 text-[11px] font-bold uppercase tracking-wider text-forest-900/55 md:table-header-group">
                <tr>
                  <th className="px-4 py-3">Climber</th>
                  <th className="px-4 py-3">Now</th>
                  <th className="px-4 py-3">Started</th>
                  <th className="px-4 py-3">Summit</th>
                  <th className="px-4 py-3">Back at base</th>
                  <th className="px-4 py-3">Contacts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-200">
                {climbers.map((c) => {
                  const progress = progressOf(c);
                  return (
                    <tr key={c.id} className="block md:table-row">
                      <td className="block px-4 pt-3 md:table-cell md:py-3">
                        <span className="font-bold text-forest-900">{c.fullName}</span>
                        {c.hasMedicalNotes && (
                          <span title="Has medical notes — see check-in" className="ml-1.5 inline-block align-middle text-clay-600">
                            <TriangleAlert className="h-4 w-4" aria-label="Has medical notes" />
                          </span>
                        )}
                        <span className="block font-mono text-xs font-bold text-forest-700">{c.passId}</span>
                      </td>
                      <td className="block px-4 py-1 md:table-cell md:py-3">
                        <Badge variant={PROGRESS_BADGE[progress]}>{PROGRESS_LABELS[progress]}</Badge>
                      </td>
                      <td className="block px-4 py-0.5 tabular-nums text-forest-900/80 md:table-cell md:py-3">
                        <span className="md:hidden">Started </span>
                        {timeOnly(c.musterCheckedAt)}
                      </td>
                      <td className="block px-4 py-0.5 tabular-nums text-forest-900/80 md:table-cell md:py-3">
                        <span className="md:hidden">Summit </span>
                        {timeOnly(c.summitReachedAt)}
                        {c.summitReachedAt && (
                          <span className="ml-1 text-xs text-forest-900/55">({minutesBetween(c.musterCheckedAt, c.summitReachedAt)} up)</span>
                        )}
                      </td>
                      <td className="block px-4 py-0.5 tabular-nums text-forest-900/80 md:table-cell md:py-3">
                        <span className="md:hidden">Back </span>
                        {timeOnly(c.descentCheckedAt)}
                      </td>
                      <td className="block px-4 pb-3 pt-1 text-xs md:table-cell md:py-3">
                        <a href={`tel:+${c.phone}`} className="inline-flex items-center gap-1 font-semibold text-forest-800 hover:underline">
                          <Phone className="h-3 w-3" /> {displayPhone(c.phone)}
                        </a>
                        <a href={`tel:+${c.nextOfKinPhone}`} className="block text-forest-900/65 hover:underline">
                          Kin: {c.nextOfKinName} · {displayPhone(c.nextOfKinPhone)}
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-4 text-xs text-forest-900/60">
          Times are West Africa Time. A climber stays under
          “On the mountain” until a marshal scans their pass at the “Back at base” checkpoint.
        </p>
      </div>
    </main>
  );
}
