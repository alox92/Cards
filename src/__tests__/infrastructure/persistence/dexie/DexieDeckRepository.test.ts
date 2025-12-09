import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import { DexieDeckRepository } from "../../../../infrastructure/persistence/dexie/DexieDeckRepository";
import { DeckEntity } from "../../../../domain/entities/Deck";
import { aribaDB } from "../../../../infrastructure/persistence/dexie/AribaDB";

describe("DexieDeckRepository", () => {
  let repo: DexieDeckRepository;

  beforeEach(async () => {
    repo = new DexieDeckRepository();
    await aribaDB.open();
    await aribaDB.decks.clear();
  });

  afterEach(async () => {
    await aribaDB.decks.clear();
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
