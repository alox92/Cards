import { describe, it, expect } from 'vitest'
import { AdaptiveOrchestratorService } from '@/application/services/AdaptiveOrchestratorService'

describe('AdaptiveOrchestratorService', () => {
  it('computes queue (skip if no indexedDB)', async () => {
    if(typeof indexedDB === 'undefined'){ return }
    // Mock services
    const mockForecastSvc = { warmup: () => Promise.resolve() } as any
    const mockInsightSvc = { generate: () => Promise.resolve() } as any
    const orchestrator = new AdaptiveOrchestratorService(mockForecastSvc, mockInsightSvc)
    // minimal fake cards
    const now = Date.now()
    const cards: any[] = [
      { id:'c1', deckId:'d', nextReview: now-1000, totalReviews:5, easinessFactor:2.3, interval:2, repetition:1, correctReviews:3 },
      { id:'c2', deckId:'d', nextReview: now+3600_000, totalReviews:1, easinessFactor:2.5, interval:1, repetition:0, correctReviews:1 },
      { id:'c3', deckId:'d', nextReview: now+10, totalReviews:10, easinessFactor:2.1, interval:5, repetition:2, correctReviews:8 }
    ]
    const ordered = orchestrator.computeQueue(cards as any, 'd')
    expect(ordered.length).toBe(3)
  })
})