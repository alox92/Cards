import { describe, it, expect, vi } from 'vitest'

// --- Minimal stubs / utilities ---
// (ValidationError / ServiceError non nécessaires ici, on laisse les chemins réels mockés via logger)

// Reuse real services via imports where safe
import { AdaptiveStudyScorer } from '@/application/services/AdaptiveStudyScorer'
import { AdaptiveOrchestratorService } from '@/application/services/AdaptiveOrchestratorService'
import { LearningForecastService } from '@/application/services/LearningForecastService'
import { CardService } from '@/application/services/CardService'
import { DeckService } from '@/application/services/DeckService'
import HeatmapStatsService from '@/application/services/HeatmapStatsService'

// Monkey patch global logger / eventBus used in services to no-op to keep tests silent
vi.mock('@/utils/logger', () => ({ logger: { error: vi.fn(), debug: vi.fn() } }))
vi.mock('@/core/events/EventBus', () => ({ eventBus: { publish: vi.fn() } }))

// In‑memory aribaDB tables facade (subset needed)
const makeTable = () => {
  const api: any = {
    _rows: [] as any[],
    bulkAdd(arr: any[]){ api._rows.push(...arr); return Promise.resolve() },
    add(row:any){ api._rows.push(row); return Promise.resolve() },
    put(row:any){ const i = api._rows.findIndex((r:any)=> r.term? r.term===row.term : false); if(i>=0) api._rows[i]=row; else api._rows.push(row); return Promise.resolve() },
    clear(){ api._rows = []; return Promise.resolve() },
    where(field: string){
      return { equals: (val:any) => ({
        toArray: async () => api._rows.filter((r:any)=> r[field]===val),
        first: async () => api._rows.find((r:any)=> r[field]===val) || null,
        delete: async () => { api._rows = api._rows.filter((r:any)=> r[field]!==val) }
      }) }
    },
    count: async () => Promise.resolve(api._rows.length)
  }
  return api
}

// Install global aribaDB stub once with stable table() returning named tables
// @ts-ignore
const ensureAriba = () => {
  const g:any = globalThis as any
  const existing = g.aribaDB || {}
  const tables = existing._tables || existing.tables || {}
  tables.searchIndex = tables.searchIndex || makeTable()
  tables.searchTrigrams = tables.searchTrigrams || makeTable()
  tables.searchTermStats = tables.searchTermStats || makeTable()
  tables.cards = tables.cards || { count: async () => 1 }
  g.aribaDB = {
    ...existing,
    ...tables,
    _tables: tables,
    table: (name: string) => (tables[name] ||= makeTable())
  }
}
ensureAriba()
vi.mock('@/infrastructure/persistence/dexie/AribaDB', () => ({ aribaDB: (globalThis as any).aribaDB }))

// Utility create fake card
const card = (id:string, extras: any = {}) => ({ id, deckId: 'd1', frontText: 'alpha beta', backText: 'gamma', totalReviews: 0, interval: 0, ...extras })

describe('Additional service coverage', () => {
  describe('AdaptiveStudyScorer', () => {
    it('scores cards with high vs low difficulty factors', () => {
      const scorer = new AdaptiveStudyScorer()
      const now = Date.now()
      const cards = [
        card('c1', { totalReviews: 1, easinessFactor: 2.3, interval: 2, nextReview: now - 1000 }),
        card('c2', { totalReviews: 10, easinessFactor: 2.6, interval: 30, nextReview: now + 1000*60*60*24*5 })
      ]
      const scored = scorer.scoreCards(cards as any, { now, targetDeck: 'd1' })
      expect(scored.length).toBe(2)
      // Due card should come first
      expect(scored[0].card.id).toBe('c1')
      // difficultyFactor path difference covered
      expect(scored[0].factors.difficulty).toBeGreaterThan(scored[1].factors.difficulty)
    })
  })

  describe('AdaptiveOrchestratorService weight adjustment', () => {
    it('adjusts weights downward quality < 0.6 and alternate path >= 0.6', async () => {
      const forecastSvc: any = { getForecast: vi.fn().mockResolvedValue({ items: [] }) }
      const insightSvc: any = { getCached: () => ({ insights: [] }), generate: vi.fn() }
      const svc = new AdaptiveOrchestratorService(forecastSvc, insightSvc) as any
      svc.adjustInterval = 0 // force immediate adjust
      // Low quality samples
      for(let i=0;i<30;i++){ svc.recordFeedback(0.5, 0.4, 1200) }
      const w1 = svc.getWeights()
      expect(w1.due + w1.difficulty + w1.retention + w1.forecast).toBeCloseTo(1,5)
      // High quality second batch triggers alternate branch
      for(let i=0;i<30;i++){ svc.recordFeedback(0.5, 0.9, 800) }
      const w2 = svc.getWeights()
      expect(w2.difficulty).toBeGreaterThan(w1.difficulty)
    })
  })

  describe('LearningForecastService caching + force', () => {
    it('returns cached snapshot unless force used and computes risk metrics', async () => {
      const now = Date.now()
      const cards = [
        { id:'a', interval: 5, easinessFactor:2.5, lastReview: now-86400000*2, nextReview: now+3600_000, totalReviews:4, correctReviews:3 },
        { id:'b', interval: 1, easinessFactor:2.3, lastReview: now-86400000*5, nextReview: now+1000, totalReviews:2, correctReviews:1 },
        { id:'c', interval: 10, easinessFactor:2.8, lastReview: now-86400000*1, nextReview: now+10*3600_000, totalReviews:8, correctReviews:7 }
      ]
      const forecast = new LearningForecastService({ getAll: async () => cards }) as any
      forecast.cacheTtlMs = 10_000
      const s1 = await forecast.getForecast()
      const s2 = await forecast.getForecast()
      expect(s1).toBe(s2) // cached
      const s3 = await forecast.getForecast(true)
      expect(s3).not.toBe(s2)
      expect(s3.items.length).toBeGreaterThan(0)
      expect(s3.averageRisk).toBeGreaterThanOrEqual(0)
      expect(s3.averageRisk).toBeLessThanOrEqual(1)
      expect(s3.highRiskCount).toBeGreaterThanOrEqual(0)
    })
  })

  describe('CardService error paths & count fallback', () => {
    it('throws validation & wraps repo errors', async () => {
      const repo = {
        create: vi.fn().mockRejectedValue(new Error('fail create')),
        update: vi.fn().mockRejectedValue(new Error('fail update')),
        delete: vi.fn().mockRejectedValue(new Error('fail delete')),
        getById: vi.fn().mockResolvedValue(null),
        getByDeck: vi.fn().mockResolvedValue([]),
        getAll: vi.fn().mockResolvedValue([])
      }
      const svc = new CardService(repo as any)
      await expect(svc.create('', { frontText:'a', backText:'b' } as any)).rejects.toThrow(/deckId/)
      await expect(svc.create('d1', { frontText:'', backText:'b' } as any)).rejects.toThrow(/frontText/)
      await expect(svc.create('d1', { frontText:'a', backText:'b' } as any)).rejects.toThrow(/création/)
      await expect(svc.update({} as any)).rejects.toThrow(/ID carte/)
      await expect(svc.delete('')).rejects.toThrow(/ID requis/)
      await expect(svc.get('')).rejects.toThrow(/ID requis/)
      // countAll fallback path (no repo.count)
      const count = await svc.countAll()
      expect(count).toBe(0)
    })
  })

  describe('DeckService stats enrichment & errors', () => {
    it('enriches stats when zero and wraps repo failures', async () => {
      const deck = { id:'d1', name:'Deck', totalCards:0, updated:0, updateStats(cards:any[]){ this.totalCards = cards.length; this.updated = Date.now() } }
      const deckRepo = {
        getAll: vi.fn().mockResolvedValue([deck]),
        getById: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockRejectedValue(new Error('x')),
        update: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined)
      }
      const cardRepo = { getByDeck: vi.fn().mockResolvedValue([card('c1')]), deleteByDeck: vi.fn(), getAll: vi.fn() }
      const svc = new DeckService(deckRepo as any, cardRepo as any)
      const enriched = await svc.listDecksWithStats()
      expect(enriched[0].totalCards).toBe(1)
      await expect(svc.getDeck('')).rejects.toThrow(/ID deck/)
      await expect(svc.getDeck('missing')).rejects.toThrow(/introuvable/)
      await expect(svc.createDeck({ name:'' } as any)).rejects.toThrow(/Nom requis/)
      await expect(svc.createDeck({ name:'Ok' } as any)).rejects.toThrow(/création deck/)
    })
  })

  describe('HeatmapStatsService large sequential fallback', () => {
    it('processes >500 sessions sequentially and returns N days array', async () => {
      // Build 600 sessions over last 10 days
      const now = Date.now()
      const sessions = Array.from({ length: 600 }, (_,i)=> ({ startTime: now - (i%10)*86400000 + (i*1234)%10_000, cardsStudied: (i%5)+1 }))
      const repo = { getRecent: async () => sessions }
      const svc = new HeatmapStatsService(repo as any)
      const out = await svc.getLastNDays(15)
      expect(out.length).toBe(15)
      // Some days should have aggregated reviews >0
      expect(out.some(d=> d.reviews>0)).toBe(true)
    })
  })

  describe('SearchIndexService instrumentation trimming', () => {
    it('trims search duration history to 200 and builds stats', async () => {
      // Minimal repo returns one card so candidate set non-empty for term present; but we do no indexing -> empty results fine
      const repo = { getAll: async () => [card('c1')] }
  // Import dynamique après le mock pour capturer le stub aribaDB correct
  const { SearchIndexService } = await import('@/application/services/SearchIndexService')
  const svc = new SearchIndexService(repo as any)
  // Pré-index basique pour éviter undefined postings (simulate indexCard path)
  await (globalThis as any).aribaDB.searchIndex.bulkAdd([{ term:'alpha', cardId:'c1' }])
  // Ne pas utiliser ranking: 'none' car cela bypass l'instrumentation (early return).
  for(let i=0;i<205;i++) await svc.search('alpha')
      const w:any = window as any
      expect(w.__SEARCH_DURS__).toBeDefined()
      expect(w.__SEARCH_DURS__.length).toBe(200) // trimmed
      expect(w.__SEARCH_DURS_STATS__).toBeDefined()
      expect(w.__SEARCH_DURS_STATS__.p50).toBeGreaterThanOrEqual(0)
    })
  })
})
