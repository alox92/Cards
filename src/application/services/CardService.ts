import type { CardRepository } from "../../domain/repositories/CardRepository";
import { CardEntity, type CardCreationData } from "../../domain/entities/Card";
import { logger } from "@/utils/logger";
import { processBatch } from "@/utils/batchProcessor";
import { createServiceError } from "./base/ServiceError";
import { Validators } from "./base/validators";

/**
 * Service de gestion des cartes (flashcards)
 * Coordonne les opérations CRUD sur les entités Card via le repository
 */
export class CardService {
  private repo: CardRepository;

  constructor(repo: CardRepository) {
    this.repo = repo;
  }

  /**
   * Crée une nouvelle carte pour un deck
   *
   * @param deckId - Identifiant du deck parent
   * @param data - Données de création de la carte
   * @returns La carte créée
   * @throws {ValidationError} Si les données sont invalides
   * @throws {ServiceError} En cas d'échec de création
   *
   * @example
   * ```typescript
   * const card = await cardService.create('deck-123', {
   *   frontText: 'Question',
   *   backText: 'Réponse',
   *   difficulty: 3
   * })
   * ```
   */
  async create(deckId: string, data: CardCreationData): Promise<CardEntity> {
    // Validation avant try-catch pour messages clairs
    Validators.validateId(deckId, "deck");
    Validators.validateRequiredString(data.frontText, "frontText", {
      minLength: 1,
      trim: true,
    });
    Validators.validateRequiredString(data.backText, "backText", {
      minLength: 1,
      trim: true,
    });

    if (data.difficulty !== undefined) {
      Validators.validateNumber(data.difficulty, "difficulty", {
        min: 1,
        max: 5,
        integer: true,
      });
    }

    try {
      const entity = new CardEntity({ ...data, deckId });
      const created = await this.repo.create(entity);

      logger.debug("CardService", "Carte créée avec succès", {
        cardId: created.id,
        deckId,
      });

      return created;
    } catch (error) {
      // Re-throw ServiceErrors sans modification
      if ((error as any)?.code) throw error;

      logger.error("CardService", "Échec création carte", {
        error,
        deckId,
        dataKeys: Object.keys(data),
      });
      throw createServiceError.operationFailed("Card", "create", error);
    }
  }

  /**
   * Met à jour une carte existante
   *
   * @param card - Entité carte avec modifications
   * @throws {ValidationError} Si l'ID est invalide
   * @throws {NotFoundError} Si la carte n'existe pas
   * @throws {ServiceError} En cas d'échec de mise à jour
   */
  async update(card: CardEntity): Promise<void> {
    Validators.validateId(card.id, "card");

    try {
      // Vérification d'existence avant mise à jour
      const existing = await this.repo.getById(card.id);
      if (!existing) {
        throw createServiceError.notFound("Card", card.id);
      }

      await this.repo.update(card);

      logger.debug("CardService", "Carte mise à jour", { cardId: card.id });
    } catch (error) {
      if ((error as any)?.code) throw error;

      logger.error("CardService", "Échec mise à jour carte", {
        error,
        cardId: card.id,
      });
      throw createServiceError.operationFailed("Card", "update", error);
    }
  }

  /**
   * Supprime une carte
   *
   * @param id - Identifiant de la carte à supprimer
   * @throws {ValidationError} Si l'ID est invalide
   * @throws {ServiceError} En cas d'échec de suppression
   */
  async delete(id: string): Promise<void> {
    Validators.validateId(id, "card");

    try {
      await this.repo.delete(id);
      logger.debug("CardService", "Carte supprimée", { cardId: id });
    } catch (error) {
      if ((error as any)?.code) throw error;

      logger.error("CardService", "Échec suppression carte", {
        error,
        cardId: id,
      });
      throw createServiceError.operationFailed("Card", "delete", error);
    }
  }

  /**
   * Récupère une carte par son ID
   *
   * @param id - Identifiant de la carte
   * @returns La carte ou null si non trouvée
   * @throws {ValidationError} Si l'ID est invalide
   * @throws {ServiceError} En cas d'erreur de récupération
   */
  async get(id: string): Promise<CardEntity | null> {
    Validators.validateId(id, "card");

    try {
      const card = await this.repo.getById(id);
      return card || null;
    } catch (error) {
      if ((error as any)?.code) throw error;

      logger.error("CardService", "Échec récupération carte", {
        error,
        cardId: id,
      });
      throw createServiceError.operationFailed("Card", "get", error);
    }
  }

  /**
   * Liste toutes les cartes d'un deck
   *
   * @param deckId - Identifiant du deck
   * @returns Liste des cartes du deck
   * @throws {ValidationError} Si le deckId est invalide
   * @throws {ServiceError} En cas d'erreur de récupération
   */
  async listByDeck(deckId: string): Promise<CardEntity[]> {
    Validators.validateId(deckId, "deck");

    try {
      const cards = await this.repo.getByDeck(deckId);

      logger.debug("CardService", "Cartes récupérées par deck", {
        deckId,
        count: cards.length,
      });

      return cards;
    } catch (error) {
      if ((error as any)?.code) throw error;

      logger.error("CardService", "Échec listByDeck", { error, deckId });
      throw createServiceError.operationFailed("Card", "listByDeck", error);
    }
  }

  /**
   * Liste toutes les cartes de tous les decks
   *
   * @returns Liste complète des cartes
   * @throws {ServiceError} En cas d'erreur de récupération
   */
  async listAll(): Promise<CardEntity[]> {
    try {
      const cards = await this.repo.getAll();

      logger.debug("CardService", "Toutes cartes récupérées", {
        count: cards.length,
      });

      return cards;
    } catch (error) {
      if ((error as any)?.code) throw error;

      logger.error("CardService", "Échec listAll", { error });
      throw createServiceError.operationFailed("Card", "listAll", error);
    }
  }

  /**
   * Compte le nombre total de cartes
   * Utilise une méthode optimisée si disponible, sinon compte via listAll
   *
   * @returns Nombre total de cartes
   * @throws {ServiceError} En cas d'erreur
   */
  async countAll(): Promise<number> {
    try {
      // Tentative d'utilisation d'une méthode optimisée si disponible
      const anyRepo: any = this.repo as any;
      if (typeof anyRepo.count === "function") {
        try {
          const count = await anyRepo.count();
          return count;
        } catch {
          // Fallback vers méthode standard
        }
      }

      // Fallback: charger et compter (moins performant pour grands volumes)
      const all = await this.repo.getAll();
      return all.length;
    } catch (error) {
      if ((error as any)?.code) throw error;

      logger.error("CardService", "Échec countAll", { error });
      throw createServiceError.operationFailed("Card", "countAll", error);
    }
  }

  /**
   * Crée plusieurs cartes en batch pour éviter surcharge IndexedDB
   * Résout le problème de limite de transactions simultanées (~50)
   *
   * @param deckId - ID du deck parent
   * @param cardsData - Tableau de données de cartes à créer
   * @param options - Options de batch (batchSize, onProgress)
   * @returns Tableau de cartes créées
   * @throws {ValidationError} Si le deckId est invalide ou les données vides
   * @throws {ServiceError} En cas d'échec de création batch
   *
   * @example
   * ```typescript
   * const cards = await cardService.createMany('deck-123', [
   *   { frontText: 'Q1', backText: 'R1' },
   *   { frontText: 'Q2', backText: 'R2' }
   * ], {
   *   batchSize: 50,
   *   onProgress: (done, total) => console.log(`${done}/${total}`)
   * })
   * ```
   */
  async createMany(
    deckId: string,
    cardsData: CardCreationData[],
    options?: {
      batchSize?: number;
      onProgress?: (done: number, total: number) => void;
    }
  ): Promise<CardEntity[]> {
    Validators.validateId(deckId, "deck");

    if (!cardsData || cardsData.length === 0) {
      logger.debug(
        "CardService",
        "createMany: tableau vide, aucune carte à créer"
      );
      return [];
    }

    logger.info("CardService", `Création batch de ${cardsData.length} cartes`, {
      deckId,
      batchSize: options?.batchSize || 50,
    });

    try {
      return await processBatch(
        cardsData,
        async (data) => this.create(deckId, data),
        {
          batchSize: options?.batchSize || 50,
          onProgress: options?.onProgress,
          onError: (error, data) => {
            logger.error("CardService", "Échec création carte dans batch", {
              error,
              data,
            });
          },
          continueOnError: false, // Arrêter si erreur critique
        }
      );
    } catch (error) {
      if ((error as any)?.code) throw error;

      logger.error("CardService", "Échec createMany", {
        error,
        deckId,
        count: cardsData.length,
      });
      throw createServiceError.operationFailed("Card", "createMany", error);
    }
  }
}

export const CARD_SERVICE_TOKEN = "CardService";
