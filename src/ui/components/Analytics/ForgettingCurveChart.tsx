import React, { useMemo, useEffect, useState } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Card } from '@/domain/entities/Card'
import { useForgettingCurveService } from '@/ui/hooks/useForgettingCurveService'
import type { ForgettingCurveData, RetentionDataPoint } from '@/application/services/forgettingCurve'

// Enregistrer les composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface ForgettingCurveChartProps {
  card?: Card
  cards?: Card[]
  showPrediction?: boolean
  predictionDays?: number
  className?: string
}

/**
 * Graphique des courbes d'oubli d'Ebbinghaus
 * Visualise la rétention au fil du temps avec prédictions
 */
export const ForgettingCurveChart: React.FC<ForgettingCurveChartProps> = ({
  card,
  cards = [],
  showPrediction = true,
  predictionDays = 7,
  className = ''
}) => {
  const { service: forgettingCurveService, isReady } = useForgettingCurveService()
  const [curveData, setCurveData] = useState<ForgettingCurveData | null>(null)
  const [predictionData, setPredictionData] = useState<RetentionDataPoint[]>([])

  useEffect(() => {
    if (!isReady) return

    const loadData = async () => {
      try {
        let curve: ForgettingCurveData

        if (card) {
          // Courbe pour une carte unique
          curve = await forgettingCurveService.calculateCurveForCard(card)
        } else if (cards.length > 0) {
          // Courbe pour plusieurs cartes - prendre la première pour l'instant
          const curves = await forgettingCurveService.calculateCurvesForCards(cards)
          curve = curves[0] || {
            cardId: 'empty',
            dataPoints: [],
            predictedRetention: 1,
            halfLife: 24,
            stability: 5
          }
        } else {
          // Données par défaut
          curve = {
            cardId: 'empty',
            dataPoints: [],
            predictedRetention: 1,
            halfLife: 24,
            stability: 5
          }
        }

        setCurveData(curve)

        // Générer prédiction si demandée
        if (showPrediction && card) {
          const predictions: RetentionDataPoint[] = []
          const now = Date.now()
          const lastReview = card.lastReview || now
          const timeSinceLastReview = (now - lastReview) / 3600000 // Heures

          for (let days = 0; days <= predictionDays; days++) {
            const retention = await forgettingCurveService.predictRetention(card, days)
            predictions.push({
              time: (timeSinceLastReview + days * 24) * 60, // Convertir en minutes
              retention,
              reviewCount: 0
            })
          }
          setPredictionData(predictions)
        }
      } catch (error) {
        // Error silencieux - composant affichera état vide
      }
    }

    loadData()
  }, [forgettingCurveService, isReady, card, cards, showPrediction, predictionDays])

  const { curveData: finalCurveData, predictionData: finalPredictionData } = useMemo(() => {
    return {
      curveData: curveData || {
        cardId: 'empty',
        dataPoints: [],
        predictedRetention: 1,
        halfLife: 24,
        stability: 5
      },
      predictionData: predictionData
    }
  }, [curveData, predictionData])

  // Préparer les données pour Chart.js
  const chartData = useMemo(() => {
    if (!finalCurveData) return { labels: [], datasets: [] }
    
    const historicalLabels = finalCurveData.dataPoints.map(p => {
      const hours = Math.floor(p.time / 60)
      const days = Math.floor(hours / 24)
      return days > 0 ? `J+${days}` : `${hours}h`
    })

    const predictionLabels = finalPredictionData.map((p) => {
      const hours = Math.floor(p.time / 60)
      const days = Math.floor(hours / 24)
      return `Prév. J+${days}`
    })

    const allLabels = [...historicalLabels, ...predictionLabels]

    const historicalRetention = finalCurveData.dataPoints.map(p => p.retention * 100)
    const predictionRetention = finalPredictionData.map((p) => p.retention * 100)

    return {
      labels: allLabels,
      datasets: [
        {
          label: 'Rétention historique',
          data: [...historicalRetention, ...Array(predictionData.length).fill(null)],
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6
        },
        ...(predictionData.length > 0
          ? [
              {
                label: 'Rétention prédite',
                data: [
                  ...Array(historicalRetention.length - 1).fill(null),
                  historicalRetention[historicalRetention.length - 1],
                  ...predictionRetention
                ],
                borderColor: 'rgb(249, 115, 22)',
                backgroundColor: 'rgba(249, 115, 22, 0.1)',
                borderDash: [5, 5],
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                pointHoverRadius: 5
              }
            ]
          : [])
      ]
    }
  }, [finalCurveData, finalPredictionData])

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#6b7280'
        }
      },
      title: {
        display: true,
        text: card ? `Courbe d'oubli - ${card.frontText.slice(0, 40)}...` : 'Courbe d\'oubli agrégée',
        color: '#1f2937',
        font: {
          size: 16,
          weight: 'bold' as const
        }
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function (value: any) {
            return value + '%'
          },
          color: '#6b7280'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        ticks: {
          color: '#6b7280',
          maxRotation: 45,
          minRotation: 45
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      }
    }
  }

  return (
    <div className={`forgetting-curve-chart ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        {/* Graphique */}
        <div className="h-[400px] mb-6">
          <Line data={chartData} options={options} />
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Rétention prédite */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Rétention actuelle
            </div>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {((finalCurveData?.predictedRetention || 1) * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {(finalCurveData?.predictedRetention || 1) > 0.8
                ? '✓ Excellent'
                : (finalCurveData?.predictedRetention || 1) > 0.5
                ? '⚠ Moyen'
                : '❌ Faible'}
            </div>
          </div>

          {/* Demi-vie */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Demi-vie (50%)
            </div>
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              {(finalCurveData?.halfLife || 24) < 24
                ? `${(finalCurveData?.halfLife || 24).toFixed(1)}h`
                : `${((finalCurveData?.halfLife || 24) / 24).toFixed(1)}j`}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Temps jusqu'à 50% de rétention
            </div>
          </div>

          {/* Stabilité */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Score de stabilité
            </div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {(finalCurveData?.stability || 5).toFixed(1)}/10
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {'★'.repeat(Math.ceil((finalCurveData?.stability || 5) / 2))}
              {'☆'.repeat(5 - Math.ceil((finalCurveData?.stability || 5) / 2))}
            </div>
          </div>
        </div>

        {/* Interprétation */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
            📊 Interprétation
          </h4>
          <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <li>
              • <strong>Courbe bleue</strong> : Rétention historique basée sur vos révisions
            </li>
            {showPrediction && (
              <li>
                • <strong>Courbe orange (pointillés)</strong> : Prédiction Ebbinghaus sur {predictionDays} jours
              </li>
            )}
            <li>
              • <strong>Demi-vie</strong> : Temps avant que votre mémoire tombe à 50%
            </li>
            <li>
              • <strong>Stabilité</strong> : Plus c'est élevé, plus la mémoire est solide
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default ForgettingCurveChart
