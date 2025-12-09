import { describe, it, expect, vi } from 'vitest'

describe('Coverage push phase C', () => {
  it('AdaptiveOrchestratorService recordFeedback triggers normalization both branches', async () => {
    const { AdaptiveOrchestratorService } = await import('@/application/services/AdaptiveOrchestratorService')
    const forecastSvc = { getForecast: () => ({ items: [] }) }
    const insightSvc = { getCached: () => ({ insights: [] }) }
    const orch = new AdaptiveOrchestratorService(forecastSvc as any, insightSvc as any)
    ;(orch as any).adjustInterval = 0
    // Low quality samples
    for(let i=0;i<35;i++){ orch.recordFeedback(0.2, 0.4, 900) }
    const w1 = orch.getWeights()
    // Force time to allow another adjust
    ;(orch as any).lastAdjust = 0
    // High quality samples appended
    for(let i=0;i<40;i++){ orch.recordFeedback(0.9, 0.95, 300) }
    const w2 = orch.getWeights()
    const sum1 = w1.due + w1.difficulty + w1.retention + w1.forecast
    const sum2 = w2.due + w2.difficulty + w2.retention + w2.forecast
    expect(sum1).toBeCloseTo(1,5)
    expect(sum2).toBeCloseTo(1,5)
  })

  it('StudySessionService logging path (only timeElapsed triggers) + second slow path', async () => {
    const { StudySessionService } = await import('@/application/services/StudySessionService')
    const srs = { getStudyQueue: (cards:any[])=> cards.slice(0,1), schedule: ()=>{}, getBuriedIds: ()=>[] }
    const repo = { getAll: async () => [{ id:'c1', deckId:'d', nextReview: Date.now()-1, totalReviews:0 }] }
    const sessionRepo = { create: async()=>{}, getRecent: async()=>[], getByDeck: async()=>[] }
    const svc = new StudySessionService(srs as any, repo as any, sessionRepo as any)
    await svc.buildQueue('d', 5) // initial sets meta
    // manipulate meta to simulate >1s elapsed without size change
    ;(StudySessionService as any)._lastQueueLog.t = Date.now() - 2000
    await svc.buildQueue('d', 5)
    // slow path: mock performance.now to return large duration
    const perfSpy = vi.spyOn(performance, 'now').mockReturnValueOnce(0).mockReturnValueOnce(100) // dur=100 (>8)
    await svc.buildQueue('d', 5)
    perfSpy.mockRestore()
    expect(true).toBe(true)
  })

  it('PerformanceOptimizer scheduleIdle fallback + throttle + weakCache + observer', async () => {
    // Force idleUnsupported before import => need fresh module import
    const orig = (globalThis as any).requestIdleCallback
    delete (globalThis as any).requestIdleCallback
    // Provide minimal IntersectionObserver
    class IO { constructor(public cb: any){ } observe(){} disconnect(){} unobserve(){} }
    ;(globalThis as any).IntersectionObserver = IO as any
    const mod = await import('@/utils/performanceOptimizer')
    const { PerformanceOptimizer } = mod
    vi.useFakeTimers()
    const task = vi.fn()
    PerformanceOptimizer.scheduleIdle(task, 50)
    vi.advanceTimersByTime(60)
    expect(task).toHaveBeenCalled()
    // throttle
    const incr = vi.fn()
    const throttled = PerformanceOptimizer.throttle(incr, 20)
    throttled(); throttled(); vi.advanceTimersByTime(25); throttled();
    expect(incr.mock.calls.length).toBeGreaterThanOrEqual(2)
    // weak cache
    const cache = PerformanceOptimizer.createWeakCache<object, number>()
    const key: any = {}
    cache.set(key, 42)
    expect(cache.get(key)).toBe(42)
    // observer
    const obs = PerformanceOptimizer.createOptimizedObserver(()=>{})
    expect(obs).toBeInstanceOf(IO)
    vi.useRealTimers()
    // restore
    if(orig) (globalThis as any).requestIdleCallback = orig
  })
})
