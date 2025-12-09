// requestIdleCallback polyfill affiné (deadline imitation)
// Fournit un fallback plus stable que setTimeout simple pour lisibilité
export interface IdleDeadlineLike { didTimeout: boolean; timeRemaining(): number }

type IdleCb = (deadline: IdleDeadlineLike)=>void

if(typeof window !== 'undefined' && typeof window.requestIdleCallback !== 'function'){
  let scheduled: number | null = null
  window.requestIdleCallback = (cb: IdleCb, opts?: { timeout?: number }) => {
    const start = performance.now()
    const timeout = opts?.timeout ?? 1000
    const id = window.setTimeout(()=>{
      cb({
        didTimeout: performance.now() - start >= timeout,
        timeRemaining(){ return Math.max(0, 50 - (performance.now() - start)) }
      })
    }, 1)
    scheduled = id
    return id
  }
  window.cancelIdleCallback = (id: number) => { clearTimeout(id); if(scheduled === id) scheduled = null }
}

export function ensureIdle(){ /* side-effect import suffisant */ }