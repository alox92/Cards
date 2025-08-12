import { describe, it, expect } from 'vitest'
import { recordReview } from '@/domain/usecases/review/recordReview'

// Test simple de smoke du use case (logique SM-2 déjà testée ailleurs)

describe('recordReview use case', () => {
  it('met à jour une carte avec SM-2 et incrémente compteurs', async () => {
    const card:any = { id:'c1', easinessFactor:2.5, interval:0, repetition:0, lastReview:0, nextReview:0, totalReviews:0, correctReviews:0 }
    const deps = {
      getCard: async ()=> card,
      updateCard: async (_id:string, patch:any)=> Object.assign(card, patch)
    }
    const res = await recordReview(deps, { cardId:'c1', quality:4 })
    expect(res.after.totalReviews).toBe(1)
    expect(res.after.correctReviews).toBe(1)
    expect(res.after.interval).toBeGreaterThan(0)
  })
})
