import { lazy, Suspense, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import useGlobalStats from '@/ui/hooks/useGlobalStats'
import { container } from '@/application/Container'
import { HEATMAP_STATS_SERVICE_TOKEN, HeatmapStatsService } from '@/application/services/HeatmapStatsService'
import Icons from '@/ui/components/common/Icons'

// Lazy charts (simulate heavy libs)
const Sparkline = lazy(()=> import('./components/Sparkline'))

export const AnalyticsWorkspace = () => {
  const { stats, loading } = useGlobalStats(60000)
  const heatmapSvc = useMemo(()=> container.resolve<HeatmapStatsService>(HEATMAP_STATS_SERVICE_TOKEN), [])
  const [recent, setRecent] = useState<any[]>([])

  // Minimal async load on demand
  async function loadRecent(){
    try {
      // On utilise getRecentSessions si exposé plus tard, sinon fallback: heatmap data transformée
      const anySvc:any = heatmapSvc as any
      if(typeof anySvc.repo?.getRecent === 'function'){
        const sessions = await anySvc.repo.getRecent(30)
        setRecent(sessions)
      } else {
        setRecent([])
      }
    } catch { setRecent([]) }
  }

  return (
    <div className="p-6 space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Icons.TrendUp size="md" />
          <span>Analytics</span>
        </h1>
        <button onClick={loadRecent} className="px-3 py-1.5 rounded bg-gray-200 dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600">Charger sessions</button>
      </header>
      <section>
        <h2 className="text-sm font-semibold mb-3 text-gray-600 dark:text-gray-300 uppercase tracking-wide">Global</h2>
        {loading && <div className="text-xs text-gray-400">Chargement…</div>}
        {stats && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Cartes" value={stats.totalCards} />
            <Metric label="À réviser" value={stats.dueToday} />
            <Metric label="Précision" value={Math.round(stats.accuracy*100)+'%'} />
            <Metric label="Streak" value={stats.currentStreak} />
          </div>
        )}
      </section>
      <section>
        <h2 className="text-sm font-semibold mb-3 text-gray-600 dark:text-gray-300 uppercase tracking-wide">Tendance</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Suspense fallback={<SkeletonLine />}> <Sparkline metric="reviews" /> </Suspense>
          <Suspense fallback={<SkeletonLine />}> <Sparkline metric="accuracy" /> </Suspense>
          <Suspense fallback={<SkeletonLine />}> <Sparkline metric="newCards" /> </Suspense>
        </div>
      </section>
      <section>
        <h2 className="text-sm font-semibold mb-3 text-gray-600 dark:text-gray-300 uppercase tracking-wide">Sessions Récentes</h2>
        {!recent.length && <div className="text-xs text-gray-400">(Vide) Cliquer sur Charger sessions.</div>}
        {recent.length>0 && (
          <ul className="divide-y divide-gray-200 dark:divide-gray-800 rounded border border-gray-200 dark:border-gray-700 overflow-hidden">
            {recent.map((s:any)=>(
              <li key={s.id} className="p-3 flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
                <span className="font-medium">{new Date(s.startTime).toLocaleDateString()}</span>
                <span>{s.cardsStudied} cartes</span>
                <span>{Math.round((s.correctAnswers/(s.cardsStudied||1))*100)}%</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

const Metric = ({ label, value }:{label:string; value: any}) => (
  <motion.div layout whileHover={{ y:-3 }} className="p-4 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm">
    <div className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-1 tabular-nums">{value}</div>
    <div className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</div>
  </motion.div>
)

const SkeletonLine = () => <div className="h-24 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />

export default AnalyticsWorkspace
