import { describe, it, expect, beforeEach } from "vitest";
import { LocalDeckRepository } from "../../../infrastructure/persistence/LocalDeckRepository";
import { DeckEntity } from "../../../domain/entities/Deck";

describe("LocalDeckRepository", () => {
  let repo: LocalDeckRepository;

  beforeEach(() => {
    localStorage.clear();
    repo = new LocalDeckRepository();
  });

  it("should create and retrieve a deck", async () => {
    const deck = new DeckEntity({ name: "Test Deck" });
    await repo.create(deck);

    const retrieved = await repo.getById(deck.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(deck.id);
    expect(retrieved?.name).toBe("Test Deck");
  });

  it("should get all decks", async () => {
    const d1 = new DeckEntity({ name: "Deck 1" });
    const d2 = new DeckEntity({ name: "Deck 2" });
    await repo.create(d1);
    await repo.create(d2);

    const all = await repo.getAll();
    expect(all).toHaveLength(2);
  });

  it("should update a deck", async () => {
    const deck = new DeckEntity({ name: "Old Name" });
    await repo.create(deck);

    deck.name = "New Name";
    await repo.update(deck);

    const retrieved = await repo.getById(deck.id);
    expect(retrieved?.name).toBe("New Name");
  });

  it("should delete a deck", async () => {
    const deck = new DeckEntity({ name: "To Delete" });
    await repo.create(deck);

    await repo.delete(deck.id);
    const retrieved = await repo.getById(deck.id);
    expect(retrieved).toBeNull();
  });
});
