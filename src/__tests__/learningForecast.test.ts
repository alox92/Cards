import { describe, it, expect, beforeAll } from 'vitest'
import { LEARNING_FORECAST_SERVICE_TOKEN } from '@/application/services/LearningForecastService'
import { CARD_REPOSITORY_TOKEN } from '@/domain/repositories/CardRepository'
import { container } from '@/application/Container'
import { CardEntity } from '@/domain/entities/Card'

// Basic sanity test for LearningForecastService heuristic

describe('LearningForecastService', () => {
  let svc: any
  let repo: any
  beforeAll(async () => {
    if(typeof indexedDB === 'undefined') return
    svc = container.resolve(LEARNING_FORECAST_SERVICE_TOKEN as any)
    repo = container.resolve(CARD_REPOSITORY_TOKEN)
    // seed a few cards with differing intervals / accuracy
    await repo.clear?.()
    const now = Date.now()
    const mk = (text:string, interval:number, correct:number, total:number) => {
      const c = new CardEntity({ deckId: 'd1', frontText: text, backText: 'b' })
      c.interval = interval
      c.correctReviews = correct
      c.totalReviews = total
      c.lastReview = now - (interval*0.6)*86400000 // 60% of interval elapsed
      c.nextReview = now + (interval*0.4)*86400000
      return c
    }
    const cards = [
      mk('alpha', 1, 1, 2),
      mk('beta', 5, 10, 12),
      mk('gamma', 10, 30, 35),
    ]
    for(const c of cards) await repo.create(c)
  })
  it('produces snapshot with averageRisk and items', async () => {
    if(typeof indexedDB === 'undefined') return
    const snap = await svc.getForecast(true)
    expect(snap.items.length).toBeGreaterThan(0)
    expect(snap.averageRisk).toBeGreaterThanOrEqual(0)
    expect(snap.averageRisk).toBeLessThanOrEqual(1)
  })
})
