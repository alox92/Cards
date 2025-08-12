import { describe, it, expect, beforeEach } from 'vitest'
// On importe directement la classe sans déclencher le container pour éviter les collisions de singletons dans le test
import { StudySessionService } from '@/application/services/StudySessionService'
import type { CardEntity } from '@/domain/entities/Card'

// Simple in-memory fakes for repositories
class FakeCardRepo {
  private cards: any[] = []
  async getAll(){ return this.cards }
  async update(_card: any){ /* no-op for test */ }
  seed(cards: any[]){ this.cards = cards }
}
class FakeSessionRepo {
  sessions: any[] = []
  async getRecent(){ return this.sessions.slice(-50).reverse() }
  async getByDeck(deckId: string){ return this.sessions.filter(s=>s.deckId===deckId) }
  async create(session: any){ this.sessions.push(session) }
  async update(session: any){ const i=this.sessions.findIndex(s=>s.id===session.id); if(i>=0) this.sessions[i]=session }
  async clear(){ this.sessions = [] }
}
class FakeSRS {
  getStudyQueue(cards: CardEntity[], deckId: string){ return cards.filter(c=>c.deckId===deckId).slice(0, 5) }
  schedule(card: CardEntity, quality: number, _responseTimeMs: number){ card.difficulty = Math.max(1, Math.min(5, (card.difficulty||3) + (quality>=4? -1: quality<=2? 1:0))) }
}

describe('StudySessionService', () => {
  let service: StudySessionService
  let cardRepo: FakeCardRepo
  let sessionRepo: FakeSessionRepo
  let srs: FakeSRS

  beforeEach(() => {
    cardRepo = new FakeCardRepo()
    sessionRepo = new FakeSessionRepo()
    srs = new FakeSRS()
    // Seed some cards
    cardRepo.seed([
      { id: 'c1', deckId: 'deck1', frontText: 'Q1', backText: 'A1', difficulty: 3 },
      { id: 'c2', deckId: 'deck1', frontText: 'Q2', backText: 'A2', difficulty: 3 },
      { id: 'c3', deckId: 'deck2', frontText: 'Q3', backText: 'A3', difficulty: 3 }
    ])
  service = new StudySessionService(srs as any, cardRepo as any, sessionRepo as any)
  })

  it('buildQueue filters cards by deck and limits size', async () => {
    const queue = await service.buildQueue('deck1', 10)
    expect(queue.length).toBe(2)
    expect(queue.every(c=>c.deckId==='deck1')).toBe(true)
  })

  it('recordAnswer schedules and updates difficulty', async () => {
    const queue = await service.buildQueue('deck1', 10)
    const card = queue[0]
    const oldDiff = card.difficulty
    await service.recordAnswer(card as any, 1, 1500) // poor answer increases difficulty
    expect(card.difficulty).toBeGreaterThanOrEqual(oldDiff)
  })

  it('endSession computes stats and persists session', async () => {
    const baseSession: any = {
      id: 's1', deckId: 'deck1', startTime: Date.now() - 5000, cardsStudied: 4, correctAnswers: 3,
      studyMode: 'quiz', performance: { accuracy: 0, streak: 2 }
    }
    const completed = await service.endSession(baseSession)
    expect(completed.endTime).toBeDefined()
    expect(completed.totalTimeSpent).toBeGreaterThan(0)
    expect(completed.performance.accuracy).toBeCloseTo(3/4)
    const stored = await sessionRepo.getByDeck('deck1')
    expect(stored.length).toBe(1)
  })
})
