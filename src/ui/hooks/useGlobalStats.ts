import { useCallback, useEffect, useRef, useState } from 'react'
import { container } from '@/application/Container'
import { STATISTICS_SERVICE_TOKEN, StatisticsService, type GlobalStatsSnapshot } from '@/application/services/StatisticsService'

/**
 * Hook global pour récupérer et rafraîchir périodiquement les statistiques.
 * - Intervalle par défaut: 30s
 * - Se met à jour aussi après événement personnalisé window.dispatchEvent(new Event('ariba:session-finished'))
 */
export function useGlobalStats(intervalMs = 30000){
  const svcRef = useRef<StatisticsService>()
  const [stats, setStats] = useState<GlobalStatsSnapshot | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if(!svcRef.current){
    svcRef.current = container.resolve<StatisticsService>(STATISTICS_SERVICE_TOKEN)
  }

  const refresh = useCallback(async () => {
    if(!svcRef.current) return
    setLoading(true); setError(null)
    try { setStats(await svcRef.current.snapshot()) } catch(e:any){ setError(e.message||'Erreur stats') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void refresh() }, [refresh])
  useEffect(() => {
    const id = setInterval(() => { void refresh() }, intervalMs)
    const handler = () => { void refresh() }
    window.addEventListener('ariba:session-finished', handler)
    return () => { clearInterval(id); window.removeEventListener('ariba:session-finished', handler) }
  }, [refresh, intervalMs])

  return { stats, loading, error, refresh }
}

export default useGlobalStats
