/**
 * 🎨 Types et Constantes pour le Système de Suggestions et Status
 */

/**
 * Status d'un deck basé sur l'état des cartes
 */
export type DeckStatus = 'unlearned' | 'urgent' | 'soon' | 'mastered'

/**
 * Niveau de priorité pour les suggestions
 */
export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low' | 'none'

/**
 * Statistiques de rétention d'un deck
 */
export interface RetentionStats {
  /** Pourcentage de rétention global (0-100) */
  retention: number
  /** Nombre de cartes dues aujourd'hui */
  dueToday: number
  /** Nombre de cartes dues dans 1-3 jours */
  dueSoon: number
  /** Nombre de cartes jamais étudiées */
  unlearnedCount: number
  /** Nombre total de cartes maîtrisées */
  masteredCount: number
  /** Easiness Factor moyen */
  avgEasiness: number
  /** Nombre de cartes totales */
  totalCards: number
}

/**
 * Suggestion pour un deck
 */
export interface DeckSuggestion {
  /** ID du deck */
  deckId: string
  /** Nom du deck */
  deckName: string
  /** Status du deck */
  status: DeckStatus
  /** Niveau de priorité */
  priority: PriorityLevel
  /** Score de priorité (0-100) */
  priorityScore: number
  /** Statistiques de rétention */
  stats: RetentionStats
  /** Message de recommandation */
  message: string
  /** Action recommandée */
  action: 'study_new' | 'review' | 'maintain' | 'none'
}

/**
 * Configuration des couleurs par status
 */
export interface StatusColors {
  bg: string
  text: string
  border: string
  icon: string
  badge: string
  card?: string
  progress?: string
}

/**
 * Couleurs pour chaque status de deck
 */
export const DECK_STATUS_COLORS: Record<DeckStatus, StatusColors> = {
  unlearned: {
    bg: 'bg-red-50 dark:bg-red-900/10',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-300 dark:border-red-700',
    icon: 'text-red-500',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    card: 'bg-red-50 dark:bg-red-900/10 border-2 border-red-200 dark:border-red-800',
    progress: 'bg-gradient-to-r from-red-500 to-rose-600'
  },
  urgent: {
    bg: 'bg-orange-50 dark:bg-orange-900/10',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-300 dark:border-orange-700',
    icon: 'text-orange-500',
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    card: 'bg-orange-50 dark:bg-orange-900/10 border-2 border-orange-200 dark:border-orange-800',
    progress: 'bg-gradient-to-r from-orange-500 to-amber-600'
  },
  soon: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/10',
    text: 'text-yellow-700 dark:text-yellow-300',
    border: 'border-yellow-300 dark:border-yellow-700',
    icon: 'text-yellow-500',
    badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    card: 'bg-yellow-50 dark:bg-yellow-900/10 border-2 border-yellow-200 dark:border-yellow-800',
    progress: 'bg-gradient-to-r from-yellow-500 to-amber-600'
  },
  mastered: {
    bg: 'bg-green-50 dark:bg-green-900/10',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-300 dark:border-green-700',
    icon: 'text-green-500',
    badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    card: 'bg-green-50 dark:bg-green-900/10 border-2 border-green-200 dark:border-green-800',
    progress: 'bg-gradient-to-r from-green-500 to-emerald-600'
  }
}

/**
 * Labels pour chaque status
 */
export const DECK_STATUS_LABELS: Record<DeckStatus, string> = {
  unlearned: 'Jamais étudié',
  urgent: 'Révision urgente',
  soon: 'Révision bientôt',
  mastered: 'Bien maîtrisé'
}

/**
 * Messages de suggestion par status
 */
export const DECK_STATUS_MESSAGES: Record<DeckStatus, string> = {
  unlearned: 'Commencez à apprendre ces nouvelles cartes !',
  urgent: 'Des cartes nécessitent une révision immédiate',
  soon: 'Préparez-vous, révisions dans quelques jours',
  mastered: 'Excellent ! Continuez votre bon travail'
}

/**
 * Emojis/Icônes par status (fallback)
 */
export const DECK_STATUS_EMOJI: Record<DeckStatus, string> = {
  unlearned: '🆕',
  urgent: '🔥',
  soon: '⏰',
  mastered: '✅'
}

/**
 * Couleurs pour les niveaux de priorité
 */
export const PRIORITY_COLORS: Record<PriorityLevel, StatusColors> = {
  critical: DECK_STATUS_COLORS.unlearned,
  high: DECK_STATUS_COLORS.urgent,
  medium: DECK_STATUS_COLORS.soon,
  low: DECK_STATUS_COLORS.mastered,
  none: {
    bg: 'bg-gray-50 dark:bg-gray-900/10',
    text: 'text-gray-700 dark:text-gray-300',
    border: 'border-gray-300 dark:border-gray-700',
    icon: 'text-gray-500',
    badge: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
  }
}

/**
 * Seuils pour déterminer le status d'un deck
 */
export const STATUS_THRESHOLDS = {
  /** Nombre minimum de cartes dues pour être "urgent" */
  URGENT_DUE_COUNT: 5,
  /** Nombre de jours pour "soon" */
  SOON_DAYS: 3,
  /** Pourcentage de rétention minimum pour "mastered" */
  MASTERED_RETENTION: 80
}

/**
 * Configuration des tailles de carte pour l'étude
 */
export const CARD_SIZES = {
  small: {
    maxWidth: 'max-w-[600px]',
    minHeight: 'min-h-[300px]',
    padding: 'p-6',
    fontSize: 'text-base'
  },
  medium: {
    maxWidth: 'max-w-[800px]',
    minHeight: 'min-h-[400px]',
    padding: 'p-8',
    fontSize: 'text-lg'
  },
  large: {
    maxWidth: 'max-w-[1000px]',
    minHeight: 'min-h-[500px]',
    padding: 'p-10',
    fontSize: 'text-xl'
  },
  fullscreen: {
    maxWidth: 'max-w-[1200px]',
    minHeight: 'min-h-[600px]',
    padding: 'p-12',
    fontSize: 'text-2xl'
  }
} as const

export type CardSize = keyof typeof CARD_SIZES

/**
 * Configuration par défaut
 */
export const DEFAULT_CARD_SIZE: CardSize = 'medium'

/**
 * Helper pour obtenir les classes CSS d'un status
 */
export function getStatusClasses(status: DeckStatus): StatusColors {
  return DECK_STATUS_COLORS[status]
}

/**
 * Helper pour obtenir le label d'un status
 */
export function getStatusLabel(status: DeckStatus): string {
  return DECK_STATUS_LABELS[status]
}

/**
 * Helper pour obtenir le message d'un status
 */
export function getStatusMessage(status: DeckStatus): string {
  return DECK_STATUS_MESSAGES[status]
}

/**
 * Helper pour obtenir l'emoji d'un status
 */
export function getStatusEmoji(status: DeckStatus): string {
  return DECK_STATUS_EMOJI[status]
}

/**
 * Helper pour formater un pourcentage de rétention
 */
export function formatRetention(retention: number): string {
  if (retention >= 90) return `${Math.round(retention)}% - Excellent`
  if (retention >= 70) return `${Math.round(retention)}% - Bien`
  if (retention >= 50) return `${Math.round(retention)}% - Moyen`
  return `${Math.round(retention)}% - À améliorer`
}

/**
 * Helper pour obtenir la couleur de rétention
 */
export function getRetentionColor(retention: number): string {
  if (retention >= 90) return 'text-green-600 dark:text-green-400'
  if (retention >= 70) return 'text-blue-600 dark:text-blue-400'
  if (retention >= 50) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}
