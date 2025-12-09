/**
 * CircadianDashboard - Tableau de bord des rythmes circadiens
 * Affiche le chronotype, les performances par heure et les recommandations
 */

import React, { useEffect, useState } from 'react'
import { useCircadianSchedulerService } from '../../hooks/useCircadianSchedulerService'
import type { CircadianProfile, StudyRecommendation } from '../../../application/services/circadianScheduler/ICircadianSchedulerService'
import { CircadianChart } from './CircadianChart'
import { StudyTimeRecommendation } from './StudyTimeRecommendation'

interface CircadianDashboardProps {
  userId: string
  onStartStudy?: () => void
}

export const CircadianDashboard: React.FC<CircadianDashboardProps> = ({ userId, onStartStudy }) => {
  const { service, isReady } = useCircadianSchedulerService()
  const [profile, setProfile] = useState<CircadianProfile | null>(null)
  const [recommendation, setRecommendation] = useState<StudyRecommendation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Charger le profil et les recommandations
  useEffect(() => {
    if (!isReady) return

    const loadProfile = async () => {
      try {
        setLoading(true)
        setError(null)

        // Initialiser ou charger le profil
        const userProfile = await service.initializeProfile(userId)
        setProfile(userProfile)

        // Obtenir la recommandation actuelle
        const rec = await service.getStudyRecommendation(userProfile)
        setRecommendation(rec)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement')
      } finally {
        setLoading(false)
      }
    }

    void loadProfile()

    // Rafraîchir toutes les 5 minutes
    const interval = setInterval(() => {
      void loadProfile()
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [userId, isReady, service])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Analyse de vos rythmes circadiens...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">❌ {error}</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-gray-600">Aucun profil circadien disponible</p>
      </div>
    )
  }

  const getChronotypeInfo = (chronotype: string) => {
    switch (chronotype) {
      case 'lark':
        return {
          icon: '🌅',
          name: 'Alouette (Lark)',
          description: 'Vous êtes plus performant tôt le matin',
          color: 'text-orange-600'
        }
      case 'owl':
        return {
          icon: '🦉',
          name: 'Hibou (Owl)',
          description: 'Vous êtes plus performant tard le soir',
          color: 'text-purple-600'
        }
      default:
        return {
          icon: '🌤️',
          name: 'Intermédiaire',
          description: 'Votre performance est équilibrée',
          color: 'text-blue-600'
        }
    }
  }

  const chronotypeInfo = getChronotypeInfo(profile.chronotype)

  return (
    <div className="space-y-6">
      {/* Header avec chronotype */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">{chronotypeInfo.icon}</span>
              <h2 className="text-2xl font-bold">Votre Chronotype</h2>
            </div>
            <p className="text-xl font-semibold text-blue-100">{chronotypeInfo.name}</p>
            <p className="text-sm text-blue-100 mt-1">{chronotypeInfo.description}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-100">Points de données</p>
            <p className="text-3xl font-bold">{profile.totalDataPoints}</p>
          </div>
        </div>
      </div>

      {/* Recommandation actuelle */}
      {recommendation && (
        <StudyTimeRecommendation
          recommendation={recommendation}
          onStartStudy={onStartStudy}
        />
      )}

      {/* Graphique de performance */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          📊 Votre Performance par Heure
        </h3>
        <CircadianChart profile={profile} />
      </div>

      {/* Heures optimales et à éviter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Heures optimales */}
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-green-800 mb-3 flex items-center gap-2">
            <span>⚡</span>
            Heures Optimales
          </h3>
          <div className="flex flex-wrap gap-2">
            {profile.peakHours.map((hour) => (
              <span
                key={hour}
                className="px-4 py-2 bg-green-500 text-white rounded-full font-semibold"
              >
                {hour}:00
              </span>
            ))}
          </div>
          <p className="text-sm text-green-700 mt-3">
            Vous êtes le plus performant pendant ces créneaux
          </p>
        </div>

        {/* Heures à éviter */}
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-red-800 mb-3 flex items-center gap-2">
            <span>😴</span>
            Heures à Éviter
          </h3>
          <div className="flex flex-wrap gap-2">
            {profile.lowHours.map((hour) => (
              <span
                key={hour}
                className="px-4 py-2 bg-red-500 text-white rounded-full font-semibold"
              >
                {hour}:00
              </span>
            ))}
          </div>
          <p className="text-sm text-red-700 mt-3">
            Privilégiez des activités plus légères à ces moments
          </p>
        </div>
      </div>

      {/* Conseils */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-blue-800 mb-3">💡 Conseils d'Optimisation</h3>
        <ul className="space-y-2 text-blue-700">
          <li>✓ Planifiez vos sessions difficiles pendant vos heures optimales</li>
          <li>✓ Utilisez les heures basses pour réviser du contenu facile</li>
          <li>✓ Respectez des pauses régulières toutes les 25-30 minutes</li>
          <li>✓ Le service s'améliore avec plus de données collectées</li>
        </ul>
      </div>
    </div>
  )
}
