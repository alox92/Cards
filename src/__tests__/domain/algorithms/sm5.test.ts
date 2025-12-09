import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import SM5Service from "@/domain/algorithms/sm5";

describe("SM5Service", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should initialize with default values", () => {
    const data = SM5Service.initialize();
    expect(data.easiness).toBe(2.5);
    expect(data.interval).toBe(1);
    expect(data.repetition).toBe(0);
    expect(data.stability).toBe(1);
    expect(data.difficulty).toBe(5);
    expect(data.retrievability).toBe(1);
    expect(data.ofMatrix.size).toBe(0);
  });

  it("should initialize with custom config", () => {
    const data = SM5Service.initialize({
      initialEasiness: 3.0,
      requestedFI: 2,
    });
    expect(data.easiness).toBe(3.0);
    expect(data.interval).toBe(2);
  });

  it("should handle correct response (Quality 5)", () => {
    const initial = SM5Service.initialize();
    // Advance time by 1 day (default interval)
    vi.advanceTimersByTime(24 * 60 * 60 * 1000);

    const result = SM5Service.calculate(initial, 5);

    expect(result.repetition).toBe(1);
    expect(result.interval).toBeGreaterThanOrEqual(1);
    expect(result.difficulty).toBeLessThan(5); // Difficulty should decrease
    expect(result.lastQuality).toBe(5);
    expect(result.consecutiveCorrect).toBe(1);
  });

  it("should handle incorrect response (Quality 0)", () => {
    const initial = SM5Service.initialize();
    initial.repetition = 5;
    initial.interval = 10;
    initial.stability = 10;

    vi.advanceTimersByTime(10 * 24 * 60 * 60 * 1000);

    const result = SM5Service.calculate(initial, 0);

    expect(result.repetition).toBe(0); // Reset repetition
    expect(result.interval).toBe(1); // Reset to requestedFI (default 1)
    expect(result.difficulty).toBeGreaterThan(5); // Difficulty should increase
    expect(result.stability).toBeLessThan(10); // Stability should decrease significantly
    expect(result.lapses).toBe(1);
  });

  it("should calculate retrievability correctly over time", () => {
    const data = SM5Service.initialize();
    data.lastReview = Date.now();

    // Immediately after review, R should be close to 1
    let result = SM5Service.calculate(data, 4);
    expect(result.retrievability).toBeCloseTo(1, 1);

    // Advance time significantly
    vi.advanceTimersByTime(10 * 24 * 60 * 60 * 1000);

    result = SM5Service.calculate(data, 4);
    expect(result.retrievability).toBeLessThan(1);
  });

  it("should update OF matrix", () => {
    const data = SM5Service.initialize();
    vi.advanceTimersByTime(24 * 60 * 60 * 1000);

    const result = SM5Service.calculate(data, 4);

    // Key for difficulty 5 (initial) and repetition 1 (after success)
    // Wait, calculate uses newDifficulty and newRepetition for the key
    // Initial diff=5. Quality 4 -> diff adjustment = 0.5 * (3-4) = -0.5 -> newDiff = 4.5
    // Repetition 0 -> 1
    // Key: "4-1"

    expect(result.ofMatrix.size).toBeGreaterThan(0);
    // We can't easily predict the exact key without duplicating logic, but size should increase
  });

  it("should migrate from SM-2", () => {
    const sm2Data = {
      easinessFactor: 2.8,
      interval: 5,
      repetition: 3,
      lastReview: Date.now() - 100000,
    };

    const sm5Data = SM5Service.migrateFromSM2(sm2Data);

    expect(sm5Data.easiness).toBe(2.8);
    expect(sm5Data.repetition).toBe(3);
    expect(sm5Data.lastReview).toBe(sm2Data.lastReview);
    expect(sm5Data.nextReview).toBe(sm2Data.lastReview + 5 * 86400000);
  });

  it("should export and import data correctly", () => {
    const initial = SM5Service.initialize();
    initial.ofMatrix.set("5-1", 2.6);

    const exported = SM5Service.export(initial);
    expect(Array.isArray(exported.ofMatrix)).toBe(true);

    const imported = SM5Service.import(exported);
    expect(imported.ofMatrix).toBeInstanceOf(Map);
    expect(imported.ofMatrix.get("5-1")).toBe(2.6);
    expect(imported.easiness).toBe(initial.easiness);
  });

  it("should compare with SM-2", () => {
    const data = SM5Service.initialize();
    data.interval = 10;

    const comparison = SM5Service.compareWithSM2(data, 5);

    expect(comparison.sm5Interval).toBe(10);
    expect(comparison.sm2Interval).toBe(5);
    expect(comparison.difference).toBe(5);
    expect(comparison.percentageDiff).toBe(100);
  });
});
