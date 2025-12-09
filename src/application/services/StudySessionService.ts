import { SpacedRepetitionService } from "./SpacedRepetitionService";
import type { CardRepository } from "../../domain/repositories/CardRepository";
import type { StudySessionRepository } from "../../domain/repositories/StudySessionRepository";
import type { StudySession } from "../../domain/entities/StudySession";
import type { CardEntity } from "../../domain/entities/Card";
import { eventBus } from "@/core/events/EventBus";
import { WorkerPool } from "@/workers/WorkerPool";
import { adaptiveStudyScorer } from "./AdaptiveStudyScorer";
import { logger } from "@/utils/logger";
import { createServiceError } from "./base/ServiceError";
import { Validators } from "./base/validators";
import { AdaptiveOrchestratorService } from "./AdaptiveOrchestratorService";

/**
 * Service de gestion des sessions d'étude
 * Coordonne la construction des files d'étude et l'enregistrement des réponses
 */
export class StudySessionService {
  private srs: SpacedRepetitionService;
  private cardRepo: CardRepository;
  private sessionRepo: StudySessionRepository;

  constructor(
    srs: SpacedRepetitionService,
    cardRepo: CardRepository,
    sessionRepo: StudySessionRepository,
    private orchestrator?: AdaptiveOrchestratorService
  ) {
    this.srs = srs;
    this.cardRepo = cardRepo;
    this.sessionRepo = sessionRepo;
  }

  /**
   * Construit la file d'étude pour un deck donné
   * Utilise un pool de workers pour les gros decks (>2000 cartes) pour optimisation
   *
   * @param deckId - Identifiant du deck
   * @param dailyNewLimit - Nombre maximum de nouvelles cartes par jour
   * @returns File de cartes à étudier
   * @throws {ValidationError} Si les paramètres sont invalides
   * @throws {ServiceError} En cas d'échec de construction
   */
  async buildQueue(
    deckId: string,
    dailyNewLimit: number
  ): Promise<CardEntity[]> {
    // Validation hors try pour messages clairs
    Validators.validateId(deckId, "deck");
    Validators.validateNumber(dailyNewLimit, "dailyNewLimit", {
      min: 0,
      integer: true,
    });

    try {
      const start = performance.now();
      const all = await this.cardRepo.getAll();

      // Parallel path: utiliser worker pool pour gros decks (>2000 cartes)
      let q: CardEntity[];
      const LARGE_THRESHOLD = 2000;

      if (
        all.length >= LARGE_THRESHOLD &&
        typeof navigator !== "undefined" &&
        (navigator as any).hardwareConcurrency
      ) {
        try {
          const workerModule = await import(
            "@/workers/studyQueueWorker?worker"
          );
          const threads = Math.min(
            (navigator as any).hardwareConcurrency || 4,
            8
          );
          const chunkSize = Math.ceil(all.length / threads);
          const now = Date.now();
          const chunks = [] as Array<
            Array<
              Pick<
                CardEntity,
                "id" | "deckId" | "nextReview" | "totalReviews" | "created"
              >
            >
          >;

          for (let i = 0; i < all.length; i += chunkSize) {
            const slice = all.slice(i, i + chunkSize).map((c) => ({
              id: c.id,
              deckId: c.deckId,
              nextReview: c.nextReview,
              totalReviews: c.totalReviews,
              created: (c as any).created || now,
            }));
            chunks.push(slice);
          }

          const pool = new WorkerPool<
            {
              cards: any[];
              deckId: string;
              dailyNewLimit: number;
              now: number;
              buriedIds: string[];
            },
            { dueIds: string[]; freshIds: string[] }
          >(() => new workerModule.default(), threads);

          const buriedIds = (this.srs as any).getBuriedIds
            ? (this.srs as any).getBuriedIds()
            : [];
          const results = await Promise.all(
            chunks.map((chunk) =>
              pool.run({ cards: chunk, deckId, dailyNewLimit, now, buriedIds })
            )
          );
          await pool.terminate();

          const dueIdSet = new Set<string>();
          const freshIdList: string[] = [];
          for (const r of results) {
            r.dueIds.forEach((id) => dueIdSet.add(id));
            for (let i = 0; i < r.freshIds.length; i++)
              freshIdList.push(r.freshIds[i]);
          }

          // Limite globale pour nouvelles cartes
          const limitedFresh = freshIdList.slice(0, dailyNewLimit);
          const idWanted = new Set<string>([...dueIdSet, ...limitedFresh]);
          q = all.filter((c) => idWanted.has(c.id));
        } catch (error) {
          logger.error(
            "StudySessionService",
            "Fallback sur SRS après échec worker",
            { error }
          );
          const fallbackResult = this.srs.getStudyQueue(
            all,
            deckId,
            dailyNewLimit
          );
          q = fallbackResult.ok ? fallbackResult.value : [];
        }
      } else {
        // Support stub test (getStudyQueue(cards, deckId) renvoie directement tableau)
        const res: any = (this.srs as any).getStudyQueue(
          all,
          deckId,
          dailyNewLimit
        );
        if (Array.isArray(res)) {
          q = res.slice(0, dailyNewLimit > 0 ? dailyNewLimit : undefined);
        } else {
          q = res && res.ok ? res.value : [];
        }
      }

      const dur = performance.now() - start;

      // Throttling du log pour éviter spam (reconstructions fréquentes réactives)
      const now = Date.now();
      (StudySessionService as any)._lastQueueLog = (StudySessionService as any)
        ._lastQueueLog || { t: 0, size: 0 };
      const meta = (StudySessionService as any)._lastQueueLog;
      const sizeChanged = meta.size !== q.length;
      const timeElapsed = now - meta.t;
      const slow = dur > 8; // ms

      if (sizeChanged || slow || timeElapsed > 1000) {
        logger.debug("StudySessionService", "Queue construite", {
          deckId,
          size: q.length,
          durationMs: dur,
          sizeChanged,
          suppressedMs: timeElapsed,
        });
        meta.t = now;
        meta.size = q.length;
      }

      // Phase 5: post-tri adaptatif (ne modifie pas la sélection due/fresh, seulement l'ordre)
      try {
        if (this.orchestrator) {
          q = this.orchestrator.computeQueue(q, deckId);
        }
      } catch {
        /* ignore scoring errors */
      }

      return q;
    } catch (error) {
      // Re-throw ServiceErrors
      if ((error as any)?.code) throw error;

      logger.error("StudySessionService", "Échec buildQueue", {
        error,
        deckId,
      });
      throw createServiceError.operationFailed(
        "StudySession",
        "buildQueue",
        error
      );
    }
  }

  /**
   * Enregistre la réponse d'un utilisateur à une carte
   *
   * @param card - Carte étudiée
   * @param quality - Qualité de la réponse (0-5)
   * @param responseTimeMs - Temps de réponse en millisecondes
   * @returns Carte mise à jour avec nouveau planning
   * @throws {ServiceError} En cas d'échec d'enregistrement
   */
  async recordAnswer(
    card: CardEntity,
    quality: number,
    responseTimeMs: number
  ): Promise<CardEntity> {
    try {
      const ret: any = this.srs.schedule(card, quality, responseTimeMs);
      if (ret && ret.ok === false) {
        throw createServiceError.operationFailed("SRS", "schedule", ret.error);
      }

      await this.cardRepo.update(card);

      // Feedback Phase 8: enregistrement pour orchestrateur adaptatif
      try {
        if (this.orchestrator) {
          const base = adaptiveStudyScorer.scoreCards([card], {
            now: Date.now(),
            targetDeck: card.deckId,
          })[0];
          this.orchestrator.recordFeedback(
            base?.score || 0,
            quality >= 3 ? 1 : 0,
            responseTimeMs
          );
        }
      } catch {
        /* ignore orchestrator errors */
      }

      // Publier événement carte revue pour invalidations caches / UI
      try {
        eventBus.publish({
          type: "card.reviewed",
          payload: {
            cardId: card.id,
            deckId: card.deckId,
            quality,
            nextReview: card.nextReview,
          },
        });
      } catch {
        /* ignore event bus errors */
      }

      return card;
    } catch (error) {
      // Re-throw ServiceErrors
      if ((error as any)?.code) throw error;

      logger.error("StudySessionService", "Échec recordAnswer", {
        error,
        cardId: card.id,
        quality,
      });
      throw createServiceError.operationFailed(
        "StudySession",
        "recordAnswer",
        error
      );
    }
  }

  /**
   * Persiste une session d'étude
   *
   * @param session - Session à persister
   * @throws {ServiceError} En cas d'échec de persistence
   */
  async persistSession(session: StudySession): Promise<void> {
    try {
      await this.sessionRepo.create(session);
      logger.debug("StudySessionService", "Session persistée", {
        sessionId: session.id,
      });
    } catch (error) {
      if ((error as any)?.code) throw error;

      logger.error("StudySessionService", "Échec persistSession", {
        error,
        sessionId: session.id,
      });
      throw createServiceError.operationFailed(
        "StudySession",
        "persist",
        error
      );
    }
  }

  /**
   * Termine une session d'étude et calcule les statistiques finales
   *
   * @param session - Session à terminer
   * @returns Session complétée avec statistiques
   * @throws {ServiceError} En cas d'échec de fin de session
   */
  async endSession(session: StudySession): Promise<StudySession> {
    try {
      const endTime = Date.now();
      const totalTimeSpent = endTime - session.startTime;
      const completed: StudySession = {
        id: session.id,
        deckId: session.deckId,
        startTime: session.startTime,
        endTime,
        cardsStudied: session.cardsStudied,
        correctAnswers: session.correctAnswers,
        totalTimeSpent,
        averageResponseTime: session.cardsStudied
          ? totalTimeSpent / session.cardsStudied
          : 0,
        studyMode: session.studyMode,
        performance: {
          ...session.performance,
          accuracy: session.cardsStudied
            ? session.correctAnswers / session.cardsStudied
            : 0,
        },
      };

      await this.sessionRepo.create(completed);

      logger.debug("StudySessionService", "Session terminée", {
        sessionId: completed.id,
        cardsStudied: completed.cardsStudied,
        accuracy: completed.performance.accuracy,
      });

      // Publier événement de progrès de session
      try {
        eventBus.publish({
          type: "session.progress",
          payload: {
            sessionId: completed.id,
            studied: completed.cardsStudied,
            correct: completed.correctAnswers,
          },
        });
      } catch {
        /* ignore event bus errors */
      }

      return completed;
    } catch (error) {
      if ((error as any)?.code) throw error;

      logger.error("StudySessionService", "Échec endSession", {
        error,
        sessionId: session.id,
      });
      throw createServiceError.operationFailed("StudySession", "end", error);
    }
  }

  /**
   * Récupère les sessions récentes
   *
   * @param limit - Nombre maximum de sessions à récupérer (défaut: 50)
   * @returns Liste des sessions récentes
   * @throws {ServiceError} En cas d'échec de récupération
   */
  async getRecentSessions(limit = 50): Promise<StudySession[]> {
    try {
      const sessions = await this.sessionRepo.getRecent(limit);

      logger.debug("StudySessionService", "Sessions récentes récupérées", {
        count: sessions.length,
      });

      return sessions;
    } catch (error) {
      if ((error as any)?.code) throw error;

      logger.error("StudySessionService", "Échec getRecentSessions", {
        error,
        limit,
      });
      throw createServiceError.operationFailed(
        "StudySession",
        "getRecent",
        error
      );
    }
  }

  /**
   * Récupère toutes les sessions d'un deck spécifique
   *
   * @param deckId - Identifiant du deck
   * @returns Liste des sessions du deck
   * @throws {ValidationError} Si le deckId est invalide
   * @throws {ServiceError} En cas d'échec de récupération
   */
  async getSessionsByDeck(deckId: string): Promise<StudySession[]> {
    Validators.validateId(deckId, "deck");

    try {
      const sessions = await this.sessionRepo.getByDeck(deckId);

      logger.debug("StudySessionService", "Sessions récupérées par deck", {
        deckId,
        count: sessions.length,
      });

      return sessions;
    } catch (error) {
      if ((error as any)?.code) throw error;

      logger.error("StudySessionService", "Échec getSessionsByDeck", {
        error,
        deckId,
      });
      throw createServiceError.operationFailed(
        "StudySession",
        "getByDeck",
        error
      );
    }
  }
}

export const STUDY_SESSION_SERVICE_TOKEN = "StudySessionService";
