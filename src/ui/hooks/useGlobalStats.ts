import { useCallback, useEffect, useRef, useState } from 'react'
import { container } from '@/application/Container'
import { STATISTICS_SERVICE_TOKEN, StatisticsService, type GlobalStatsSnapshot } from '@/application/services/StatisticsService'
import { PerformanceOptimizer } from '@/utils/performanceOptimizer'
import { FLAGS } from '@/utils/featureFlags'
import { logger, logError } from '@/utils/logger'

/**
 * Hook global pour récupérer et rafraîchir périodiquement les statistiques.
 * - Intervalle par défaut: 30s
 * - Se met à jour aussi après événement personnalisé window.dispatchEvent(new Event('ariba:session-finished'))
 */
export interface UseGlobalStatsOptions {
  enabled?: boolean
  logCategory?: string
}

export function useGlobalStats(intervalMs = 30000, options: UseGlobalStatsOptions = {}){
  const svcRef = useRef<StatisticsService>()
  const [stats, setStats] = useState<GlobalStatsSnapshot | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)
  const loadingRef = useRef(false)
  const mountedRef = useRef(true)

  const enabled = options.enabled ?? true
  const logCategory = options.logCategory ?? 'GlobalStats'
  const diagnosticsEnabled = FLAGS.diagnosticsEnabled

  if(!svcRef.current){
    svcRef.current = container.resolve<StatisticsService>(STATISTICS_SERVICE_TOKEN)
  }

  const refresh = useCallback(async () => {
    if(!svcRef.current) return
    if(loadingRef.current) return
    loadingRef.current = true
    if(mountedRef.current) setLoading(true)
    if(mountedRef.current) setError(null)
    const started = performance.now()
    try {
      const snapshot = await svcRef.current.snapshot()
      PerformanceOptimizer.scheduleIdle(() => {
        if(mountedRef.current){
          setStats(snapshot)
          setLastUpdated(Date.now())
        }
      }, 32)
      if(diagnosticsEnabled){
        logger.debug(logCategory, '📊 Snapshot rafraîchi', {
          durationMs: performance.now() - started,
          totals: {
            decks: snapshot.totalDecks,
            cards: snapshot.totalCards,
            dueToday: snapshot.dueToday,
            reviewsToday: snapshot.reviewsToday
          }
        })
      }
    } catch(e: any){
      const message = e?.message || 'Erreur lors du chargement des statistiques'
      if(mountedRef.current) setError(message)
      logError(logCategory, e, { source: 'useGlobalStats' })
    } finally {
      if(mountedRef.current) setLoading(false)
      loadingRef.current = false
    }
  }, [diagnosticsEnabled, logCategory])

  useEffect(() => () => { mountedRef.current = false }, [])

  useEffect(() => {
    if(!enabled) return
    void refresh()
  }, [refresh, enabled])
  useEffect(() => {
    if(!enabled) return
    const id = setInterval(() => { void refresh() }, intervalMs)
    const handler = () => { void refresh() }
    window.addEventListener('ariba:session-finished', handler)
    return () => { clearInterval(id); window.removeEventListener('ariba:session-finished', handler) }
  }, [refresh, intervalMs, enabled])

  return { stats, loading, error, refresh, lastUpdated }
}

export default useGlobalStats
