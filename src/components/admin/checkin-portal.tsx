"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  Activity,
  CircleCheck,
  Footprints,
  HeartPulse,
  House,
  Loader2,
  MountainSnow,
  Phone,
  QrCode,
  ScanLine,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  TriangleAlert,
  Undo2,
  X,
} from "lucide-react";
import type { Participant } from "@/lib/participants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, displayPhone, formatWAT } from "@/lib/utils";
import type { Verdict } from "@/lib/pass-verify";
import type { CheckpointCounts } from "@/lib/tracker";
import {
  blockReason,
  CHECKPOINT_INFO,
  CHECKPOINTS,
  checkpointTime,
  isCheckpoint,
  type Checkpoint,
} from "@/lib/checkpoints";

type Stage = Checkpoint;
type Stats = CheckpointCounts;

const STAGES = CHECKPOINT_INFO;
const STAGE_ICONS: Record<Stage, React.ElementType> = {
  medical: HeartPulse,
  muster: Footprints,
  summit: MountainSnow,
  descent: House,
};
const STAGE_BADGE: Record<Stage, "forest" | "gold" | "soft"> = {
  medical: "forest",
  muster: "gold",
  summit: "forest",
  descent: "soft",
};

/**
 * The marshal's checkpoint is remembered on their phone, so a reload at the
 * summit stays on "Summit". Falls back to memory if the browser blocks storage.
 */
const STAGE_KEY = "kil.checkin.stage";
const STAGE_EVENT = "kil:checkin-stage";
let memoryStage: Stage = "medical";

function readStage(): Stage {
  try {
    const saved = window.localStorage.getItem(STAGE_KEY);
    if (isCheckpoint(saved)) return saved;
  } catch {
    // storage unavailable
  }
  return memoryStage;
}

function writeStage(next: Stage) {
  memoryStage = next;
  try {
    window.localStorage.setItem(STAGE_KEY, next);
  } catch {
    // kept in memory only
  }
  window.dispatchEvent(new Event(STAGE_EVENT));
}

function subscribeStage(onChange: () => void) {
  window.addEventListener(STAGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(STAGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

// ── QR scanner ──────────────────────────────────────────────────────────────
function Scanner({ onScan, onClose }: { onScan: (text: string) => void; onClose: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const handled = useRef(false);

  useEffect(() => {
    let scanner: { stop: () => Promise<void>; clear: () => void } | null = null;
    let cancelled = false;

    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;
        const instance = new Html5Qrcode("qr-reader");
        scanner = instance;
        await instance.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (text) => {
            if (handled.current) return;
            handled.current = true;
            onScan(text);
          },
          () => {},
        );
      } catch {
        setError("Couldn't open the camera. Allow camera access, or search by name or pass ID instead.");
      }
    })();

    return () => {
      cancelled = true;
      scanner
        ?.stop()
        .then(() => scanner?.clear())
        .catch(() => {});
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-forest-950/90 p-4" role="dialog" aria-modal="true" aria-label="Scan pass QR code">
      <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white">
        <div className="flex items-center justify-between p-4">
          <p className="font-display text-xl font-semibold text-forest-900">Scan a pass</p>
          <button onClick={onClose} aria-label="Close scanner" className="grid h-10 w-10 place-items-center rounded-full hover:bg-sand-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div id="qr-reader" className="aspect-square w-full bg-black" />
        <p className="p-4 text-center text-sm text-forest-900/70">
          {error ?? "Hold the climber's QR code inside the square."}
        </p>
      </div>
    </div>
  );
}

// ── Participant card ────────────────────────────────────────────────────────
function ParticipantCard({
  p,
  stage,
  busy,
  onCheck,
  onResend,
}: {
  p: Participant;
  stage: Stage;
  busy: boolean;
  onCheck: (p: Participant, undo: boolean) => void;
  onResend: (p: Participant) => void;
}) {
  const done = checkpointTime(p, stage);
  const blocked = blockReason(p, stage);

  return (
    <li className={cn("rounded-2xl border-2 bg-white p-5", done ? "border-forest-500" : "border-sand-200")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-2xl font-semibold leading-tight text-forest-900">{p.fullName}</p>
          <p className="mt-0.5 font-mono text-sm font-bold tracking-wide text-forest-700">{p.passId}</p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-xs font-bold uppercase tracking-wider text-forest-900/50">Blood group</dt>
          <dd className="font-bold text-forest-900">{p.bloodGroup}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wider text-forest-900/50">Genotype</dt>
          <dd className="font-bold text-forest-900">{p.genotype}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wider text-forest-900/50">Experience</dt>
          <dd className="font-bold capitalize text-forest-900">{p.experience.toLowerCase()}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wider text-forest-900/50">Kit size</dt>
          <dd className="font-bold text-forest-900">{p.kitSize}</dd>
        </div>
      </dl>

      {p.medicalNotes && (
        <p className="mt-4 flex gap-2 rounded-xl bg-clay-500/10 p-3 text-sm font-semibold text-clay-600">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" /> {p.medicalNotes}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-forest-900/80">
        <a href={`tel:+${p.phone}`} className="inline-flex items-center gap-1.5 font-semibold hover:text-forest-700">
          <Phone className="h-3.5 w-3.5" /> {displayPhone(p.phone)}
        </a>
        <a href={`tel:+${p.nextOfKinPhone}`} className="inline-flex items-center gap-1.5 hover:text-forest-700">
          Next of kin: <span className="font-semibold">{p.nextOfKinName}</span> · {displayPhone(p.nextOfKinPhone)}
        </a>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {CHECKPOINTS.map((s) => {
          const at = checkpointTime(p, s);
          const Icon = STAGE_ICONS[s];
          // Later checkpoints only appear once reached; the first two always show.
          if (!at && (s === "summit" || s === "descent")) return null;
          return (
            <Badge key={s} variant={at ? STAGE_BADGE[s] : "sand"}>
              <Icon className="h-3.5 w-3.5" />
              {at ? `${STAGES[s].done} ${formatWAT(at)}` : STAGES[s].pending}
            </Badge>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-sand-200 pt-4">
        {done ? (
          <>
            <span className="inline-flex items-center gap-2 font-bold text-forest-700">
              <CircleCheck className="h-5 w-5" /> {STAGES[stage].done}
            </span>
            <Button variant="ghost" size="sm" disabled={busy} onClick={() => onCheck(p, true)} className="ml-auto">
              <Undo2 className="h-4 w-4" /> Undo
            </Button>
          </>
        ) : blocked ? (
          <p className="flex gap-2 text-sm font-bold text-clay-600">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" /> {blocked}
          </p>
        ) : (
          <Button variant="forest" disabled={busy} onClick={() => onCheck(p, false)} className="w-full sm:w-auto">
            {busy && <Loader2 className="h-5 w-5 animate-spin" />} {STAGES[stage].action}
          </Button>
        )}
        {!done && (
          <Button variant="ghost" size="sm" disabled={busy} onClick={() => onResend(p)} className="ml-auto">
            <Send className="h-4 w-4" /> Resend pass
          </Button>
        )}
      </div>
    </li>
  );
}

// ── Scan result ─────────────────────────────────────────────────────────────
type AutoRecord = { stage: string; recorded: boolean; already: boolean; blocked: string | null };
type ScanResult = { verdict: Verdict; message: string; participant: Participant | null; auto?: AutoRecord | null };

/** After an automatic record, the scanner reopens by itself for the next climber. */
const AUTO_NEXT_MS = 2500;

const VERDICT_STYLE: Record<Verdict, { title: string; className: string; icon: React.ElementType }> = {
  valid: { title: "Genuine pass", className: "bg-forest-600", icon: ShieldCheck },
  id_only: { title: "Check photo ID", className: "bg-amber-600", icon: ShieldQuestion },
  not_genuine: { title: "QR does not match", className: "bg-clay-600", icon: ShieldAlert },
  cancelled: { title: "Cancelled", className: "bg-clay-600", icon: ShieldAlert },
  unconfirmed: { title: "Not confirmed", className: "bg-clay-600", icon: ShieldAlert },
  unknown: { title: "Not a valid pass", className: "bg-clay-600", icon: ShieldAlert },
};

function ScanResultSheet({
  result,
  stage,
  busy,
  onCheck,
  onResend,
  onNext,
  onClose,
}: {
  result: ScanResult;
  stage: Stage;
  busy: boolean;
  onCheck: (p: Participant, undo: boolean) => void;
  onResend: (p: Participant) => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const admissible = result.verdict === "valid" || result.verdict === "id_only";
  const auto = result.auto && isCheckpoint(result.auto.stage) ? result.auto : null;
  const autoStage = auto && isCheckpoint(auto.stage) ? auto.stage : stage;
  const autoTime = result.participant ? checkpointTime(result.participant, autoStage) : null;

  // What the marshal needs to know first: was this scan recorded?
  let style = VERDICT_STYLE[result.verdict];
  let message = result.message;
  if (auto?.recorded) {
    style = { title: `${STAGES[autoStage].done} — recorded`, className: "bg-forest-600", icon: CircleCheck };
    message = `Recorded automatically at ${formatWAT(autoTime)}. Scanning the next climber in a moment…`;
  } else if (auto?.already) {
    style = { title: "Already recorded", className: "bg-amber-600", icon: ShieldQuestion };
    message = `This climber was already recorded here at ${formatWAT(autoTime)}. Nothing was changed.`;
  } else if (auto?.blocked) {
    style = { title: "Not recorded", className: "bg-clay-600", icon: ShieldAlert };
    message = auto.blocked;
  }
  const Icon = style.icon;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-forest-950/90 p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="scan-verdict">
      <div className="mx-auto max-w-xl">
        <div className={cn("rounded-3xl p-6 text-white shadow-lift", style.className)} role="alert">
          <p id="scan-verdict" className="flex items-center gap-3 text-3xl font-bold">
            <Icon className="h-10 w-10 shrink-0" /> {style.title}
          </p>
          <p className="mt-2 text-sm font-semibold text-white/90">{message}</p>
        </div>
        {result.participant && (
          <ul className="mt-3">
            {admissible ? (
              <ParticipantCard p={result.participant} stage={stage} busy={busy} onCheck={onCheck} onResend={onResend} />
            ) : (
              <li className="rounded-2xl bg-white p-5">
                <p className="font-display text-2xl font-semibold text-forest-900">{result.participant.fullName}</p>
                <p className="font-mono text-sm font-bold text-forest-700">{result.participant.passId}</p>
              </li>
            )}
          </ul>
        )}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button variant="light" onClick={onClose}>Close</Button>
          <Button onClick={onNext}><ScanLine className="h-5 w-5" /> Scan next</Button>
        </div>
      </div>
    </div>
  );
}

// ── Portal ──────────────────────────────────────────────────────────────────
export function CheckinPortal() {
  const router = useRouter();
  const stage = useSyncExternalStore(subscribeStage, readStage, () => "medical" as Stage);
  const setStage = writeStage;
  const [query, setQuery] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const requestId = useRef(0);

  // Continuous scanning: once a scan has been recorded automatically, reopen the camera.
  useEffect(() => {
    if (!scanResult?.auto?.recorded) return;
    const timer = setTimeout(() => {
      setScanResult(null);
      setScanning(true);
    }, AUTO_NEXT_MS);
    return () => clearTimeout(timer);
  }, [scanResult]);

  const search = useCallback(
    async (q: string) => {
      const id = ++requestId.current;
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/participants?q=${encodeURIComponent(q)}`, { cache: "no-store" });
        if (res.status === 401) return router.replace("/admin/login?next=/admin/checkin");
        const json = await res.json();
        if (id !== requestId.current) return; // a newer search has started
        setParticipants(json.participants ?? []);
        setStats(json.stats ?? null);
      } catch {
        if (id === requestId.current) setNotice({ tone: "error", text: "Couldn't load participants. Check your connection." });
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    },
    [router],
  );

  useEffect(() => {
    const timer = setTimeout(() => void search(query), 250);
    return () => clearTimeout(timer);
  }, [query, search]);

  const onScan = useCallback(
    async (text: string) => {
      setScanning(false);
      setNotice(null);
      try {
        const res = await fetch("/api/admin/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: text, stage }),
        });
        if (res.status === 401) return router.replace("/admin/login?next=/admin/checkin");
        const json = await res.json();
        if (!res.ok) setNotice({ tone: "error", text: json.error ?? "Couldn't check that code." });
        else {
          setScanResult(json);
          if (json.auto?.recorded) void search(query);
        }
      } catch {
        setNotice({ tone: "error", text: "No connection — nothing was recorded. Try again when the signal returns, or note the pass ID." });
      }
    },
    [router, stage, search, query],
  );

  async function check(p: Participant, undo: boolean) {
    setBusyId(p.passId);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passId: p.passId, stage, undo }),
      });
      const json = await res.json();
      if (!res.ok) {
        setNotice({ tone: "error", text: json.error ?? "Couldn't update this participant." });
      } else {
        setParticipants((list) => list.map((x) => (x.passId === p.passId ? json.participant : x)));
        setScanResult((r) => (r?.participant?.passId === p.passId ? { ...r, participant: json.participant } : r));
        setNotice({
          tone: "ok",
          text: undo ? `Undone for ${p.fullName}.` : `${p.fullName} — ${STAGES[stage].done.toLowerCase()}.`,
        });
        void search(query);
      }
    } catch {
      setNotice({ tone: "error", text: "Couldn't reach the server. Nothing was changed." });
    }
    setBusyId(null);
  }

  async function resend(p: Participant) {
    setBusyId(p.passId);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passId: p.passId }),
      });
      const json = await res.json();
      const sent = [json.sent?.email && "email", json.sent?.sms && "SMS"].filter(Boolean).join(" and ");
      setNotice(
        res.ok && sent
          ? { tone: "ok", text: `Pass re-sent to ${p.fullName} by ${sent}.` }
          : { tone: "error", text: "The pass could not be re-sent. Check the email and SMS settings." },
      );
    } catch {
      setNotice({ tone: "error", text: "Couldn't reach the server." });
    }
    setBusyId(null);
  }


  const statCells: [string, number | undefined][] = [
    ["Registered", stats?.total],
    ["Medically cleared", stats?.medical],
    ["Started ascent", stats?.muster],
    ["Summited", stats?.summit],
    ["Back at base", stats?.descent],
    ["On the mountain", stats?.onMountain],
  ];

  return (
    <main className="min-h-screen bg-sand-100 pb-16">
      <header className="bg-forest-900 text-white">
        <div className="container flex items-center justify-between py-4">
          <div>
            <p className="eyebrow text-amber-400">Kilang Expedition 2026</p>
            <h1 className="text-2xl font-semibold">Marshal check-in</h1>
          </div>
          <Link
            href="/admin/tracker"
            className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-bold hover:bg-white/20"
          >
            <Activity className="h-4 w-4 text-amber-400" /> Summit tracker
          </Link>
        </div>
        <div className="container grid grid-cols-3 gap-2 pb-5 sm:grid-cols-6">
          {statCells.map(([label, value]) => (
            <div key={label} className="rounded-xl bg-white/10 p-3">
              <p className="font-display text-3xl font-semibold tabular-nums">{value ?? "–"}</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-forest-200">{label}</p>
            </div>
          ))}
        </div>
      </header>

      <div className="container mt-5">
        <div role="tablist" aria-label="Checkpoint" className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {CHECKPOINTS.map((s) => {
            const Icon = STAGE_ICONS[s];
            return (
              <button
                key={s}
                role="tab"
                aria-selected={stage === s}
                onClick={() => setStage(s)}
                className={cn(
                  "rounded-2xl border-2 p-4 text-left transition",
                  stage === s ? "border-forest-700 bg-forest-700 text-white" : "border-sand-200 bg-white text-forest-900",
                )}
              >
                <Icon className={cn("h-5 w-5", stage === s ? "text-amber-400" : "text-forest-700")} />
                <p className="mt-1.5 font-bold leading-tight">{STAGES[s].label}</p>
                <p className={cn("text-xs", stage === s ? "text-forest-100" : "text-forest-900/60")}>{STAGES[s].when}</p>
              </button>
            );
          })}
        </div>

        <p className="mt-3 text-sm text-forest-900/70">
          {STAGES[stage].auto
            ? `Scanning a genuine pass records “${STAGES[stage].done.toLowerCase()}” automatically, then the camera reopens for the next climber.`
            : "Scanning shows the climber; the medical team confirms clearance with one tap."}
        </p>

        <div className="mt-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-forest-900/40" />
            <input
              type="search"
              aria-label="Search by name, pass ID, phone or email"
              placeholder="Name, pass ID, phone or email"
              className="field-input pl-12"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => setScanning(true)} className="shrink-0 px-5">
            <QrCode className="h-5 w-5" /> <span className="hidden sm:inline">Scan QR</span>
          </Button>
        </div>

        {notice && (
          <p
            role="status"
            className={cn(
              "mt-4 flex items-start gap-2 rounded-xl p-4 text-sm font-bold",
              notice.tone === "ok" ? "bg-forest-100 text-forest-800" : "bg-clay-500/10 text-clay-600",
            )}
          >
            {notice.tone === "ok" ? (
              <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            {notice.text}
          </p>
        )}

        <p className="mt-6 text-sm font-semibold text-forest-900/60">
          {loading
            ? "Searching…"
            : query
              ? `${participants.length} match${participants.length === 1 ? "" : "es"}`
              : "Most recent registrations"}
        </p>

        {!loading && participants.length === 0 ? (
          <p className="mt-3 rounded-2xl border-2 border-dashed border-sand-300 p-8 text-center text-forest-900/70">
            {query
              ? "No registered climber matches that search. Check the spelling or scan their QR code."
              : "No registrations yet."}
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {participants.map((p) => (
              <ParticipantCard
                key={p.passId}
                p={p}
                stage={stage}
                busy={busyId === p.passId}
                onCheck={check}
                onResend={resend}
              />
            ))}
          </ul>
        )}
      </div>

      {scanning && <Scanner onScan={onScan} onClose={() => setScanning(false)} />}
      {scanResult && !scanning && (
        <ScanResultSheet
          result={scanResult}
          stage={stage}
          busy={busyId === scanResult.participant?.passId}
          onCheck={check}
          onResend={resend}
          onNext={() => {
            setScanResult(null);
            setScanning(true);
          }}
          onClose={() => setScanResult(null)}
        />
      )}
    </main>
  );
}
