import { SpacedRepetitionService } from './SpacedRepetitionService'
import type { CardRepository } from '../../domain/repositories/CardRepository'
import type { StudySessionRepository } from '../../domain/repositories/StudySessionRepository'
import type { StudySession } from '../../domain/entities/StudySession'
import type { CardEntity } from '../../domain/entities/Card'
import { ValidationError, ServiceError } from '@/utils/errors'
import { logger } from '@/utils/logger'
import { eventBus } from '@/core/events/EventBus'
import { WorkerPool } from '@/workers/WorkerPool'
export class StudySessionService {
  private srs: SpacedRepetitionService
  private cardRepo: CardRepository
  private sessionRepo: StudySessionRepository
  constructor(srs: SpacedRepetitionService, cardRepo: CardRepository, sessionRepo: StudySessionRepository) {
    this.srs = srs
    this.cardRepo = cardRepo
    this.sessionRepo = sessionRepo
  }
  async buildQueue(deckId: string, dailyNewLimit: number): Promise<CardEntity[]> { 
    if(!deckId) throw new ValidationError('deckId requis','SESSION_QUEUE_NO_DECK')
    if(dailyNewLimit < 0) throw new ValidationError('dailyNewLimit négatif','SESSION_QUEUE_LIMIT')
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
          q = (all as CardEntity[]).filter(c => idWanted.has(c.id))
        } catch (err) {
          // Fallback gracefully
          q = this.srs.getStudyQueue(all as CardEntity[], deckId, dailyNewLimit)
        }
      } else {
        q = this.srs.getStudyQueue(all as CardEntity[], deckId, dailyNewLimit)
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
      return q
    } catch(e){
      logger.error('StudySession','Echec buildQueue',{error:e, deckId})
      throw new ServiceError('Erreur build queue','SESSION_QUEUE_FAILED',{ cause: e, deckId })
    }
  }
  async recordAnswer(card: CardEntity, quality: number, responseTimeMs: number): Promise<CardEntity> { 
    this.srs.schedule(card, quality, responseTimeMs); 
    await this.cardRepo.update(card); 
    // Publier événement carte revue pour invalidations caches / UI
    try { eventBus.publish({ type: 'card.reviewed', payload: { cardId: card.id, deckId: card.deckId, quality, nextReview: card.nextReview } }) } catch { /* ignore */ }
    return card 
  }
  async persistSession(session: StudySession): Promise<void> { await this.sessionRepo.create(session) }
  async endSession(session: StudySession): Promise<StudySession> {
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
  }
  async getRecentSessions(limit = 50){ return this.sessionRepo.getRecent(limit) }
  async getSessionsByDeck(deckId: string){ return this.sessionRepo.getByDeck(deckId) }
}
export const STUDY_SESSION_SERVICE_TOKEN = 'StudySessionService'
