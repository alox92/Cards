import { describe, it, expect, vi } from "vitest";
import { DeckEntity } from "../../../domain/entities/Deck";
import { CardEntity } from "../../../domain/entities/Card";

describe("DeckEntity", () => {
  const defaultData = {
    name: "Test Deck",
    description: "Description",
  };

  it("should initialize with default values", () => {
    const deck = new DeckEntity(defaultData);

    expect(deck.id).toBeDefined();
    expect(deck.name).toBe("Test Deck");
    expect(deck.color).toBe("#3B82F6");
    expect(deck.totalCards).toBe(0);
    expect(deck.settings.dailyNewCards).toBe(20);
  });

  it("should update fields", () => {
    vi.useFakeTimers();
    const deck = new DeckEntity(defaultData);
    const originalUpdated = deck.updated;

    vi.advanceTimersByTime(10);

    deck.update({
      name: "New Name",
      color: "#000000",
    });

    expect(deck.name).toBe("New Name");
    expect(deck.color).toBe("#000000");
    expect(deck.updated).toBeGreaterThan(originalUpdated);
    vi.useRealTimers();
  });

  it("should update stats from cards", () => {
    const deck = new DeckEntity(defaultData);

    const card1 = new CardEntity({
      deckId: deck.id,
      frontText: "1",
      backText: "1",
    });
    card1.recordResponse(5, 1000); // Mastered potentially if interval >= 21? No, first review interval is 1.
    card1.interval = 22; // Force mature

    const card2 = new CardEntity({
      deckId: deck.id,
      frontText: "2",
      backText: "2",
    });
    // Not studied

    const card3 = new CardEntity({
      deckId: deck.id,
      frontText: "3",
      backText: "3",
    });
    card3.recordResponse(2, 1000); // Failed

    deck.updateStats([card1, card2, card3]);

    expect(deck.totalCards).toBe(3);
    expect(deck.studiedCards).toBe(2);
    expect(deck.masteredCards).toBe(1);

    // Success rates:
    // Card 1: 1/1 = 1.0
    // Card 2: 0 (not studied) -> 0 contribution? Logic says: (card.totalReviews > 0 ? ... : 0)
    // Card 3: 0/1 = 0.0
    // Average: (1.0 + 0 + 0.0) / 3 = 0.333...
    expect(deck.averageSuccessRate).toBeCloseTo(1 / 3);
  });

  it("should record study session", () => {
    vi.useFakeTimers();
    const deck = new DeckEntity(defaultData);
    const now = Date.now();
    vi.setSystemTime(now);

    deck.recordStudySession(60000, 10);

    expect(deck.totalStudyTime).toBe(60000);
    expect(deck.lastStudied).toBe(now);
    vi.useRealTimers();
  });

  it("should calculate detailed stats", () => {
    const deck = new DeckEntity(defaultData);
    const now = Date.now();

    const card1 = new CardEntity({
      deckId: deck.id,
      frontText: "1",
      backText: "1",
    });
    card1.nextReview = now - 1000; // Due
    card1.lastReview = now - 1000; // Studied today (within 24h)
    card1.totalReviews = 1; // Not new

    const card2 = new CardEntity({
      deckId: deck.id,
      frontText: "2",
      backText: "2",
    });
    card2.nextReview = now + 10000; // Not due
    // New

    deck.updateStats([card1, card2]); // Update internal stats first
    const stats = deck.calculateStats([card1, card2]);

    expect(stats.totalCards).toBe(2);
    expect(stats.newCards).toBe(1);
    expect(stats.dueCards).toBe(1);
    expect(stats.studiedToday).toBe(1);
  });
});
