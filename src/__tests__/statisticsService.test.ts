import { describe, it, expect } from 'vitest'
import { StatisticsService } from '@/application/services/StatisticsService'
import { CardEntity } from '@/domain/entities/Card'
import { DeckEntity } from '@/domain/entities/Deck'
import type { CardRepository } from '@/domain/repositories/CardRepository'
import type { DeckRepository } from '@/domain/repositories/DeckRepository'
import type { StudySessionRepository } from '@/domain/repositories/StudySessionRepository'

class CardRepoStub implements CardRepository { cards: CardEntity[] = []; async getAll(){return this.cards}; async getByDeck(id:string){return this.cards.filter(c=>c.deckId===id)}; async getById(id:string){return this.cards.find(c=>c.id===id)||null}; async create(c:CardEntity){this.cards.push(c); return c}; async update(){return}; async delete(id:string){this.cards=this.cards.filter(c=>c.id!==id)}; async deleteByDeck(deckId:string){this.cards=this.cards.filter(c=>c.deckId!==deckId)} }
class DeckRepoStub implements DeckRepository { decks: DeckEntity[]=[]; async getAll(){return this.decks}; async getById(id:string){return this.decks.find(d=>d.id===id)||null}; async create(d:DeckEntity){this.decks.push(d); return d}; async update(){return}; async delete(id:string){this.decks=this.decks.filter(d=>d.id!==id)} }
class SessionRepoStub implements StudySessionRepository { async getRecent(){return []}; async getByDeck(){return []}; async create(){return}; async update(){return}; async clear(){return} }

describe('StatisticsService snapshot', () => {
  it('calcule les métriques de base avec sessions', async () => {
    const deckRepo = new DeckRepoStub()
    const cardRepo = new CardRepoStub()
    const sessionRepo = new SessionRepoStub()
    const deck = new DeckEntity({ name: 'Test' })
    deckRepo.decks.push(deck)
    const c1 = new CardEntity({ frontText: 'Q1', backText: 'A1', deckId: deck.id })
    const c2 = new CardEntity({ frontText: 'Q2', backText: 'A2', deckId: deck.id })
    c1.recordResponse(5, 1200)
    c2.recordResponse(2, 1500)
    cardRepo.cards.push(c1, c2)
    const stats = await new StatisticsService(cardRepo, deckRepo, sessionRepo).snapshot()
    expect(stats.totalDecks).toBe(1)
    expect(stats.totalCards).toBe(2)
    expect(stats.matureCards).toBe(0)
    expect(stats.dueToday).toBeGreaterThanOrEqual(0)
  expect(stats.averageRetention).toBeGreaterThan(0)
  expect(stats.totalSessions).toBeDefined()
  expect(stats.currentStreak).toBeGreaterThanOrEqual(0)
  expect(stats.avgSessionAccuracy).toBeGreaterThanOrEqual(0)
  })
})
