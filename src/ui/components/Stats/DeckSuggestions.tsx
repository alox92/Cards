import { useNavigate } from 'react-router-dom'
import Icons from '@/ui/components/common/Icons'
import { getStatusClasses, formatRetention } from '@/types/deckStatus'
import type { DeckSuggestion } from '@/types/deckStatus'

interface DeckSuggestionsProps {
  suggestions: DeckSuggestion[]
  title?: string
  showAll?: boolean
}

/**
 * Composant affichant les suggestions de paquets avec code couleur
 */
export const DeckSuggestions = ({ 
  suggestions, 
  title = 'Suggestions Quotidiennes',
  showAll = false 
}: DeckSuggestionsProps) => {
  const navigate = useNavigate()

  // Filtrer les suggestions si nécessaire
  const displayedSuggestions = showAll 
    ? suggestions 
    : suggestions.filter(s => s.priority === 'critical' || s.priority === 'high')

  if (displayedSuggestions.length === 0) {
    return (
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Icons.Zap size="lg" />
          {title}
        </h2>
        <div className="text-center py-8">
          <Icons.Check size="xl" className="mx-auto mb-4 text-green-500" />
          <p className="text-gray-600 dark:text-gray-400 flex items-center justify-center gap-2">
            <Icons.Check size="sm" className="text-green-500" />
            Aucune révision urgente ! Excellent travail !
          </p>
        </div>
      </div>
    )
  }

  const getPriorityIcon = (priority: DeckSuggestion['priority']) => {
    switch (priority) {
      case 'critical':
        return <Icons.Warning size="sm" className="text-red-500" />
      case 'high':
        return <Icons.Clock size="sm" className="text-orange-500" />
      case 'medium':
        return <Icons.Info size="sm" className="text-yellow-500" />
      default:
        return <Icons.Check size="sm" className="text-green-500" />
    }
  }

  const getActionIcon = (action: DeckSuggestion['action']) => {
    switch (action) {
      case 'study_new':
        return <Icons.Add size="sm" />
      case 'review':
        return <Icons.Refresh size="sm" />
      case 'maintain':
        return <Icons.Study size="sm" />
      default:
        return <Icons.Check size="sm" />
    }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Icons.Zap size="lg" />
          {title}
        </h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {displayedSuggestions.length} paquet{displayedSuggestions.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-3">
        {displayedSuggestions.map((suggestion) => {
          const statusClasses = getStatusClasses(suggestion.status)

          return (
            <div
              key={suggestion.deckId}
              onClick={() => navigate(`/study-service/${suggestion.deckId}`)}
              className={`${statusClasses.card || statusClasses.bg} rounded-lg p-4 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]`}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Contenu principal */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {getPriorityIcon(suggestion.priority)}
                    <h3 className={`font-semibold truncate ${statusClasses.text}`}>
                      {suggestion.deckName}
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${statusClasses.badge}`}>
                      {suggestion.status}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {suggestion.message}
                  </p>

                  {/* Statistiques */}
                  <div className="flex flex-wrap gap-3 text-xs">
                    {suggestion.stats.dueToday > 0 && (
                      <div className="flex items-center gap-1">
                        <Icons.Clock size="xs" />
                        <span>{suggestion.stats.dueToday} dues</span>
                      </div>
                    )}
                    {suggestion.stats.unlearnedCount > 0 && (
                      <div className="flex items-center gap-1">
                        <Icons.Add size="xs" />
                        <span>{suggestion.stats.unlearnedCount} nouvelles</span>
                      </div>
                    )}
                    {suggestion.stats.dueSoon > 0 && (
                      <div className="flex items-center gap-1">
                        <Icons.Calendar size="xs" />
                        <span>{suggestion.stats.dueSoon} bientôt</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Icons.TrendUp size="xs" />
                      <span>{formatRetention(suggestion.stats.retention)}</span>
                    </div>
                  </div>
                </div>

                {/* Score de priorité et action */}
                <div className="flex flex-col items-end gap-2">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${statusClasses.text}`}>
                      {Math.round(suggestion.priorityScore)}
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">
                      priorité
                    </div>
                  </div>
                  <button
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusClasses.badge} hover:opacity-80 transition`}
                  >
                    {getActionIcon(suggestion.action)}
                    Étudier
                  </button>
                </div>
              </div>

              {/* Barre de progression */}
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                  <span>Progression</span>
                  <span className="font-medium">
                    {suggestion.stats.masteredCount} / {suggestion.stats.totalCards}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${statusClasses.progress || 'bg-blue-500'}`}
                    style={{ 
                      width: `${(suggestion.stats.masteredCount / suggestion.stats.totalCards) * 100}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
