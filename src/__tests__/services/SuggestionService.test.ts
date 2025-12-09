import { describe, it, expect, beforeEach } from "vitest";
import { SuggestionService } from "../../application/services/SuggestionService";
import type { CardEntity } from "../../domain/entities/Card";
import type { DeckEntity } from "../../domain/entities/Deck";
import type { RetentionStats } from "../../types/deckStatus";

describe("SuggestionService", () => {
  let service: SuggestionService;

  beforeEach(() => {
    service = new SuggestionService();
  });

  const createMockCard = (overrides: Partial<CardEntity> = {}): CardEntity => ({
    id: "card-1",
    deckId: "deck-1",
    question: "Q",
    answer: "A",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    repetition: 0,
    interval: 0,
    easinessFactor: 2.5,
    ...overrides,
  });

  const createMockDeck = (overrides: Partial<DeckEntity> = {}): DeckEntity => ({
    id: "deck-1",
    name: "Test Deck",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  });

  describe("calculateRetentionStats", () => {
    it("should handle empty cards list", () => {
      const stats = service.calculateRetentionStats([]);
      expect(stats).toEqual({
        retention: 0,
        dueToday: 0,
        dueSoon: 0,
        unlearnedCount: 0,
        masteredCount: 0,
        avgEasiness: 1.3,
        totalCards: 0,
      });
    });

    it("should calculate stats correctly for mixed cards", () => {
      const now = Date.now();
      const cards = [
        createMockCard({ repetition: 0, easinessFactor: 1.3 }), // Unlearned
        createMockCard({ repetition: 1, nextReview: now - 1000 }), // Due today
        createMockCard({
          repetition: 1,
          nextReview: now + 24 * 60 * 60 * 1000,
          easinessFactor: 1.5,
        }), // Due soon
        createMockCard({
          repetition: 5,
          easinessFactor: 2.8,
          nextReview: now + 10 * 24 * 60 * 60 * 1000,
        }), // Mastered
      ];

      const stats = service.calculateRetentionStats(cards);

      expect(stats.totalCards).toBe(4);
      expect(stats.unlearnedCount).toBe(1);
      expect(stats.dueToday).toBe(1);
      expect(stats.dueSoon).toBe(1);
      expect(stats.masteredCount).toBe(1);
      expect(stats.avgEasiness).toBeGreaterThan(1.3);
    });
  });

  describe("determineDeckStatus", () => {
    it("should return unlearned if no cards", () => {
      const stats = service.calculateRetentionStats([]);
      expect(service.determineDeckStatus(stats)).toBe("unlearned");
    });

    it("should return unlearned if unlearned cards exist", () => {
      const stats = {
        ...service.calculateRetentionStats([]),
        totalCards: 10,
        unlearnedCount: 1,
      };
      expect(service.determineDeckStatus(stats)).toBe("unlearned");
    });

    it("should return urgent if many cards due today", () => {
      const stats = {
        ...service.calculateRetentionStats([]),
        totalCards: 20,
        dueToday: 20, // Assuming threshold is < 20
      };
      expect(service.determineDeckStatus(stats)).toBe("urgent");
    });

    it("should return soon if cards due today or soon", () => {
      const stats = {
        ...service.calculateRetentionStats([]),
        totalCards: 10,
        dueToday: 1,
      };
      expect(service.determineDeckStatus(stats)).toBe("soon");
    });

    it("should return mastered if retention is high", () => {
      const stats = {
        ...service.calculateRetentionStats([]),
        totalCards: 10,
        retention: 95,
      };
      expect(service.determineDeckStatus(stats)).toBe("mastered");
    });
  });

  describe("calculatePriority", () => {
    it("should return critical for unlearned", () => {
      const stats = service.calculateRetentionStats([]);
      expect(service.calculatePriority("unlearned", stats)).toBe("critical");
    });

    it("should return high for urgent", () => {
      const stats = service.calculateRetentionStats([]);
      expect(service.calculatePriority("urgent", stats)).toBe("high");
    });

    it("should return medium for soon with due today", () => {
      const stats = { ...service.calculateRetentionStats([]), dueToday: 1 };
      expect(service.calculatePriority("soon", stats)).toBe("medium");
    });

    it("should return low for soon without due today", () => {
      const stats = { ...service.calculateRetentionStats([]), dueToday: 0 };
      expect(service.calculatePriority("soon", stats)).toBe("low");
    });

    it("should return none for mastered", () => {
      const stats = service.calculateRetentionStats([]);
      expect(service.calculatePriority("mastered", stats)).toBe("none");
    });
  });

  describe("calculatePriorityScore", () => {
    it("should calculate score based on weights", () => {
      const stats = {
        ...service.calculateRetentionStats([]),
        unlearnedCount: 2, // 2 * 3 = 6
        dueToday: 1, // 1 * 2 = 2
        dueSoon: 1, // 1 * 1 = 1
        retention: 50, // 0.5 * 10 * 0.1 = 0.5
      };
      // Score = 6 + 2 + 1 - 0.5 = 8.5 -> 9
      expect(service.calculatePriorityScore(stats)).toBe(9);
    });

    it("should clamp score between 0 and 100", () => {
      const stats = {
        ...service.calculateRetentionStats([]),
        unlearnedCount: 100,
      };
      expect(service.calculatePriorityScore(stats)).toBe(100);
    });
  });

  describe("generateMessage", () => {
    it("should generate correct messages for statuses", () => {
      const stats = service.calculateRetentionStats([]);

      expect(
        service.generateMessage("unlearned", { ...stats, unlearnedCount: 1 })
      ).toContain("nouvelle");
      expect(
        service.generateMessage("urgent", { ...stats, dueToday: 5 })
      ).toContain("maintenant");
      expect(
        service.generateMessage("soon", { ...stats, dueToday: 1 })
      ).toContain("aujourd'hui");
      expect(
        service.generateMessage("soon", { ...stats, dueSoon: 1 })
      ).toContain("bientôt");
      expect(
        service.generateMessage("mastered", { ...stats, retention: 90 })
      ).toContain("maîtrisé");
    });
  });

  describe("determineAction", () => {
    it("should return correct actions", () => {
      const stats = service.calculateRetentionStats([]);

      expect(service.determineAction({ ...stats, unlearnedCount: 1 })).toBe(
        "study_new"
      );
      expect(service.determineAction({ ...stats, dueToday: 1 })).toBe("review");
      expect(service.determineAction({ ...stats, dueSoon: 1 })).toBe(
        "maintain"
      );
      expect(service.determineAction(stats)).toBe("none");
    });
  });

  describe("generateSuggestion", () => {
    it("should generate full suggestion object", () => {
      const deck = createMockDeck();
      const cards = [createMockCard({ repetition: 0 })];

      const suggestion = service.generateSuggestion(deck, cards);

      expect(suggestion.deckId).toBe(deck.id);
      expect(suggestion.status).toBe("unlearned");
      expect(suggestion.action).toBe("study_new");
      expect(suggestion.stats.totalCards).toBe(1);
    });
  });

  describe("generateSuggestions", () => {
    it("should generate and sort suggestions", () => {
      const deck1 = createMockDeck({ id: "d1" });
      const deck2 = createMockDeck({ id: "d2" });

      const cards1 = [createMockCard({ repetition: 0 })]; // Unlearned -> High priority
      const cards2 = [
        createMockCard({ repetition: 5, nextReview: Date.now() + 10000000 }),
      ]; // Mastered -> Low priority

      const cardsMap = new Map();
      cardsMap.set("d1", cards1);
      cardsMap.set("d2", cards2);

      const suggestions = service.generateSuggestions([deck1, deck2], cardsMap);

      expect(suggestions.length).toBe(2);
      expect(suggestions[0].deckId).toBe("d1"); // Higher priority first
    });
  });

  describe("filterByPriority", () => {
    it("should filter correctly", () => {
      const suggestions = [
        { priority: "critical" },
        { priority: "medium" },
        { priority: "none" },
      ] as any[];

      const filtered = service.filterByPriority(suggestions, "medium");
      expect(filtered.length).toBe(2); // critical and medium
      expect(filtered.map((s) => s.priority)).toContain("critical");
      expect(filtered.map((s) => s.priority)).toContain("medium");
    });
  });

  describe("getTodaySuggestions", () => {
    it("should return suggestions with due cards or unlearned", () => {
      const suggestions = [
        { stats: { dueToday: 1, unlearnedCount: 0 } },
        { stats: { dueToday: 0, unlearnedCount: 1 } },
        { stats: { dueToday: 0, unlearnedCount: 0 } },
      ] as any[];

      const today = service.getTodaySuggestions(suggestions);
      expect(today.length).toBe(2);
    });
  });

  describe("getTotalDueToday", () => {
    it("should calculate total due including limited new cards", () => {
      const suggestions = [
        { stats: { dueToday: 5, unlearnedCount: 10 } }, // 5 + 5 (max new) = 10
        { stats: { dueToday: 2, unlearnedCount: 2 } }, // 2 + 2 = 4
      ] as any[];

      expect(service.getTotalDueToday(suggestions)).toBe(14);
    });
  });

  describe("getGlobalRetention", () => {
    it("should calculate weighted average retention", () => {
      const suggestions = [
        { stats: { retention: 100, totalCards: 10 } },
        { stats: { retention: 50, totalCards: 10 } },
      ] as any[];

      // (100*10 + 50*10) / 20 = 1500 / 20 = 75
      expect(service.getGlobalRetention(suggestions)).toBe(75);
    });

    it("should handle empty suggestions", () => {
      expect(service.getGlobalRetention([])).toBe(0);
    });

    it("should handle suggestions with no cards", () => {
      const suggestions = [{ stats: { retention: 0, totalCards: 0 } }] as any[];
      expect(service.getGlobalRetention(suggestions)).toBe(0);
    });
  });
});
