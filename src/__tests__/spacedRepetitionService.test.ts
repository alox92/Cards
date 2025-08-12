import { describe, it, expect } from 'vitest'
import { SpacedRepetitionService } from '@/application/services/SpacedRepetitionService'
import { CardEntity } from '@/domain/entities/Card'

describe('SpacedRepetitionService / SM-2', () => {
  it('augmente l intervalle avec réponses de qualité élevée', () => {
    const srv = new SpacedRepetitionService()
    const card = new CardEntity({ frontText: 'Q', backText: 'A', deckId: 'd1' })
    const intervals: number[] = []
    for (let i=0;i<4;i++) { srv.schedule(card, 5, 1500); intervals.push(card.interval) }
    expect(intervals[0]).toBe(1)
    expect(intervals[1]).toBe(6)
    expect(intervals[2]).toBeGreaterThanOrEqual(6)
    expect(intervals[3]).toBeGreaterThan(intervals[2]-1)
  })

  it('réinitialise après une mauvaise réponse', () => {
    const srv = new SpacedRepetitionService()
    const card = new CardEntity({ frontText: 'Q', backText: 'A', deckId: 'd1' })
    srv.schedule(card, 5, 1000)
    srv.schedule(card, 5, 1000)
    const beforeReset = card.interval
    srv.schedule(card, 1, 1200)
    expect(beforeReset).toBeGreaterThan(1)
    expect(card.interval).toBe(1)
    expect(card.repetition).toBe(0)
  })
})
