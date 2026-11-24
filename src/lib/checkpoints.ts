/**
 * The four checkpoints a climber passes, in order. Browser-safe: the check-in
 * portal, the pass page and the API all read the rules from here.
 *
 *   medical → muster (start of ascent) → summit → descent (back at base)
 */

export const CHECKPOINTS = ["medical", "muster", "summit", "descent"] as const;
export type Checkpoint = (typeof CHECKPOINTS)[number];

export type CheckpointTimes = {
  medicalCheckedAt: string | Date | null;
  musterCheckedAt: string | Date | null;
  summitReachedAt: string | Date | null;
  descentCheckedAt: string | Date | null;
};

export const CHECKPOINT_FIELDS: Record<
  Checkpoint,
  { at: keyof CheckpointTimes; by: "medicalCheckedBy" | "musterCheckedBy" | "summitReachedBy" | "descentCheckedBy" }
> = {
  medical: { at: "medicalCheckedAt", by: "medicalCheckedBy" },
  muster: { at: "musterCheckedAt", by: "musterCheckedBy" },
  summit: { at: "summitReachedAt", by: "summitReachedBy" },
  descent: { at: "descentCheckedAt", by: "descentCheckedBy" },
};

export const CHECKPOINT_INFO: Record<
  Checkpoint,
  { label: string; when: string; action: string; done: string; pending: string; auto: boolean }
> = {
  medical: {
    label: "Medical checkup",
    when: "Dec 30 · Kaleh Infotech",
    action: "Mark medically cleared",
    done: "Medically cleared",
    pending: "Medical pending",
    // A clinical decision: scanning shows the climber, a person confirms.
    auto: false,
  },
  muster: {
    label: "Ascent start",
    when: "Dec 31 · 4:00 AM · Popandi",
    action: "Check in for ascent",
    done: "Started the ascent",
    pending: "Not at muster",
    auto: true,
  },
  summit: {
    label: "Summit",
    when: "Dec 31 · top of Pan Kilang",
    action: "Record summit",
    done: "Reached the summit",
    pending: "Not at summit",
    auto: true,
  },
  descent: {
    label: "Back at base",
    when: "Dec 31 · after the descent",
    action: "Record safe return",
    done: "Back at base",
    pending: "Not back yet",
    auto: true,
  },
};

export function isCheckpoint(value: unknown): value is Checkpoint {
  return typeof value === "string" && (CHECKPOINTS as readonly string[]).includes(value);
}

export function checkpointTime(p: CheckpointTimes, stage: Checkpoint) {
  return p[CHECKPOINT_FIELDS[stage].at];
}

/** Why this climber cannot be recorded at this checkpoint yet, or null if they can. */
export function blockReason(p: CheckpointTimes, stage: Checkpoint): string | null {
  // Safety rule: no medical clearance, no climb.
  if (stage === "muster" && !p.medicalCheckedAt) return "Not medically cleared — cannot climb.";
  if ((stage === "summit" || stage === "descent") && !p.musterCheckedAt) {
    return p.medicalCheckedAt
      ? "Not checked in at the ascent start. Check them in there first."
      : "Not medically cleared and not checked in for the ascent.";
  }
  return null;
}

/** Why this checkpoint cannot be undone yet, or null if it can. */
export function undoBlockReason(p: CheckpointTimes, stage: Checkpoint): string | null {
  if (stage === "medical" && p.musterCheckedAt) return "Undo the ascent check-in first.";
  if (stage === "muster" && (p.summitReachedAt || p.descentCheckedAt)) return "Undo the summit and return records first.";
  return null;
}

/** Where a climber is right now, for the summit tracker. */
export type Progress = "registered" | "cleared" | "ascending" | "summit" | "returned" | "turned_back";

export function progressOf(p: CheckpointTimes): Progress {
  if (p.descentCheckedAt) return p.summitReachedAt ? "returned" : "turned_back";
  if (p.summitReachedAt) return "summit";
  if (p.musterCheckedAt) return "ascending";
  if (p.medicalCheckedAt) return "cleared";
  return "registered";
}

export const PROGRESS_LABELS: Record<Progress, string> = {
  registered: "Registered",
  cleared: "Medically cleared",
  ascending: "On the way up",
  summit: "Summited — on the way down",
  returned: "Summited and back at base",
  turned_back: "Back at base (did not summit)",
};

/** True while the climber has started the ascent and has not been scanned back at base. */
export function onMountain(p: CheckpointTimes) {
  return Boolean(p.musterCheckedAt) && !p.descentCheckedAt;
}
