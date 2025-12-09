import { describe, it, expect, vi, beforeEach } from "vitest";
import { CardService } from "../../application/services/CardService";
import { CardRepository } from "../../domain/repositories/CardRepository";
import { CardEntity } from "../../domain/entities/Card";

describe("CardService", () => {
  let service: CardService;
  let mockRepo: CardRepository;

  beforeEach(() => {
    mockRepo = {
      getAll: vi.fn(),
      getByDeck: vi.fn(),
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteByDeck: vi.fn(),
    } as unknown as CardRepository;

    service = new CardService(mockRepo);
  });

  describe("create", () => {
    it("should create a card successfully", async () => {
      const deckId = "deck-123";
      const data = { frontText: "Front", backText: "Back", difficulty: 1 };
      const createdCard = new CardEntity({ ...data, deckId, id: "card-1" });

      (mockRepo.create as any).mockResolvedValue(createdCard);

      const result = await service.create(deckId, data);

      expect(mockRepo.create).toHaveBeenCalledWith(expect.any(CardEntity));
      expect(result).toEqual(createdCard);
    });

    it("should throw validation error for invalid deckId", async () => {
      await expect(
        service.create("", { frontText: "F", backText: "B" })
      ).rejects.toThrow();
    });

    it("should throw validation error for missing frontText", async () => {
      await expect(
        service.create("deck-1", { frontText: "", backText: "B" })
      ).rejects.toThrow();
    });
  });

  describe("get", () => {
    it("should return card if found", async () => {
      const card = new CardEntity({
        id: "c1",
        deckId: "d1",
        frontText: "F",
        backText: "B",
      });
      (mockRepo.getById as any).mockResolvedValue(card);

      const result = await service.get("c1");
      expect(result).toEqual(card);
    });

    it("should return null if not found", async () => {
      (mockRepo.getById as any).mockResolvedValue(null);

      const result = await service.get("c1");
      expect(result).toBeNull();
    });
  });

  describe("update", () => {
    it("should update card if exists", async () => {
      const card = new CardEntity({
        id: "c1",
        deckId: "d1",
        frontText: "F",
        backText: "B",
      });
      (mockRepo.getById as any).mockResolvedValue(card);
      (mockRepo.update as any).mockResolvedValue(undefined);

      await service.update(card);

      expect(mockRepo.update).toHaveBeenCalledWith(card);
    });

    it("should throw not found error if card does not exist", async () => {
      const card = new CardEntity({
        id: "c1",
        deckId: "d1",
        frontText: "F",
        backText: "B",
      });
      (mockRepo.getById as any).mockResolvedValue(null);

      await expect(service.update(card)).rejects.toThrow(/Card introuvable/);
    });
  });

  describe("delete", () => {
    it("should delete card", async () => {
      (mockRepo.delete as any).mockResolvedValue(undefined);

      await service.delete("c1");

      expect(mockRepo.delete).toHaveBeenCalledWith("c1");
    });
  });

  describe("listByDeck", () => {
    it("should return cards for deck", async () => {
      const cards = [
        new CardEntity({
          id: "c1",
          deckId: "d1",
          frontText: "F1",
          backText: "B1",
        }),
        new CardEntity({
          id: "c2",
          deckId: "d1",
          frontText: "F2",
          backText: "B2",
        }),
      ];
      (mockRepo.getByDeck as any).mockResolvedValue(cards);

      const result = await service.listByDeck("d1");

      expect(result).toEqual(cards);
    });
  });

  describe("createMany", () => {
    it("should create multiple cards", async () => {
      const deckId = "d1";
      const data = [
        { frontText: "F1", backText: "B1" },
        { frontText: "F2", backText: "B2" },
      ];

      (mockRepo.create as any).mockImplementation(
        async (entity: CardEntity) => {
          return { ...entity, id: "generated-id" };
        }
      );

      const result = await service.createMany(deckId, data);

      expect(result).toHaveLength(2);
      expect(mockRepo.create).toHaveBeenCalledTimes(2);
    });

    it("should return empty array if input is empty", async () => {
      const result = await service.createMany("d1", []);
      expect(result).toEqual([]);
      expect(mockRepo.create).not.toHaveBeenCalled();
    });
  });
});
