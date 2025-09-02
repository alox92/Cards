// Web Worker: fuzzySearchWorker
// Reçoit { terms: string[] } et renvoie { orderedIds: string[] }
// Calcule Jaccard basé sur trigrams agrégés
import { aribaDB } from '@/infrastructure/persistence/dexie/AribaDB'

function trigrams(term: string): string[]{
  const padded = `  ${term} `
  const out: string[] = []
  for(let i=0;i<padded.length-2;i++) out.push(padded.slice(i,i+3))
  return out
}

self.onmessage = async (e: MessageEvent) => {
  const { terms } = e.data as { terms: string[] }
  if(!terms || !terms.length){ (self as any).postMessage({ orderedIds: [] }); return }
  try {
    // Agrège tous les trigrammes uniques des termes de requête
    const allTrisSet = new Set<string>()
    for(const t of terms){ for(const tri of trigrams(t)) allTrisSet.add(tri) }
    const allTris = [...allTrisSet]
  const overlapCounts: Record<string, number> = {}
  const cardTriCounts: Record<string, number> = {}
    // Batch anyOf pour limiter la taille (Dexie recommande batches raisonnables)
    const BATCH = 120
    for(let i=0;i<allTris.length;i+=BATCH){
      const batch = allTris.slice(i,i+BATCH)
      let rows: any[] = []
      try {
        rows = await (aribaDB as any).searchTrigrams.where('tri').anyOf(batch).toArray()
      } catch {
        // fallback: requêtes individuelles si anyOf non supporté sur ancien schéma
        for(const tri of batch){
          const r = await (aribaDB as any).searchTrigrams.where('tri').equals(tri).toArray().catch(()=>[])
          rows.push(...r)
        }
      }
      for(const r of rows){
        overlapCounts[r.cardId] = (overlapCounts[r.cardId]||0) + 1
        cardTriCounts[r.cardId] = (cardTriCounts[r.cardId]||0) + 1 // comptage approximatif (chaque occurrence rencontrée)
      }
      // micro-yield pour garder worker réactif si gros volume
      if(rows.length > 500) await new Promise(res=> setTimeout(res,0))
    }
    const qTrisCount = allTris.length
    const scored = Object.entries(overlapCounts).map(([cid, overlap])=> {
      const docCount = cardTriCounts[cid] || overlap
      const union = qTrisCount + docCount - overlap
      const j = union ? (overlap / union) : 0
      return { cid, jaccard: j }
    })
    scored.sort((a,b)=> b.jaccard - a.jaccard)
    ;(self as any).postMessage({ orderedIds: scored.map(s=> s.cid) })
  } catch {
    (self as any).postMessage({ orderedIds: [] })
  }
}
