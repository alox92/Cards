import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ThemeCycler } from '@/ui/components/layout/ThemeCycler'
import { RouteTransitionLayer } from '@/ui/components/layout/RouteTransitionLayer'
import { FeedbackCenterProvider } from '@/ui/components/feedback/FeedbackCenter'

// Import des composants principaux
import Navigation from '@/ui/components/Navigation/Navigation'
import GlobalStatsWidget from '@/ui/components/dashboard/GlobalStatsWidget'
import HomePage from '@/ui/pages/HomePageOptimized'
import DecksPage from '@/ui/pages/DecksPage'
import StudyPage from '@/ui/pages/StudyPage'
// Nouvelles vues meta (non encore intégrées dans ce fichier auparavant)
import StudyHubPage from '@/ui/pages/hubs/StudyHubPage'
import StudyWorkspace from '@/features/study/workspace/StudyWorkspace'
import AnalyticsWorkspace from '@/ui/features/analytics/AnalyticsWorkspace'
import AgendaPage from '@/ui/pages/AgendaPage'
import StatsPage from '@/ui/pages/StatsPage'
import SettingsPage from '@/ui/pages/SettingsPage'
import MediaArchivePage from '@/ui/pages/MediaArchivePage'
import AdvancedStatsPage from '@/ui/pages/AdvancedStatsPage'
import { TipsPage } from '@/ui/pages/TipsPage'
// Placeholder nouvelle route /study-service (évite 404 + future impl)
import StudyServiceDeckPage from '@/ui/pages/StudyServiceDeckPage'
import useDecksService from '@/ui/hooks/useDecksService'
const StudyServicePlaceholder = () => {
  const { decks, loading } = useDecksService()
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Mode Étude (Liste Rapide)</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Sélectionnez un deck pour ouvrir la vue liste rapide (création inline + navigation clavier) ou basculer en mode session classique.</p>
      {loading && <div className="text-sm">Chargement...</div>}
      {!loading && decks.length===0 && <div className="text-sm text-gray-500">Aucun deck.</div>}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        {decks.map(d => (
          <a key={d.id} href={`/study-service/${d.id}`} className="block p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors">
            <div className="flex items-center gap-2 mb-1"><span className="text-xl">{d.icon||'📚'}</span><span className="font-medium text-gray-800 dark:text-gray-100 truncate">{d.name}</span></div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400">{d.totalCards} cartes · {d.masteredCards} maîtrisées</div>
          </a>
        ))}
      </div>
    </div>
  )
}
import CardEditorPage from '@/ui/pages/CardEditorPage'
import DeckCardsManagerPage from '@/ui/pages/DeckCardsManagerPage'
// Pages démo supprimées définitivement

// Import des nouveaux composants avancés
import { GamificationSystem } from '@/ui/components/Gamification/GamificationSystem'
import GlobalSearchBar from '@/ui/components/Search/GlobalSearchBar'
// UltraSmoothTest retiré
import DebugTestPage from '@/ui/pages/DebugTestPage'

// Import des hooks et providers
import { useTheme } from '@/ui/hooks/useTheme'
// import { SystemIntegrationMaster } from '@/core/SystemIntegrationMaster'

// Import des optimisations performance 120fps
import { PerformanceOptimizer, MOTION_VARIANTS, PERFORMANCE_STYLES } from '@/utils/performanceOptimizer'

// Import du système de logging avancé
import { logger, loggedPromise, logError } from '@/utils/logger'

// Import des stores
import { useSettingsStore } from '@/data/stores/settingsStore'
import useApplyDynamicUISettings from '@/ui/hooks/useApplyDynamicUISettings'
// Legacy stores deckStore/cardStore supprimés de cette page (migration services)
import { initializeDemoDataServices } from '@/data/demoData'
import { container } from '@/application/Container'
import { DECK_SERVICE_TOKEN, DeckService } from '@/application/services/DeckService'
import { CARD_SERVICE_TOKEN, CardService } from '@/application/services/CardService'
import LogViewer from '@/ui/components/Diagnostics/LogViewer'
import { getFPSMonitor } from '@/utils/fpsMonitor'
import PerformanceDiagnosticsPanel from '@/ui/components/Diagnostics/PerformanceDiagnosticsPanel'
import { getFluidTransitionMastery } from '@/core/FluidTransitionMastery'

function App() {
  const { theme, toggleTheme } = useTheme()
  const { loadSettings, settings, updateSettings } = useSettingsStore()
  const deckService = container.resolve<DeckService>(DECK_SERVICE_TOKEN)
  const cardService = container.resolve<CardService>(CARD_SERVICE_TOKEN)
  const [isLoading, setIsLoading] = useState(true)
  const [initError, setInitError] = useState<string | null>(null)
  // const [systemMaster] = useState(() => new SystemIntegrationMaster())
  const [navCollapsed, setNavCollapsed] = useState(false)
  // Focus mode (persisté)
  const [focusMode, setFocusMode] = useState<boolean>(() => {
    try { return localStorage.getItem('ariba-focus-mode') === '1' } catch { return false }
  })

  // Appliquer dynamiquement les réglages UI (zoom, accent, police...)
  useApplyDynamicUISettings()

  // Génération palette dynamique HSL autour de accentColor (remplace ancien RGB lighten/darken)
  useEffect(() => {
    const root = document.documentElement
    const hex = settings.accentColor || '#3b82f6'
    const clean = hex.replace('#','')
    if(!/^([0-9a-fA-F]{6})$/.test(clean)) return
    const r = parseInt(clean.substring(0,2),16)/255
    const g = parseInt(clean.substring(2,4),16)/255
    const b = parseInt(clean.substring(4,6),16)/255
    const max = Math.max(r,g,b), min = Math.min(r,g,b)
    let h = 0, s = 0
    const l = (max+min)/2
    const d = max-min
    if(d!==0){
      s = l > .5 ? d/(2-max-min) : d/(max+min)
      switch(max){
        case r: h = (g-b)/d + (g < b ? 6 : 0); break
        case g: h = (b-r)/d + 2; break
        case b: h = (r-g)/d + 4; break
      }
      h /= 6
    }
    const toHex = (R:number,G:number,B:number)=>'#'+[R,G,B].map(v=>{
      const cl = Math.round(Math.min(255, Math.max(0, v)))
      return cl.toString(16).padStart(2,'0')
    }).join('')
    const hslToHex = (hh:number, ss:number, ll:number)=>{
      const hue2rgb = (p:number, q:number, t:number) => {
        if(t < 0) t += 1
        if(t > 1) t -= 1
        if(t < 1/6) return p + (q - p) * 6 * t
        if(t < 1/2) return q
        if(t < 2/3) return p + (q - p) * (2/3 - t) * 6
        return p
      }
      let r2:number,g2:number,b2:number
      if(ss===0){
        r2=g2=b2=ll
      } else {
        const q = ll < .5 ? ll * (1 + ss) : ll + ss - ll*ss
        const p = 2 * ll - q
        r2 = hue2rgb(p,q,hh + 1/3)
        g2 = hue2rgb(p,q,hh)
        b2 = hue2rgb(p,q,hh - 1/3)
      }
      return toHex(r2*255,g2*255,b2*255)
    }
    // Crée une échelle en modifiant la lightness tout en gardant hue & saturation
    const lightnessScale = [0.9,0.8,0.7,0.6,0.5,0.4,0.32,0.24,0.16] // 100 -> 900
    lightnessScale.forEach((L, idx) => {
      const name = `--accent-${(idx+1)*100}`
      root.style.setProperty(name, hslToHex(h, s, L))
    })
    root.style.setProperty('--accent-h', (h*360).toFixed(1))
    root.style.setProperty('--accent-s', (s*100).toFixed(1)+'%')
    root.style.setProperty('--accent-l', (l*100).toFixed(1)+'%')
  }, [settings.accentColor])

  // Application des presets thèmes (Solarized, Nord, Dracula...)
  useEffect(() => {
    const root = document.documentElement
    const preset = settings.themePreset
    if(!preset){ return }
    const palettes: Record<string, Record<string,string>> = {
      solarized: { '--accent-color':'#268bd2','--accent-700':'#0f4b66','--bg-base':'#fdf6e3','--bg-alt':'#eee8d5','--text-base':'#073642' },
      nord: { '--accent-color':'#88c0d0','--accent-700':'#40616e','--bg-base':'#2e3440','--bg-alt':'#3b4252','--text-base':'#eceff4' },
      dracula: { '--accent-color':'#bd93f9','--accent-700':'#6d4ca8','--bg-base':'#282a36','--bg-alt':'#343746','--text-base':'#f8f8f2' },
      gruvbox: { '--accent-color':'#fabd2f','--accent-700':'#b57614','--bg-base':'#282828','--bg-alt':'#3c3836','--text-base':'#ebdbb2' }
    }
    const p = palettes[preset]
    if(p){ Object.entries(p).forEach(([k,v])=> root.style.setProperty(k,v)) }
  }, [settings.themePreset])

  // Persistance focus mode
  useEffect(() => {
    try {
      if(focusMode) localStorage.setItem('ariba-focus-mode','1')
      else localStorage.removeItem('ariba-focus-mode')
    } catch {}
  }, [focusMode])

  useEffect(() => {
    const initializeApp = async () => {
      logger.info('App', '🚀 Démarrage de l\'initialisation de Cards', {
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
        env: process.env.NODE_ENV
      })

      try {
        logger.startTimer('app-initialization')

        // 🚀 WARMUP GPU pour animations ultra-fluides
        logger.debug('Performance', '🎮 Warmup GPU pour optimisations 120fps')
        // Warmup GPU décalé pour ne pas bloquer first paint
        PerformanceOptimizer.scheduleIdle(()=>{
          loggedPromise(Promise.resolve(PerformanceOptimizer.warmupGPU()), 'Performance','GPU Warmup (idle)')
          // Démarrer surveillance FPS en dev
          if(process.env.NODE_ENV === 'development'){
            getFPSMonitor().start()
          }
        },300)
        
        // Charger les paramètres
        logger.debug('Settings', '⚙️  Chargement des paramètres utilisateur')
        await loggedPromise(
          loadSettings(),
          'Settings',
          'Chargement paramètres'
        )
        
        // Initialiser les données de démonstration si nécessaire
        logger.debug('Data', '🎯 Initialisation des données de démonstration')
        await loggedPromise(
          initializeDemoDataServices(deckService, cardService),
          'Data',
          'Initialisation données démo'
        )

        // Log des métriques de performance
        const perfSummary = logger.getPerformanceSummary()
        logger.info('Performance', '📊 Résumé des performances d\'initialisation', perfSummary)
        
        // Charger les données de base
        logger.info('App', '✅ Cards initialisé avec succès - GPU optimisé pour 120fps', {
          initDuration: logger.endTimer('app-initialization'),
          // Comptes approximatifs (services)
          // On ne charge pas tout ici pour éviter un await supplémentaire; valeurs placeholders
          decksCount: 'via services',
          cardsCount: 'via services',
          theme,
          memoryUsage: (performance as any).memory?.usedJSHeapSize || 'non disponible'
        })
        
      } catch (error) {
        const errorMessage = 'Erreur critique lors de l\'initialisation de Cards'
        logger.critical('App', errorMessage, {
          error: error instanceof Error ? error.message : 'Erreur inconnue',
          stack: error instanceof Error ? error.stack : undefined
        })
        logError('App', error, { phase: 'initialization' })
        setInitError(errorMessage)
      } finally {
        logger.debug('App', '🏁 Fin de la phase d\'initialisation')
        setIsLoading(false)
      }
    }

    initializeApp()
    // Gestion visibilité onglet: pause / reprise FPS monitor & futures animations
    const handleVisibility = () => {
      const monitor = getFPSMonitor()
      const ftm = getFluidTransitionMastery()
      if(document.hidden){
        monitor.pause()
        ftm.pauseAll()
      } else {
        monitor.resume()
        ftm.resumeAll()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => { document.removeEventListener('visibilitychange', handleVisibility) }
  }, [loadSettings, deckService, cardService, theme])

  if (isLoading) {
    return (
      <div 
        className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center"
        style={PERFORMANCE_STYLES.base}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center"
          style={PERFORMANCE_STYLES.base}
        >
          <div className="inline-block w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Chargement de Cards
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Initialisation GPU 120fps...
          </p>
        </motion.div>
      </div>
    )
  }

  if (initError) {
    return (
      <div 
        className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 dark:from-gray-900 dark:to-red-900 flex items-center justify-center"
        style={PERFORMANCE_STYLES.base}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-6 max-w-md mx-auto p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg"
        >
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Erreur d'initialisation
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            {initError}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              🔄 Redémarrer Cards
            </button>
            <button
              onClick={() => logger.exportLogs()}
              className="w-full px-6 py-3 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors font-medium"
            >
              📥 Exporter les logs
            </button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Consultez la console (F12) pour plus de détails
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <FeedbackCenterProvider>
    <ThemeCycler enabled periodMs={10000} />
    <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`} style={PERFORMANCE_STYLES.base}>
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-700" style={PERFORMANCE_STYLES.base}>
        <RouteTransitionLayer>
        <div className="flex">
          {/* Navigation Sidebar */}
          {!focusMode && (
            <Navigation onThemeToggle={toggleTheme} currentTheme={theme} onCollapseChange={setNavCollapsed} />
          )}
          
          {/* Main Content */}
          <main className={`flex-1 transition-all duration-300 ${navCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`} style={PERFORMANCE_STYLES.base}>
            {/* Overlay debug conditionnelle (désactivable) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="fixed bottom-2 right-2 z-[999] px-3 py-1 rounded bg-black/50 text-[10px] text-white backdrop-blur select-none">
                <span>Build:{import.meta.env?.MODE}</span>
              </div>
            )}
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
                {process.env.NODE_ENV === 'development' && (
                  <details className="ml-2">
                    <summary className="cursor-pointer text-xs text-indigo-500">Logs</summary>
                    <div className="w-[640px] max-w-[80vw] mt-2">
                      <LogViewer />
                    </div>
                  </details>
                )}
              </div>
            </div>
            {!focusMode && (
              <div className="px-4 pt-4 max-w-xl w-full mx-auto sticky top-0 z-40">
                <GlobalSearchBar />
              </div>
            )}
            <div className="min-h-screen" style={PERFORMANCE_STYLES.scroll}>
              <AnimatePresence mode="wait">
                <Routes>
                  {/* Routes META ajoutées (Hub / Workspace / Analytics) */}
                  <Route 
                    path="/study-hub" 
                    element={
                      <motion.div
                        key="study-hub"
                        variants={MOTION_VARIANTS.pageTransition}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        style={PERFORMANCE_STYLES.base}
                      >
                        <StudyHubPage />
                      </motion.div>
                    } 
                  />
                  <Route 
                    path="/workspace/study" 
                    element={
                      <motion.div
                        key="workspace-study"
                        variants={MOTION_VARIANTS.pageTransition}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        style={PERFORMANCE_STYLES.base}
                      >
                        <StudyWorkspace />
                      </motion.div>
                    } 
                  />
                  <Route 
                    path="/workspace/analytics" 
                    element={
                      <motion.div
                        key="workspace-analytics"
                        variants={MOTION_VARIANTS.pageTransition}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        style={PERFORMANCE_STYLES.base}
                      >
                        <AnalyticsWorkspace />
                      </motion.div>
                    } 
                  />
                  <Route
                    path="/deck/:deckId/cards"
                    element={
                      <motion.div
                        key="deck-cards-manager"
                        variants={MOTION_VARIANTS.pageTransition}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        style={PERFORMANCE_STYLES.base}
                      >
                        <DeckCardsManagerPage />
                      </motion.div>
                    }
                  />
                  <Route 
                    path="/" 
                    element={
                      <motion.div
                        key="home"
                        variants={MOTION_VARIANTS.pageTransition}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        style={PERFORMANCE_STYLES.base}
                      >
                        <HomePage />
                      </motion.div>
                    } 
                  />
                  <Route 
                    path="/decks" 
                    element={
                      <motion.div
                        key="decks"
                        variants={MOTION_VARIANTS.pageTransition}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        style={PERFORMANCE_STYLES.base}
                      >
                        <DecksPage />
                      </motion.div>
                    } 
                  />
                  <Route 
                    path="/study/:deckId" 
                    element={
                      <motion.div
                        key="study"
                        variants={MOTION_VARIANTS.pageTransition}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        style={PERFORMANCE_STYLES.base}
                      >
                        <StudyPage />
                      </motion.div>
                    } 
                  />
                  <Route 
                    path="/study" 
                    element={
                      <motion.div
                        key="study-generic"
                        variants={MOTION_VARIANTS.pageTransition}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        style={PERFORMANCE_STYLES.base}
                      >
                        <StudyPage />
                      </motion.div>
                    } 
                  />
                  <Route 
                    path="/stats" 
                    element={
                      <motion.div
                        key="stats"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <StatsPage />
                      </motion.div>
                    } 
                  />
                  <Route 
                    path="/settings" 
                    element={
                      <motion.div
                        key="settings"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <SettingsPage />
                      </motion.div>
                    } 
                  />
                  <Route 
                    path="/tips" 
                    element={
                      <motion.div
                        key="tips"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <TipsPage />
                      </motion.div>
                    } 
                  />
                  <Route 
                    path="/card-editor/:deckId" 
                    element={
                      <motion.div
                        key="card-editor"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <CardEditorPage />
                      </motion.div>
                    } 
                  />
                  <Route 
                    path="/advanced-stats" 
                    element={
                      <motion.div
                        key="advanced-stats"
                        variants={MOTION_VARIANTS.pageTransition}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        style={PERFORMANCE_STYLES.base}
                      >
                        <AdvancedStatsPage />
                      </motion.div>
                    } 
                  />
                  <Route 
                    path="/debug-test" 
                    element={
                      <motion.div
                        key="debug-test"
                        variants={MOTION_VARIANTS.pageTransition}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        style={PERFORMANCE_STYLES.base}
                      >
                        <DebugTestPage />
                      </motion.div>
                    } 
                  />
                  <Route 
                    path="/agenda" 
                    element={
                      <motion.div
                        key="agenda"
                        variants={MOTION_VARIANTS.pageTransition}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        style={PERFORMANCE_STYLES.base}
                      >
                        <AgendaPage />
                      </motion.div>
                    } 
                  />
                  <Route 
                    path="/media-archive" 
                    element={
                      <motion.div
                        key="media-archive"
                        variants={MOTION_VARIANTS.pageTransition}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        style={PERFORMANCE_STYLES.base}
                      >
                        <MediaArchivePage />
                      </motion.div>
                    } 
                  />
                    <Route
                      path="/study-service"
                      element={
                        <motion.div
                          key="study-service"
                          variants={MOTION_VARIANTS.pageTransition}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          style={PERFORMANCE_STYLES.base}
                        >
                          <StudyServicePlaceholder />
                        </motion.div>
                      }
                    />
                    <Route
                      path="/study-service/:deckId"
                      element={
                        <motion.div
                          key="study-service-deck"
                          variants={MOTION_VARIANTS.pageTransition}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          style={PERFORMANCE_STYLES.base}
                        >
                          <StudyServiceDeckPage />
                        </motion.div>
                      }
                    />
                </Routes>
              </AnimatePresence>
            </div>
          </main>

          {/* Système de Gamification Global (optionnel) */}
          {settings.gamificationEnabled && (
            <GamificationSystem
              onLevelUp={(level) => console.log(`🎉 Level Up! Niveau ${level}`)}
              onAchievementUnlocked={(achievement) => console.log(`🏆 Achievement: ${achievement.title}`)}
              onXPGained={(xp) => console.log(`✨ +${xp} XP`)}
              userId="user-001"
              compact={settings.gamificationCompact}
            />
          )}
        </div>
        </RouteTransitionLayer>
      </div>
  <PerformanceDiagnosticsPanel />
    </div>
    </FeedbackCenterProvider>
  )
}

export default App
