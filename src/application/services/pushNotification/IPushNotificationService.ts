/**
 * Interface pour le service de notifications push
 * Gère les notifications navigateur pour rappels d'étude
 */

// Types exportés
export type NotificationType = 'study_reminder' | 'achievement' | 'streak_warning' | 'daily_goal'

export interface NotificationConfig {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: any
  requireInteraction?: boolean
  silent?: boolean
}

/**
 * Interface du service de notifications push
 */
export interface IPushNotificationService {
  /**
   * Vérifie si les notifications sont supportées par le navigateur
   */
  isNotificationSupported(): boolean

  /**
   * Obtient le statut actuel de permission
   */
  getPermission(): NotificationPermission

  /**
   * Demande la permission pour les notifications
   */
  requestPermission(): Promise<boolean>

  /**
   * Envoie une notification avec configuration personnalisée
   */
  sendNotification(config: NotificationConfig): Promise<void>

  /**
   * Envoie un rappel d'étude avec le nombre de cartes dues
   */
  sendStudyReminder(dueCardsCount: number): Promise<void>

  /**
   * Envoie une notification d'achievement débloqué
   */
  sendAchievementNotification(achievementName: string): Promise<void>

  /**
   * Envoie un avertissement pour la série en danger
   */
  sendStreakWarning(currentStreak: number): Promise<void>

  /**
   * Envoie une notification de progression quotidienne
   */
  sendDailyGoalProgress(progress: number, goal: number): Promise<void>

  /**
   * Programme un rappel récurrent
   */
  scheduleRecurringReminder(intervalMinutes?: number): void

  /**
   * Annule toutes les notifications actives
   */
  clearAllNotifications(): Promise<void>

  /**
   * Vérifie si le service est prêt
   */
  isReady(): boolean

  /**
   * Libère les ressources du service
   */
  dispose(): void
}

/**
 * Token pour l'injection de dépendances
 */
export const PUSH_NOTIFICATION_SERVICE_TOKEN = Symbol('IPushNotificationService')
