/**
 * Service de Répétition Espacée (SM-2 et variantes futures)
 */
import { CardEntity } from '../../domain/entities/Card'
import { logger } from '@/utils/logger'
import { Result, ok, err } from '@/utils/result'

export interface ScheduleResult { card: CardEntity; nextReview: number; interval: number; easinessFactor: number }

export class SpacedRepetitionService {
  private leechThreshold = 8
  private leechTag = 'leech'
  private buriedToday = new Set<string>()
  schedule(card: CardEntity, quality: number, responseTimeMs: number): Result<ScheduleResult, {code: string; message: string}> {
    try {
      if(quality < 0 || quality > 5) {
        logger.warn('SpacedRepetitionService', 'Quality hors intervalle 0-5', {quality})
        return err({code: 'SRS_QUALITY_RANGE', message: 'Quality hors intervalle 0-5'})
      }
      card.recordResponse(quality, responseTimeMs)
      // Leech detection
      if(card.totalReviews >= this.leechThreshold && card.correctReviews / card.totalReviews < 0.5){
        if(!card.tags.includes(this.leechTag)) card.tags.push(this.leechTag)
        // Option: suspend by pushing nextReview far
        card.nextReview = Date.now() + 7*24*60*60*1000
      }
      const result = { card, nextReview: card.nextReview, interval: card.interval, easinessFactor: card.easinessFactor }
      return ok(result)
    } catch (e) {
      logger.error('SpacedRepetitionService', 'schedule: Erreur planification', e)
      return err({code: 'SRS_SCHEDULE_FAILED', message: 'Erreur planification'})
    }
  }
  getStudyQueue(allCards: CardEntity[], deckId: string, dailyNewLimit: number, maxTotal: number = 20): Result<CardEntity[], {code: string; message: string}> {
    try {
      const now = Date.now()
      const due = allCards.filter(c => c.deckId === deckId && c.nextReview <= now && !this.buriedToday.has(c.id))
      const fresh = allCards.filter(c => c.deckId === deckId && c.totalReviews === 0 && !this.buriedToday.has(c.id))
      
      // Construire la queue en respectant les deux limites
      let queue: CardEntity[] = []
      
      // D'abord ajouter les cartes dues (jusqu'à maxTotal)
      queue = due.slice(0, maxTotal)
      
      // Puis ajouter nouvelles cartes si on a de la place
      const remainingSlots = maxTotal - queue.length
      if (remainingSlots > 0) {
        const newCardsToAdd = Math.min(remainingSlots, dailyNewLimit)
        queue.push(...fresh.slice(0, newCardsToAdd))
      }
      
      logger.info('SpacedRepetitionService', 'Queue construite', {
        due: due.length,
        fresh: fresh.length,
        queueSize: queue.length,
        maxTotal,
        dailyNewLimit
      })
      
      return ok(queue)
    } catch (e) {
      logger.error('SpacedRepetitionService', 'getStudyQueue: Erreur construction queue', e)
      return err({code: 'SRS_QUEUE_FAILED', message: 'Erreur construction queue'})
    }
  }
  bury(cardIds: string[]){ cardIds.forEach(id => this.buriedToday.add(id)) }
  resetBuried(){ this.buriedToday.clear() }
  /** Expose read-only list of buried card IDs for advanced filtering */
  getBuriedIds(): string[] { return Array.from(this.buriedToday) }
}
export const SPACED_REPETITION_SERVICE_TOKEN = 'SpacedRepetitionService'
