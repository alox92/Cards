// Polyfill object URL pour l'environnement jsdom (MediaService dépend de URL.createObjectURL)
// On le fait très tôt avant d'importer/instancier le service.
if (!(globalThis as any).URL) {
  (globalThis as any).URL = {
    createObjectURL: () => 'blob://stub',
    revokeObjectURL: () => {}
  } as any;
} else if (!(globalThis as any).URL.createObjectURL) {
  (globalThis as any).URL.createObjectURL = () => 'blob://stub';
  if (!(globalThis as any).URL.revokeObjectURL) {
    (globalThis as any).URL.revokeObjectURL = () => {};
  }
}

import { describe, it, expect, vi } from 'vitest'
import { AgendaScheduler } from '@/application/services/AgendaScheduler'
import { InsightService } from '@/application/services/InsightService'
import { HeatmapStatsService } from '@/application/services/HeatmapStatsService'
import { ThemeService } from '@/application/services/ThemeService'
import { MediaService } from '@/application/services/MediaService'
import { SearchIndexService } from '@/application/services/SearchIndexService'
import { PerformanceOptimizer } from '@/utils/performanceOptimizer'

// Neutraliser yield pour rapidité
PerformanceOptimizer.yieldToMain = async () => {}

describe('Micro services coverage', () => {
  describe('AgendaScheduler', () => {
    it('yearlyHeatmap vide retourne tableau vide', async () => {
      const sched = new AgendaScheduler({ getAll: async () => [] } as any)
      expect(await sched.yearlyHeatmap()).toEqual([])
    })
    it('yearlyHeatmap agrège plusieurs cartes même jour', async () => {
      const day = new Date().toISOString().slice(0,10)
      const sched = new AgendaScheduler({ getAll: async () => [
        { nextReview: Date.now() }, { nextReview: Date.now()+1000 }
      ] } as any)
      const res = await sched.yearlyHeatmap()
      expect(res.length).toBe(1)
      expect(res[0].day).toBe(day)
      expect(res[0].due).toBe(2)
    })
  })

  describe('InsightService', () => {
    const makeCards = (n:number, extra?: Partial<any>) => Array.from({length:n}, (_,i)=> ({ id:'c'+i, totalReviews: extra?.totalReviews ?? 10, correctReviews: extra?.correctReviews ?? 2, repetition: extra?.repetition ?? 1, nextReview: Date.now()+ (i%3)*3600_000, tags: i%2? ['tA']: ['tB'] }))
    const makeSessions = (opts:{recent?:boolean}={}) => opts.recent? [{ startTime: Date.now()-1000, averageResponseTime: 7000, cardIds:['c1','c2'], cardsStudied:2 }]: []
    it('generate produit snapshot et met en cache', async () => {
      const svc = new InsightService(()=> ({ getAll: async ()=> makeCards(10) }), ()=> ({ getRecent: async ()=> makeSessions({recent:true}) }))
      const snap1 = await svc.generate()
      const snap2 = await svc.generate() // cache hit
      expect(snap2).toBe(snap1)
      expect(svc.getCached()).toBe(snap1)
    })
    it('force=true ignore cache et régénère', async () => {
      const svc = new InsightService(()=> ({ getAll: async ()=> makeCards(5) }), ()=> ({ getRecent: async ()=> makeSessions({recent:false}) }))
      const s1 = await svc.generate()
      const s2 = await svc.generate(true)
      expect(s2).not.toBe(s1)
      expect(s2.insights.length).toBeGreaterThanOrEqual(1) // stagnation au moins
    })
  })

  describe('MediaService', () => {
    it('saveImage / getUrl via repo stub', async () => {
      const blob = new Blob(['abc'], { type:'text/plain' }) as any
  const repo = { save: vi.fn(async (_f:File)=> 'id1'), get: async ()=> ({ blob }) }
      const ms = new MediaService(repo as any)
      const id = await ms.saveImage(new File([blob], 'f.txt'))
      expect(id).toBe('id1')
      const url = await ms.getUrl('id1')
      expect(typeof url).toBe('string')
    })
  })

  describe('HeatmapStatsService', () => {
    it('fallback séquentiel agrège sur N jours', async () => {
      const now = Date.now()
      const sessions = [0,1,2].map(i=> ({ startTime: now - i*24*3600_000, cardsStudied: i+1 }))
      const svc = new HeatmapStatsService({ getRecent: async ()=> sessions } as any)
      const res = await svc.getLastNDays(5)
      expect(res.length).toBe(5)
      // Somme des trois premiers jours
      const recentSum = res.slice(-3).reduce((a,b)=> a+b.reviews,0)
      expect(recentSum).toBe(1+2+3)
    })
  })

  describe('ThemeService', () => {
    it('apply met data-theme sur root', () => {
      const root = document.documentElement
      const ts = new ThemeService()
      ts.apply('dark')
      expect(root.dataset.theme).toBe('dark')
      ts.register({ id:'custom', name:'Custom', className:'theme-custom', dark:false, palette:{ bg:'#fff', text:'#000', primary:'#123'} })
      ts.apply('custom')
      expect(root.dataset.theme).toBe('custom')
    })
  })

  describe('SearchIndexService prime abort', () => {
    it('prime() abort avant boucle ne marque pas _primed', async () => {
      const svc: any = new SearchIndexService({ getAll: async () => Array.from({length:30}, (_,i)=> ({ id:'x'+i, frontText:'A'+i, backText:'B'+i, deckId:'d' })) })
      const controller = new AbortController(); controller.abort()
      await (svc as any).prime(20, controller.signal)
      expect(svc.isPrimed()).toBe(false)
    })
  })
})
