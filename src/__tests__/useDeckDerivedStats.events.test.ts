import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import useDeckDerivedStats from '@/ui/hooks/useDeckDerivedStats'
import { eventBus } from '@/core/events/EventBus'

// On crée un jeu de cartes mutable afin de simuler les effets d'un review ou d'une création.
const fakeCards: any[] = [
  { id: 'c1', deckId: 'd1', totalReviews: 0, correctReviews: 0, interval: 0, nextReview: Date.now() - 1000, created: Date.now()-2000, lastReview: 0 },
  { id: 'c2', deckId: 'd1', totalReviews: 1, correctReviews: 1, interval: 1, nextReview: Date.now() - 500, created: Date.now()-3000, lastReview: 0 }
]

vi.mock('@/application/Container', () => {
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

describe('useDeckDerivedStats - invalidation événementielle', () => {
  it('réagit à card.reviewed et recalcule dueCards', async () => {
    const { result } = renderHook(() => useDeckDerivedStats('d1'))
    // Attendre initial fetch
    await act(async () => { await new Promise(r=>setTimeout(r,0)) })
    expect(result.current.dueCards).toBe(2)

    // Simuler review de c1: on la rend non due en avançant nextReview
    const target = fakeCards.find(c=>c.id==='c1')!
    target.nextReview = Date.now() + 60_000
    target.totalReviews += 1
    target.correctReviews += 1
    target.interval = 2

    // Publier événement
    act(()=>{
      eventBus.publish({ type:'card.reviewed', payload:{ cardId:'c1', deckId:'d1', quality:4, nextReview: target.nextReview } })
    })
    // Laisser le hook recalculer (microtask + async compute)
    await act(async () => { await new Promise(r=>setTimeout(r,10)) })
    expect(result.current.dueCards).toBe(1)
  })

  it('réagit à card.created et met à jour newCards/dueCards', async () => {
    const { result } = renderHook(() => useDeckDerivedStats('d1'))
    await act(async () => { await new Promise(r=>setTimeout(r,0)) })
    const initialNew = result.current.newCards
    const initialDue = result.current.dueCards

    // Ajouter nouvelle carte due & new
    const newCard = { id:'c_new', deckId:'d1', totalReviews:0, correctReviews:0, interval:0, nextReview: Date.now() - 100, created: Date.now(), lastReview:0 }
    fakeCards.push(newCard)
    act(()=>{ eventBus.publish({ type:'card.created', payload:{ cardId:'c_new', deckId:'d1' } }) })
    await act(async () => { await new Promise(r=>setTimeout(r,10)) })
    expect(result.current.newCards).toBe(initialNew + 1)
    expect(result.current.dueCards).toBe(initialDue + 1)
  })
})
