import { useEffect, useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import clsx from 'clsx'
import type { GlobalStatsSnapshot } from '@/application/services/StatisticsService'
import { useGlobalStats } from '@/ui/hooks/useGlobalStats'
import Icons from '../common/Icons'

interface GlobalStatsWidgetProps {
  stats?: GlobalStatsSnapshot | null
  loading?: boolean
  error?: string | null
  refresh?: () => void | Promise<void>
  autoFetch?: boolean
  variant?: 'summary' | 'extended'
  lastUpdated?: number | null
}

const summaryLayout = 'grid grid-cols-2 gap-2 sm:grid-cols-4'
const extendedLayout = 'grid gap-2 md:grid-cols-3'

export function GlobalStatsWidget({
  stats: externalStats,
  loading: externalLoading,
  error: externalError,
  refresh: externalRefresh,
  autoFetch = true,
  variant = 'summary',
  lastUpdated: externalLastUpdated
}: GlobalStatsWidgetProps = {}) {
  const { stats: hookStats, loading: hookLoading, error: hookError, refresh: hookRefresh, lastUpdated: hookLastUpdated } = useGlobalStats(30000, { enabled: autoFetch, logCategory: 'GlobalStatsWidget' })
  const reduceMotion = useReducedMotion()

  const stats = externalStats ?? hookStats
  const loading = externalLoading ?? hookLoading
  const error = externalError ?? hookError
  const refresh = externalRefresh ?? hookRefresh
  const lastUpdated = externalLastUpdated ?? hookLastUpdated ?? null

  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if(!lastUpdated) return
    setNow(Date.now())
    const id = window.setInterval(() => setNow(Date.now()), 60000)
    return () => window.clearInterval(id)
  }, [lastUpdated])

  const numberFormatter = useMemo(() => new Intl.NumberFormat('fr-FR'), [])
  const percentFormatter = useMemo(() => new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: 0 }), [])
  const timeFormatter = useMemo(() => new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }), [])

  const lastUpdatedLabel = useMemo(() => {
    if(!lastUpdated) return null
    return timeFormatter.format(lastUpdated)
  }, [lastUpdated, timeFormatter])

  const isStale = useMemo(() => {
    if(!lastUpdated) return false
    return now - lastUpdated > 5 * 60 * 1000
  }, [lastUpdated, now])

  const cards = useMemo(() => {
    if(!stats){
      return []
    }
    const summaryMetrics = [
      {
        id: 'totalDecks',
        label: 'Decks',
        value: numberFormatter.format(stats.totalDecks),
        icon: <Icons.Folder size="sm" />
      },
      {
        id: 'totalCards',
        label: 'Cartes',
        value: numberFormatter.format(stats.totalCards),
        icon: <Icons.File size="sm" />
      },
      {
        id: 'matureCards',
        label: 'Matures',
        value: numberFormatter.format(stats.matureCards),
        icon: <Icons.Check size="sm" />
      },
      {
        id: 'totalSessions',
        label: 'Sessions',
        value: numberFormatter.format(stats.totalSessions),
        icon: <Icons.Study size="sm" />
      }
    ]

    if(variant === 'summary'){
      return summaryMetrics
    }

    const qualityMetrics = [
      {
        id: 'averageRetention',
        label: 'Rétention',
        value: percentFormatter.format(Math.max(0, Math.min(1, stats.averageRetention || 0))),
        icon: <Icons.TrendUp size="sm" />
      },
      {
        id: 'accuracy',
        label: 'Précision',
        value: percentFormatter.format(Math.max(0, Math.min(1, stats.accuracy || 0))),
        icon: <Icons.Target size="sm" />
      },
      {
        id: 'avgSessionAccuracy',
        label: 'Acc. session',
        value: percentFormatter.format(Math.max(0, Math.min(1, stats.avgSessionAccuracy || 0))),
        icon: <Icons.Stats size="sm" />
      },
      {
        id: 'dueToday',
        label: 'À réviser',
        value: numberFormatter.format(stats.dueToday),
        icon: <Icons.Clock size="sm" />
      },
      {
        id: 'dueTomorrow',
        label: 'Demain',
        value: numberFormatter.format(stats.dueTomorrow),
        icon: <Icons.Clock size="sm" />
      },
      {
        id: 'reviewsToday',
        label: 'Revues du jour',
        value: numberFormatter.format(stats.reviewsToday),
        icon: <Icons.Refresh size="sm" />
      },
      {
        id: 'newCardsToday',
        label: 'Nouv. cartes',
        value: numberFormatter.format(stats.newCardsToday),
        icon: <Icons.Zap size="sm" />
      },
      {
        id: 'currentStreak',
        label: 'Streak',
        value: `${numberFormatter.format(stats.currentStreak)} j`,
        icon: <Icons.Zap size="sm" className="text-orange-500" />
      }
    ]

    return [...summaryMetrics, ...qualityMetrics]
  }, [stats, variant, numberFormatter, percentFormatter])

  const layoutClass = variant === 'extended' ? extendedLayout : summaryLayout
  const isInitialLoading = loading && !stats
  const isRefreshing = loading && !!stats

  return (
    <div className="relative rounded-3xl glass-panel p-4 text-xs text-gray-700 dark:text-slate-200">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-indigo-600/80 dark:text-indigo-300/80">
          <span>Statistiques globales</span>
          {lastUpdatedLabel && (
            <span
              className={clsx(
                'rounded-full border px-2 py-[1px] font-medium normal-case opacity-80 transition',
                isStale
                  ? 'border-amber-400/40 text-amber-500 dark:border-amber-400/20 dark:text-amber-300'
                  : 'border-indigo-400/40 text-indigo-500 dark:border-indigo-400/20 dark:text-indigo-200'
              )}
            >
              {isStale ? `à rafraîchir • ${lastUpdatedLabel}` : `à ${lastUpdatedLabel}`}
            </span>
          )}
        </div>
        {refresh && (
          <button
            type="button"
            onClick={() => { void refresh() }}
            className={clsx(
              'flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-600 shadow-sm transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60',
              'dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200 dark:hover:bg-indigo-500/20'
            )}
            disabled={loading}
          >
            {isRefreshing && (
              <span className="inline-flex h-3 w-3 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent dark:border-indigo-300" />
            )}
            {isRefreshing ? 'Actualisation…' : 'Actualiser'}
          </button>
        )}
      </div>

      {isInitialLoading && (
        <div className={clsx(layoutClass, 'animate-pulse')}>
          {Array.from({ length: variant === 'summary' ? 4 : 8 }).map((_, idx) => (
            <div
              key={`stats-skeleton-${idx}`}
              className="h-16 rounded-2xl border border-white/60 bg-white/70 shadow-sm dark:border-white/10 dark:bg-slate-900/60"
            />
          ))}
        </div>
      )}

      {!isInitialLoading && stats && (
        <div className={layoutClass}>
          {cards.map(card => (
            <motion.div
              layout
              key={card.id}
              className="flex h-full items-center gap-3 rounded-2xl glass-tile px-3 py-2 transition-colors"
              whileHover={reduceMotion ? undefined : { y: -2, scale: 1.01 }}
              transition={{ duration: reduceMotion ? 0.15 : 0.25 }}
            >
              <span className="text-lg" aria-hidden>{card.icon}</span>
              <div className="flex flex-col">
                <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400">{card.label}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{card.value}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-medium text-red-600 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      )}
    </div>
  )
}

export default GlobalStatsWidget
