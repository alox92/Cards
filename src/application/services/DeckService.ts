import type { DeckRepository } from "../../domain/repositories/DeckRepository";
import type { CardRepository } from "../../domain/repositories/CardRepository";
import { DeckEntity, type DeckCreationData } from "../../domain/entities/Deck";
import type { CardEntity } from "../../domain/entities/Card";
import { logger } from "@/utils/logger";
import { processBatch } from "@/utils/batchProcessor";
import { createServiceError, safeLog } from "./base/ServiceError";
import { Validators } from "./base/validators";

/**
 * Service de gestion des decks
 *
 * Gère toutes les opérations CRUD sur les decks avec validation,
 * logging et gestion d'erreur standardisée.
 */
export class DeckService {
  private deckRepo: DeckRepository;
  private cardRepo: CardRepository;

  constructor(deckRepo: DeckRepository, cardRepo: CardRepository) {
    this.deckRepo = deckRepo;
    this.cardRepo = cardRepo;
  }

  /**
   * Récupère tous les decks
   *
   * @returns Liste de tous les decks
   * @throws ServiceError si la récupération échoue
   */
  async listDecks(): Promise<DeckEntity[]> {
    try {
      return await this.deckRepo.getAll();
    } catch (error) {
      logger.error("DeckService", "Erreur récupération decks", error);
      throw createServiceError.operationFailed("récupération", "decks", error);
    }
  }

  /**
   * Récupère tous les decks avec leurs statistiques calculées
   *
   * @returns Liste de decks avec statistiques à jour
   * @throws ServiceError si la récupération échoue
   */
  async listDecksWithStats(): Promise<DeckEntity[]> {
    try {
      const decks = await this.deckRepo.getAll();

      // Calculer les stats uniquement pour les decks qui n'ont pas de stats
      for (const deck of decks) {
        if (deck.totalCards === 0 || deck.updated === 0) {
          const cards = await this.cardRepo.getByDeck(deck.id);
          deck.updateStats(cards as any);
        }
      }

      return decks;
    } catch (error) {
      logger.error(
        "DeckService",
        "Erreur récupération decks avec stats",
        error
      );
      throw createServiceError.operationFailed(
        "récupération stats",
        "decks",
        error
      );
    }
  }

  /**
   * Récupère un deck par son ID
   *
   * @param id - ID du deck à récupérer
   * @returns Le deck correspondant
   * @throws ValidationError si l'ID est invalide
   * @throws NotFoundError si le deck n'existe pas
   * @throws ServiceError si la récupération échoue
   */
  async getDeck(id: string): Promise<DeckEntity> {
    // Validation de l'ID
    Validators.validateId(id, "deck");

    try {
      const deck = await this.deckRepo.getById(id);

      if (!deck) {
        safeLog(logger, "warn", "DeckService", "Deck introuvable", { id });
        throw createServiceError.notFound("Deck", id);
      }

      return deck;
    } catch (error) {
      // Re-throw les erreurs de service (validation, not found)
      if ((error as any)?.code) {
        throw error;
      }

      logger.error("DeckService", "Erreur récupération deck", error);
      throw createServiceError.operationFailed("récupération", "deck", error);
    }
  }

  /**
   * Crée un nouveau deck
   *
   * @param data - Données du deck à créer
   * @returns Le deck créé
   * @throws ValidationError si les données sont invalides
   * @throws ServiceError si la création échoue
   *
   * @example
   * ```ts
   * const deck = await deckService.createDeck({
   *   name: "Mon Deck",
   *   description: "Description optionnelle"
   * });
   * ```
   */
  async createDeck(data: DeckCreationData): Promise<DeckEntity> {
    // Validation des données
    Validators.validateRequiredString(data.name, "nom du deck", {
      minLength: 1,
      trim: true,
    });

    try {
      const deck = new DeckEntity(data);
      return await this.deckRepo.create(deck);
    } catch (error) {
      logger.error("DeckService", "Échec création deck", error);
      throw createServiceError.operationFailed("création", "deck", error);
    }
  }

  /**
   * Met à jour un deck existant
   *
   * @param deck - Deck avec les modifications à sauvegarder
   * @throws ValidationError si l'ID est manquant
   * @throws ServiceError si la mise à jour échoue
   */
  async updateDeck(deck: DeckEntity): Promise<void> {
    // Validation de l'ID du deck
    Validators.validateId(deck.id, "deck");

    try {
      await this.deckRepo.update(deck);
    } catch (error) {
      logger.error("DeckService", "Échec mise à jour deck", {
        id: deck.id,
        error,
      });
      throw createServiceError.operationFailed("mise à jour", "deck", error);
    }
  }

  /**
   * Supprime un deck et toutes ses cartes
   *
   * ⚠️ Attention: Cette opération est irréversible et supprime également
   * toutes les cartes associées au deck.
   *
   * @param id - ID du deck à supprimer
   * @throws ValidationError si l'ID est invalide
   * @throws NotFoundError si le deck n'existe pas
   * @throws ServiceError si la suppression échoue
   */
  async deleteDeck(id: string): Promise<void> {
    // Validation de l'ID
    Validators.validateId(id, "deck");

    // Vérifier que le deck existe avant suppression
    const existing = await this.deckRepo.getById(id);
    if (!existing) {
      throw createServiceError.notFound("Deck", id);
    }

    try {
      // Suppression du deck et de toutes ses cartes
      await this.deckRepo.delete(id);
      await this.cardRepo.deleteByDeck(id);
    } catch (error) {
      logger.error("DeckService", "Échec suppression deck", { id, error });
      throw createServiceError.operationFailed("suppression", "deck", error);
    }
  }

  /**
   * Récupère toutes les cartes d'un deck
   *
   * @param deckId - ID du deck
   * @returns Liste des cartes du deck
   * @throws ValidationError si l'ID est invalide
   * @throws ServiceError si la récupération échoue
   */
  async getDeckCards(deckId: string): Promise<CardEntity[]> {
    // Validation de l'ID
    Validators.validateId(deckId, "deck");

    try {
      return await this.cardRepo.getByDeck(deckId);
    } catch (error) {
      logger.error("DeckService", "Erreur récupération cartes deck", {
        deckId,
        error,
      });
      throw createServiceError.operationFailed(
        "récupération cartes",
        "deck",
        error
      );
    }
  }

  /**
   * Crée plusieurs decks en batch pour éviter surcharge IndexedDB
   *
   * Utilise un traitement par lots pour optimiser les performances
   * lors de la création de nombreux decks.
   *
   * @param decksData - Tableau de données de decks à créer
   * @param options - Options de batch (batchSize, onProgress)
   * @returns Tableau de decks créés
   * @throws ValidationError si les données sont invalides
   * @throws ServiceError si la création batch échoue
   *
   * @example
   * ```ts
   * const decks = await deckService.createMany(
   *   [{ name: "Deck 1" }, { name: "Deck 2" }],
   *   {
   *     batchSize: 50,
   *     onProgress: (done, total) => console.log(`${done}/${total}`)
   *   }
   * );
   * ```
   */
  async createMany(
    decksData: DeckCreationData[],
    options?: {
      batchSize?: number;
      onProgress?: (done: number, total: number) => void;
    }
  ): Promise<DeckEntity[]> {
    if (!decksData || decksData.length === 0) {
      return [];
    }

    logger.info("DeckService", `Création batch de ${decksData.length} decks`);

    try {
      return await processBatch(
        decksData,
        async (data) => this.createDeck(data),
        {
          batchSize: options?.batchSize || 50,
          onProgress: options?.onProgress,
          onError: (error, data) => {
            logger.error("DeckService", "Échec création deck dans batch", {
              error,
              data,
            });
          },
          continueOnError: false,
        }
      );
    } catch (error) {
      logger.error("DeckService", "Échec création batch decks", error);
      throw createServiceError.operationFailed(
        "création batch",
        "decks",
        error
      );
    }
  }
}

export const DECK_SERVICE_TOKEN = "DeckService";
