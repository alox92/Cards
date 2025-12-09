import { describe, it, expect, vi, beforeEach } from "vitest";
import { ForgettingCurveService } from "@/application/services/forgettingCurve/ForgettingCurveService";
import { Card } from "@/domain/entities/Card";

// Mock logger
vi.mock("@/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("ForgettingCurveService", () => {
  let service: ForgettingCurveService;

  beforeEach(() => {
    service = new ForgettingCurveService();
  });

  const createMockCard = (overrides: Partial<Card> = {}): Card =>
    ({
      id: "card-1",
      deckId: "deck-1",
      question: "Q",
      answer: "A",
      createdAt: Date.now(),
      created: Date.now(),
      modified: Date.now(),
      totalReviews: 0,
      correctReviews: 0,
      lastReview: 0,
      easinessFactor: 2.5,
      interval: 0,
      repetitions: 0,
      ...overrides,
    } as Card);

  describe("calculateCurveForCard", () => {
    it("should return default values for new card", async () => {
      const card = createMockCard();
      const result = await service.calculateCurveForCard(card);

      expect(result).toEqual({
        cardId: card.id,
        dataPoints: [],
        predictedRetention: 1,
        halfLife: 24,
        stability: 5,
      });
    });

    it("should calculate curve for reviewed card", async () => {
      const card = createMockCard({
        totalReviews: 10,
        correctReviews: 8,
        lastReview: Date.now() - 3600000, // 1 hour ago
        easinessFactor: 2.5,
      });

      const result = await service.calculateCurveForCard(card);

      expect(result.cardId).toBe(card.id);
      expect(result.dataPoints.length).toBeGreaterThan(0);
      expect(result.predictedRetention).toBeGreaterThan(0);
      expect(result.predictedRetention).toBeLessThanOrEqual(1);
    });
  });

  describe("predictRetention", () => {
    it("should predict lower retention for future dates", async () => {
      const card = createMockCard({
        lastReview: Date.now(),
        easinessFactor: 2.5,
      });

      const retention1Day = await service.predictRetention(card, 1);
      const retention10Days = await service.predictRetention(card, 10);

      expect(retention1Day).toBeGreaterThan(retention10Days);
    });
  });

  describe("getOptimalReviewTime", () => {
    it("should return a positive duration", async () => {
      const card = createMockCard({
        easinessFactor: 2.5,
      });

      const time = await service.getOptimalReviewTime(card);
      expect(time).toBeGreaterThan(0);
    });
  });

  describe("getGlobalStats", () => {
    it("should return default stats for empty list", async () => {
      const stats = await service.getGlobalStats([]);
      expect(stats.totalCards).toBe(0);
      expect(stats.averageRetention).toBe(1);
    });

    it("should calculate stats for multiple cards", async () => {
      const cards = [
        createMockCard({
          id: "1",
          totalReviews: 5,
          correctReviews: 5,
          lastReview: Date.now(),
        }),
        createMockCard({
          id: "2",
          totalReviews: 5,
          correctReviews: 0,
          lastReview: Date.now(),
        }),
      ];

      const stats = await service.getGlobalStats(cards);
      expect(stats.totalCards).toBe(2);
      expect(stats.averageRetention).toBeGreaterThan(0);
      expect(stats.averageRetention).toBeLessThanOrEqual(1);
    });
  });
});
