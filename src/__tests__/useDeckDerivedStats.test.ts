import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import useDeckDerivedStats from '@/ui/hooks/useDeckDerivedStats'

// Mock du container / repository utilisé par le hook
vi.mock('@/application/Container', () => {
  const fakeCards: any[] = [
    { id: 'c1', deckId: 'd1', totalReviews: 0, correctReviews: 0, interval: 0, nextReview: Date.now() - 1000, created: Date.now()-2000, lastReview: 0 },
    { id: 'c2', deckId: 'd1', totalReviews: 3, correctReviews: 2, interval: 25, nextReview: Date.now() + 60_000, created: Date.now()-86400000, lastReview: Date.now()-1000 },
    { id: 'c3', deckId: 'd1', totalReviews: 5, correctReviews: 5, interval: 30, nextReview: Date.now() - 5000, created: Date.now()-86400000*2, lastReview: Date.now()-2000 },
    { id: 'c4', deckId: 'd2', totalReviews: 0, correctReviews: 0, interval: 0, nextReview: Date.now() - 1000, created: Date.now()-1000, lastReview: 0 }
  ]
  return {
    container: {
      resolve: (token: string) => {
        if(token === 'CardService'){
          return {
            async listByDeck(deckId: string){ return fakeCards.filter(c=>c.deckId === deckId) }
          }
        }
        return {}
      }
    }
  }
})

describe('useDeckDerivedStats', () => {
  it('calcule stats, utilise cache TTL et permet refresh manuel', async () => {
    const { result, rerender } = renderHook(({ id }) => useDeckDerivedStats(id), { initialProps: { id: 'd1' } })

    await act(async () => { await new Promise(r => setTimeout(r, 0)) })
    expect(result.current.loading).toBe(false)
    expect(result.current.dueCards).toBe(2)
    expect(result.current.newCards).toBe(1)
    expect(result.current.mature).toBe(2)

    // Rerender immédiat: devrait provenir du cache sans repasser par loading
    const prevRef = { loading: result.current.loading }
    rerender({ id: 'd1' })
    expect(result.current.loading || prevRef.loading).toBe(false)

    // Force refresh manuel
    await act(async () => { await result.current.refresh(true) })
    expect(result.current.dueCards).toBe(2)
  })
})
