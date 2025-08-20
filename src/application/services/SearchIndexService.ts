import { aribaDB } from '@/infrastructure/persistence/dexie/AribaDB'
import { container } from '../Container'
import { CARD_REPOSITORY_TOKEN } from '@/domain/repositories/CardRepository'
import { WorkerPool } from '@/workers/WorkerPool'

function tokenize(text: string): string[]{
  return text.toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(t=> t.length>1 && t.length<40)
}

export class SearchIndexService {
  async rebuildAll(){
    await aribaDB.table('searchIndex').clear()
    const cardRepo = container.resolve<any>(CARD_REPOSITORY_TOKEN)
    const cards = await cardRepo.getAll()
    const THRESHOLD = 1500
    // Parallel path via WorkerPool
    if (cards.length >= THRESHOLD && typeof navigator !== 'undefined' && (navigator as any).hardwareConcurrency) {
      try {
        const workerModule = await import('@/workers/searchIndexWorker?worker')
        const threads = Math.min((navigator as any).hardwareConcurrency || 4, 8)
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
        return { indexedCards: cards.length, entries: entries.length, parallel: true, threads }
      } catch {
        // fallback to sequential
      }
    }
    // Sequential fallback/small set
    const bulk: any[] = []
    for (const c of cards) {
      const terms = [...tokenize(c.frontText || ''), ...tokenize(c.backText || '')]
      for (const t of terms) bulk.push({ term: t, cardId: c.id })
    }
    if (bulk.length) await (aribaDB as any).searchIndex.bulkAdd(bulk)
    return { indexedCards: cards.length, entries: bulk.length, parallel: false }
  }
  async indexCard(card: any){
    const terms = [...tokenize(card.frontText), ...tokenize(card.backText)]
    // delete old terms
    await (aribaDB as any).searchIndex.where('cardId').equals(card.id).delete()
    if(terms.length){ await (aribaDB as any).searchIndex.bulkAdd(terms.map(t=> ({ term: t, cardId: card.id }))) }
  }
  async search(query: string, opts: { ranking?: 'none' | 'tfidf' } = { ranking: 'tfidf' }){
    const qTerms = tokenize(query)
    if(!qTerms.length) return []
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
