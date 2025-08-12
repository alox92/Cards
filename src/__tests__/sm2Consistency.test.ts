import { describe, test, expect } from 'vitest'
import { sm2Update, retentionScore } from '@/domain/algorithms/sm2'
import { CardEntity } from '@/domain/entities/Card'

/** Test basique de cohérence entre CardEntity et sm2Update */

describe('SM-2 consistency', () => {
test('SM-2 update via module et via CardEntity recordResponse alignent interval/repetition', () => {
  const card = new CardEntity({ deckId: 'd1', frontText: 'Q', backText: 'A' })
  const qualities = [4,5,3,2,5]
  for(const q of qualities){
    const snapshot = { ef: card.easinessFactor, interval: card.interval, repetition: card.repetition, lastReview: card.lastReview, nextReview: card.nextReview }
    const moduleRes = sm2Update({ easinessFactor: snapshot.ef, interval: snapshot.interval, repetition: snapshot.repetition, lastReview: snapshot.lastReview, nextReview: snapshot.nextReview, quality: q })
    card.recordResponse(q, 1500)
    expect(card.interval).toBe(moduleRes.interval)
    expect(card.repetition).toBe(moduleRes.repetition)
  }
  const score = retentionScore(card.totalReviews, card.correctReviews, card.easinessFactor, card.interval)
  expect(score).toBeGreaterThanOrEqual(0)
  expect(score).toBeLessThanOrEqual(1)
})
})
