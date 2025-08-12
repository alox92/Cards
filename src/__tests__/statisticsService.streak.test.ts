import { describe, it, expect } from 'vitest'
import { StatisticsService } from '@/application/services/StatisticsService'
import type { CardRepository } from '@/domain/repositories/CardRepository'
import type { DeckRepository } from '@/domain/repositories/DeckRepository'
import type { StudySessionRepository } from '@/domain/repositories/StudySessionRepository'
import { CardEntity } from '@/domain/entities/Card'
import { DeckEntity } from '@/domain/entities/Deck'

class CardRepoStub implements CardRepository { cards: CardEntity[]=[]; async getAll(){return this.cards}; async getByDeck(id:string){return this.cards.filter(c=>c.deckId===id)}; async getById(id:string){return this.cards.find(c=>c.id===id)||null}; async create(c:CardEntity){this.cards.push(c); return c}; async update(){return}; async delete(id:string){this.cards=this.cards.filter(c=>c.id!==id)}; async deleteByDeck(deckId:string){this.cards=this.cards.filter(c=>c.deckId!==deckId)} }
class DeckRepoStub implements DeckRepository { decks: DeckEntity[]=[]; async getAll(){return this.decks}; async getById(id:string){return this.decks.find(d=>d.id===id)||null}; async create(d:DeckEntity){this.decks.push(d); return d}; async update(){return}; async delete(id:string){this.decks=this.decks.filter(d=>d.id!==id)} }
interface StubSession { id:string; deckId:string; startTime:number; endTime?:number; cardsStudied:number; correctAnswers:number; totalTimeSpent:number; averageResponseTime:number; studyMode:'quiz'|'speed'|'matching'|'writing'; performance:any }
class SessionRepoStub implements StudySessionRepository { constructor(private sessions: StubSession[]){} async getRecent(){return this.sessions}; async getByDeck(deckId:string){return this.sessions.filter(s=>s.deckId===deckId)}; async create(){return}; async update(){return}; async clear(){return} }

describe('StatisticsService streak', () => {
  it('calcule un streak continu', async () => {
    const deckRepo = new DeckRepoStub(); const cardRepo = new CardRepoStub();
    const deck = new DeckEntity({ name: 'Test' }); deckRepo.decks.push(deck)
    // sessions sur 5 jours consécutifs + trou + 2 jours récents => streak = 2
    const now = new Date()
    const msDay = 24*60*60*1000
  const sessions: StubSession[] = [5,4,3,2,1].map(offset => ({ id:'s'+offset, deckId:deck.id, startTime: now.getTime()-offset*msDay, cardsStudied:10, correctAnswers:8, totalTimeSpent:600000, averageResponseTime:6000, studyMode:'quiz', performance:{} }))
    // trou (day 0-?) puis 2 jours récents: today & yesterday
  const todaySession: StubSession = { id:'today', deckId: deck.id, startTime: now.getTime(), cardsStudied:5, correctAnswers:4, totalTimeSpent:300000, averageResponseTime:6000, studyMode:'quiz', performance:{} }
  const yesterdaySession: StubSession = { id:'yesterday', deckId: deck.id, startTime: now.getTime()-1*msDay, cardsStudied:5, correctAnswers:5, totalTimeSpent:300000, averageResponseTime:6000, studyMode:'quiz', performance:{} }
  const allSessions: StubSession[] = [...sessions, yesterdaySession, todaySession]
    const sessionRepo = new SessionRepoStub(allSessions)
    const stats = await new StatisticsService(cardRepo, deckRepo, sessionRepo).snapshot()
    expect(stats.currentStreak).toBeGreaterThanOrEqual(2)
    expect(stats.totalSessions).toBe(allSessions.length)
  })
})
