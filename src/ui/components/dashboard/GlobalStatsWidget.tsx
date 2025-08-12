import { useGlobalStats } from '@/ui/hooks/useGlobalStats'

export function GlobalStatsWidget() {
  const { stats, loading, error } = useGlobalStats(30000)
  if(loading && !stats) return <div className="text-xs text-gray-500">Chargement stats...</div>
  if(error && !stats) return <div className="text-xs text-red-500">{error}</div>
  if(!stats) return null
  return (
    <div className="p-3 rounded-md bg-white/60 dark:bg-gray-800/60 backdrop-blur border border-gray-200 dark:border-gray-700 text-[11px] flex flex-wrap gap-x-4 gap-y-1">
      <span>Decks <strong>{stats.totalDecks}</strong></span>
      <span>Cartes <strong>{stats.totalCards}</strong></span>
      <span>Matures <strong>{stats.matureCards}</strong></span>
      <span>Retention <strong>{(stats.averageRetention*100).toFixed(0)}%</strong></span>
      <span>Dues <strong>{stats.dueToday}</strong></span>
      <span>Sessions <strong>{stats.totalSessions}</strong></span>
      <span>Streak <strong>{stats.currentStreak}</strong></span>
      <span>Acc. sess. <strong>{(stats.avgSessionAccuracy*100).toFixed(0)}%</strong></span>
    </div>
  )
}

export default GlobalStatsWidget
