import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { DemoCard } from '@/ui/components/Card/DemoCard'

const HomePage = () => {
  const navigate = useNavigate()

  const handleStartLearning = () => {
    navigate('/study')
  }

  const handleExploreDecks = () => {
    navigate('/decks')
  }

  const demoCard = { frontText: 'Hello', backText: 'Bonjour / Salut' }
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="mb-8">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
              Bienvenue sur{' '}
              <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                Ariba Flashcards
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Application de cartes flash intelligente avec 7 systèmes d'optimisation révolutionnaires 
              pour un apprentissage adaptatif et performant
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12"
          >
            <div className="card">
              <div className="text-4xl mb-4">🧠</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                IA d'Apprentissage
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Algorithme de répétition espacée avec adaptation automatique selon vos performances
              </p>
            </div>

            <div className="card">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Performance Optimisée
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                7 systèmes d'optimisation pour une expérience fluide et responsive
              </p>
            </div>

            <div className="card">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Analytics Avancées
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Suivi détaillé de vos progrès avec insights personnalisés
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="space-y-4"
          >
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                className="btn-primary px-8 py-3 text-lg"
                onClick={handleStartLearning}
              >
                Commencer l'apprentissage
              </button>
              <button 
                className="btn-secondary px-8 py-3 text-lg"
                onClick={handleExploreDecks}
              >
                Explorer les paquets
              </button>
            </div>
            
            <p className="text-sm text-gray-500 dark:text-gray-400">
              🚀 Migration Flutter → React TypeScript en cours
            </p>
          </motion.div>
        </motion.div>

        {/* Section Fonctionnalités */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="mt-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Essayez une Carte Flash Interactive
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
              Cliquez sur la carte ci-dessous pour découvrir l'expérience d'apprentissage Ariba
            </p>
            
            <div className="max-w-xs mx-auto mb-12">
              <DemoCard
                frontText={demoCard.frontText}
                backText={demoCard.backText}
              />
            </div>
          </div>

          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Modes d'Étude Innovants
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Quatre modes d'apprentissage interactifs pour maximiser votre rétention
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card text-center">
              <div className="text-3xl mb-3">📝</div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Quiz Mode</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Questions à choix multiples avec feedback immédiat
              </p>
            </div>

            <div className="card text-center">
              <div className="text-3xl mb-3">⚡</div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Speed Round</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Sessions chronométrées pour améliorer la rapidité
              </p>
            </div>

            <div className="card text-center">
              <div className="text-3xl mb-3">🎯</div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Matching Game</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Glisser-déposer pour créer des associations
              </p>
            </div>

            <div className="card text-center">
              <div className="text-3xl mb-3">✍️</div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Writing Practice</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Saisie manuelle avec vérification intelligente
              </p>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  )
}

export default HomePage
