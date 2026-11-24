import { describe, expect, it } from "vitest";
import {
  blockReason,
  CHECKPOINT_INFO,
  onMountain,
  progressOf,
  undoBlockReason,
  type CheckpointTimes,
} from "@/lib/checkpoints";
import { generateDonationReference } from "@/lib/ids";

const at = "2026-12-31T05:00:00.000Z";
const climber = (done: Partial<CheckpointTimes> = {}): CheckpointTimes => ({
  medicalCheckedAt: null,
  musterCheckedAt: null,
  summitReachedAt: null,
  descentCheckedAt: null,
  ...done,
});

describe("checkpoint rules", () => {
  it("no medical clearance, no climb", () => {
    expect(blockReason(climber(), "medical")).toBeNull();
    expect(blockReason(climber(), "muster")).toMatch(/not medically cleared/i);
    expect(blockReason(climber({ medicalCheckedAt: at }), "muster")).toBeNull();
  });

  it("the summit and the return need the ascent start first", () => {
    const cleared = climber({ medicalCheckedAt: at });
    expect(blockReason(cleared, "summit")).toMatch(/ascent start/i);
    expect(blockReason(cleared, "descent")).toMatch(/ascent start/i);
    expect(blockReason(climber(), "summit")).toMatch(/not medically cleared/i);
  });

  it("a climber who turns back can be recorded at base without a summit", () => {
    const started = climber({ medicalCheckedAt: at, musterCheckedAt: at });
    expect(blockReason(started, "descent")).toBeNull();
    expect(blockReason(started, "summit")).toBeNull();
  });

  it("checkpoints are undone in reverse order", () => {
    const summited = climber({ medicalCheckedAt: at, musterCheckedAt: at, summitReachedAt: at });
    expect(undoBlockReason(summited, "medical")).not.toBeNull();
    expect(undoBlockReason(summited, "muster")).not.toBeNull();
    expect(undoBlockReason(summited, "summit")).toBeNull();
  });

  it("medical clearance is never recorded by a scan alone", () => {
    expect(CHECKPOINT_INFO.medical.auto).toBe(false);
    expect(CHECKPOINT_INFO.muster.auto && CHECKPOINT_INFO.summit.auto && CHECKPOINT_INFO.descent.auto).toBe(true);
  });
});

describe("summit tracker progress", () => {
  it("follows a climber up and down", () => {
    expect(progressOf(climber())).toBe("registered");
    expect(progressOf(climber({ medicalCheckedAt: at }))).toBe("cleared");
    expect(progressOf(climber({ medicalCheckedAt: at, musterCheckedAt: at }))).toBe("ascending");
    expect(progressOf(climber({ medicalCheckedAt: at, musterCheckedAt: at, summitReachedAt: at }))).toBe("summit");
    expect(
      progressOf(climber({ medicalCheckedAt: at, musterCheckedAt: at, summitReachedAt: at, descentCheckedAt: at })),
    ).toBe("returned");
    expect(progressOf(climber({ medicalCheckedAt: at, musterCheckedAt: at, descentCheckedAt: at }))).toBe("turned_back");
  });

  it("counts a climber as on the mountain until scanned back at base", () => {
    expect(onMountain(climber({ medicalCheckedAt: at }))).toBe(false);
    expect(onMountain(climber({ medicalCheckedAt: at, musterCheckedAt: at, summitReachedAt: at }))).toBe(true);
    expect(onMountain(climber({ medicalCheckedAt: at, musterCheckedAt: at, descentCheckedAt: at }))).toBe(false);
  });
});

describe("donation references", () => {
  it("are unique and cannot be confused with registration references", () => {
    const refs = new Set(Array.from({ length: 500 }, generateDonationReference));
    expect(refs.size).toBe(500);
    for (const r of refs) expect(r).toMatch(/^KILD-[2-9A-Z]{12}$/);
  });
});
