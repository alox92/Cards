import type { StudyInsight, InsightSnapshot } from '@/domain/entities/StudyInsight'
import { eventBus } from '@/core/events/EventBus'
import { PerformanceOptimizer } from '@/utils/performanceOptimizer'

export class InsightService {
  private _cache: InsightSnapshot | null = null
  private _cacheTtlMs = 30_000

  constructor(
    private readonly cardRepoFn: () => any,
    private readonly sessionRepoFn: () => any
  ){}

  async generate(force = false): Promise<InsightSnapshot>{
    const now = Date.now()
    if(!force && this._cache && (now - this._cache.generatedAt) < this._cacheTtlMs){ return this._cache }
    const cardRepo: any = this.cardRepoFn()
    const sessionRepo: any = this.sessionRepoFn()
    const [cards, sessions] = await Promise.all([cardRepo.getAll(), sessionRepo.getRecent(200)])
    const insights: StudyInsight[] = []
    const nowTs = Date.now()

    // Parcours cartes en chunks pour ne pas bloquer le thread
    const CHUNK = 200
    for(let i=0;i<cards.length;i+=CHUNK){
      const slice = cards.slice(i, i+CHUNK)
      for(const c of slice){
        if(c.totalReviews >= 8){
          const sr = c.correctReviews / c.totalReviews
          if(sr < 0.45 && c.repetition < 3){
            insights.push({ id: 'leech:'+c.id, type: 'leech', severity: sr < 0.3? 'critical':'warn', title: 'Leech détectée', detail: `Carte ${c.id} taux réussite ${(sr*100).toFixed(0)}%`, meta: { cardId: c.id, successRate: sr }, created: nowTs })
          }
        }
      }
      await PerformanceOptimizer.yieldToMain(10)
    }
    const dueNext24 = cards.filter((c: any)=> c.nextReview <= nowTs + 24*3600*1000).length
    if(cards.length && dueNext24 / cards.length > 0.4){
      insights.push({ id: 'due_surge', type: 'due_surge', severity: dueNext24 / cards.length > 0.6 ? 'critical':'warn', title: 'Pic de révisions imminent', detail: `${dueNext24} cartes dues < 24h (${Math.round(dueNext24/cards.length*100)}%)`, meta: { dueNext24 }, created: nowTs })
    }
    const recent = sessions.find((s: any)=> nowTs - s.startTime < 48*3600*1000)
    if(!recent){
      insights.push({ id: 'stagnation', type: 'stagnation', severity: 'warn', title: 'Absence d\'activité', detail: 'Aucune session sur les 48 dernières heures', created: nowTs })
    }
    if(sessions.length){
      const last5 = sessions.slice(0,5)
      const med = median(last5.map((s:any)=> s.averageResponseTime || 0))
      if(med > 6000){ insights.push({ id: 'slow_resp', type: 'slow_response', severity: med>9000?'critical':'warn', title: 'Réponses lentes', detail: `Médiane temps réponse ${(med/1000).toFixed(1)}s`, meta: { median: med }, created: nowTs }) }
    }
    const tagCounts: Record<string, number> = {}
    for(let i=0;i<cards.length;i+=400){
      const slice = cards.slice(i,i+400)
      for(const c of slice){ for(const t of (c.tags||[])){ tagCounts[t] = (tagCounts[t]||0)+1 } }
      await PerformanceOptimizer.yieldToMain(8)
    }
    const studiedIds = new Set<string>()
    for(const s of sessions.slice(0,30)){ for(const id of (s as any).cardIds || []) studiedIds.add(id) }
    const tagStudied: Record<string, number> = {}
    for(const c of cards){ if(studiedIds.has(c.id)){ for(const t of (c.tags||[])){ tagStudied[t] = (tagStudied[t]||0)+1 } } }
    const neglected = Object.keys(tagCounts).map(t=> ({ t, ratio: (tagStudied[t]||0)/tagCounts[t], count: tagCounts[t] })).filter(x=> x.count>=5 && x.ratio < 0.15).sort((a,b)=> a.ratio - b.ratio).slice(0,2)
    for(const n of neglected){
      insights.push({ id: 'tag_gap:'+n.t, type: 'tag_gap', severity: 'info', title: 'Tag sous-travaillé', detail: `${n.t} seulement ${(n.ratio*100).toFixed(0)}% revu récemment`, meta: n, created: nowTs })
    }
    const snapshot: InsightSnapshot = { generatedAt: nowTs, insights }
    this._cache = snapshot
    try { eventBus.publish({ type: 'insights.generated', payload: { count: insights.length } }) } catch {}
    return snapshot
  }
  getCached(){ return this._cache }
  resetCache(){ this._cache = null }
}
function median(arr: number[]): number { if(!arr.length) return 0; const a = [...arr].sort((x,y)=> x-y); const mid = Math.floor(a.length/2); return a.length % 2 ? a[mid] : (a[mid-1]+a[mid])/2 }
export const INSIGHT_SERVICE_TOKEN = 'InsightService'
