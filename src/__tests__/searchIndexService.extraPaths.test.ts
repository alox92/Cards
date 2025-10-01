import { describe, it, expect, vi, beforeEach } from 'vitest'

// Re‑utilise la stratégie monkey‑patch du test principal sans le dupliquer entièrement.
interface Row { [k:string]: any }
function makeTable(){
  const data: Row[] = []
  const api: any = {
    _data: data,
    clear: async () => { data.length = 0 },
    bulkAdd: async (rows: Row[]) => { data.push(...rows) },
    add: async (row: Row) => { data.push(row) },
    put: async (row: Row) => { const i = row.term ? data.findIndex(r=> r.term===row.term): -1; if(i>=0) data[i]=row; else data.push(row) },
    where(field: string){
      return { equals(val: any){ return { toArray: async () => data.filter(r=> r[field] === val), first: async () => data.find(r=> r[field] === val), delete: async () => { for(let i=data.length-1;i>=0;i--){ if(data[i][field]===val) data.splice(i,1) } } } } }
    }
  }
  return api
}

// Tables spécifiques à ce fichier
const searchIndex = makeTable()
const searchTrigrams = makeTable()
const searchTermStats = makeTable()
let mockCards: Array<{ id:string; frontText:string; backText:string; deckId:string }> = []

// Force échec de l'import du worker fuzzy -> fallback local trigram dans search()
vi.mock('@/workers/fuzzySearchWorker?worker', () => { throw new Error('fuzzy worker load fail') })

import { aribaDB } from '@/infrastructure/persistence/dexie/AribaDB'
import { SearchIndexService } from '@/application/services/SearchIndexService'
import { PerformanceOptimizer } from '@/utils/performanceOptimizer'

// Monkey‑patch minimal
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
PerformanceOptimizer.yieldToMain = async () => { /* no-op pour accélérer */ }

const cardRepo = { getAll: async () => mockCards }

describe('SearchIndexService chemins supplémentaires', () => {
  beforeEach(()=> { mockCards = []; searchIndex.clear(); searchTrigrams.clear(); searchTermStats.clear() })

  it('maybeContainsTerm retourne false pour un terme absent quand bloom présent', async () => {
    mockCards = [{ id:'c1', frontText:'Alpha Beta', backText:'Gamma', deckId:'d1' }]
    const svc:any = new SearchIndexService(cardRepo as any)
    svc._bloomMap = new Map(); await svc.indexCard(mockCards[0])
    // Terme improbable (hash bits différents) – on s\'attend à false car non ajouté
    expect(svc.maybeContainsTerm('c1','zzzzzzzz')).toBe(false)
  })

  it('fuzzy ranking fallback trigram retourne des ids', async () => {
    mockCards = [
      { id:'f1', frontText:'navigation rapide', backText:'interface fluide', deckId:'d1' },
      { id:'f2', frontText:'navigateur lent', backText:'performance basse', deckId:'d1' }
    ]
    const svc = new SearchIndexService(cardRepo as any)
    await svc.rebuildAll()
  const res = await svc.search('navigat', { ranking: 'fuzzy' })
    expect(res.length).toBeGreaterThan(0)
    expect(res.some((id: string) => id === 'f1' || id === 'f2')).toBe(true)
  })

  it('prime() indexe un lot partiel et marque isPrimed()', async () => {
    mockCards = Array.from({ length: 80 }, (_,i)=> ({ id:'p'+i, frontText:'Terme'+i, backText:'Texte'+i, deckId:'dA' }))
    const svc:any = new SearchIndexService(cardRepo as any)
    expect(svc.isPrimed()).toBe(false)
    await (svc as any).prime(40)
    expect(svc.isPrimed()).toBe(true)
    // Vérifie que la table a au moins une entrée (prime partiel)
    expect(searchIndex._data.length).toBeGreaterThan(0)
    // Deck map initialisée
    const deckIds = svc.getDeckCardIds('dA')
    expect(deckIds.length).toBeGreaterThan(0)
  })
})
