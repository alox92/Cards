import { ReactNode, useState, useEffect } from 'react'
import Navigation from '@/ui/components/Navigation/Navigation'
import GlobalStatsWidget from '@/ui/components/dashboard/GlobalStatsWidget'
import GlobalSearchBar from '@/ui/components/Search/GlobalSearchBar'
import { GamificationSystem } from '@/ui/components/Gamification/GamificationSystem'
import LogViewer from '@/ui/components/Diagnostics/LogViewer'
import PerformanceDiagnosticsPanel from '@/ui/components/Diagnostics/PerformanceDiagnosticsPanel'
import OfflineBanner from '@/ui/components/Connectivity/OfflineBanner'
import { useSettingsStore } from '@/data/stores/settingsStore'
import { PERFORMANCE_STYLES } from '@/utils/performanceOptimizer'

interface AppShellProps { theme: string | undefined; toggleTheme: () => void; children: ReactNode }

export function AppShell({ theme, toggleTheme, children }: AppShellProps){
  const { settings, updateSettings } = useSettingsStore()
  const [navCollapsed, setNavCollapsed] = useState(false)
  const [focusMode, setFocusMode] = useState<boolean>(()=>{ try { return localStorage.getItem('cards-focus-mode') === '1' } catch { return false } })
  useEffect(()=>{ try { focusMode ? localStorage.setItem('cards-focus-mode','1') : localStorage.removeItem('cards-focus-mode') } catch {} }, [focusMode])
  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`} style={PERFORMANCE_STYLES.base}>
      <OfflineBanner />
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-700" style={PERFORMANCE_STYLES.base}>
        <div className="flex">
          {!focusMode && (<Navigation onThemeToggle={toggleTheme} currentTheme={(theme as any) || 'light'} onCollapseChange={setNavCollapsed} />)}
          <main id="main" className={`flex-1 transition-all duration-300 ${navCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`} style={PERFORMANCE_STYLES.base}>
            {process.env.NODE_ENV === 'development' && (<div className="fixed bottom-2 right-2 z-[999] px-3 py-1 rounded bg-black/50 text-[10px] text-white backdrop-blur select-none"><span>Build:{import.meta.env?.MODE}</span></div>)}
            <div className="p-3 flex items-center justify-between">
              <GlobalStatsWidget />
              <div className="flex gap-2 items-center">
                <button onClick={()=> setFocusMode(f=>!f)} className="px-2 py-1 text-xs rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">{focusMode?'Quitter Focus':'Mode Focus'}</button>
                <select className="text-xs bg-gray-100 dark:bg-gray-800 rounded px-2 py-1" value={settings.themePreset || ''} onChange={e=> updateSettings({ themePreset: e.target.value || undefined })}>
                  <option value="">Preset</option>
                  <option value="solarized">Solarized</option>
                  <option value="nord">Nord</option>
                  <option value="dracula">Dracula</option>
                  <option value="gruvbox">Gruvbox</option>
                </select>
                {process.env.NODE_ENV === 'development' && (<details className="ml-2"><summary className="cursor-pointer text-xs text-indigo-500">Logs</summary><div className="w-[640px] max-w-[80vw] mt-2"><LogViewer /></div></details>)}
              </div>
            </div>
            {!focusMode && (<div className="px-4 pt-4 max-w-xl w-full mx-auto sticky top-0 z-40"><GlobalSearchBar /></div>)}
            <div className="min-h-screen" style={PERFORMANCE_STYLES.scroll}>{children}</div>
          </main>
          {settings.gamificationEnabled && (
            <GamificationSystem onLevelUp={(level) => console.log(`🎉 Level Up! Niveau ${level}`)} onAchievementUnlocked={(achievement) => console.log(`🏆 Achievement: ${achievement.title}`)} onXPGained={(xp) => console.log(`✨ +${xp} XP`)} userId="user-001" compact={settings.gamificationCompact} />
          )}
        </div>
      </div>
      <PerformanceDiagnosticsPanel />
    </div>
  )
}
