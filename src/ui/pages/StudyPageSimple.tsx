import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { container } from '@/application/Container'
import { DECK_SERVICE_TOKEN, DeckService } from '@/application/services/DeckService'
import { logger } from '@/utils/logger'

type StudyMode = 'quiz' | 'speed' | 'matching' | 'writing' | 'review'

const StudyPageSimple = () => {
  const navigate = useNavigate()
  const { deckId } = useParams<{ deckId: string }>()
  const [selectedMode, setSelectedMode] = useState<StudyMode | null>(null)
  const [isStudying, setIsStudying] = useState(false)
  const deckService = container.resolve<DeckService>(DECK_SERVICE_TOKEN)
  const [deckName, setDeckName] = useState<string>('')
  const [deckStats, setDeckStats] = useState<{ totalCards: number; masteredCards: number }>({ totalCards: 0, masteredCards: 0 })
  const [cards, setCards] = useState<any[]>([])

  useEffect(() => {
    let active = true
    const load = async () => {
      if (!deckId) return
      const deck = await deckService.getDeck(deckId)
      if (deck && active) {
        setDeckName(deck.name)
        // Basic stats derivation (placeholder until real stats service integration)
        const deckCards = await deckService.getDeckCards(deckId)
        setCards(deckCards)
        const mastered = deckCards.filter(c => (c as any).totalReviews > 0 && (c as any).successRate >= 0.9).length
        setDeckStats({ totalCards: deckCards.length, masteredCards: mastered })
      }
    }
    load()
    return () => { active = false }
  }, [deckId, deckService])

  const studyModes = [
    {
      id: 'quiz' as StudyMode,
      title: 'Mode Quiz',
      description: 'Questions à choix multiples avec feedback immédiat',
      icon: '📝',
      color: 'bg-blue-500'
    },
    {
      id: 'speed' as StudyMode,
      title: 'Speed Round',
      description: 'Sessions chronométrées pour améliorer la rapidité',
      icon: '⚡',
      color: 'bg-yellow-500'
    },
    {
      id: 'matching' as StudyMode,
      title: 'Jeu d\'Association',
      description: 'Glisser-déposer pour créer des associations',
      icon: '🎯',
      color: 'bg-green-500'
    },
    {
      id: 'writing' as StudyMode,
      title: 'Pratique Écrite',
      description: 'Saisie manuelle avec vérification intelligente',
      icon: '✍️',
      color: 'bg-purple-500'
    },
    {
      id: 'review' as StudyMode,
      title: 'Révision Libre',
      description: 'Parcourez vos cartes à votre rythme',
      icon: '📖',
      color: 'bg-indigo-500'
    }
  ]

  const handleStartStudy = (mode: StudyMode) => {
    setSelectedMode(mode)
    setIsStudying(true)
    logger.info('StudyPageSimple', 'Démarrage étude', { mode })
    
    // Simulation d'une session d'étude
    setTimeout(() => {
      alert(`Session d'étude ${mode} terminée ! 🎉\n\nCette fonctionnalité sera bientôt entièrement implémentée.`)
      setIsStudying(false)
      setSelectedMode(null)
    }, 3000)
  }

  const availableCards = deckId ? cards : []

  if (isStudying && selectedMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center text-white"
        >
          <div className="text-6xl mb-6">
            {studyModes.find(m => m.id === selectedMode)?.icon}
          </div>
          <h2 className="text-3xl font-bold mb-4">
            Session {studyModes.find(m => m.id === selectedMode)?.title} en cours...
          </h2>
          <div className="inline-block w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-xl opacity-90">
            Préparez-vous pour une expérience d'apprentissage optimisée !
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                🎓 Session d'Étude
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {deckName 
                  ? `Étude du paquet: ${deckName}` 
                  : 'Choisissez votre mode d\'apprentissage préféré'}
              </p>
            </div>
            
    {deckName && (
              <div className="text-right">
                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
      <span>📚 {deckStats.totalCards} cartes</span>
      <span>⭐ {deckStats.masteredCards} maîtrisées</span>
      <span>🎯 {deckStats.totalCards ? Math.round((deckStats.masteredCards / deckStats.totalCards) * 100) : 0}% de réussite</span>
                </div>
              </div>
            )}
          </div>

          {availableCards.length === 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <span className="text-2xl mr-3">⚠️</span>
                <div>
                  <h3 className="font-medium text-yellow-800 dark:text-yellow-200">
                    Aucune carte disponible
                  </h3>
                  <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                    {!deckName 
                      ? 'Sélectionnez un paquet ou créez des cartes pour commencer l\'étude.'
                      : 'Ce paquet ne contient pas encore de cartes. Ajoutez-en pour commencer l\'étude.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {!deckName ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <div className="card max-w-md mx-auto">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Sélectionnez un paquet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Choisissez un paquet de cartes pour commencer votre session d'étude
              </p>
              <button
                onClick={() => navigate('/decks')}
                className="btn-primary"
              >
                Voir mes paquets
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {studyModes.map((mode, index) => (
              <motion.div
                key={mode.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card hover:shadow-xl transition-all duration-300 cursor-pointer group"
                onClick={() => handleStartStudy(mode.id)}
              >
                <div className="text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${mode.color} text-white text-2xl mb-4 group-hover:scale-110 transition-transform`}>
                    {mode.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {mode.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {mode.description}
                  </p>
                  <div className={`inline-flex items-center px-4 py-2 rounded-full text-white text-sm font-medium ${mode.color} group-hover:shadow-lg transition-shadow`}>
                    Commencer
                    <span className="ml-2">→</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

  {deckName && availableCards.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-center"
          >
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
              <h3 className="text-xl font-bold mb-2">🤖 IA d'Apprentissage Activée</h3>
              <p className="opacity-90">
                L'algorithme SM-2 et les 7 systèmes d'optimisation analyseront vos performances 
                pour adapter automatiquement la difficulté et optimiser votre rétention.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default StudyPageSimple
