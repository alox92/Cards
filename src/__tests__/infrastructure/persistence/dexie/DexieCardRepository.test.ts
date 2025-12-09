import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import { DexieCardRepository } from "../../../../infrastructure/persistence/dexie/DexieCardRepository";
import { CardEntity } from "../../../../domain/entities/Card";
import { aribaDB } from "../../../../infrastructure/persistence/dexie/AribaDB";

describe("DexieCardRepository", () => {
  let repo: DexieCardRepository;

  beforeEach(async () => {
    repo = new DexieCardRepository();
    await aribaDB.open();
    await aribaDB.cards.clear();
  });

  afterEach(async () => {
    await aribaDB.cards.clear();
  });

  it("should create and retrieve a card", async () => {
    const card = new CardEntity({
      deckId: "d1",
      frontText: "F",
      backText: "B",
    });
    await repo.create(card);

    const retrieved = await repo.getById(card.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(card.id);
    expect(retrieved?.frontText).toBe("F");
  });

  it("should get all cards", async () => {
    const c1 = new CardEntity({ deckId: "d1", frontText: "1", backText: "1" });
    const c2 = new CardEntity({ deckId: "d1", frontText: "2", backText: "2" });
    await repo.create(c1);
    await repo.create(c2);

    const all = await repo.getAll();
    expect(all).toHaveLength(2);
  });

  it("should get cards by deck", async () => {
    const c1 = new CardEntity({ deckId: "d1", frontText: "1", backText: "1" });
    const c2 = new CardEntity({ deckId: "d2", frontText: "2", backText: "2" });
    await repo.create(c1);
    await repo.create(c2);

    const deck1Cards = await repo.getByDeck("d1");
    expect(deck1Cards).toHaveLength(1);
    expect(deck1Cards[0]?.id).toBe(c1.id);
  });

  it("should update a card", async () => {
    const card = new CardEntity({
      deckId: "d1",
      frontText: "Old",
      backText: "B",
    });
    await repo.create(card);

    card.frontText = "New";
    await repo.update(card);

    const retrieved = await repo.getById(card.id);
    expect(retrieved?.frontText).toBe("New");
  });

  it("should delete a card", async () => {
    const card = new CardEntity({
      deckId: "d1",
      frontText: "F",
      backText: "B",
    });
    await repo.create(card);

    await repo.delete(card.id);
    const retrieved = await repo.getById(card.id);
    expect(retrieved).toBeNull();
  });

  it("should delete cards by deck", async () => {
    const c1 = new CardEntity({ deckId: "d1", frontText: "1", backText: "1" });
    const c2 = new CardEntity({ deckId: "d1", frontText: "2", backText: "2" });
    const c3 = new CardEntity({ deckId: "d2", frontText: "3", backText: "3" });
    await repo.create(c1);
    await repo.create(c2);
    await repo.create(c3);

    await repo.deleteByDeck("d1");

    const all = await repo.getAll();
    expect(all).toHaveLength(1);
    expect(all[0]?.id).toBe(c3.id);
  });
});
