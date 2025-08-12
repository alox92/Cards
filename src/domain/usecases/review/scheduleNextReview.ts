import { sm2Update } from '@/domain/algorithms/sm2'

export function simulateNext(card: any, quality: number){
  return sm2Update({
    easinessFactor: card.easinessFactor ?? 2.5,
    interval: card.interval ?? 0,
    repetition: card.repetition ?? 0,
    lastReview: card.lastReview ?? Date.now(),
    nextReview: card.nextReview ?? Date.now(),
    quality
  })
}
