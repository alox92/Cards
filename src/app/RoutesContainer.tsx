import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { MOTION_VARIANTS, PERFORMANCE_STYLES } from '@/utils/performanceOptimizer'
import useDecksService from '@/ui/hooks/useDecksService'

const HomePage = lazy(() => import('@/ui/pages/HomePageOptimized'))
const DecksPage = lazy(() => import('@/ui/pages/DecksPage'))
const StudyPage = lazy(() => import('@/ui/pages/StudyPage'))
const StudyHubPage = lazy(() => import('@/ui/pages/hubs/StudyHubPage'))
const StudyWorkspace = lazy(() => import('@/features/study/workspace/StudyWorkspace'))
const AnalyticsWorkspace = lazy(() => import('@/ui/features/analytics/AnalyticsWorkspace'))
const AgendaPage = lazy(() => import('@/ui/pages/AgendaPage'))
const StatsPage = lazy(() => import('@/ui/pages/StatsPage'))
const SettingsPage = lazy(() => import('@/ui/pages/SettingsPage'))
const MediaArchivePage = lazy(() => import('@/ui/pages/MediaArchivePage'))
const AdvancedStatsPage = lazy(() => import('@/ui/pages/AdvancedStatsPage'))
const TipsPage = lazy(() => import('@/ui/pages/TipsPage').then(m=>({default: m.TipsPage})))
const StudyServiceDeckPage = lazy(() => import('@/ui/pages/StudyServiceDeckPage'))
const CardEditorPage = lazy(()=> import('@/ui/pages/CardEditorPage'))
const DeckCardsManagerPage = lazy(()=> import('@/ui/pages/DeckCardsManagerPage'))
const DebugTestPage = lazy(()=> import('@/ui/pages/DebugTestPage'))

function StudyServicePlaceholder(){
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

export function RoutesContainer(){
  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<div className="p-6 text-sm text-gray-500">Chargement...</div>}>
        <Routes>
          <Route path="/study-hub" element={<motion.div key="study-hub" variants={MOTION_VARIANTS.pageTransition} initial="initial" animate="animate" exit="exit" style={PERFORMANCE_STYLES.base}><StudyHubPage /></motion.div>} />
          <Route path="/workspace/study" element={<motion.div key="workspace-study" variants={MOTION_VARIANTS.pageTransition} initial="initial" animate="animate" exit="exit" style={PERFORMANCE_STYLES.base}><StudyWorkspace /></motion.div>} />
          <Route path="/workspace/analytics" element={<motion.div key="workspace-analytics" variants={MOTION_VARIANTS.pageTransition} initial="initial" animate="animate" exit="exit" style={PERFORMANCE_STYLES.base}><AnalyticsWorkspace /></motion.div>} />
          <Route path="/deck/:deckId/cards" element={<motion.div key="deck-cards-manager" variants={MOTION_VARIANTS.pageTransition} initial="initial" animate="animate" exit="exit" style={PERFORMANCE_STYLES.base}><DeckCardsManagerPage /></motion.div>} />
          <Route path="/" element={<motion.div key="home" variants={MOTION_VARIANTS.pageTransition} initial="initial" animate="animate" exit="exit" style={PERFORMANCE_STYLES.base}><HomePage /></motion.div>} />
          <Route path="/decks" element={<motion.div key="decks" variants={MOTION_VARIANTS.pageTransition} initial="initial" animate="animate" exit="exit" style={PERFORMANCE_STYLES.base}><DecksPage /></motion.div>} />
          <Route path="/study/:deckId" element={<motion.div key="study" variants={MOTION_VARIANTS.pageTransition} initial="initial" animate="animate" exit="exit" style={PERFORMANCE_STYLES.base}><StudyPage /></motion.div>} />
          <Route path="/study" element={<motion.div key="study-generic" variants={MOTION_VARIANTS.pageTransition} initial="initial" animate="animate" exit="exit" style={PERFORMANCE_STYLES.base}><StudyPage /></motion.div>} />
          <Route path="/stats" element={<motion.div key="stats" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}><StatsPage /></motion.div>} />
          <Route path="/settings" element={<motion.div key="settings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}><SettingsPage /></motion.div>} />
          <Route path="/tips" element={<motion.div key="tips" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}><TipsPage /></motion.div>} />
          <Route path="/card-editor/:deckId" element={<motion.div key="card-editor" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}><CardEditorPage /></motion.div>} />
          <Route path="/advanced-stats" element={<motion.div key="advanced-stats" variants={MOTION_VARIANTS.pageTransition} initial="initial" animate="animate" exit="exit" style={PERFORMANCE_STYLES.base}><AdvancedStatsPage /></motion.div>} />
          <Route path="/debug-test" element={<motion.div key="debug-test" variants={MOTION_VARIANTS.pageTransition} initial="initial" animate="animate" exit="exit" style={PERFORMANCE_STYLES.base}><DebugTestPage /></motion.div>} />
          <Route path="/agenda" element={<motion.div key="agenda" variants={MOTION_VARIANTS.pageTransition} initial="initial" animate="animate" exit="exit" style={PERFORMANCE_STYLES.base}><AgendaPage /></motion.div>} />
          <Route path="/media-archive" element={<motion.div key="media-archive" variants={MOTION_VARIANTS.pageTransition} initial="initial" animate="animate" exit="exit" style={PERFORMANCE_STYLES.base}><MediaArchivePage /></motion.div>} />
          <Route path="/study-service" element={<motion.div key="study-service" variants={MOTION_VARIANTS.pageTransition} initial="initial" animate="animate" exit="exit" style={PERFORMANCE_STYLES.base}><StudyServicePlaceholder /></motion.div>} />
          <Route path="/study-service/:deckId" element={<motion.div key="study-service-deck" variants={MOTION_VARIANTS.pageTransition} initial="initial" animate="animate" exit="exit" style={PERFORMANCE_STYLES.base}><StudyServiceDeckPage /></motion.div>} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  )
}
