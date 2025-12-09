import { describe, it, expect, vi } from "vitest";
import { CardEntity } from "../../../domain/entities/Card";

describe("CardEntity", () => {
  const defaultData = {
    deckId: "deck-1",
    frontText: "Front",
    backText: "Back",
    tags: ["tag1"],
    difficulty: 1,
  };

  it("should initialize with default values", () => {
    const card = new CardEntity(defaultData);

    expect(card.id).toBeDefined();
    expect(card.deckId).toBe("deck-1");
    expect(card.frontText).toBe("Front");
    expect(card.easinessFactor).toBe(2.5);
    expect(card.interval).toBe(1); // Default is 1
    expect(card.repetition).toBe(0);
    expect(card.totalReviews).toBe(0);
    expect(card.correctReviews).toBe(0);
  });

  it("should update fields", () => {
    vi.useFakeTimers();
    const card = new CardEntity(defaultData);
    const originalUpdated = card.updated;

    // Wait a bit to ensure timestamp changes
    vi.advanceTimersByTime(10);

    card.update({
      frontText: "New Front",
      difficulty: 2,
    });

    expect(card.frontText).toBe("New Front");
    expect(card.difficulty).toBe(2);
    expect(card.backText).toBe("Back"); // Unchanged
    expect(card.updated).toBeGreaterThan(originalUpdated);
    vi.useRealTimers();
  });

  it("should record response and update SM2 data", () => {
    const card = new CardEntity(defaultData);
    const now = Date.now();

    // Mock Date.now
    vi.setSystemTime(now);

    card.recordResponse(5, 1000);

    expect(card.totalReviews).toBe(1);
    expect(card.correctReviews).toBe(1);
    expect(card.averageResponseTime).toBe(1000);
    expect(card.lastReview).toBe(now);
    expect(card.repetition).toBe(1);
    expect(card.interval).toBeGreaterThan(0);
    expect(card.nextReview).toBeGreaterThan(now);
  });

  it("should calculate success rate", () => {
    const card = new CardEntity(defaultData);
    expect(card.getSuccessRate()).toBe(0);

    card.recordResponse(5, 1000); // Success
    expect(card.getSuccessRate()).toBe(1);

    card.recordResponse(2, 1000); // Failure
    expect(card.getSuccessRate()).toBe(0.5);
  });

  it("should determine if due", () => {
    const card = new CardEntity(defaultData);
    // New card is due immediately (nextReview = 0 or created time?)
    // Actually nextReview defaults to 0 in constructor usually?
    // Let's check constructor logic if needed.
    // Assuming nextReview is 0 or <= now for new cards.

    // Force nextReview to future
    card.nextReview = Date.now() + 10000;
    expect(card.isDue()).toBe(false);

    // Force nextReview to past
    card.nextReview = Date.now() - 10000;
    expect(card.isDue()).toBe(true);
  });

  it("should determine maturity", () => {
    const card = new CardEntity(defaultData);
    card.interval = 10;
    expect(card.isMature()).toBe(false);

    card.interval = 21;
    expect(card.isMature()).toBe(true);
  });

  it("should calculate retention score", () => {
    const card = new CardEntity(defaultData);
    // Initial score might be 0
    expect(card.getRetentionScore()).toBe(0);

    card.recordResponse(5, 1000);
    // Should have some score
    expect(card.getRetentionScore()).toBeGreaterThan(0);
  });
});
