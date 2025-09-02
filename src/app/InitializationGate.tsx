import { useEffect, useState, ReactNode } from 'react'
import { PERFORMANCE_STYLES, PerformanceOptimizer } from '@/utils/performanceOptimizer'
import { scheduleGPUWarmup } from '@/app/init/gpuWarmup'
import { reportWebVitals } from '@/app/performance/reportWebVitals'
import { logger, loggedPromise, logError } from '@/utils/logger'
import { getFPSMonitor } from '@/utils/fpsMonitor'
import { getFluidTransitionMastery } from '@/core/FluidTransitionMastery'
import { motion } from 'framer-motion'
import { DeckService, DECK_SERVICE_TOKEN } from '@/application/services/DeckService'
import { CardService, CARD_SERVICE_TOKEN } from '@/application/services/CardService'
import { container } from '@/application/Container'

interface InitializationGateProps {
  theme: string | undefined
  loadSettings: () => Promise<any>
  initializeDemoData: (deckService: DeckService, cardService: CardService) => Promise<any>
  deckService?: DeckService
  cardService?: CardService
  children: ReactNode
}

export function InitializationGate({ theme, loadSettings, initializeDemoData, deckService: extDeckService, cardService: extCardService, children }: InitializationGateProps){
  const deckService = extDeckService || container.resolve<DeckService>(DECK_SERVICE_TOKEN)
  const cardService = extCardService || container.resolve<CardService>(CARD_SERVICE_TOKEN)
  const [isLoading, setIsLoading] = useState(true)
  const [initError, setInitError] = useState<string | null>(null)

  useEffect(()=>{
    let cancelled = false
    const initializeApp = async () => {
      logger.info('App', '🚀 Démarrage de l\'initialisation de Cards', { userAgent: navigator.userAgent, timestamp: Date.now(), env: process.env.NODE_ENV })
      try {
        logger.startTimer('app-initialization')
        logger.debug('Performance', '🎮 Warmup GPU pour optimisations 120fps')
        PerformanceOptimizer.scheduleIdle(()=>{ scheduleGPUWarmup(200); if(process.env.NODE_ENV === 'development'){ getFPSMonitor().start() } },300)
        logger.debug('Settings', '⚙️  Chargement des paramètres utilisateur')
        await loggedPromise(loadSettings(), 'Settings', 'Chargement paramètres')
        logger.debug('Data', '🎯 Initialisation des données de démonstration')
        await loggedPromise(initializeDemoData(deckService, cardService), 'Data', 'Initialisation données démo')
        const perfSummary = logger.getPerformanceSummary()
        logger.info('Performance', '📊 Résumé des performances d\'initialisation', perfSummary)
        logger.info('App', '✅ Cards initialisé avec succès - GPU optimisé pour 120fps', { initDuration: logger.endTimer('app-initialization'), decksCount: 'via services', cardsCount: 'via services', theme, memoryUsage: (performance as any).memory?.usedJSHeapSize || 'non disponible' })
      } catch (error) {
        const errorMessage = 'Erreur critique lors de l\'initialisation de Cards'
        logger.critical('App', errorMessage, { error: error instanceof Error ? error.message : 'Erreur inconnue', stack: error instanceof Error ? error.stack : undefined })
        logError('App', error, { phase: 'initialization' })
        if(!cancelled) setInitError(errorMessage)
      } finally {
        if(!cancelled){ logger.debug('App', '🏁 Fin de la phase d\'initialisation'); setIsLoading(false) }
      }
    }
    initializeApp()
    if(process.env.NODE_ENV === 'development'){ reportWebVitals() }
    const handleVisibility = () => { const monitor = getFPSMonitor(); const ftm = getFluidTransitionMastery(); if(document.hidden){ monitor.pause(); ftm.pauseAll() } else { monitor.resume(); ftm.resumeAll() } }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => { cancelled = true; document.removeEventListener('visibilitychange', handleVisibility) }
  }, [loadSettings, initializeDemoData, deckService, cardService, theme])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center" style={PERFORMANCE_STYLES.base}>
        <motion.div initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }} animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} transition={{ duration: 0.5, ease: 'easeOut' }} className="text-center" style={PERFORMANCE_STYLES.base}>
          <div className="inline-block w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Chargement de Cards</h2>
          <p className="text-gray-600 dark:text-gray-400">Initialisation GPU 120fps...</p>
        </motion.div>
      </div>
    )
  }
  if (initError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 dark:from-gray-900 dark:to-red-900 flex items-center justify-center" style={PERFORMANCE_STYLES.base}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="text-center space-y-6 max-w-md mx-auto p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Erreur d'initialisation</h2>
          <p className="text-gray-600 dark:text-gray-300">{initError}</p>
          <div className="space-y-3">
            <button onClick={()=> window.location.reload()} className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">🔄 Redémarrer Cards</button>
            <button onClick={()=> logger.exportLogs()} className="w-full px-6 py-3 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors font-medium">📥 Exporter les logs</button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Consultez la console (F12) pour plus de détails</p>
        </motion.div>
      </div>
    )
  }
  return <>{children}</>
}
