import { sm2Update } from '@/domain/algorithms/sm2'
import { eventBus } from '@/core/events/EventBus'

// Contract simplifié - adaptera avec CardRepository réel
export interface RecordReviewDeps {
  getCard: (id: string) => Promise<any>
  updateCard: (id: string, patch: any) => Promise<void>
}

export interface RecordReviewInput { cardId: string; quality: number }

export async function recordReview(deps: RecordReviewDeps, input: RecordReviewInput){
  const card = await deps.getCard(input.cardId)
  if(!card) throw new Error('Card not found')
  const result = sm2Update({
    easinessFactor: card.easinessFactor ?? 2.5,
    interval: card.interval ?? 0,
    repetition: card.repetition ?? 0,
    lastReview: card.lastReview ?? Date.now(),
    nextReview: card.nextReview ?? Date.now(),
    quality: input.quality
  })
  const patch = {
    easinessFactor: result.easinessFactor,
    interval: result.interval,
    repetition: result.repetition,
    lastReview: result.lastReview,
    nextReview: result.nextReview,
    totalReviews: (card.totalReviews||0)+1,
    correctReviews: (card.correctReviews||0) + (input.quality >=3 ? 1:0)
  }
  await deps.updateCard(card.id, patch)
  eventBus.publish({ type:'card.reviewed', payload:{ cardId: card.id, deckId: card.deckId, quality: input.quality, nextReview: result.nextReview } })
  return { before: card, after: { ...card, ...patch } }
}
