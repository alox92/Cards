import { describe, it, expect, beforeEach, vi } from "vitest";
import { SearchService } from "../../application/services/SearchService";
import { CardEntity } from "../../domain/entities/Card";

describe("SearchService", () => {
  let service: SearchService;
  let mockRepo: any;
  let mockCards: CardEntity[];

  beforeEach(() => {
    mockCards = [
      {
        id: "1",
        deckId: "deck-1",
        frontText: "Hello World",
        backText: "Bonjour le monde",
        tags: ["greeting", "basic"],
        nextReview: Date.now() - 10000, // Due
        created: Date.now(),
        updated: Date.now(),
        interval: 1,
        easinessFactor: 2.5,
        repetition: 0,
        difficulty: 1,
        lastReview: 0,
        quality: 0,
        totalReviews: 0,
        correctReviews: 0,
        averageResponseTime: 0,
      },
      {
        id: "2",
        deckId: "deck-1",
        frontText: "Cat",
        backText: "Chat",
        tags: ["animal"],
        nextReview: Date.now() + 10000, // Not due
        created: Date.now(),
        updated: Date.now(),
        interval: 1,
        easinessFactor: 2.5,
        repetition: 0,
        difficulty: 1,
        lastReview: 0,
        quality: 0,
        totalReviews: 0,
        correctReviews: 0,
        averageResponseTime: 0,
      },
      {
        id: "3",
        deckId: "deck-2",
        frontText: "Dog",
        backText: "Chien",
        tags: ["animal", "pet"],
        nextReview: Date.now() - 10000, // Due
        created: Date.now(),
        updated: Date.now(),
        interval: 1,
        easinessFactor: 2.5,
        repetition: 0,
        difficulty: 1,
        lastReview: 0,
        quality: 0,
        totalReviews: 0,
        correctReviews: 0,
        averageResponseTime: 0,
      },
    ] as unknown as CardEntity[];

    mockRepo = {
      getAll: vi.fn().mockResolvedValue(mockCards),
    };

    service = new SearchService(mockRepo);
  });

  it("should return all cards if query is empty", async () => {
    const results = await service.search({});
    expect(results).toHaveLength(3);
  });

  it("should filter by deckId", async () => {
    const results = await service.search({ deckId: "deck-1" });
    expect(results).toHaveLength(2);
    expect(results.map((c) => c.id)).toContain("1");
    expect(results.map((c) => c.id)).toContain("2");
  });

  it("should filter by tag", async () => {
    const results = await service.search({ tag: "animal" });
    expect(results).toHaveLength(2);
    expect(results.map((c) => c.id)).toContain("2");
    expect(results.map((c) => c.id)).toContain("3");
  });

  it("should filter by isDue", async () => {
    const results = await service.search({ isDue: true });
    expect(results).toHaveLength(2);
    expect(results.map((c) => c.id)).toContain("1");
    expect(results.map((c) => c.id)).toContain("3");
  });

  it("should filter by text (front)", async () => {
    const results = await service.search({ text: "Hello" });
    expect(results).toHaveLength(1);
    expect(results[0]?.id).toBe("1");
  });

  it("should filter by text (back)", async () => {
    const results = await service.search({ text: "Chien" });
    expect(results).toHaveLength(1);
    expect(results[0]?.id).toBe("3");
  });

  it("should filter by text (case insensitive)", async () => {
    const results = await service.search({ text: "chat" });
    expect(results).toHaveLength(1);
    expect(results[0]?.id).toBe("2");
  });

  it("should combine filters", async () => {
    const results = await service.search({
      deckId: "deck-1",
      isDue: true,
    });
    expect(results).toHaveLength(1);
    expect(results[0]?.id).toBe("1");
  });

  it("should return empty array if no matches", async () => {
    const results = await service.search({ text: "Zebra" });
    expect(results).toHaveLength(0);
  });
});
