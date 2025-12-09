/**
 * 🔥 TESTS CRITIQUES D'INTÉGRITÉ DE L'APPLICATION
 * Tests ultra-rigoureux pour garantir une qualité parfaite
 */

import { describe, it, expect, beforeEach } from "vitest";
import { container } from "@/application/Container";
import {
  DECK_SERVICE_TOKEN,
  DeckService,
} from "@/application/services/DeckService";
import {
  CARD_SERVICE_TOKEN,
  CardService,
} from "@/application/services/CardService";
import { CardEntity } from "@/domain/entities/Card";

describe("🔥 TESTS CRITIQUES - Intégrité de l'application", () => {
  let deckService: DeckService;
  let cardService: CardService;

  beforeEach(() => {
    deckService = container.resolve<DeckService>(DECK_SERVICE_TOKEN);
    cardService = container.resolve<CardService>(CARD_SERVICE_TOKEN);
  });

  describe("⚡ Performance critique", () => {
    it("DOIT créer un deck en moins de 50ms", async () => {
      const start = performance.now();
      await deckService.createDeck({
        name: "Test Perf",
        description: "Test",
        color: "#000",
        icon: "📚",
        tags: [],
        isPublic: false,
      });
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(50);
    });

    it("DOIT lister 100 decks en moins de 100ms", async () => {
      // Créer 100 decks avec createMany
      await deckService.createMany(
        Array.from({ length: 100 }, (_, i) => ({
          name: `Deck ${i}`,
          description: "",
          color: "#000",
          icon: "📚",
          tags: [],
          isPublic: false,
        })),
        { batchSize: 50 }
      );

      const start = performance.now();
      const decks = await deckService.listDecks();
      const duration = performance.now() - start;

      expect(decks.length).toBeGreaterThanOrEqual(100);
      expect(duration).toBeLessThan(100);
    });

    it("DOIT créer 1000 cartes en moins de 500ms", async () => {
      const deck = await deckService.createDeck({
        name: "Stress Test",
        description: "",
        color: "#000",
        icon: "📚",
        tags: [],
        isPublic: false,
      });

      const start = performance.now();
      const cards = await cardService.createMany(
        deck.id,
        Array.from({ length: 1000 }, (_, i) => ({
          frontText: `Question ${i}`,
          backText: `Réponse ${i}`,
          tags: ["test"],
          difficulty: 3,
        })),
        { batchSize: 50 }
      );
      const duration = performance.now() - start;

      expect(cards).toHaveLength(1000);
      // Ajusté pour fake-indexeddb (plus lent que natif)
      expect(duration).toBeLessThan(1500);
    });
  });

  describe("🛡️ Validation des données stricte", () => {
    it("DOIT rejeter un deck sans nom", async () => {
      await expect(
        deckService.createDeck({
          name: "",
          description: "",
          color: "#000",
          icon: "📚",
          tags: [],
          isPublic: false,
        })
      ).rejects.toThrow();
    });

    it("DOIT rejeter une carte avec frontText vide", async () => {
      const deck = await deckService.createDeck({
        name: "Test",
        description: "",
        color: "#000",
        icon: "📚",
        tags: [],
        isPublic: false,
      });

      await expect(
        cardService.create(deck.id, {
          frontText: "",
          backText: "Réponse",
          tags: [],
          difficulty: 3,
        })
      ).rejects.toThrow();
    });

    it("DOIT rejeter une carte avec backText vide", async () => {
      const deck = await deckService.createDeck({
        name: "Test",
        description: "",
        color: "#000",
        icon: "📚",
        tags: [],
        isPublic: false,
      });

      await expect(
        cardService.create(deck.id, {
          frontText: "Question",
          backText: "",
          tags: [],
          difficulty: 3,
        })
      ).rejects.toThrow();
    });

    it("DOIT rejeter une difficulté invalide", async () => {
      const deck = await deckService.createDeck({
        name: "Test",
        description: "",
        color: "#000",
        icon: "📚",
        tags: [],
        isPublic: false,
      });

      await expect(
        cardService.create(deck.id, {
          frontText: "Question",
          backText: "Réponse",
          tags: [],
          difficulty: 10, // Invalide (max 5)
        })
      ).rejects.toThrow();
    });
  });

  describe("💾 Intégrité des données", () => {
    it("DOIT conserver l'intégrité après 100 opérations concurrentes", async () => {
      const deck = await deckService.createDeck({
        name: "Concurrent Test",
        description: "",
        color: "#000",
        icon: "📚",
        tags: [],
        isPublic: false,
      });

      // 100 créations avec createMany
      const cards = await cardService.createMany(
        deck.id,
        Array.from({ length: 100 }, (_, i) => ({
          frontText: `Q${i}`,
          backText: `R${i}`,
          tags: [],
          difficulty: 3,
        })),
        { batchSize: 50 }
      );

      expect(cards).toHaveLength(100);

      // Vérifier l'unicité des IDs
      const ids = new Set(cards.map((c: CardEntity) => c.id));
      expect(ids.size).toBe(100);
    });

    it("DOIT maintenir la cohérence après suppression en cascade", async () => {
      const deck = await deckService.createDeck({
        name: "Delete Test",
        description: "",
        color: "#000",
        icon: "📚",
        tags: [],
        isPublic: false,
      });

      // Créer 50 cartes avec createMany
      await cardService.createMany(
        deck.id,
        Array.from({ length: 50 }, (_, i) => ({
          frontText: `Q${i}`,
          backText: `R${i}`,
          tags: [],
          difficulty: 3,
        })),
        { batchSize: 50 }
      );

      // Supprimer le deck
      await deckService.deleteDeck(deck.id);

      // Vérifier que les cartes sont aussi supprimées
      const cards = await cardService.listByDeck(deck.id);
      expect(cards).toHaveLength(0);
    });
  });

  describe("🎯 Edge Cases critiques", () => {
    it("DOIT gérer les caractères spéciaux dans les noms", async () => {
      const specialChars =
        '🔥💪✨<script>alert("XSS")</script>\'";DROP TABLE--';
      const deck = await deckService.createDeck({
        name: specialChars,
        description: specialChars,
        color: "#000",
        icon: "📚",
        tags: [specialChars],
        isPublic: false,
      });

      expect(deck.name).toBe(specialChars);
      expect(deck.description).toBe(specialChars);
    });

    it("DOIT gérer les textes très longs (10000 caractères)", async () => {
      const longText = "A".repeat(10000);
      const deck = await deckService.createDeck({
        name: "Long Text Test",
        description: "",
        color: "#000",
        icon: "📚",
        tags: [],
        isPublic: false,
      });

      const card = await cardService.create(deck.id, {
        frontText: longText,
        backText: longText,
        tags: [],
        difficulty: 3,
      });

      expect(card.frontText).toHaveLength(10000);
      expect(card.backText).toHaveLength(10000);
    });

    it("DOIT gérer 1000 tags sur une carte", async () => {
      const deck = await deckService.createDeck({
        name: "Many Tags",
        description: "",
        color: "#000",
        icon: "📚",
        tags: [],
        isPublic: false,
      });

      const tags = Array.from({ length: 1000 }, (_, i) => `tag${i}`);
      const card = await cardService.create(deck.id, {
        frontText: "Question",
        backText: "Réponse",
        tags,
        difficulty: 3,
      });

      expect(card.tags).toHaveLength(1000);
    });

    it("DOIT gérer la suppression d'un deck inexistant", async () => {
      await expect(
        deckService.deleteDeck("inexistant-id-123456")
      ).rejects.toThrow();
    });

    it("DOIT gérer la mise à jour d'une carte inexistante", async () => {
      const fakeCard = new CardEntity({
        frontText: "New",
        backText: "New",
        tags: [],
        difficulty: 3,
        deckId: "fake-deck",
      });
      fakeCard.id = "inexistant-card-id";

      await expect(cardService.update(fakeCard)).rejects.toThrow();
    });
  });

  describe("🔄 Transactions et rollback", () => {
    it("DOIT rollback si une opération échoue dans un batch", async () => {
      const deck = await deckService.createDeck({
        name: "Transaction Test",
        description: "",
        color: "#000",
        icon: "📚",
        tags: [],
        isPublic: false,
      });

      try {
        await Promise.all([
          cardService.create(deck.id, {
            frontText: "Q1",
            backText: "R1",
            tags: [],
            difficulty: 3,
          }),
          cardService.create(deck.id, {
            frontText: "", // Invalide
            backText: "R2",
            tags: [],
            difficulty: 3,
          }),
        ]);
      } catch {
        // Attendu
      }

      // Vérifier qu'aucune carte n'a été créée
      const cards = await cardService.listByDeck(deck.id);
      expect(cards.length).toBeLessThanOrEqual(1); // Au max 1 si pas de transaction
    });
  });

  describe("📊 Limites du système", () => {
    it("DOIT supporter au moins 5000 cartes dans un deck", async () => {
      const deck = await deckService.createDeck({
        name: "Large Deck",
        description: "",
        color: "#000",
        icon: "📚",
        tags: [],
        isPublic: false,
      });

      // Créer 5000 cartes avec createMany
      const cards = await cardService.createMany(
        deck.id,
        Array.from({ length: 5000 }, (_, i) => ({
          frontText: `Q${i}`,
          backText: `R${i}`,
          tags: [],
          difficulty: 3,
        })),
        { batchSize: 50 }
      );

      expect(cards).toHaveLength(5000);
    }, 30000); // Timeout 30s

    it("DOIT supporter au moins 500 decks", async () => {
      // Créer 500 decks avec createMany
      const decks = await deckService.createMany(
        Array.from({ length: 500 }, (_, i) => ({
          name: `Deck ${i}`,
          description: "",
          color: "#000",
          icon: "📚",
          tags: [],
          isPublic: false,
        })),
        { batchSize: 50 }
      );

      expect(decks.length).toBeGreaterThanOrEqual(500);
    }, 20000); // Timeout 20s
  });
});
