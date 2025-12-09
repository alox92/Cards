import Icons from '@/ui/components/common/Icons'
import { formatRetention, getRetentionColor } from '@/types/deckStatus'

interface RetentionMetricsProps {
  totalDecks: number
  totalCards: number
  dueToday: number
  unlearnedCards: number
  masteredCards: number
  retention: number
}

/**
 * Composant affichant les métriques de rétention globales
 */
export const RetentionMetrics = ({
  totalDecks,
  totalCards,
  dueToday,
  unlearnedCards,
  masteredCards,
  retention
}: RetentionMetricsProps) => {
  const retentionColor = getRetentionColor(retention)

  const metrics = [
    {
      label: 'Paquets',
      value: totalDecks,
      icon: <Icons.Decks size="md" />,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      label: 'Cartes Totales',
      value: totalCards,
      icon: <Icons.File size="md" />,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      label: 'À Réviser Aujourd\'hui',
      value: dueToday,
      icon: <Icons.Clock size="md" />,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20'
    },
    {
      label: 'Non Apprises',
      value: unlearnedCards,
      icon: <Icons.Add size="md" />,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20'
    },
    {
      label: 'Maîtrisées',
      value: masteredCards,
      icon: <Icons.Check size="md" />,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      label: 'Rétention Globale',
      value: formatRetention(retention),
      icon: <Icons.TrendUp size="md" />,
      color: retentionColor,
      bgColor: retention >= 80 
        ? 'bg-green-50 dark:bg-green-900/20'
        : retention >= 60
        ? 'bg-yellow-50 dark:bg-yellow-900/20'
        : 'bg-red-50 dark:bg-red-900/20'
    }
  ]

  return (
    <div className="card">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        <Icons.Stats size="lg" />
        Métriques Globales
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className={`${metric.bgColor} rounded-lg p-4 border border-gray-200 dark:border-gray-700 transition-all hover:shadow-md`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`${metric.color} font-medium`}>
                {metric.icon}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {metric.label}
              </span>
            </div>
            <div className={`text-3xl font-bold ${metric.color}`}>
              {metric.value}
            </div>
          </div>
        ))}
      </div>

      {/* Barre de progression de rétention */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Progression globale
          </span>
          <span className={`text-sm font-bold ${retentionColor}`}>
            {formatRetention(retention)}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              retention >= 80
                ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                : retention >= 60
                ? 'bg-gradient-to-r from-yellow-500 to-amber-600'
                : 'bg-gradient-to-r from-red-500 to-rose-600'
            }`}
            style={{ width: `${retention}%` }}
          />
        </div>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
          {retention >= 80 ? (
            <>
              <Icons.Check size="xs" className="text-green-500" />
              <span>Excellent ! Continue comme ça !</span>
            </>
          ) : retention >= 60 ? (
            <>
              <Icons.Zap size="xs" className="text-blue-500" />
              <span>Bon travail ! Encore un effort !</span>
            </>
          ) : (
            <>
              <Icons.Decks size="xs" className="text-amber-500" />
              <span>Continuez à réviser régulièrement !</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
