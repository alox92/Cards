import { motion } from 'framer-motion'
import { GlowButton } from '@/ui/components/Enhanced/EnhancedUILib'

const AdvancedStatsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-6xl mx-auto"
      >
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            📈 Statistiques Avancées
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Analyses détaillées de vos performances d'apprentissage
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Analytics Cards */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Performance Globale
              </h3>
              <span className="text-2xl">🎯</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Taux de réussite:</span>
                <span className="font-bold text-green-500">87%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Cartes maîtrisées:</span>
                <span className="font-bold text-blue-500">156/200</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Temps moyen:</span>
                <span className="font-bold text-purple-500">2.3s</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Progression Hebdomadaire
              </h3>
              <span className="text-2xl">📊</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Cette semaine:</span>
                <span className="font-bold text-green-500">+12%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Sessions:</span>
                <span className="font-bold text-blue-500">24</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Temps total:</span>
                <span className="font-bold text-purple-500">4h 32m</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                IA Adaptative
              </h3>
              <span className="text-2xl">🤖</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Difficulté:</span>
                <span className="font-bold text-orange-500">Adaptative</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Prédiction:</span>
                <span className="font-bold text-green-500">94% réussite</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Confiance:</span>
                <span className="font-bold text-blue-500">Élevée</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Analyse Comportementale
              </h3>
              <span className="text-2xl">🧠</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Pic de performance:</span>
                  <span className="font-bold text-blue-500">14h-16h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Mode préféré:</span>
                  <span className="font-bold text-green-500">Visuel</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Rétention:</span>
                  <span className="font-bold text-purple-500">7 jours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Effort optimal:</span>
                  <span className="font-bold text-orange-500">85%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Gamification
              </h3>
              <span className="text-2xl">🎮</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Niveau:</span>
                <span className="font-bold text-yellow-500">12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">XP Total:</span>
                <span className="font-bold text-blue-500">2,847</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Achievements:</span>
                <span className="font-bold text-purple-500">18/25</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <GlowButton
            variant="primary"
            glow
            onClick={() => window.print()}
          >
            📄 Exporter le rapport
          </GlowButton>
        </div>
      </motion.div>
    </div>
  )
}

export default AdvancedStatsPage
