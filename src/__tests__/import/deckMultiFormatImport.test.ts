import { describe, it, expect, vi, beforeEach } from "vitest";
import { importDeckMultiFormat } from "@/application/import/deckMultiFormatImport";
import { container } from "@/application/Container";
import { CARD_REPOSITORY_TOKEN } from "@/domain/repositories/CardRepository";
import { DECK_REPOSITORY_TOKEN } from "@/domain/repositories/DeckRepository";
import { MEDIA_REPOSITORY_TOKEN } from "@/infrastructure/persistence/dexie/DexieMediaRepository";
import { SEARCH_INDEX_SERVICE_TOKEN } from "@/application/services/SearchIndexService";

// Mock container and repositories
const mockCardRepo = {
  create: vi.fn().mockResolvedValue(undefined),
};
const mockDeckRepo = {
  create: vi.fn().mockResolvedValue(undefined),
  getById: vi.fn().mockResolvedValue(null),
};
const mockMediaRepo = {
  save: vi.fn().mockResolvedValue({ id: "m1", key: "k1", type: "image" }),
};
const mockSearchIndexService = {
  indexCard: vi.fn().mockResolvedValue(undefined),
};

vi.mock("@/application/Container", () => ({
  container: {
    resolve: vi.fn((token) => {
      if (token === CARD_REPOSITORY_TOKEN) return mockCardRepo;
      if (token === DECK_REPOSITORY_TOKEN) return mockDeckRepo;
      if (token === MEDIA_REPOSITORY_TOKEN) return mockMediaRepo;
      if (token === SEARCH_INDEX_SERVICE_TOKEN) return mockSearchIndexService;
      return null;
    }),
  },
}));

describe("deckMultiFormatImport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should import TXT file", async () => {
    const content = "Q1\tA1\nQ2\tA2";
    const file = new File([content], "test.txt", { type: "text/plain" });
    // Mock text() method which might be missing in JSDOM
    Object.defineProperty(file, "text", {
      value: async () => content,
    });

    const result = await importDeckMultiFormat(file, { deckName: "Test Deck" });

    expect(result.deck.name).toBe("Test Deck");
    expect(result.cards.length).toBe(2);
    expect(result.cards[0]!.frontText).toBe("Q1");
    expect(result.cards[0]!.backText).toBe("A1");
    expect(mockCardRepo.create).toHaveBeenCalledTimes(2);
  });

  it("should import CSV file", async () => {
    const content = "front,back\nQ1,A1\nQ2,A2";
    const file = new File([content], "test.csv", { type: "text/csv" });
    Object.defineProperty(file, "text", {
      value: async () => content,
    });

    const result = await importDeckMultiFormat(file, { deckName: "CSV Deck" });

    expect(result.cards.length).toBe(2);
    expect(result.cards[0]!.frontText).toBe("Q1");
    expect(result.cards[0]!.backText).toBe("A1");
  });

  it("should import JSON file", async () => {
    const content = JSON.stringify([
      { front: "Q1", back: "A1", tags: ["t1"] },
      { front: "Q2", back: "A2" },
    ]);
    const file = new File([content], "test.json", { type: "application/json" });
    Object.defineProperty(file, "text", {
      value: async () => content,
    });

    const result = await importDeckMultiFormat(file, { deckName: "JSON Deck" });

    expect(result.cards.length).toBe(2);
    expect(result.cards[0]!.tags).toContain("t1");
  });

  it("should handle unknown format", async () => {
    const file = new File([""], "test.unknown", {
      type: "application/octet-stream",
    });

    const result = await importDeckMultiFormat(file, { deckName: "Unknown" });

    expect(result.cards.length).toBe(0);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});
