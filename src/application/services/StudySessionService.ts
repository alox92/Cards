import { SpacedRepetitionService } from './SpacedRepetitionService'
import type { CardRepository } from '../../domain/repositories/CardRepository'
import type { StudySessionRepository } from '../../domain/repositories/StudySessionRepository'
import type { StudySession } from '../../domain/entities/StudySession'
import type { CardEntity } from '../../domain/entities/Card'
import { eventBus } from '@/core/events/EventBus'
import { WorkerPool } from '@/workers/WorkerPool'
import { adaptiveStudyScorer } from './AdaptiveStudyScorer'
import { logger } from '@/utils/logger'

function svcError(code: string, message: string){ const e:any = new Error(message); e.code = code; return e }
// logger.warn peut être absent dans certains tests (mock partiel) => safe wrapper
const safeWarn = (cat: string, msg: string) => {
  try {
    const anyLogger = logger as any
    if (typeof anyLogger.warn === 'function') {
      anyLogger.warn(cat, msg)
    } else if (typeof anyLogger.debug === 'function') {
      anyLogger.debug(cat, msg)
    }
  } catch {
    /* ignore logging errors */
  }
}
import { AdaptiveOrchestratorService } from './AdaptiveOrchestratorService'
export class StudySessionService {
  private srs: SpacedRepetitionService
  private cardRepo: CardRepository
  private sessionRepo: StudySessionRepository
  constructor(srs: SpacedRepetitionService, cardRepo: CardRepository, sessionRepo: StudySessionRepository, private orchestrator?: AdaptiveOrchestratorService) {
    this.srs = srs
    this.cardRepo = cardRepo
    this.sessionRepo = sessionRepo
  }
  async buildQueue(deckId: string, dailyNewLimit: number): Promise<CardEntity[]> {
    // Validation hors try pour laisser passer les erreurs de validation sans re-wrapping
  if(!deckId) { safeWarn('StudySessionService', 'buildQueue: deckId requis'); throw svcError('SESSION_QUEUE_NO_DECK','deckId requis') }
  if(dailyNewLimit < 0) { safeWarn('StudySessionService', 'buildQueue: dailyNewLimit négatif'); throw svcError('SESSION_QUEUE_LIMIT','dailyNewLimit négatif') }
    try {

      const start = performance.now()
      const all = await this.cardRepo.getAll();
      // Parallel path: use worker pool for large decks to leverage all cores
      let q: CardEntity[]
      const LARGE_THRESHOLD = 2000
      if (all.length >= LARGE_THRESHOLD && typeof navigator !== 'undefined' && (navigator as any).hardwareConcurrency) {
        try {
          const workerModule = await import('@/workers/studyQueueWorker?worker')
          const threads = Math.min((navigator as any).hardwareConcurrency || 4, 8)
          const chunkSize = Math.ceil(all.length / threads)
          const now = Date.now()
          const chunks = [] as Array<Array<Pick<CardEntity,'id'|'deckId'|'nextReview'|'totalReviews'|'created'>>> 
          for (let i = 0; i < all.length; i += chunkSize) {
            const slice = all.slice(i, i + chunkSize).map(c => ({ id: c.id, deckId: c.deckId, nextReview: c.nextReview, totalReviews: c.totalReviews, created: (c as any).created || now }))
            chunks.push(slice)
          }
          const pool = new WorkerPool<{ cards: any[]; deckId: string; dailyNewLimit: number; now: number; buriedIds: string[] }, { dueIds: string[]; freshIds: string[] }>(() => new workerModule.default(), threads)
          const buriedIds = (this.srs as any).getBuriedIds ? (this.srs as any).getBuriedIds() : []
          const results = await Promise.all(
            chunks.map(chunk => pool.run({ cards: chunk, deckId, dailyNewLimit, now, buriedIds }))
          )
          await pool.terminate()
          const dueIdSet = new Set<string>()
          const freshIdList: string[] = []
          for (const r of results) {
            r.dueIds.forEach(id => dueIdSet.add(id))
            // collect fresh for later slicing across all chunks
            for (let i = 0; i < r.freshIds.length; i++) freshIdList.push(r.freshIds[i])
          }
          // global fresh limit
          const limitedFresh = freshIdList.slice(0, dailyNewLimit)
          const idWanted = new Set<string>([...dueIdSet, ...limitedFresh])
          q = all.filter(c => idWanted.has(c.id))
        } catch (error) {
          logger.error('StudySessionService', 'buildQueue: fallback sur SRS après échec worker', error)
          const fallbackResult = this.srs.getStudyQueue(all, deckId, dailyNewLimit)
          q = fallbackResult.ok ? fallbackResult.value : []
        }
      } else {
        // Supporter stub test (getStudyQueue(cards, deckId) renvoie directement tableau)
  const res: any = (this.srs as any).getStudyQueue(all, deckId, dailyNewLimit)
        if(Array.isArray(res)) q = res.slice(0, dailyNewLimit > 0 ? dailyNewLimit : undefined)
        else q = res && res.ok ? res.value : []
      }
      const dur = performance.now() - start
      // Throttling du log pour éviter le spam massif (reconstructions fréquentes réactives)
      const now = Date.now()
      ;(StudySessionService as any)._lastQueueLog = (StudySessionService as any)._lastQueueLog || { t: 0, size: 0 }
      const meta = (StudySessionService as any)._lastQueueLog
      const sizeChanged = meta.size !== q.length
      const timeElapsed = now - meta.t
      const slow = dur > 8 // ms
      if(sizeChanged || slow || timeElapsed > 1000){
        logger.debug('StudySession','Queue construite',{ deckId, size: q.length, durationMs: dur, sizeChanged, suppressedMs: timeElapsed - (timeElapsed>0?timeElapsed:0) })
        meta.t = now
        meta.size = q.length
      }
      // Phase 5: post-tri adaptatif (ne modifie pas la sélection due/fresh, seulement l'ordre)
      try { if(this.orchestrator){ q = this.orchestrator.computeQueue(q, deckId) } } catch {/* ignore scoring errors */}
    return q
    } catch(e){
      logger.error('StudySession','Échec buildQueue', e)
    throw svcError('SESSION_QUEUE_FAILED','Erreur build queue')
    }
  }
  async recordAnswer(card: CardEntity, quality: number, responseTimeMs: number): Promise<CardEntity> {
    try {
      const ret: any = this.srs.schedule(card, quality, responseTimeMs)
      if(ret && ret.ok === false){ throw svcError(ret.error?.code || 'SRS_SCHEDULE_FAILED','schedule failed') }
      await this.cardRepo.update(card); 
      // Feedback Phase 8
      try { if(this.orchestrator){ const base = adaptiveStudyScorer.scoreCards([card], { now: Date.now(), targetDeck: card.deckId })[0]; this.orchestrator.recordFeedback(base?.score || 0, quality >=3 ? 1:0, responseTimeMs) } } catch{}
      // Publier événement carte revue pour invalidations caches / UI
      try { eventBus.publish({ type: 'card.reviewed', payload: { cardId: card.id, deckId: card.deckId, quality, nextReview: card.nextReview } }) } catch { /* ignore */ }
    return card
    } catch (e) {
      logger.error('StudySessionService', 'recordAnswer: Erreur enregistrement réponse', e)
    throw svcError('RECORD_ANSWER_FAILED','recordAnswer failed')
    }
  }
  async persistSession(session: StudySession): Promise<void> {
    try {
      await this.sessionRepo.create(session)
    } catch (e) {
      logger.error('StudySessionService', 'persistSession: Erreur sauvegarde session', e)
    throw new Error('PERSIST_SESSION_FAILED')
    }
  }
  async endSession(session: StudySession): Promise<StudySession> {
    try {
      const endTime = Date.now()
      const totalTimeSpent = endTime - session.startTime
      const completed: StudySession = {
        id: session.id,
        deckId: session.deckId,
        startTime: session.startTime,
        endTime,
        cardsStudied: session.cardsStudied,
        correctAnswers: session.correctAnswers,
        totalTimeSpent,
        averageResponseTime: session.cardsStudied ? totalTimeSpent / session.cardsStudied : 0,
        studyMode: session.studyMode,
        performance: {
          ...session.performance,
          accuracy: session.cardsStudied ? session.correctAnswers / session.cardsStudied : 0
        }
      }
      await this.sessionRepo.create(completed)
      try { eventBus.publish({ type: 'session.progress', payload: { sessionId: completed.id, studied: completed.cardsStudied, correct: completed.correctAnswers } }) } catch { /* ignore */ }
    return completed
    } catch (e) {
      logger.error('StudySessionService', 'endSession: Erreur fin de session', e)
    throw new Error('END_SESSION_FAILED')
    }
  }
  async getRecentSessions(limit = 50): Promise<StudySession[]> {
    try {
      const sessions = await this.sessionRepo.getRecent(limit)
    return sessions
    } catch (e) {
      logger.error('StudySessionService', 'getRecentSessions: Erreur récupération sessions récentes', e)
    throw new Error('GET_RECENT_SESSIONS_FAILED')
    }
  }
  async getSessionsByDeck(deckId: string): Promise<StudySession[]> {
    try {
      const sessions = await this.sessionRepo.getByDeck(deckId)
    return sessions
    } catch (e) {
      logger.error('StudySessionService', 'getSessionsByDeck: Erreur récupération sessions par deck', e)
    throw new Error('GET_DECK_SESSIONS_FAILED')
    }
  }
}
export const STUDY_SESSION_SERVICE_TOKEN = 'StudySessionService'
