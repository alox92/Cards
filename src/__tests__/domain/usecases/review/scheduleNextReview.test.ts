import { describe, it, expect } from "vitest";
import { simulateNext } from "../../../../domain/usecases/review/scheduleNextReview";

describe("scheduleNextReview", () => {
  it("should simulate next review schedule", () => {
    const card = {
      easinessFactor: 2.5,
      interval: 0,
      repetition: 0,
      lastReview: Date.now(),
      nextReview: Date.now(),
    };

    const result = simulateNext(card, 4);

    expect(result.interval).toBeGreaterThan(0);
    expect(result.repetition).toBe(1);
    expect(result.quality).toBe(4);
  });

  it("should handle missing fields with defaults", () => {
    const card = {}; // Empty object
    const result = simulateNext(card, 4);

    expect(result.easinessFactor).toBeDefined();
    expect(result.interval).toBeDefined();
  });
});
