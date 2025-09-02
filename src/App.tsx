import { useEffect } from 'react'
import { FeedbackCenterProvider } from '@/ui/components/feedback/FeedbackCenter'
import { RouteTransitionLayer } from '@/ui/components/layout/RouteTransitionLayer'
import { useTheme } from '@/ui/hooks/useTheme'
import { useSettingsStore } from '@/data/stores/settingsStore'
import useApplyDynamicUISettings from '@/ui/hooks/useApplyDynamicUISettings'
import { applyAccentPalette } from '@/app/theme/palette'
import { initializeDemoDataServices } from '@/data/demoData'
import { InitializationGate } from '@/app/InitializationGate'
import { AppShell } from '@/app/AppShell'
import { RoutesContainer } from '@/app/RoutesContainer'

function App(){
  const { theme, toggleTheme } = useTheme()
  const { loadSettings, settings } = useSettingsStore()
  useApplyDynamicUISettings()
  useEffect(()=>{ applyAccentPalette(settings.accentColor || '#3b82f6') }, [settings.accentColor])
  useEffect(()=>{ const root = document.documentElement; const preset = settings.themePreset; if(!preset) return; const palettes: Record<string, Record<string,string>> = { solarized: { '--accent-color':'#268bd2','--accent-700':'#0f4b66','--bg-base':'#fdf6e3','--bg-alt':'#eee8d5','--text-base':'#073642' }, nord: { '--accent-color':'#88c0d0','--accent-700':'#40616e','--bg-base':'#2e3440','--bg-alt':'#3b4252','--text-base':'#eceff4' }, dracula: { '--accent-color':'#bd93f9','--accent-700':'#6d4ca8','--bg-base':'#282a36','--bg-alt':'#343746','--text-base':'#f8f8f2' }, gruvbox: { '--accent-color':'#fabd2f','--accent-700':'#b57614','--bg-base':'#282828','--bg-alt':'#3c3836','--text-base':'#ebdbb2' } }; const p = palettes[preset]; if(p){ Object.entries(p).forEach(([k,v])=> root.style.setProperty(k,v)) } }, [settings.themePreset])

  return (
    <FeedbackCenterProvider>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-indigo-600 text-white px-3 py-1 rounded">Aller au contenu</a>
      <RouteTransitionLayer>
        <InitializationGate theme={theme} loadSettings={loadSettings} initializeDemoData={initializeDemoDataServices}>
          <AppShell theme={theme} toggleTheme={toggleTheme}>
            <RoutesContainer />
          </AppShell>
        </InitializationGate>
      </RouteTransitionLayer>
    </FeedbackCenterProvider>
  )
}

export default App
