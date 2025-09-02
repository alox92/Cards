// Web Vitals integration (Phase 1). Logs to console for now; can be wired to analytics later.
import { onCLS, onINP, onLCP, onFID, onTTFB, onFCP } from 'web-vitals'
import { logger } from '@/utils/logger'
import { silentCatch } from '../../utils/silentCatch'

export interface WebVitalMetric { name: string; value: number; rating: string; delta?: number }

type Reporter = (metric: WebVitalMetric)=>void

export function reportWebVitals(reporter: Reporter = defaultReporter){
  const ensureStores = () => {
    const w: any = window as any
    if(!w.__WEB_VITALS__) w.__WEB_VITALS__ = {}
    if(!w.__WEB_VITALS_HISTORY__) w.__WEB_VITALS_HISTORY__ = []
    if(!w.__WEB_VITALS_BY_NAME__) w.__WEB_VITALS_BY_NAME__ = {}
  }
  const wrap = (name: string, ratingFallback='na') => (m: any) => {
    const metric: WebVitalMetric = { name, value: m.value, rating: m.rating || ratingFallback }
    try {
      ensureStores()
      const w: any = window as any
      w.__WEB_VITALS__[name] = metric
      w.__WEB_VITALS_HISTORY__.push({ ...metric, ts: Date.now() })
      // Cap global history
      if(w.__WEB_VITALS_HISTORY__.length > 200) w.__WEB_VITALS_HISTORY__.splice(0, w.__WEB_VITALS_HISTORY__.length - 200)
      const arr = (w.__WEB_VITALS_BY_NAME__[name] ||= [])
      arr.push(metric.value)
      if(arr.length > 60) arr.splice(0, arr.length - 60)
    } catch(e){ silentCatch('webVitals.store', e) }
    try { logger.info('WebVitals', name, metric) } catch(e){ silentCatch('webVitals.log', e) }
    reporter(metric)
  }
  onCLS(wrap('CLS'))
  onLCP(wrap('LCP'))
  onFID(wrap('FID'))
  onINP(wrap('INP'))
  onTTFB(wrap('TTFB'))
  onFCP?.(wrap('FCP'))
}

function defaultReporter(metric: WebVitalMetric){
  const color = metric.rating === 'good' ? 'color: #16a34a' : metric.rating === 'needs-improvement' ? 'color: #d97706' : 'color: #dc2626'
  // eslint-disable-next-line no-console
  console.log(`%cWebVital %s: %f (%s)`, color, metric.name, metric.value, metric.rating)
}
