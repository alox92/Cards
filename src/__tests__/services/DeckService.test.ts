import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeckService } from "../../application/services/DeckService";
import { DeckRepository } from "../../domain/repositories/DeckRepository";
import { CardRepository } from "../../domain/repositories/CardRepository";
import { DeckEntity } from "../../domain/entities/Deck";

describe("DeckService", () => {
  let service: DeckService;
  let mockDeckRepo: DeckRepository;
  let mockCardRepo: CardRepository;

  beforeEach(() => {
    mockDeckRepo = {
      getAll: vi.fn(),
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as DeckRepository;

    mockCardRepo = {
      deleteByDeck: vi.fn(),
      getByDeck: vi.fn(),
    } as unknown as CardRepository;

    service = new DeckService(mockDeckRepo, mockCardRepo);
  });

  describe("listDecks", () => {
    it("should return all decks", async () => {
      const decks = [new DeckEntity({ id: "d1", name: "Deck 1" })];
      (mockDeckRepo.getAll as any).mockResolvedValue(decks);

      const result = await service.listDecks();
      expect(result).toEqual(decks);
    });
  });

  describe("createDeck", () => {
    it("should create a deck", async () => {
      const data = { name: "New Deck" };
      const created = new DeckEntity({ ...data, id: "d1" });
      (mockDeckRepo.create as any).mockResolvedValue(created);

      const result = await service.createDeck(data);
      expect(result).toEqual(created);
      expect(mockDeckRepo.create).toHaveBeenCalledWith(expect.any(DeckEntity));
    });

    it("should throw validation error for empty name", async () => {
      await expect(service.createDeck({ name: "" })).rejects.toThrow();
    });
  });

  describe("getDeck", () => {
    it("should return deck if found", async () => {
      const deck = new DeckEntity({ id: "d1", name: "Deck 1" });
      (mockDeckRepo.getById as any).mockResolvedValue(deck);

      const result = await service.getDeck("d1");
      expect(result).toEqual(deck);
    });

    it("should throw if not found", async () => {
      (mockDeckRepo.getById as any).mockResolvedValue(null);
      await expect(service.getDeck("d1")).rejects.toThrow(/Deck introuvable/);
    });
  });

  describe("updateDeck", () => {
    it("should update deck", async () => {
      const deck = new DeckEntity({ id: "d1", name: "Deck 1" });
      (mockDeckRepo.update as any).mockResolvedValue(undefined);

      await service.updateDeck(deck);
      expect(mockDeckRepo.update).toHaveBeenCalledWith(deck);
    });
  });

  describe("deleteDeck", () => {
    it("should delete deck and its cards", async () => {
      (mockDeckRepo.getById as any).mockResolvedValue(
        new DeckEntity({ id: "d1", name: "D1" })
      );
      (mockDeckRepo.delete as any).mockResolvedValue(undefined);
      (mockCardRepo.deleteByDeck as any).mockResolvedValue(undefined);

      await service.deleteDeck("d1");

      expect(mockDeckRepo.delete).toHaveBeenCalledWith("d1");
      expect(mockCardRepo.deleteByDeck).toHaveBeenCalledWith("d1");
    });
  });

  describe("getDeckCards", () => {
    it("should return cards for deck", async () => {
      const cards = [{ id: "c1" }];
      (mockCardRepo.getByDeck as any).mockResolvedValue(cards);

      const result = await service.getDeckCards("d1");
      expect(result).toEqual(cards);
    });
  });
});
