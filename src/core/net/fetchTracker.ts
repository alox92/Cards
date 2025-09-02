// Fetch tracker - instrumentation des requêtes réseau pour métriques réelles
let pending = 0
let total = 0
const listeners: Array<() => void> = []

export function trackFetch(){
  if((globalThis as any).__CARDS_FETCH_TRACKED__) return
  const orig = globalThis.fetch
  if(typeof orig !== 'function') return
  ;(globalThis as any).__CARDS_FETCH_TRACKED__ = true
  globalThis.fetch = async (...args: any[]) => {
    pending++
    total++
    notify()
    try {
      const res = await orig(...args as [RequestInfo, RequestInit?])
      return res
    } finally {
      pending = Math.max(0, pending - 1)
      notify()
    }
  }
}

export function getPendingRequests(){ return pending }
export function getTotalRequests(){ return total }
export function onFetchMetrics(cb: () => void){ listeners.push(cb) }
function notify(){ listeners.forEach(l=>{ try{ l() } catch{} }) }

// Auto-init
trackFetch()
