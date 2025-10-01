/**
 * fetchPlus - wrapper fetch avec:
 *  - Timeout adaptatif (baseline 12s, réduit si connexion lente détectée)
 *  - AbortSignal combiné (externe + timeout)
 *  - Retente légère sur erreurs réseau transitoires (1 retry)
 *  - Heuristiques réseau (Network Information API) & batterie (Battery API) pour ajuster priorité
 */
export interface FetchPlusOptions extends RequestInit {
  timeoutMs?: number
  retry?: number
  taskPriority?: 'high' | 'normal' | 'low'
  signal?: AbortSignal
}

export async function fetchPlus(input: RequestInfo | URL, options: FetchPlusOptions = {}): Promise<Response> {
  const controller = new AbortController()
  const signals: AbortSignal[] = []
  if(options.signal) signals.push(options.signal)
  const timeoutMs = computeAdaptiveTimeout(options.timeoutMs)
  const to = setTimeout(()=> controller.abort(), timeoutMs)
  signals.push(controller.signal)
  const combined = anySignal(signals)
  const retry = options.retry ?? 1
  let attempt = 0
  let lastErr: any = null
  while(attempt <= retry){
    try {
  // Retirer champs internes non standard avant fetch
  const { timeoutMs: _t, retry: _r, taskPriority: _p, ...rest } = options
  const res = await fetch(input, { ...rest, signal: combined })
      clearTimeout(to)
      return res
    } catch(e:any) {
      lastErr = e
      if(e?.name === 'AbortError') break
      attempt++
      if(attempt > retry) break
      await wait( 150 * attempt )
    }
  }
  clearTimeout(to)
  throw lastErr || new Error('fetchPlus failed')
}

function wait(ms: number){ return new Promise(r=> setTimeout(r, ms)) }

function anySignal(signals: AbortSignal[]): AbortSignal | undefined {
  if(!signals.length) return undefined
  if((AbortSignal as any).any){ try { return (AbortSignal as any).any(signals) } catch {/* ignore */} }
  const controller = new AbortController()
  const onAbort = () => controller.abort()
  signals.forEach(s=> { if(s.aborted) controller.abort(); else s.addEventListener('abort', onAbort) })
  return controller.signal
}

function computeAdaptiveTimeout(base?: number){
  let t = base ?? 12000
  try {
    const nav: any = (navigator as any)
    const conn = nav.connection || nav.mozConnection || nav.webkitConnection
    if(conn){
      if(conn.saveData) t = Math.min(t, 8000)
      if(['slow-2g','2g'].includes(conn.effectiveType)) t = Math.min(t, 7000)
      else if(conn.effectiveType === '3g') t = Math.min(t, 9000)
    }
  } catch {/* ignore */}
  try {
    // Battery API (expérimental) – si batterie faible, réduire timeout pour échouer plus vite
    ;(navigator as any).getBattery?.().then((b: any)=>{ if(b.level < 0.15) t = Math.min(t, 8000) })
  } catch {/* ignore */}
  return t
}

// Expose simple helper pour JSON
export async function fetchJson<T=any>(input: RequestInfo | URL, options: FetchPlusOptions = {}): Promise<T> {
  const res = await fetchPlus(input, options)
  if(!res.ok) throw new Error('HTTP '+res.status)
  return res.json() as Promise<T>
}

// Marquer module
;(globalThis as any).__FETCH_PLUS__ = true
