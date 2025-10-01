import { describe, it, expect, vi, beforeEach } from 'vitest'

// NOTE: D'autres fichiers de test importent déjà la vraie AribaDB (Dexie) avant ce test,
// ce qui rend un vi.mock tardif inefficace. On monkey‑patch donc l'instance après import.
interface Row { [k:string]: any }
function makeTable(){
  const data: Row[] = []
  const api: any = {
    _data: data,
    clear: async () => { data.length = 0 },
    bulkAdd: async (rows: Row[]) => { data.push(...rows) },
    add: async (row: Row) => { data.push(row) },
    put: async (row: Row) => {
      // remplace par clé logique 'term' si présente sinon push
      if(row.term){
        const idx = data.findIndex(r=> r.term === row.term)
        if(idx>=0) data[idx] = row; else data.push(row)
      } else {
        data.push(row)
      }
    },
    where(field: string){
      return { equals(val: any){ return { toArray: async () => data.filter(r=> r[field] === val), first: async () => data.find(r=> r[field] === val), delete: async () => { for(let i=data.length-1;i>=0;i--){ if(data[i][field]===val) data.splice(i,1) } } } } }
    }
  }
  return api
}

// Tables in‑memory
const searchIndex = makeTable()
const searchTrigrams = makeTable()
const searchTermStats = makeTable()
let mockCards: Array<{ id:string; frontText:string; backText:string; deckId:string }> = []
let clearCalls = 0
const originalClear = searchIndex.clear
searchIndex.clear = async () => { clearCalls++; return originalClear() }

// Stub WorkerPool pour forcer le chemin séquentiel (entries: [])
vi.mock('@/workers/WorkerPool', () => ({ WorkerPool: class { constructor(){} run(){ return Promise.resolve({ entries: [] }) } terminate(){} } }))

import { aribaDB } from '@/infrastructure/persistence/dexie/AribaDB'
import { SearchIndexService } from '@/application/services/SearchIndexService'
import { PerformanceOptimizer } from '@/utils/performanceOptimizer'

// Monkey‑patch AribaDB (après import) pour détourner uniquement les tables utilisées par le service.
const originalTable = aribaDB.table.bind(aribaDB as any)
;(aribaDB as any).cards = { count: async ()=> mockCards.length }
;(aribaDB as any).searchIndex = searchIndex
;(aribaDB as any).searchTrigrams = searchTrigrams
;(aribaDB as any).searchTermStats = searchTermStats
;(aribaDB as any).table = (name: string) => {
  if(name === 'searchIndex') return searchIndex
  if(name === 'searchTrigrams') return searchTrigrams
  if(name === 'searchTermStats') return searchTermStats
  return originalTable(name)
}

// Override coop yield pour accélérer tests et rendre l'abort plus prévisible
PerformanceOptimizer.yieldToMain = async () => { await new Promise(r=> setTimeout(r, 1)) }

const cardRepo = { getAll: async () => mockCards }
const countIndexEntries = () => searchIndex._data.length

describe('SearchIndexService bloom & abort', () => {
  beforeEach(()=> { mockCards = []; searchIndex.clear(); searchTrigrams.clear(); searchTermStats.clear() })
  it('aborte un rebuildAllAbortable rapidement', async () => {
    mockCards = Array.from({ length: 300 }, (_,i)=> ({ id:'c'+i, frontText:'Banane '+i, backText:'Fruit '+i, deckId:'d1' }))
    const svc = new SearchIndexService(cardRepo as any)
    const p = svc.rebuildAllAbortable(); (p as any).abort()
    const res = await p
    expect(res.aborted).toBe(true)
    expect(countIndexEntries()).toBeLessThan(mockCards.length)
  })
  it('réutilise la même promesse quand rebuild déjà en cours', async () => {
    mockCards = Array.from({ length: 10 }, (_,i)=> ({ id:'x'+i, frontText:'Alpha', backText:'Beta', deckId:'d1' }))
    const svc = new SearchIndexService(cardRepo as any)
  clearCalls = 0
  const p1: any = svc.rebuildAll(); const p2: any = svc.rebuildAll()
  const [res] = await Promise.all([p1,p2])
  // On attend qu'une seule passe de clear() donc un seul rebuild effectif
  expect(clearCalls).toBe(1)
    expect(res.indexedCards).toBe(10)
    expect(countIndexEntries()).toBeGreaterThan(0)
  })
  it('maybeContainsTerm positif pour terme existant via bloom incrémental', async () => {
    mockCards = [{ id:'b1', frontText:'Pomme Poire', backText:'Fruit', deckId:'d1' }]
    const svc:any = new SearchIndexService(cardRepo as any)
    svc._bloomMap = new Map(); await svc.indexCard(mockCards[0])
    expect(svc.maybeContainsTerm('b1','pomme')).toBe(true)
    expect(svc.maybeContainsTerm('zzz','pomme')).toBe(true)
  })
  it('search TF-IDF retourne des ids ordonnés', async () => {
    mockCards = [ { id:'s1', frontText:'Chat noir', backText:'Felin agile', deckId:'d1' }, { id:'s2', frontText:'Chien rapide', backText:'Animal fidèle', deckId:'d1' }, { id:'s3', frontText:'Chat tigré', backText:'Animal domestique', deckId:'d1' } ]
    const svc = new SearchIndexService(cardRepo as any)
    await svc.rebuildAll(); const res = await svc.search('chat')
    expect(res.length).toBeGreaterThan(0); expect(res[0]).toMatch(/s1|s3/)
  })
})
