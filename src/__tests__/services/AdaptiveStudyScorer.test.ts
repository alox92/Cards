import { describe, it, expect } from "vitest";
import { adaptiveStudyScorer } from "../../application/services/AdaptiveStudyScorer";
import { CardEntity } from "../../domain/entities/Card";

describe("AdaptiveStudyScorer", () => {
  const createCard = (overrides: any = {}): CardEntity => {
    const card = new CardEntity({
      deckId: "deck-1",
      frontText: "Front",
      backText: "Back",
      ...overrides,
    });
    Object.assign(card, overrides);
    return card;
  };

  it("should score and sort cards correctly", () => {
    const now = Date.now();

    // Card 1: Due now, low reviews (high difficulty), short interval (high retention need)
    const urgentCard = createCard({
      id: "urgent",
      nextReview: now,
      totalReviews: 1,
      easinessFactor: 1.3,
      interval: 1,
    });

    // Card 2: Due in future, high reviews (low difficulty), long interval
    const easyCard = createCard({
      id: "easy",
      nextReview: now + 7 * 24 * 60 * 60 * 1000, // 7 days
      totalReviews: 100,
      easinessFactor: 2.8,
      interval: 100,
    });

    const result = adaptiveStudyScorer.scoreCards([urgentCard, easyCard], {
      now,
      targetDeck: "deck-1",
    });

    expect(result).toHaveLength(2);
    expect(result[0]?.card.id).toBe("urgent");
    expect(result[1]?.card.id).toBe("easy");

    expect(result[0]?.score).toBeGreaterThan(result[1]?.score || 0);

    // Check factors
    expect(result[0]?.factors.due).toBeCloseTo(1, 1);
    expect(result[1]?.factors.due).toBeLessThan(1);
  });

  it("should handle empty list", () => {
    const result = adaptiveStudyScorer.scoreCards([], {
      now: Date.now(),
      targetDeck: "deck-1",
    });
    expect(result).toHaveLength(0);
  });

  it("should respect custom weights", () => {
    const now = Date.now();
    const card = createCard({ nextReview: now });

    const result = adaptiveStudyScorer.scoreCards([card], {
      now,
      targetDeck: "deck-1",
      recencyWeight: 1,
      difficultyWeight: 0,
      retentionWeight: 0,
    });

    expect(result[0]?.score).toBeCloseTo(result[0]?.factors.due || 0, 5);
  });
});
