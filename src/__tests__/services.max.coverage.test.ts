import { describe, it, expect, vi } from 'vitest'

// Mocks silencieux
vi.mock('@/utils/logger', () => ({ logger: { debug: vi.fn(), error: vi.fn() } }))
vi.mock('@/core/events/EventBus', () => ({ eventBus: { publish: vi.fn() } }))

// Stub simple SpacedRepetitionService
class FakeSRS { 
  schedule = vi.fn(); 
  getStudyQueue(cards:any[], deckId:string, daily:number){
    // retourne toutes les cartes dues/fresh selon limite
    const due = cards.filter(c=> c.deckId===deckId && c.due)
    const fresh = cards.filter(c=> c.deckId===deckId && !c.due).slice(0,daily)
    return [...due, ...fresh]
  }
  getBuriedIds(){ return [] }
}

// Services réels
import { AdaptiveOrchestratorService } from '@/application/services/AdaptiveOrchestratorService'
import { StudySessionService } from '@/application/services/StudySessionService'
import { PerformanceOptimizer } from '@/utils/performanceOptimizer'
import HeatmapStatsService from '@/application/services/HeatmapStatsService'

// Helpers
const makeCard = (id:string, deck='d1', opts: any = {}) => ({ id, deckId: deck, nextReview: Date.now()-1000, totalReviews: 1, interval: 1, due: true, ...opts })

describe('Max coverage services', () => {
  describe('AdaptiveOrchestratorService warmup & early adjust guard', () => {
    it('warmup resolves even if underlying services throw & early maybeAdjust returns', async () => {
      const forecast = { getForecast: vi.fn().mockRejectedValue(new Error('x')) } as any
      const insight = { getCached: vi.fn().mockReturnValue(null), generate: vi.fn().mockRejectedValue(new Error('y')) } as any
      const svc: any = new AdaptiveOrchestratorService(forecast, insight)
      // early maybeAdjust: feedback < 30, lastAdjust recent
      svc.recordFeedback(0.1, 0.4, 100)
      svc.lastAdjust = Date.now() // empêche adjust
      const w = await svc.warmup()
      expect(w.ready).toBe(true)
      expect(forecast.getForecast).toHaveBeenCalled()
    })
  })

  describe('StudySessionService error & logging branches', () => {
    it('throws validation errors & wraps repo failure', async () => {
      const srs = new FakeSRS() as any
      const repoErr = { getAll: vi.fn().mockRejectedValue(new Error('boom')) }
      const sessionRepo = { create: vi.fn(), getRecent: vi.fn(), getByDeck: vi.fn() } as any
      const svc = new StudySessionService(srs, repoErr as any, sessionRepo)
      await expect(svc.buildQueue('', 1)).rejects.toThrow(/deckId requis/)
      await expect(svc.buildQueue('d1', -1)).rejects.toThrow(/dailyNewLimit/)
  // Le ServiceError expose le message utilisateur en français, matcher sur ce message
  await expect(svc.buildQueue('d1', 1)).rejects.toThrow(/Erreur build queue/)
    })
    it('recordAnswer passes feedback to orchestrator & publish events no throw', async () => {
      const srs = new FakeSRS() as any
      const cardRepo = { getAll: vi.fn().mockResolvedValue([]), update: vi.fn().mockResolvedValue(undefined) }
      const sessionRepo = { create: vi.fn(), getRecent: vi.fn(), getByDeck: vi.fn() } as any
      const orchestrator: any = { computeQueue: (q:any)=> q, recordFeedback: vi.fn() }
      const svc = new StudySessionService(srs, cardRepo as any, sessionRepo, orchestrator)
      const card = makeCard('c1') as any
      const updated = await svc.recordAnswer(card, 4, 500)
      expect(updated).toBe(card)
      expect(orchestrator.recordFeedback).toHaveBeenCalled()
    })
    it('endSession computes performance & publishes', async () => {
      const srs = new FakeSRS() as any
      const cardRepo = { getAll: vi.fn().mockResolvedValue([]), update: vi.fn() }
      const sessionRepo = { create: vi.fn(), getRecent: vi.fn(), getByDeck: vi.fn() } as any
      const svc = new StudySessionService(srs, cardRepo as any, sessionRepo)
      const session = { id:'s1', deckId:'d1', startTime: Date.now()-1000, cardsStudied: 4, correctAnswers:3, studyMode:'std', performance:{} } as any
      const res = await svc.endSession(session)
      expect(res.averageResponseTime).toBeGreaterThan(0)
      expect(sessionRepo.create).toHaveBeenCalledTimes(1)
    })
  })

  describe('HeatmapStatsService parallel branch (worker failure fallback)', () => {
    it('tries worker path then falls back when import fails', async () => {
      // construire 600 sessions => déclenche tentative worker
      const now = Date.now()
      const sessions = Array.from({length: 600}, (_,i)=> ({ startTime: now - (i%7)*86400000, cardsStudied: (i%3)+1 }))
      const repo = { getRecent: async () => sessions }
      // Forcer import échec
      vi.mock('@/workers/heatmapStatsWorker?worker', () => { throw new Error('no worker') })
      const svc = new HeatmapStatsService(repo as any)
      const out = await svc.getLastNDays(7)
      expect(out.length).toBe(7)
      expect(out.some(d=> d.reviews>0)).toBe(true)
    })
  })

  describe('PerformanceOptimizer low-level helpers', () => {
    it('covers scheduleIdle aggregation & weak cache & throttle/debounce', async () => {
      // scheduleIdle fallback branch: simulate absence of requestIdleCallback
      const original = (globalThis as any).requestIdleCallback
      ;(globalThis as any).requestIdleCallback = undefined
      const calls: number[] = []
      PerformanceOptimizer.scheduleIdle(()=> calls.push(Date.now()), 10)
      await new Promise(r=> setTimeout(r,30))
      expect(calls.length).toBeGreaterThan(0)
      ;(globalThis as any).requestIdleCallback = original
      // weak cache
      const cache = PerformanceOptimizer.createWeakCache<object, number>()
      const key = {}
      cache.set(key, 42)
      expect(cache.get(key)).toBe(42)
      cache.delete(key)
      // debounce
      const debounced = PerformanceOptimizer.debounce(()=> calls.push(999),5)
      debounced(); debounced();
      await new Promise(r=> setTimeout(r,15))
      expect(calls.some(v=> v===999)).toBe(true)
      // throttle
      let tCount=0
      const throttled = PerformanceOptimizer.throttle(()=> tCount++,5)
      throttled(); throttled(); throttled();
      await new Promise(r=> setTimeout(r,12))
      throttled();
      expect(tCount).toBeGreaterThan(1)
    })
  })
})
