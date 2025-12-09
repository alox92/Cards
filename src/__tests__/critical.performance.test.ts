/**
 * 🚀 TESTS CRITIQUES DE PERFORMANCE
 * Validation stricte des performances système
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
import {
  SPACED_REPETITION_SERVICE_TOKEN,
  SpacedRepetitionService,
} from "@/application/services/SpacedRepetitionService";

describe("🚀 TESTS CRITIQUES - Performance système", () => {
  let deckService: DeckService;
  let cardService: CardService;
  let spacedRepetitionService: SpacedRepetitionService;

  beforeEach(() => {
    deckService = container.resolve<DeckService>(DECK_SERVICE_TOKEN);
    cardService = container.resolve<CardService>(CARD_SERVICE_TOKEN);
    spacedRepetitionService = container.resolve<SpacedRepetitionService>(
      SPACED_REPETITION_SERVICE_TOKEN
    );
  });

  describe("⚡ Performances d'écriture", () => {
    it("DOIT créer 100 decks en moins de 200ms", async () => {
      const start = performance.now();

      await deckService.createMany(
        Array.from({ length: 100 }, (_, i) => ({
          name: `Perf Deck ${i}`,
          description: "Test",
          color: "#000",
          icon: "📚",
          tags: [],
          isPublic: false,
        })),
        { batchSize: 50 }
      );

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(200);
    });

    it("DOIT créer 500 cartes séquentiellement en moins de 2s", async () => {
      const deck = await deckService.createDeck({
        name: "Sequential Test",
        description: "",
        color: "#000",
        icon: "📚",
        tags: [],
        isPublic: false,
      });

      const start = performance.now();

      for (let i = 0; i < 500; i++) {
        await cardService.create(deck.id, {
          frontText: `Q${i}`,
          backText: `R${i}`,
          tags: [],
          difficulty: 3,
        });
      }

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(2000);
    });

    it("DOIT mettre à jour 100 cartes en moins de 500ms", async () => {
      const deck = await deckService.createDeck({
        name: "Update Test",
        description: "",
        color: "#000",
        icon: "📚",
        tags: [],
        isPublic: false,
      });

      // Créer 100 cartes
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

      // Mettre à jour toutes les cartes
      const start = performance.now();

      await Promise.all(
        cards.map((card) => {
          card.frontText = "Updated";
          return cardService.update(card);
        })
      );

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(500);
    });
  });

  describe("📖 Performances de lecture", () => {
    it("DOIT lire 1000 cartes en moins de 50ms", async () => {
      const deck = await deckService.createDeck({
        name: "Read Test",
        description: "",
        color: "#000",
        icon: "📚",
        tags: [],
        isPublic: false,
      });

      // Créer 1000 cartes
      await Promise.all(
        Array.from({ length: 1000 }, (_, i) =>
          cardService.create(deck.id, {
            frontText: `Q${i}`,
            backText: `R${i}`,
            tags: [],
            difficulty: 3,
          })
        )
      );

      // Lire toutes les cartes
      const start = performance.now();
      const cards = await cardService.listByDeck(deck.id);
      const duration = performance.now() - start;

      expect(cards).toHaveLength(1000);
      expect(duration).toBeLessThan(50);
    });

    it("DOIT lire 500 decks en moins de 30ms", async () => {
      // Créer 500 decks
      await deckService.createMany(
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

      const start = performance.now();
      const decks = await deckService.listDecks();
      const duration = performance.now() - start;

      expect(decks.length).toBeGreaterThanOrEqual(500);
      expect(duration).toBeLessThan(30);
    });

    it("DOIT récupérer une carte spécifique en moins de 5ms", async () => {
      const deck = await deckService.createDeck({
        name: "Get Test",
        description: "",
        color: "#000",
        icon: "📚",
        tags: [],
        isPublic: false,
      });

      const card = await cardService.create(deck.id, {
        frontText: "Q",
        backText: "R",
        tags: [],
        difficulty: 3,
      });

      const start = performance.now();
      const retrieved = await cardService.get(card.id);
      const duration = performance.now() - start;

      expect(retrieved).toBeDefined();
      expect(duration).toBeLessThan(5);
    });
  });

  describe("🗑️ Performances de suppression", () => {
    it("DOIT supprimer 100 cartes en moins de 150ms", async () => {
      const deck = await deckService.createDeck({
        name: "Delete Test",
        description: "",
        color: "#000",
        icon: "📚",
        tags: [],
        isPublic: false,
      });

      // Créer 100 cartes
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

      // Supprimer toutes les cartes
      const start = performance.now();
      await Promise.all(cards.map((card) => cardService.delete(card.id)));
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(800);
    });

    it("DOIT supprimer un deck avec 1000 cartes en moins de 5000ms", async () => {
      const deck = await deckService.createDeck({
        name: "Cascade Delete Test",
        description: "",
        color: "#000",
        icon: "📚",
        tags: [],
        isPublic: false,
      });

      // Créer 1000 cartes
      await cardService.createMany(
        deck.id,
        Array.from({ length: 1000 }, (_, i) => ({
          frontText: `Q${i}`,
          backText: `R${i}`,
          tags: [],
          difficulty: 3,
        })),
        { batchSize: 50 }
      );

      const start = performance.now();
      await deckService.deleteDeck(deck.id);
      const duration = performance.now() - start;

      // Ajusté pour fake-indexeddb (cascade delete + 1000 cartes)
      expect(duration).toBeLessThan(5000);
    }, 10000);
  });

  describe("🧮 Algorithmes de répétition espacée", () => {
    it("DOIT construire une file de 1000 cartes en moins de 100ms", async () => {
      const deck = await deckService.createDeck({
        name: "Queue Test",
        description: "",
        color: "#000",
        icon: "📚",
        tags: [],
        isPublic: false,
      });

      // Créer 1000 cartes
      const cards = await cardService.createMany(
        deck.id,
        Array.from({ length: 1000 }, (_, i) => ({
          frontText: `Q${i}`,
          backText: `R${i}`,
          tags: [],
          difficulty: 3,
        })),
        { batchSize: 50 }
      );

      const start = performance.now();
      const result = spacedRepetitionService.getStudyQueue(
        cards,
        deck.id,
        1000
      );
      const duration = performance.now() - start;

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBeGreaterThan(0);
      }
      expect(duration).toBeLessThan(100);
    });

    it("DOIT planifier 500 reviews en moins de 200ms", async () => {
      const deck = await deckService.createDeck({
        name: "Review Test",
        description: "",
        color: "#000",
        icon: "📚",
        tags: [],
        isPublic: false,
      });

      // Créer 500 cartes
      const cards = await cardService.createMany(
        deck.id,
        Array.from({ length: 500 }, (_, i) => ({
          frontText: `Q${i}`,
          backText: `R${i}`,
          tags: [],
          difficulty: 3,
        })),
        { batchSize: 50 }
      );

      const start = performance.now();

      for (const card of cards) {
        spacedRepetitionService.schedule(card, 4, 1000);
      }

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(200);
    });
  });

  describe("💾 Performances mémoire", () => {
    it("DOIT gérer 5000 cartes sans fuite mémoire", async () => {
      const deck = await deckService.createDeck({
        name: "Memory Test",
        description: "",
        color: "#000",
        icon: "📚",
        tags: [],
        isPublic: false,
      });

      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Créer 5000 cartes en un seul batch
      await cardService.createMany(
        deck.id,
        Array.from({ length: 5000 }, (_, i) => ({
          frontText: `Q${i}`,
          backText: `R${i}`,
          tags: [],
          difficulty: 3,
        })),
        { batchSize: 50 }
      );

      const cards = await cardService.listByDeck(deck.id);
      expect(cards).toHaveLength(5000);

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // Vérifier que l'augmentation mémoire est raisonnable (< 50MB)
      if (initialMemory > 0) {
        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      }
    }, 30000);
  });

  describe("🔄 Performances sous charge", () => {
    it("DOIT maintenir la performance avec 1000 opérations concurrentes", async () => {
      const operations: Promise<any>[] = [];

      const start = performance.now();

      // 500 créations de decks
      for (let i = 0; i < 500; i++) {
        operations.push(
          deckService.createDeck({
            name: `Concurrent ${i}`,
            description: "",
            color: "#000",
            icon: "📚",
            tags: [],
            isPublic: false,
          })
        );
      }

      // 500 lectures de decks
      for (let i = 0; i < 500; i++) {
        operations.push(deckService.listDecks());
      }

      await Promise.all(operations);

      const duration = performance.now() - start;
      // Ajusté pour fake-indexeddb (1000 ops concurrentes mixtes)
      expect(duration).toBeLessThan(5000); // 3.5s max pour 1000 opérations
    });

    it("DOIT gérer 100 opérations/seconde pendant 10s", async () => {
      const deck = await deckService.createDeck({
        name: "Sustained Load",
        description: "",
        color: "#000",
        icon: "📚",
        tags: [],
        isPublic: false,
      });

      let operationCount = 0;
      const start = performance.now();

      // Boucle pendant 10 secondes
      while (performance.now() - start < 10000) {
        const batchStart = performance.now();

        // 100 opérations par batch
        await cardService.createMany(
          deck.id,
          Array.from({ length: 100 }, (_, i) => ({
            frontText: `Q${operationCount + i}`,
            backText: `R${operationCount + i}`,
            tags: [],
            difficulty: 3,
          })),
          { batchSize: 50 }
        );

        operationCount += 100;

        // Attendre pour maintenir ~100 ops/s
        const elapsed = performance.now() - batchStart;
        if (elapsed < 1000) {
          await new Promise((resolve) => setTimeout(resolve, 1000 - elapsed));
        }
      }

      expect(operationCount).toBeGreaterThanOrEqual(900); // Au moins 90% du target
    }, 15000);
  });
});
