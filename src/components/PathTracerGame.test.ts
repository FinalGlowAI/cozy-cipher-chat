import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  STORAGE_KEY,
  STORAGE_RESET_MS,
  getGameProgress,
  saveGameProgress,
} from "./PathTracerGame";
import { LEVEL_CREDITS } from "@/hooks/useCredits";

describe("PathTracerGame — 24h reset boundary", () => {
  const T0 = 1_700_000_000_000;

  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(T0);
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it("persists unlocked level within the 24h window", () => {
    saveGameProgress(5);
    vi.setSystemTime(T0 + STORAGE_RESET_MS - 1);
    const progress = getGameProgress();
    expect(progress.unlockedLevel).toBe(5);
    expect(progress.timeRemaining).toBe(1);
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
  });

  it("resets progress to level 1 exactly at the 24h boundary", () => {
    saveGameProgress(7);
    vi.setSystemTime(T0 + STORAGE_RESET_MS);
    const progress = getGameProgress();
    expect(progress.unlockedLevel).toBe(1);
    expect(progress.timeRemaining).toBe(0);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("resets progress after the 24h boundary", () => {
    saveGameProgress(6);
    vi.setSystemTime(T0 + STORAGE_RESET_MS + 60_000);
    const progress = getGameProgress();
    expect(progress.unlockedLevel).toBe(1);
    expect(progress.timeRemaining).toBe(0);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("restores full credit eligibility for all 7 levels after reset", () => {
    saveGameProgress(7);
    vi.setSystemTime(T0 + STORAGE_RESET_MS);
    getGameProgress(); // triggers reset

    // After reset, the user can replay every level and earn each tier again.
    const earnable = [1, 2, 3, 4, 5, 6, 7].map((lvl) => LEVEL_CREDITS[lvl]);
    expect(earnable).toEqual([5, 10, 15, 20, 25, 30, 50]);
    expect(getGameProgress().unlockedLevel).toBe(1);
  });

  it("preserves the original savedAt anchor when re-saving within the window", () => {
    saveGameProgress(2);
    vi.setSystemTime(T0 + 60_000);
    saveGameProgress(3);
    vi.setSystemTime(T0 + STORAGE_RESET_MS - 1);
    // Still within window from original savedAt (T0), not from the re-save.
    expect(getGameProgress().unlockedLevel).toBe(3);
    vi.setSystemTime(T0 + STORAGE_RESET_MS);
    expect(getGameProgress().unlockedLevel).toBe(1);
  });
});
