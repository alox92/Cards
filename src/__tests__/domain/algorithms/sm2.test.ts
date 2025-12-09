import { describe, it, expect } from "vitest";
import {
  sm2Update,
  retentionScore,
  DEFAULT_SM2_CONSTANTS,
} from "../../../domain/algorithms/sm2";

describe("SM2 Algorithm", () => {
  const baseState = {
    easinessFactor: 2.5,
    interval: 0,
    repetition: 0,
    lastReview: 0,
    nextReview: 0,
  };

  describe("sm2Update", () => {
    it("should reset interval and repetition on failure (quality < 3)", () => {
      const result = sm2Update({
        ...baseState,
        interval: 10,
        repetition: 5,
        quality: 2,
      });

      expect(result.repetition).toBe(0);
      expect(result.interval).toBe(DEFAULT_SM2_CONSTANTS.FIRST_INTERVAL);
      expect(result.quality).toBe(2);
    });

    it("should set first interval on first success", () => {
      const result = sm2Update({
        ...baseState,
        repetition: 0,
        quality: 4,
      });

      expect(result.repetition).toBe(1);
      expect(result.interval).toBe(DEFAULT_SM2_CONSTANTS.FIRST_INTERVAL);
    });

    it("should set second interval on second success", () => {
      const result = sm2Update({
        ...baseState,
        repetition: 1,
        interval: DEFAULT_SM2_CONSTANTS.FIRST_INTERVAL,
        quality: 4,
      });

      expect(result.repetition).toBe(2);
      expect(result.interval).toBe(DEFAULT_SM2_CONSTANTS.SECOND_INTERVAL);
    });

    it("should increase interval based on EF on subsequent successes", () => {
      const ef = 2.5;
      const interval = 6;
      const result = sm2Update({
        ...baseState,
        repetition: 2,
        interval,
        easinessFactor: ef,
        quality: 4,
      });

      expect(result.repetition).toBe(3);
      expect(result.interval).toBe(Math.round(interval * ef));
    });

    it("should adjust EF based on quality", () => {
      // Quality 5 -> EF increases (or stays max)
      // Quality 3 -> EF decreases
      const startEF = 2.5;

      // Quality 5: 2.5 + (0.1 - (0) * (...)) = 2.6 -> clamped to 2.5
      const res5 = sm2Update({
        ...baseState,
        easinessFactor: startEF,
        quality: 5,
      });
      expect(res5.easinessFactor).toBe(2.5);

      // Quality 3: 2.5 + (0.1 - (2) * (0.08 + 2*0.02))
      // = 2.5 + (0.1 - 2 * 0.12) = 2.5 + (0.1 - 0.24) = 2.5 - 0.14 = 2.36
      const res3 = sm2Update({
        ...baseState,
        easinessFactor: startEF,
        quality: 3,
      });
      expect(res3.easinessFactor).toBeCloseTo(2.36);
    });

    it("should clamp EF between min and max", () => {
      // Force low EF
      let state = { ...baseState, easinessFactor: 1.3 };
      // Quality 0 causes drop
      // 1.3 + (0.1 - 5 * (0.08 + 5*0.02)) = 1.3 + (0.1 - 5 * 0.18) = 1.3 + (0.1 - 0.9) = 1.3 - 0.8 = 0.5
      // Should clamp to 1.3
      const resLow = sm2Update({ ...state, quality: 0 });
      expect(resLow.easinessFactor).toBe(1.3);

      // Force high EF
      state = { ...baseState, easinessFactor: 2.5 };
      const resHigh = sm2Update({ ...state, quality: 5 });
      expect(resHigh.easinessFactor).toBe(2.5);
    });
  });

  describe("retentionScore", () => {
    it("should return 0 for no reviews", () => {
      expect(retentionScore(0, 0, 2.5, 1)).toBe(0);
    });

    it("should calculate score based on success rate, maturity and consistency", () => {
      // 100% success, mature (>21 days), max EF
      const score = retentionScore(10, 10, 2.5, 22);
      // 1.0 * 0.6 + 0.2 + (1.0 * 0.2) = 0.6 + 0.2 + 0.2 = 1.0
      expect(score).toBe(1);

      // 50% success, immature, max EF
      const score2 = retentionScore(10, 5, 2.5, 1);
      // 0.5 * 0.6 + 0 + 0.2 = 0.3 + 0.2 = 0.5
      expect(score2).toBe(0.5);
    });
  });
});
