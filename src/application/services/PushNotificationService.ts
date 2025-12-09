/**
 * Service de Notifications Push
 * Gère les notifications navigateur pour rappels d'étude
 */

import { logger } from '../../utils/logger'

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

export class PushNotificationService {
  private static instance: PushNotificationService
  private permission: NotificationPermission = 'default'
  private isSupported: boolean = false

  private constructor() {
    this.isSupported = 'Notification' in window && 'serviceWorker' in navigator
    if (this.isSupported) {
      this.permission = Notification.permission
    }
  }

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService()
    }
    return PushNotificationService.instance
  }

  /**
   * Vérifie si les notifications sont supportées
   */
  isNotificationSupported(): boolean {
    return this.isSupported
  }

  /**
   * Obtient le statut actuel de permission
   */
  getPermission(): NotificationPermission {
    return this.permission
  }

  /**
   * Demande la permission pour les notifications
   */
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported) {
      logger.warn('Notifications', 'Push notifications non supportées')
      return false
    }

    if (this.permission === 'granted') {
      return true
    }

    try {
      this.permission = await Notification.requestPermission()
      logger.info('Notifications', `Permission: ${this.permission}`)
      return this.permission === 'granted'
    } catch (error) {
      logger.error('Notifications', 'Erreur demande permission', { error })
      return false
    }
  }

  /**
   * Envoie une notification
   */
  async sendNotification(config: NotificationConfig): Promise<void> {
    if (!this.isSupported) {
      logger.warn('Notifications', 'Non supportées')
      return
    }

    if (this.permission !== 'granted') {
      const granted = await this.requestPermission()
      if (!granted) {
        logger.warn('Notifications', 'Permission refusée')
        return
      }
    }

    try {
      // Si Service Worker disponible, utiliser showNotification
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready
        await registration.showNotification(config.title, {
          body: config.body,
          icon: config.icon || '/icons/pwa-192.png',
          badge: config.badge || '/icons/pwa-64.png',
          tag: config.tag || 'cards-notification',
          data: config.data,
          requireInteraction: config.requireInteraction || false,
          silent: config.silent || false,
          actions: [
            {
              action: 'open',
              title: 'Ouvrir',
              icon: '/icons/pwa-64.png'
            },
            {
              action: 'dismiss',
              title: 'Ignorer'
            }
          ]
        } as NotificationOptions)
      } else {
        // Fallback: notification classique
        const notification = new Notification(config.title, {
          body: config.body,
          icon: config.icon || '/icons/pwa-192.png',
          tag: config.tag,
          data: config.data
        })

        notification.onclick = () => {
          window.focus()
          notification.close()
        }
      }

      logger.info('Notifications', 'Notification envoyée', { title: config.title })
    } catch (error) {
      logger.error('Notifications', 'Erreur envoi notification', { error })
    }
  }

  /**
   * Envoie un rappel d'étude
   */
  async sendStudyReminder(dueCardsCount: number): Promise<void> {
    await this.sendNotification({
      title: '📚 Temps d\'étudier !',
      body: `Vous avez ${dueCardsCount} carte(s) à réviser`,
      tag: 'study-reminder',
      data: { type: 'study_reminder', dueCardsCount },
      requireInteraction: false
    })
  }

  /**
   * Envoie une notification d'achievement
   */
  async sendAchievementNotification(achievementName: string): Promise<void> {
    await this.sendNotification({
      title: '🏆 Nouveau succès !',
      body: `Vous avez débloqué : ${achievementName}`,
      tag: 'achievement',
      data: { type: 'achievement', achievementName },
      requireInteraction: true
    })
  }

  /**
   * Envoie un avertissement de streak
   */
  async sendStreakWarning(currentStreak: number): Promise<void> {
    await this.sendNotification({
      title: '🔥 Attention à votre série !',
      body: `Votre série de ${currentStreak} jours est en danger`,
      tag: 'streak-warning',
      data: { type: 'streak_warning', currentStreak },
      requireInteraction: true
    })
  }

  /**
   * Envoie une notification de progression quotidienne
   */
  async sendDailyGoalProgress(progress: number, goal: number): Promise<void> {
    const percentage = Math.round((progress / goal) * 100)
    await this.sendNotification({
      title: '🎯 Objectif quotidien',
      body: `${progress}/${goal} cartes (${percentage}%)`,
      tag: 'daily-goal',
      data: { type: 'daily_goal', progress, goal },
      requireInteraction: false
    })
  }

  /**
   * Programme un rappel récurrent
   */
  scheduleRecurringReminder(intervalMinutes: number = 60): void {
    if (!this.isSupported || this.permission !== 'granted') {
      logger.warn('Notifications', 'Impossible de programmer rappel')
      return
    }

    // Utiliser setInterval pour les rappels réguliers
    const intervalMs = intervalMinutes * 60 * 1000
    
    setInterval(() => {
      // Vérifier s'il y a des cartes dues (à implémenter côté business)
      // Pour l'instant, notification simple
      void this.sendNotification({
        title: '⏰ Rappel d\'étude',
        body: 'Il est temps de réviser vos flashcards !',
        tag: 'recurring-reminder',
        requireInteraction: false
      })
    }, intervalMs)

    logger.info('Notifications', `Rappels programmés toutes les ${intervalMinutes} minutes`)
  }

  /**
   * Annule toutes les notifications actives
   */
  async clearAllNotifications(): Promise<void> {
    if (!this.isSupported) return

    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready
        const notifications = await registration.getNotifications()
        notifications.forEach(notification => notification.close())
      }
      logger.info('Notifications', 'Toutes les notifications annulées')
    } catch (error) {
      logger.error('Notifications', 'Erreur annulation notifications', { error })
    }
  }
}

export const pushNotificationService = PushNotificationService.getInstance()
export const PUSH_NOTIFICATION_SERVICE_TOKEN = 'PushNotificationService'
