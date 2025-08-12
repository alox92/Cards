import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

// Import des composants principaux avec chemins relatifs sûrs
import Navigation from './ui/components/Navigation/Navigation'
import HomePage from './ui/pages/HomePage'
import DecksPage from './ui/pages/DecksPage'
import StudyPage from './ui/pages/StudyPage'
import StatsPage from './ui/pages/StatsPage'
import SettingsPage from './ui/pages/SettingsPage'

// Import des hooks et stores
import { useTheme } from './ui/hooks/useTheme'
import { useSettingsStore } from './data/stores/settingsStore'
import { initializeDemoDataServices } from './data/demoData'
import { container } from './application/Container'
import { DECK_SERVICE_TOKEN, DeckService } from './application/services/DeckService'
import { CARD_SERVICE_TOKEN, CardService } from './application/services/CardService'

// Logger simple intégré
const logger = {
  info: (category: string, message: string, context?: any) => {
    console.log(`🟦 [${category}] ${message}`, context || '')
  },
  error: (category: string, message: string, context?: any) => {
    console.error(`🟥 [${category}] ${message}`, context || '')
  },
  debug: (category: string, message: string, context?: any) => {
    console.debug(`🟨 [${category}] ${message}`, context || '')
  }
}

function App() {
  const { theme, toggleTheme } = useTheme()
  const { loadSettings } = useSettingsStore()
  const deckService = container.resolve<DeckService>(DECK_SERVICE_TOKEN)
  const cardService = container.resolve<CardService>(CARD_SERVICE_TOKEN)
  const [isLoading, setIsLoading] = useState(true)
  const [initError, setInitError] = useState<string | null>(null)

  useEffect(() => {
    const initializeApp = async () => {
      logger.info('App', '🚀 Démarrage de Cards')

      try {
        // Charger les paramètres
        logger.debug('Settings', '⚙️ Chargement des paramètres')
        await loadSettings()
        
        // Initialiser les données de démonstration si nécessaire
        logger.debug('Data', '🎯 Initialisation des données')
        await initializeDemoDataServices(deckService, cardService)
  const decks = await deckService.listDecks()
        // Collect total cards count
        let totalCards = 0
        for (const d of decks) {
          const deckCards = await deckService.getDeckCards(d.id)
          totalCards += deckCards.length
        }
        logger.info('App', '✅ Cards initialisé avec succès', {
          decksCount: decks.length,
          cardsCount: totalCards,
          theme
        })
        
      } catch (error) {
        const errorMessage = 'Erreur lors de l\'initialisation de Cards'
        logger.error('App', errorMessage, error)
        setInitError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    initializeApp()
  }, [loadSettings, deckService, cardService, theme])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Chargement de Cards
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Initialisation en cours...
          </p>
        </motion.div>
      </div>
    )
  }

  if (initError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 dark:from-gray-900 dark:to-red-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6 max-w-md mx-auto p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg"
        >
          <div className="text-red-500 text-6xl">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Erreur d'initialisation
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            {initError}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            🔄 Redémarrer Cards
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`}>
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="flex">
          {/* Navigation Sidebar */}
          <Navigation onThemeToggle={toggleTheme} currentTheme={theme} />
          
          {/* Main Content */}
          <main className="flex-1 lg:ml-64">
            <div className="min-h-screen">
              <AnimatePresence mode="wait">
                <Routes>
                  <Route 
                    path="/" 
                    element={
                      <motion.div
                        key="home"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
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
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <DecksPage />
                      </motion.div>
                    } 
                  />
                  <Route 
                    path="/study/:deckId?" 
                    element={
                      <motion.div
                        key="study"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
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
                    path="/debug-test" 
                    element={
                      <motion.div
                        key="debug-test"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="max-w-4xl mx-auto p-6">
                          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                            🧪 Page de Test Debug
                          </h1>
                          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                            <p className="text-gray-600 dark:text-gray-300">
                              Cette page de test sera développée pour inclure le système de logging avancé
                              une fois que l'application principale sera stable.
                            </p>
                            <button
                              onClick={() => logger.info('DebugTest', 'Test du logging simple')}
                              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              🧪 Test Logger Simple
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    } 
                  />
                </Routes>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default App
