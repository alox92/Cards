// Utilitaire simple de profilage pour Vitest
const measures: { name: string; ms: number }[] = []

export async function profile<T>(name: string, fn: () => Promise<T> | T): Promise<T> {
  const t0 = performance.now()
  try { return await fn() } finally {
    measures.push({ name, ms: performance.now() - t0 })
  }
}

export function recordProfileSummary(threshold = 50) {
  if (!measures.length) return
  // eslint-disable-next-line no-console
  console.log('\n[TestProfiler] Résultats (triés par durée desc)')
  for (const m of measures.sort((a,b)=> b.ms - a.ms)) {
    const flag = m.ms >= threshold ? '🔥' : '·'
    // eslint-disable-next-line no-console
    console.log(` ${flag} ${m.name}: ${m.ms.toFixed(1)}ms`)
  }
  const total = measures.reduce((s,m)=> s+m.ms,0)
  // eslint-disable-next-line no-console
  console.log(`[TestProfiler] Total cumulé: ${total.toFixed(1)}ms (${measures.length} mesures)\n`)
}