/**
 * Service de Répétition Espacée (SM-2 et variantes futures)
 */
import { CardEntity } from '../../domain/entities/Card'
import { ValidationError } from '@/utils/errors'

export interface ScheduleResult { card: CardEntity; nextReview: number; interval: number; easinessFactor: number }

export class SpacedRepetitionService {
  private leechThreshold = 8
  private leechTag = 'leech'
  private buriedToday = new Set<string>()
  schedule(card: CardEntity, quality: number, responseTimeMs: number): ScheduleResult {
    if(quality < 0 || quality > 5) throw new ValidationError('Quality hors intervalle 0-5','SRS_QUALITY_RANGE')
    card.recordResponse(quality, responseTimeMs)
    // Leech detection
    if(card.totalReviews >= this.leechThreshold && card.correctReviews / card.totalReviews < 0.5){
      if(!card.tags.includes(this.leechTag)) card.tags.push(this.leechTag)
      // Option: suspend by pushing nextReview far
      card.nextReview = Date.now() + 7*24*60*60*1000
    }
    return { card, nextReview: card.nextReview, interval: card.interval, easinessFactor: card.easinessFactor }
  }
  getStudyQueue(allCards: CardEntity[], deckId: string, dailyNewLimit: number): CardEntity[] {
    const now = Date.now()
    const due = allCards.filter(c => c.deckId === deckId && c.nextReview <= now && !this.buriedToday.has(c.id))
    const fresh = allCards.filter(c => c.deckId === deckId && c.totalReviews === 0 && c.deckId===deckId && !this.buriedToday.has(c.id)).slice(0, dailyNewLimit)
    return [...due, ...fresh]
  }
  bury(cardIds: string[]){ cardIds.forEach(id => this.buriedToday.add(id)) }
  resetBuried(){ this.buriedToday.clear() }
}
export const SPACED_REPETITION_SERVICE_TOKEN = 'SpacedRepetitionService'
