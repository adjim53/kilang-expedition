"use client";

import Link from "next/link";
import { useState } from "react";
import { CircleCheck, Footprints, HeartPulse, House, Loader2, MountainSnow, ShieldAlert, ShieldCheck, TriangleAlert } from "lucide-react";
import type { Participant } from "@/lib/participants";
import { Button } from "@/components/ui/button";
import { formatWAT } from "@/lib/utils";
import {
  blockReason,
  CHECKPOINT_FIELDS,
  CHECKPOINT_INFO,
  CHECKPOINTS,
  checkpointTime,
  type Checkpoint,
} from "@/lib/checkpoints";

const ICONS: Record<Checkpoint, React.ElementType> = {
  medical: HeartPulse,
  muster: Footprints,
  summit: MountainSnow,
  descent: House,
};

/**
 * Shown on a pass page only to signed-in staff — e.g. a marshal who scanned the
 * climber's QR with their phone's camera app. Confirms the pass and lets them
 * record the climber's next checkpoint without opening the portal.
 */
export function StaffPassPanel({ participant, staffName }: { participant: Participant; staffName: string }) {
  const [p, setP] = useState(participant);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (p.status === "CANCELLED") {
    return (
      <div className="no-print mb-4 rounded-2xl bg-clay-600 p-5 text-white shadow-lift" role="alert">
        <p className="flex items-center gap-2 text-xl font-bold">
          <ShieldAlert className="h-7 w-7" /> CANCELLED — do not admit
        </p>
        <p className="mt-1 text-sm text-white/85">This registration was cancelled by the organisers.</p>
      </div>
    );
  }

  async function check(stage: Checkpoint) {
    setBusy(stage);
    setError(null);
    try {
      const res = await fetch("/api/admin/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passId: p.passId, stage }),
      });
      const json = await res.json();
      if (!res.ok) setError(json.error ?? "Couldn't check in.");
      else setP(json.participant);
    } catch {
      setError("No connection. Nothing was changed.");
    }
    setBusy(null);
  }

  return (
    <div className="no-print mb-4 overflow-hidden rounded-2xl border-2 border-forest-600 bg-white shadow-lift">
      <div className="flex items-center gap-3 bg-forest-600 p-4 text-white">
        <ShieldCheck className="h-8 w-8 shrink-0" />
        <div>
          <p className="text-xl font-bold leading-tight">Genuine pass · registered</p>
          <p className="text-xs text-forest-100">Staff view · signed in as {staffName}</p>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <p className="rounded-xl bg-sand-100 p-2.5">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-forest-900/50">Blood · genotype</span>
            <span className="font-bold">{p.bloodGroup} · {p.genotype}</span>
          </p>
          <p className="rounded-xl bg-sand-100 p-2.5">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-forest-900/50">Experience</span>
            <span className="font-bold capitalize">{p.experience.toLowerCase()}</span>
          </p>
        </div>
        {p.medicalNotes && (
          <p className="flex gap-2 rounded-xl bg-clay-500/10 p-3 text-sm font-semibold text-clay-600">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" /> {p.medicalNotes}
          </p>
        )}

        {CHECKPOINTS.map((stage) => {
          const at = checkpointTime(p, stage);
          const by = p[CHECKPOINT_FIELDS[stage].by];
          const info = CHECKPOINT_INFO[stage];
          const Icon = ICONS[stage];
          if (at) {
            return (
              <p key={stage} className="flex flex-wrap items-center gap-x-2 text-sm font-bold text-forest-700">
                <CircleCheck className="h-5 w-5" /> {info.done} {formatWAT(at)}
                {by && <span className="font-normal text-forest-900/60">by {by}</span>}
              </p>
            );
          }
          const blocked = blockReason(p, stage);
          if (blocked) {
            // Say why once, at the ascent start; the summit and return follow from it.
            if (stage !== "muster") return null;
            return (
              <p key={stage} className="flex gap-2 text-sm font-bold text-clay-600">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" /> {info.label}: {blocked}
              </p>
            );
          }
          return (
            <Button
              key={stage}
              variant={stage === "medical" ? "forest" : "primary"}
              className="w-full"
              disabled={busy !== null}
              onClick={() => check(stage)}
            >
              {busy === stage ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
              {info.action}
            </Button>
          );
        })}

        {error && (
          <p role="alert" className="field-error">
            {error}
          </p>
        )}
        <Link href="/admin/checkin" className="block text-center text-sm font-bold text-forest-700 underline underline-offset-4">
          Open the check-in portal
        </Link>
      </div>
    </div>
  );
}
