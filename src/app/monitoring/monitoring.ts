import { logger } from '@/utils/logger'
import FLAGS from '@/utils/featureFlags'

interface QueuedEvent { type: 'error'|'rejection'|'vital'; payload: any; ts: number }
const queue: QueuedEvent[] = []
const MAX_QUEUE = 200
let flushTimer: any

function scheduleFlush(){
  if(flushTimer) return
  flushTimer = setTimeout(flush, 5000)
}

export function recordVital(metric: any){
  queue.push({ type:'vital', payload: metric, ts: Date.now() })
  if(queue.length > MAX_QUEUE) queue.splice(0, queue.length - MAX_QUEUE)
  scheduleFlush()
}

function persistLocalCopy(){
  try { localStorage.setItem('cards_monitoring_buffer', JSON.stringify(queue.slice(-100))) } catch {}
}

async function flush(){
  flushTimer = null
  if(!queue.length) return
  const batch = queue.splice(0, queue.length)
  persistLocalCopy()
  // Endpoint placeholder (remplaçable plus tard). On évite d'échouer bruyamment.
  try {
    const endpoint = (import.meta as any).env?.VITE_MONITOR_ENDPOINT
    if(endpoint){
      await fetch(endpoint, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ session: (window as any).cardsSessionId, batch }) })
    }
  } catch(e){ logger.debug('Monitoring','Flush skip', { error: String(e) }) }
}

export function installGlobalErrorCapture(){
  if((window as any).__CARDS_ERRORS_CAPTURED__) return
  ;(window as any).__CARDS_ERRORS_CAPTURED__ = true
  window.addEventListener('error', ev => {
    logger.error('GlobalError', ev.message || 'error', { filename: (ev as any).filename, lineno: (ev as any).lineno, colno: (ev as any).colno })
    queue.push({ type:'error', payload: { message: ev.message, stack: (ev.error as any)?.stack }, ts: Date.now() })
    scheduleFlush()
  })
  window.addEventListener('unhandledrejection', ev => {
    logger.error('GlobalRejection', 'Promise rejection', { reason: String(ev.reason) })
    queue.push({ type:'rejection', payload: { reason: String(ev.reason) }, ts: Date.now() })
    scheduleFlush()
  })
  if(FLAGS.diagnosticsEnabled){ logger.info('Monitoring','Global error capture installed') }
}
