import { ReactNode, useEffect, useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import clsx from 'clsx'
import Navigation from '@/ui/components/Navigation/Navigation'
import { GamificationSystem } from '@/ui/components/Gamification/GamificationSystem'
import LogViewer from '@/ui/components/Diagnostics/LogViewer'
import PerformanceDiagnosticsPanel from '@/ui/components/Diagnostics/PerformanceDiagnosticsPanel'
import OfflineBanner from '@/ui/components/Connectivity/OfflineBanner'
import { useSettingsStore } from '@/data/stores/settingsStore'
import { PERFORMANCE_STYLES } from '@/utils/performanceOptimizer'
import { CommandCenterBar } from '@/ui/components/layout/CommandCenterBar'
import { logger } from '@/utils/logger'

interface AppShellProps { theme: string | undefined; toggleTheme: () => void; children: ReactNode }

export function AppShell({ theme, toggleTheme, children }: AppShellProps){
  const { settings, updateSettings } = useSettingsStore()
  const [navCollapsed, setNavCollapsed] = useState(false)
  const [focusMode, setFocusMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false
    }
    try {
      return window.localStorage.getItem('cards-focus-mode') === '1'
    } catch {
      return false
    }
  })
  const reduceMotion = useReducedMotion()
  const devMode = Boolean((import.meta as any).env?.DEV)
  const layoutTransition = useMemo(() => reduceMotion ? { duration: 0.15 } : { type: 'spring', stiffness: 240, damping: 26 }, [reduceMotion])
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    try {
      if (focusMode) {
        window.localStorage.setItem('cards-focus-mode', '1')
      } else {
        window.localStorage.removeItem('cards-focus-mode')
      }
    } catch {
      /* ignore storage errors */
    }
  }, [focusMode])
  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`} style={PERFORMANCE_STYLES.base}>
      <OfflineBanner />
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-700" style={PERFORMANCE_STYLES.base}>
        <div className="flex">
          {!focusMode && (<Navigation onThemeToggle={toggleTheme} currentTheme={(theme as any) || 'light'} onCollapseChange={setNavCollapsed} />)}
          <motion.main
            id="main"
            layout
            transition={layoutTransition}
            className={clsx(
              'flex-1 min-h-screen transition-[margin] duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]',
              focusMode ? 'lg:ml-0' : (navCollapsed ? 'lg:ml-16' : 'lg:ml-64')
            )}
            style={PERFORMANCE_STYLES.base}
          >
            {devMode && (
              <div className="pointer-events-none fixed bottom-2 right-2 z-[999] select-none rounded-full bg-black/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur">
                <span>Build:{(import.meta as any).env?.MODE}</span>
              </div>
            )}
            <CommandCenterBar
              focusMode={focusMode}
              onToggleFocusMode={() => setFocusMode(f => !f)}
              theme={theme as 'light' | 'dark' | undefined}
              toggleTheme={toggleTheme}
              themePreset={settings.themePreset}
              onPresetChange={(preset) => updateSettings({ themePreset: preset })}
              showSearch={!focusMode}
              navCollapsed={navCollapsed}
              devToolsSlot={devMode ? (
                <details className="group rounded-2xl border border-white/50 bg-white/70 px-4 py-3 text-xs shadow-md backdrop-blur dark:border-white/10 dark:bg-gray-900/70">
                  <summary className="cursor-pointer text-sm font-semibold text-indigo-600 transition-colors duration-200 group-hover:text-indigo-500 dark:text-indigo-300 dark:group-hover:text-indigo-200">
                    Journaux & Diagnostics
                  </summary>
                  <div className="mt-3 w-full max-w-3xl">
                    <LogViewer />
                  </div>
                </details>
              ) : undefined}
            />
            <div className="px-4 pb-12 pt-4 sm:px-6 lg:px-8" style={PERFORMANCE_STYLES.scroll}>
              <div className="min-h-screen rounded-[28px] bg-white/80 p-4 shadow-sm shadow-indigo-500/5 backdrop-blur dark:bg-slate-950/70">
                {children}
              </div>
            </div>
          </motion.main>
          {!focusMode && settings.gamificationEnabled && (
            <GamificationSystem 
              onLevelUp={(level) => logger.info('Gamification', `🎉 Level Up! Niveau ${level}`, { level })} 
              onAchievementUnlocked={(achievement) => logger.info('Gamification', `🏆 Achievement: ${achievement.title}`, { achievement: achievement.title })} 
              onXPGained={(xp) => logger.info('Gamification', `✨ +${xp} XP`, { xp })} 
              userId="user-001" 
              compact={settings.gamificationCompact} 
            />
          )}
        </div>
      </div>
      <PerformanceDiagnosticsPanel />
    </div>
  )
}
