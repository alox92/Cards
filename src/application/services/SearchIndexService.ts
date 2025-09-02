import { aribaDB } from '@/infrastructure/persistence/dexie/AribaDB'
import { WorkerPool } from '@/workers/WorkerPool'
import { PerformanceOptimizer } from '@/utils/performanceOptimizer'

function tokenize(text: string): string[]{
  return text.toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(t=> t.length>1 && t.length<40)
}

function trigrams(term: string): string[]{
  const padded = `  ${term} `
  const tris: string[] = []
  for(let i=0;i<padded.length-2;i++){ tris.push(padded.slice(i,i+3)) }
  return tris
}

export class SearchIndexService {
  constructor(private readonly cardRepo: any){ }

  // PROMESSE DE REBUILD EN COURS (empêche plusieurs lancements simultanés)
  private _rebuildingPromise: Promise<any> | null = null

  async rebuildAll(){
    if (this._rebuildingPromise) {
      return this._rebuildingPromise
    }
    this._rebuildingPromise = (async () => {
      try {
        // --- code original déplacé ici ---
        await aribaDB.table('searchIndex').clear()
        try { await (aribaDB as any).searchTrigrams.clear() } catch {/* may not exist on older schema */}
        const cards = await this.cardRepo.getAll()
        const THRESHOLD = 1500
        if (cards.length >= THRESHOLD && typeof navigator !== 'undefined' && (navigator as any).hardwareConcurrency) {
          try {
            const workerModule = await import('@/workers/searchIndexWorker?worker')
            const profile = (window as any).__CARDS_CPU_PROFILE__
            const hinted = profile?.poolSize
            const hc = (navigator as any).hardwareConcurrency || 4
            const threads = Math.min(hinted || hc, 8)
            const chunkSize = Math.ceil(cards.length / threads)
            const chunks: Array<Array<{ id: string; frontText: string; backText: string }>> = []
            for (let i = 0; i < cards.length; i += chunkSize) {
              const slice = cards.slice(i, i + chunkSize).map((c: any) => ({ id: c.id, frontText: c.frontText || '', backText: c.backText || '' }))
              chunks.push(slice)
            }
            const pool = new WorkerPool<{ cards: Array<{ id: string; frontText: string; backText: string }> }, { entries: Array<{ term: string; cardId: string }> }>(
              () => new workerModule.default(),
              threads
            )
            const results = await Promise.all(chunks.map((chunk) => pool.run({ cards: chunk })))
            await pool.terminate()
            const entries: Array<{ term: string; cardId: string }> = []
            for (const r of results) { if (r?.entries?.length) entries.push(...r.entries) }
            if (entries.length) await (aribaDB as any).searchIndex.bulkAdd(entries)
            const trigramRows: any[] = []
            const seen = new Set<string>()
            for (const c of cards){
              const terms = [...tokenize(c.frontText || ''), ...tokenize(c.backText || '')]
              for(const t of terms){
                for(const tri of trigrams(t)){
                  const key = tri+':'+c.id
                  if(!seen.has(key)){ seen.add(key); trigramRows.push({ tri, cardId: c.id }) }
                }
              }
            }
            if(trigramRows.length){ try { await (aribaDB as any).searchTrigrams.bulkAdd(trigramRows) } catch {/* ignore */} }
            return { indexedCards: cards.length, entries: entries.length, trigrams: trigramRows.length, parallel: true, threads }
          } catch {
            // fallback to sequential
          }
        }
        const bulk: any[] = []
        const trigramRows: any[] = []
        const seen = new Set<string>()
        const CHUNK = 120
        for(let i=0;i<cards.length;i+=CHUNK){
          const slice = cards.slice(i, i+CHUNK)
            for(const c of slice){
              const terms = [...tokenize(c.frontText || ''), ...tokenize(c.backText || '')]
              for (const t of terms) bulk.push({ term: t, cardId: c.id })
              for(const t of terms){
                for(const tri of trigrams(t)){
                  const key = tri+':'+c.id
                  if(!seen.has(key)){ seen.add(key); trigramRows.push({ tri, cardId: c.id }) }
                }
              }
            }
          await PerformanceOptimizer.yieldToMain(10)
        }
        if (bulk.length) await (aribaDB as any).searchIndex.bulkAdd(bulk)
        if(trigramRows.length){ try { await (aribaDB as any).searchTrigrams.bulkAdd(trigramRows) } catch {/* ignore */} }
        return { indexedCards: cards.length, entries: bulk.length, trigrams: trigramRows.length, parallel: false }
        // --- fin code original ---
      } finally {
        this._rebuildingPromise = null
      }
    })()
    return this._rebuildingPromise
  }
  async indexCard(card: any){
    const terms = [...tokenize(card.frontText), ...tokenize(card.backText)]
    // delete old terms
    await (aribaDB as any).searchIndex.where('cardId').equals(card.id).delete()
    await (aribaDB as any).searchTrigrams.where('cardId').equals(card.id).delete().catch(()=>{})
    if(terms.length){ await (aribaDB as any).searchIndex.bulkAdd(terms.map(t=> ({ term: t, cardId: card.id }))) }
    // Insert trigrams unique
    const trigramRows: any[] = []
    const seen = new Set<string>()
    for(const t of terms){
      for(const tri of trigrams(t)){
        const key = tri+':'+card.id
        if(!seen.has(key)){ seen.add(key); trigramRows.push({ tri, cardId: card.id }) }
      }
    }
    if(trigramRows.length){ try { await (aribaDB as any).searchTrigrams.bulkAdd(trigramRows) } catch {/* ignore */} }
  }
  async search(query: string, opts: { ranking?: 'none' | 'tfidf' | 'fuzzy' } = { ranking: 'tfidf' }){
    const qTerms = tokenize(query)
    if(!qTerms.length) return []
    // stats tracking
    try {
      for(const t of qTerms){
        const existing = await (aribaDB as any).searchTermStats.where('term').equals(t).first()
        if(existing){ existing.count += 1; await (aribaDB as any).searchTermStats.put(existing) }
        else { await (aribaDB as any).searchTermStats.add({ term: t, count: 1 }) }
      }
    } catch {/* ignore stats errors */}

    if(opts.ranking === 'fuzzy'){
      try {
        // Worker fuzzy (offload CPU)
        const workerMod = await import('@/workers/fuzzySearchWorker?worker')
        const worker = new workerMod.default()
        const payload = { terms: qTerms }
        const result: any = await new Promise((resolve, reject)=>{
          worker.onmessage = (e: MessageEvent)=> { resolve(e.data); worker.terminate() }
          worker.onerror = (e)=> { worker.terminate(); reject(e) }
          worker.postMessage(payload)
        })
        if(Array.isArray(result?.orderedIds)) return result.orderedIds
      } catch {
        // Fallback local
        const overlapCounts: Record<string, number> = {}
        const cardTriCounts: Record<string, number> = {}
        for(const qt of qTerms){
          const qTris = new Set(trigrams(qt))
          for(const tri of qTris){
            const rows = await (aribaDB as any).searchTrigrams.where('tri').equals(tri).toArray().catch(()=>[])
            for(const r of rows){ overlapCounts[r.cardId] = (overlapCounts[r.cardId]||0) + 1; cardTriCounts[r.cardId] = (cardTriCounts[r.cardId]||0) + 1 }
          }
        }
        const qTrisCount = qTerms.reduce((acc,t)=> acc + trigrams(t).length, 0)
        const scored = Object.entries(overlapCounts).map(([cid, overlap])=> {
          const docCount = cardTriCounts[cid] || overlap
            const union = qTrisCount + docCount - overlap
            const j = union ? (overlap / union) : 0
            return { cid, jaccard: j }
        })
        return scored.sort((a,b)=> b.jaccard - a.jaccard).map(s=> s.cid)
      }
    }
    // Collect postings per term
    const termPostings: Record<string, string[]> = {}
    for(const term of qTerms){
      const rows = await (aribaDB as any).searchIndex.where('term').equals(term).toArray()
      termPostings[term] = rows.map((r:any)=> r.cardId)
    }
    // Intersection base
    const sets = Object.values(termPostings).map(arr => new Set(arr))
    if(!sets.length) return []
    let candidate = [...sets[0]]
    for(const s of sets.slice(1)) candidate = candidate.filter(id=> s.has(id))
    if(opts.ranking === 'none') return candidate
    // TF-IDF scoring with real term frequency and length normalization (cosine-like)
    const N = await (aribaDB as any).cards.count()
    const tf: Record<string, Record<string, number>> = {} // term -> cardId -> freq
    const docLen: Record<string, number> = {}
    // Preload all postings for candidate docs to compute doc length
    for(const term of Object.keys(termPostings)){
      for(const cid of termPostings[term]){ if(candidate.includes(cid)){ docLen[cid] = (docLen[cid]||0) + 1 } }
    }
    for(const term of qTerms){
      tf[term] = {}
      for(const cid of termPostings[term]){ if(candidate.includes(cid)) tf[term][cid] = (tf[term][cid]||0) + 1 }
    }
    const scores: Record<string, number> = {}
    for(const cid of candidate){
      let score = 0
      for(const term of qTerms){
        const df = termPostings[term].length || 1
        const idf = Math.log((N+1)/(df)) + 1
        const termFreq = tf[term][cid] || 0
        const normTf = docLen[cid]? termFreq / docLen[cid] : termFreq
        score += normTf * idf
      }
      scores[cid] = score
    }
    return candidate.sort((a,b)=> (scores[b]||0) - (scores[a]||0))
  }
}
export const SEARCH_INDEX_SERVICE_TOKEN = 'SearchIndexService'

// Extension facultative: pré-indexer un petit lot pour warmup (utilisée par main.tsx)
;(SearchIndexService as any).prototype.prime = async function(limit = 50, signal?: AbortSignal){
  try {
    if(signal?.aborted) return
    const cards = await this.cardRepo.getAll()
    const slice = cards.slice(0, limit)
    const bulk: any[] = []
    const trigramRows: any[] = []
    const seen = new Set<string>()
    for(const c of slice){
      if(signal?.aborted) return
      const terms = [...tokenize(c.frontText || ''), ...tokenize(c.backText || '')]
      for (const t of terms) bulk.push({ term: t, cardId: c.id })
      for(const t of terms){
        for(const tri of trigrams(t)){
          const key = tri+':'+c.id
          if(!seen.has(key)){ seen.add(key); trigramRows.push({ tri, cardId: c.id }) }
        }
      }
    }
    if(bulk.length){ await (aribaDB as any).searchIndex.bulkAdd(bulk).catch(()=>{}) }
    if(trigramRows.length){ await (aribaDB as any).searchTrigrams.bulkAdd(trigramRows).catch(()=>{}) }
    ;(this as any)._primed = true
  } catch {}
}
;(SearchIndexService as any).prototype.isPrimed = function(){ return !!(this as any)._primed }
