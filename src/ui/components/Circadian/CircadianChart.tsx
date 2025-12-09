/**
 * CircadianChart - Graphique de performance circadienne sur 24h
 * Affiche l'énergie et le focus par heure avec zones colorées
 */

import React from 'react'
import type { CircadianProfile } from '../../../application/services/circadianScheduler/ICircadianSchedulerService'

interface CircadianChartProps {
  profile: CircadianProfile
}

export const CircadianChart: React.FC<CircadianChartProps> = ({ profile }) => {
  // Générer les données pour toutes les heures
  const hours = Array.from({ length: 24 }, (_, i) => i)
  
  const getData = (hour: number) => {
    const data = profile.hourlyPerformance.get(hour)
    if (!data || data.reviewCount === 0) {
      return { energyLevel: 5, focusScore: 5, hasData: false }
    }
    return { 
      energyLevel: data.energyLevel, 
      focusScore: data.focusScore,
      hasData: true 
    }
  }

  // Calculer la hauteur maximale pour normalisation
  const maxValue = 10

  return (
    <div className="w-full">
      {/* Graphique principal */}
      <div className="relative h-64 border-b-2 border-l-2 border-gray-300">
        {/* Lignes de grille horizontales */}
        {[0, 2.5, 5, 7.5, 10].map((value) => (
          <div
            key={value}
            className="absolute left-0 right-0 border-t border-gray-200"
            style={{ bottom: `${(value / maxValue) * 100}%` }}
          >
            <span className="absolute -left-8 -top-2 text-xs text-gray-500">
              {value.toFixed(0)}
            </span>
          </div>
        ))}

        {/* Barres de données */}
        <div className="absolute inset-0 flex items-end justify-around px-2">
          {hours.map((hour) => {
            const data = getData(hour)
            const isPeak = profile.peakHours.includes(hour)
            const isLow = profile.lowHours.includes(hour)
            
            return (
              <div
                key={hour}
                className="flex-1 flex flex-col items-center justify-end group relative"
              >
                {/* Barre d'énergie */}
                <div
                  className={`w-full mx-0.5 rounded-t transition-all duration-300 ${
                    isPeak
                      ? 'bg-green-500 hover:bg-green-600'
                      : isLow
                      ? 'bg-red-400 hover:bg-red-500'
                      : data.hasData
                      ? 'bg-blue-500 hover:bg-blue-600'
                      : 'bg-gray-300'
                  }`}
                  style={{
                    height: `${(data.energyLevel / maxValue) * 100}%`,
                    minHeight: data.hasData ? '8px' : '4px'
                  }}
                />
                
                {/* Tooltip au survol */}
                {data.hasData && (
                  <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                    <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
                      <p className="font-bold">{hour}:00</p>
                      <p>Énergie: {data.energyLevel.toFixed(1)}/10</p>
                      <p>Focus: {data.focusScore.toFixed(1)}/10</p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Axe des heures */}
      <div className="flex justify-around mt-2 text-xs text-gray-600">
        {hours.filter((h) => h % 3 === 0).map((hour) => (
          <span key={hour} className="w-8 text-center">
            {hour}h
          </span>
        ))}
      </div>

      {/* Légende */}
      <div className="mt-6 flex flex-wrap gap-4 justify-center text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>Heures optimales</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span>Performance normale</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-400 rounded"></div>
          <span>Heures basses</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-300 rounded"></div>
          <span>Pas de données</span>
        </div>
      </div>

      {/* Message informatif */}
      <div className="mt-4 text-center text-sm text-gray-600">
        <p>
          Les barres représentent votre niveau d'énergie estimé basé sur vos performances passées.
          Plus vous étudiez, plus les données deviennent précises.
        </p>
      </div>
    </div>
  )
}
