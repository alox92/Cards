import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { SpacedRepetitionService } from "../../application/services/SpacedRepetitionService";
import { CardEntity } from "../../domain/entities/Card";
import { logger } from "../../utils/logger";

// Mock dependencies
vi.mock("../../utils/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("SpacedRepetitionService", () => {
  let service: SpacedRepetitionService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SpacedRepetitionService();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const createCard = (overrides: any = {}): CardEntity => {
    const card = new CardEntity({
      deckId: "deck-1",
      frontText: "Front",
      backText: "Back",
      ...overrides,
    });
    // Apply overrides that might not be in constructor
    Object.assign(card, overrides);
    return card;
  };

  describe("schedule", () => {
    it("should schedule a review successfully", () => {
      const card = createCard();
      const quality = 4;
      const responseTime = 1000;
      const now = new Date("2024-01-01T12:00:00Z").getTime();
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const result = service.schedule(card, quality, responseTime);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.card).toBe(card);
        expect(result.value.nextReview).toBeGreaterThan(now);
        expect(card.totalReviews).toBe(1);
        expect(card.quality).toBe(quality);
      }
    });

    it("should handle invalid quality", () => {
      const card = createCard();
      const result = service.schedule(card, 6, 1000);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("SRS_QUALITY_RANGE");
      }
      expect(logger.warn).toHaveBeenCalled();
    });

    it("should detect leeches", () => {
      const card = createCard();
      // Simulate a card that has been reviewed many times with poor performance
      card.totalReviews = 8;
      card.correctReviews = 2; // < 50% success rate

      const result = service.schedule(card, 2, 1000); // Bad quality

      expect(result.ok).toBe(true);
      expect(card.tags).toContain("leech");
      // Check if suspended (next review pushed far into future)
      // The implementation adds 7 days for leeches
      // card.nextReview = Date.now() + 7*24*60*60*1000
    });
  });

  describe("getStudyQueue", () => {
    it("should return due cards", () => {
      const now = new Date("2024-01-01T12:00:00Z").getTime();
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const dueCard = createCard({ deckId: "deck-1" });
      dueCard.nextReview = now - 1000; // Due 1 second ago
      dueCard.totalReviews = 1;

      const futureCard = createCard({ deckId: "deck-1" });
      futureCard.nextReview = now + 100000; // Due in future
      futureCard.totalReviews = 1;

      const result = service.getStudyQueue(
        [dueCard, futureCard],
        "deck-1",
        10,
        20
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(1);
        expect(result.value[0]?.id).toBe(dueCard.id);
      }
    });

    it("should include new cards if space allows", () => {
      const now = new Date("2024-01-01T12:00:00Z").getTime();
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const dueCard = createCard({ deckId: "deck-1" });
      dueCard.nextReview = now - 1000;
      dueCard.totalReviews = 1;

      const newCard = createCard({ deckId: "deck-1" });
      newCard.totalReviews = 0;
      newCard.nextReview = now; // New cards usually have nextReview <= now or 0

      const result = service.getStudyQueue(
        [dueCard, newCard],
        "deck-1",
        10,
        20
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(2);
        expect(result.value).toContain(dueCard);
        expect(result.value).toContain(newCard);
      }
    });

    it("should respect daily new limit", () => {
      const now = new Date("2024-01-01T12:00:00Z").getTime();
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const newCards = Array.from({ length: 5 }, () => {
        const c = createCard({ deckId: "deck-1" });
        c.totalReviews = 0;
        c.nextReview = now;
        return c;
      });

      // Limit new cards to 2
      const result = service.getStudyQueue(newCards, "deck-1", 2, 20);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(2);
      }
    });

    it("should respect max total limit", () => {
      const now = new Date("2024-01-01T12:00:00Z").getTime();
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const dueCards = Array.from({ length: 5 }, () => {
        const c = createCard({ deckId: "deck-1" });
        c.nextReview = now - 1000;
        c.totalReviews = 1;
        return c;
      });

      // Max total 3
      const result = service.getStudyQueue(dueCards, "deck-1", 10, 3);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(3);
      }
    });

    it("should exclude buried cards", () => {
      const now = new Date("2024-01-01T12:00:00Z").getTime();
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const card = createCard({ deckId: "deck-1" });
      card.nextReview = now - 1000;

      service.bury([card.id]);

      const result = service.getStudyQueue([card], "deck-1", 10, 20);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(0);
      }
    });
  });

  describe("bury/reset", () => {
    it("should manage buried cards", () => {
      const cardId = "card-1";
      service.bury([cardId]);
      expect(service.getBuriedIds()).toContain(cardId);

      service.resetBuried();
      expect(service.getBuriedIds()).toHaveLength(0);
    });
  });
});
