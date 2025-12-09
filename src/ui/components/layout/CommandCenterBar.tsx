import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import clsx from 'clsx'
import GlobalStatsWidget from '@/ui/components/dashboard/GlobalStatsWidget'
import GlobalSearchBar from '@/ui/components/Search/GlobalSearchBar'
import { PERFORMANCE_STYLES, TIMING_CONFIGS } from '@/utils/performanceOptimizer'
import { logger } from '@/utils/logger'
import useGlobalStats from '@/ui/hooks/useGlobalStats'
import Icons from '@/ui/components/common/Icons'

interface CommandCenterBarProps {
  focusMode: boolean
  onToggleFocusMode: () => void
  theme: 'light' | 'dark' | undefined
  toggleTheme: () => void
  themePreset?: string
  onPresetChange: (preset?: string) => void
  showSearch: boolean
  navCollapsed: boolean
  devToolsSlot?: ReactNode
}

interface QuickAction {
  id: string
  icon: ReactNode
  label: string
  description?: string
  active?: boolean
  onClick: () => void
}

const QuickActionButton = memo(function QuickActionButton({ action, disableMotion }: { action: QuickAction; disableMotion: boolean }) {
  return (
    <motion.button
      type="button"
      layout
      whileHover={disableMotion ? undefined : { y: -4, rotateX: 1.2, scale: 1.01 }}
      whileTap={disableMotion ? undefined : { scale: 0.98, rotateX: 0 }}
      onClick={action.onClick}
      className={clsx(
        'group relative flex min-w-[160px] flex-1 items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors duration-200 sm:flex-none glass-tile',
        action.active
          ? 'glass-tile-active text-white'
          : 'glass-tile-muted text-gray-700 dark:text-gray-200'
      )}
      style={{
        ...PERFORMANCE_STYLES.button,
        boxShadow: action.active
          ? '0 18px 45px -25px rgba(99,102,241,0.55)'
          : '0 16px 35px -28px rgba(79,70,229,0.22)',
        borderColor: action.active ? 'rgba(99,102,241,0.55)' : undefined
      }}
      aria-pressed={action.active}
      title={action.description}
    >
      <span className="text-xl" aria-hidden>{action.icon}</span>
      <span className="flex flex-col">
        <span className="text-sm font-semibold leading-tight">{action.label}</span>
        {action.description && (
          <span className="text-[11px] font-medium text-gray-500 opacity-80 dark:text-gray-400">
            {action.description}
          </span>
        )}
      </span>
    </motion.button>
  )
})

export const CommandCenterBar = memo(function CommandCenterBar({
  focusMode,
  onToggleFocusMode,
  theme,
  toggleTheme,
  themePreset,
  onPresetChange,
  showSearch,
  navCollapsed,
  devToolsSlot
}: CommandCenterBarProps) {
  const reduceMotion = useReducedMotion()
  const statsState = useGlobalStats(30000, { logCategory: 'CommandCenterStats' })
  const [pulse, setPulse] = useState(false)

  const numberFormatter = useMemo(() => new Intl.NumberFormat('fr-FR'), [])
  const percentFormatter = useMemo(() => new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: 0 }), [])

  useEffect(() => {
    if(!statsState.lastUpdated || reduceMotion) return
    setPulse(true)
    const timeout = window.setTimeout(() => setPulse(false), 800)
    return () => window.clearTimeout(timeout)
  }, [statsState.lastUpdated, reduceMotion])

  const accentTone = useMemo(() => {
    const retention = statsState.stats?.averageRetention ?? 0
    if(retention >= 0.9){
      return {
        glow: 'rgba(16, 185, 129, 0.35)',
        border: 'rgba(16, 185, 129, 0.45)',
        overlay: 'rgba(16, 185, 129, 0.22)'
      }
    }
    if(retention >= 0.75){
      return {
        glow: 'rgba(129, 140, 248, 0.32)',
        border: 'rgba(99, 102, 241, 0.45)',
        overlay: 'rgba(79, 70, 229, 0.22)'
      }
    }
    return {
      glow: 'rgba(251, 191, 36, 0.32)',
      border: 'rgba(245, 158, 11, 0.45)',
      overlay: 'rgba(245, 158, 11, 0.18)'
    }
  }, [statsState.stats?.averageRetention])

  const lastUpdatedLabel = useMemo(() => {
    if(!statsState.lastUpdated) return null
    const formatter = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' })
    return formatter.format(statsState.lastUpdated)
  }, [statsState.lastUpdated])

  const handleFocusToggle = useCallback(() => {
    logger.info('UI', focusMode ? 'Mode focus désactivé' : 'Mode focus activé', { nextState: !focusMode })
    onToggleFocusMode()
  }, [focusMode, onToggleFocusMode])

  const handleThemeToggle = useCallback(() => {
    logger.info('UI', theme === 'dark' ? 'Passage en mode clair' : 'Passage en mode sombre', { previous: theme })
    toggleTheme()
  }, [theme, toggleTheme])

  const handlePresetChange = useCallback((value?: string) => {
    logger.info('UI', 'Preset thème appliqué', { preset: value ?? 'auto' })
    onPresetChange(value)
  }, [onPresetChange])

  const quickActions = useMemo<QuickAction[]>(() => [
    {
      id: 'focusMode',
      icon: focusMode ? <Icons.Target size="sm" /> : <Icons.Target size="sm" />,
      label: focusMode ? 'Quitter le focus' : 'Mode focus',
      description: focusMode
        ? 'Restaure la navigation et les widgets'
        : 'Masque la navigation pour une révision pure',
      active: focusMode,
      onClick: handleFocusToggle
    },
    {
      id: 'toggleTheme',
      icon: theme === 'dark' ? <Icons.Settings size="sm" /> : <Icons.Settings size="sm" />,
      label: theme === 'dark' ? 'Mode clair' : 'Mode sombre',
      description: theme === 'dark'
        ? 'Augmente la luminosité pour analyser les cartes'
        : 'Repos visuel optimisé pour les sessions longues',
      active: theme === 'dark',
      onClick: handleThemeToggle
    }
  ], [focusMode, handleFocusToggle, theme, handleThemeToggle])

  const highlightPills = useMemo(() => {
    const snapshot = statsState.stats
    if(!snapshot) return []
    const dueTone = snapshot.dueToday > 0 ? 'warning' : 'success'
    return [
      {
        id: 'dueToday',
        icon: <Icons.Clock size="sm" />,
        label: 'À réviser aujourd’hui',
        value: numberFormatter.format(snapshot.dueToday),
        tone: dueTone
      },
      {
        id: 'reviewsToday',
        icon: <Icons.Refresh size="sm" />,
        label: 'Revues du jour',
        value: numberFormatter.format(snapshot.reviewsToday),
        tone: snapshot.reviewsToday >= snapshot.newCardsToday ? 'primary' : 'warning'
      },
      {
        id: 'retention',
        icon: <Icons.TrendUp size="sm" />,
        label: 'Rétention globale',
        value: percentFormatter.format(Math.max(0, Math.min(1, snapshot.averageRetention || 0))),
        tone: snapshot.averageRetention >= 0.85 ? 'success' : snapshot.averageRetention >= 0.7 ? 'primary' : 'warning'
      },
      {
        id: 'streak',
        icon: <Icons.Zap size="sm" />,
        label: 'Streak actif',
        value: `${numberFormatter.format(snapshot.currentStreak)} j`,
        tone: snapshot.currentStreak >= 5 ? 'success' : 'primary'
      }
    ]
  }, [statsState.stats, numberFormatter, percentFormatter])

  const toneClasses: Record<string, string> = {
    primary: 'highlight-pill highlight-pill-primary',
    warning: 'highlight-pill highlight-pill-warning',
    success: 'highlight-pill highlight-pill-success'
  }

  return (
    <motion.header
      layout
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0.15 : 0.35, ease: TIMING_CONFIGS.SMOOTH_OUT }}
      className="sticky top-0 z-40 mx-auto w-full max-w-6xl px-4 pt-5 pb-3 sm:px-6 lg:px-8"
    >
      <motion.div
        layout
        className="relative overflow-hidden rounded-[32px] glass-panel"
        style={{
          boxShadow: pulse && !reduceMotion
            ? `0 30px 90px -42px ${accentTone.glow}`
            : `0 26px 70px -48px ${accentTone.glow}`,
          borderColor: accentTone.border
        }}
        transition={{ duration: reduceMotion ? 0.15 : 0.55, ease: TIMING_CONFIGS.SMOOTH_OUT }}
      >
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          animate={pulse && !reduceMotion ? { opacity: 0.55 } : { opacity: 0.22 }}
          transition={{ duration: reduceMotion ? 0.2 : 0.6, ease: TIMING_CONFIGS.SMOOTH_OUT }}
          style={{
            background: `radial-gradient(circle at 24% 18%, ${accentTone.overlay}, transparent 60%), radial-gradient(circle at 82% 15%, rgba(236,72,153,0.12), transparent 60%), radial-gradient(circle at 50% 100%, rgba(14,165,233,0.12), transparent 70%)`
          }}
        />
        <div className="relative z-10 flex flex-col gap-4 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <motion.div
              layout
              className="flex-1"
              transition={{ duration: reduceMotion ? 0.1 : 0.3, ease: TIMING_CONFIGS.SMOOTH_OUT }}
            >
              {focusMode ? (
                <motion.div
                  layout
                  className="flex items-center gap-3 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3 text-indigo-700 dark:border-indigo-400/30 dark:bg-indigo-400/10 dark:text-indigo-200"
                >
                  <span className="text-xl" aria-hidden>🔒</span>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold leading-tight">Mode focus activé</span>
                    <span className="text-[11px] text-indigo-600/80 dark:text-indigo-200/80">
                      Interface épurée, distractions réduites au minimum.
                    </span>
                  </div>
                </motion.div>
              ) : (
                <div className="flex flex-col gap-3">
                  {highlightPills.length > 0 && (
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                      {highlightPills.map(pill => (
                        <motion.div
                          layout
                          key={pill.id}
                          className={clsx('flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors duration-200', toneClasses[pill.tone])}
                          whileHover={reduceMotion ? undefined : { y: -2, scale: 1.01 }}
                          transition={{ duration: reduceMotion ? 0.15 : 0.25, ease: TIMING_CONFIGS.SMOOTH_OUT }}
                        >
                          <span className="text-lg" aria-hidden>{pill.icon}</span>
                          <div className="flex flex-col">
                            <span className="text-[11px] uppercase tracking-wide opacity-80">{pill.label}</span>
                            <span className="text-sm font-semibold">{pill.value}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                  <GlobalStatsWidget
                    stats={statsState.stats}
                    loading={statsState.loading}
                    error={statsState.error}
                    refresh={statsState.refresh}
                    lastUpdated={statsState.lastUpdated}
                    autoFetch={false}
                    variant="summary"
                  />
                </div>
              )}
            </motion.div>
            <div className="flex flex-col items-stretch justify-center gap-2 md:items-end">
              <div className="flex flex-wrap justify-end gap-2">
                {quickActions.map(action => (
                  <QuickActionButton key={action.id} action={action} disableMotion={!!reduceMotion} />
                ))}
                <div className="group flex min-w-[160px] items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-gray-700 glass-tile text-left">
                  <span className="flex items-center" aria-hidden>
                    <Icons.Image size="md" />
                  </span>
                  <div className="flex flex-1 flex-col">
                    <label htmlFor="command-center-theme" className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Preset
                    </label>
                    <select
                      id="command-center-theme"
                      value={themePreset || ''}
                      onChange={(event) => handlePresetChange(event.target.value || undefined)}
                      className="mt-0.5 w-full rounded-xl border border-white/40 bg-white/80 px-2 py-1 text-xs text-gray-700 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-white/20 dark:bg-gray-900/80 dark:text-gray-100"
                    >
                      <option value="">Automatique</option>
                      <option value="solarized">Solarized</option>
                      <option value="nord">Nord</option>
                      <option value="dracula">Dracula</option>
                      <option value="gruvbox">Gruvbox</option>
                    </select>
                  </div>
                </div>
              </div>
              {!focusMode && (
                <motion.span
                  layout
                  className="text-[11px] uppercase tracking-wide text-indigo-600/70 dark:text-indigo-300/70"
                >
                  {navCollapsed ? 'Navigation compacte' : 'Navigation étendue'}
                  {lastUpdatedLabel && ` • stats ${lastUpdatedLabel}`}
                </motion.span>
              )}
            </div>
          </div>

          {showSearch && (
            <motion.div
              layout
              initial={false}
              className="rounded-3xl border border-white/60 bg-white/80 p-3 shadow-inner shadow-indigo-500/10 backdrop-blur dark:border-white/10 dark:bg-gray-950/70"
            >
              <GlobalSearchBar />
            </motion.div>
          )}

          {devToolsSlot && (
            <motion.div layout className="-mb-2">
              {devToolsSlot}
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.header>
  )
})

export default CommandCenterBar
