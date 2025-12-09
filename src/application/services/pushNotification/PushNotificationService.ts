import { BaseService } from "@/application/services/base/BaseService";
import type {
  IPushNotificationService,
  NotificationConfig,
} from "./IPushNotificationService";

/**
 * Service de Notifications Push
 * Gère les notifications navigateur pour rappels d'étude et achievements
 */
export class PushNotificationService
  extends BaseService
  implements IPushNotificationService
{
  private permission: NotificationPermission = "default";
  private isSupported: boolean = false;
  private recurringIntervalId?: number;

  constructor() {
    super({
      name: "PushNotificationService",
      retryAttempts: 1,
      retryDelay: 500,
      timeout: 5000,
    });

    this.isSupported = "Notification" in window && "serviceWorker" in navigator;
    if (this.isSupported) {
      this.permission = Notification.permission;
    }

    this.log("PushNotificationService initialisé", {
      supported: this.isSupported,
      permission: this.permission,
    });
  }

  /**
   * Vérifie si les notifications sont supportées par le navigateur
   */
  isNotificationSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Obtient le statut actuel de permission
   */
  getPermission(): NotificationPermission {
    return this.permission;
  }

  /**
   * Demande la permission pour les notifications
   */
  async requestPermission(): Promise<boolean> {
    return this.executeWithRetry(async () => {
      if (!this.isSupported) {
        this.warn("Push notifications non supportées");
        return false;
      }

      if (this.permission === "granted") {
        return true;
      }

      try {
        this.permission = await Notification.requestPermission();
        this.log(`Permission: ${this.permission}`);
        return this.permission === "granted";
      } catch (error) {
        this.error("Erreur demande permission", error as Error);
        return false;
      }
    }, "requestPermission");
  }

  /**
   * Envoie une notification avec configuration personnalisée
   */
  async sendNotification(config: NotificationConfig): Promise<void> {
    return this.executeWithRetry(async () => {
      if (!this.isSupported) {
        this.warn("Notifications non supportées");
        return;
      }

      if (this.permission !== "granted") {
        const granted = await this.requestPermission();
        if (!granted) {
          this.warn("Permission refusée");
          return;
        }
      }

      try {
        // Si Service Worker disponible, utiliser showNotification
        if ("serviceWorker" in navigator && navigator.serviceWorker) {
          const registration = await navigator.serviceWorker.ready;
          await registration.showNotification(config.title, {
            body: config.body,
            icon: config.icon || "/icons/pwa-192.png",
            badge: config.badge || "/icons/pwa-64.png",
            tag: config.tag || "cards-notification",
            data: config.data,
            requireInteraction: config.requireInteraction || false,
            silent: config.silent || false,
            actions: [
              {
                action: "open",
                title: "Ouvrir",
                icon: "/icons/pwa-64.png",
              },
              {
                action: "dismiss",
                title: "Ignorer",
              },
            ],
          } as NotificationOptions);
        } else {
          // Fallback: notification classique
          const notification = new Notification(config.title, {
            body: config.body,
            icon: config.icon || "/icons/pwa-192.png",
            tag: config.tag,
            data: config.data,
          });

          notification.onclick = () => {
            window.focus();
            notification.close();
          };
        }

        this.log("Notification envoyée", { title: config.title });
      } catch (error) {
        this.error("Erreur envoi notification", error as Error);
      }
    }, "sendNotification");
  }

  /**
   * Envoie un rappel d'étude avec le nombre de cartes dues
   */
  async sendStudyReminder(dueCardsCount: number): Promise<void> {
    return this.executeWithRetry(async () => {
      await this.sendNotification({
        title: "📚 Temps d'étudier !",
        body: `Vous avez ${dueCardsCount} carte(s) à réviser`,
        tag: "study-reminder",
        data: { type: "study_reminder", dueCardsCount },
        requireInteraction: false,
      });
    }, "sendStudyReminder");
  }

  /**
   * Envoie une notification d'achievement débloqué
   */
  async sendAchievementNotification(achievementName: string): Promise<void> {
    return this.executeWithRetry(async () => {
      await this.sendNotification({
        title: "🏆 Nouveau succès !",
        body: `Vous avez débloqué : ${achievementName}`,
        tag: "achievement",
        data: { type: "achievement", achievementName },
        requireInteraction: true,
      });
    }, "sendAchievementNotification");
  }

  /**
   * Envoie un avertissement pour la série en danger
   */
  async sendStreakWarning(currentStreak: number): Promise<void> {
    return this.executeWithRetry(async () => {
      await this.sendNotification({
        title: "🔥 Attention à votre série !",
        body: `Votre série de ${currentStreak} jours est en danger`,
        tag: "streak-warning",
        data: { type: "streak_warning", currentStreak },
        requireInteraction: true,
      });
    }, "sendStreakWarning");
  }

  /**
   * Envoie une notification de progression quotidienne
   */
  async sendDailyGoalProgress(progress: number, goal: number): Promise<void> {
    return this.executeWithRetry(async () => {
      const percentage = Math.round((progress / goal) * 100);
      await this.sendNotification({
        title: "🎯 Objectif quotidien",
        body: `${progress}/${goal} cartes (${percentage}%)`,
        tag: "daily-goal",
        data: { type: "daily_goal", progress, goal },
        requireInteraction: false,
      });
    }, "sendDailyGoalProgress");
  }

  /**
   * Programme un rappel récurrent
   */
  scheduleRecurringReminder(intervalMinutes: number = 60): void {
    if (!this.isSupported || this.permission !== "granted") {
      this.warn("Impossible de programmer rappel");
      return;
    }

    // Annuler l'intervalle précédent s'il existe
    if (this.recurringIntervalId) {
      clearInterval(this.recurringIntervalId);
    }

    // Utiliser setInterval pour les rappels réguliers
    const intervalMs = intervalMinutes * 60 * 1000;

    this.recurringIntervalId = window.setInterval(() => {
      void this.sendNotification({
        title: "⏰ Rappel d'étude",
        body: "Il est temps de réviser vos flashcards !",
        tag: "recurring-reminder",
        requireInteraction: false,
      });
    }, intervalMs);

    this.log(`Rappels programmés toutes les ${intervalMinutes} minutes`);
  }

  /**
   * Annule toutes les notifications actives
   */
  async clearAllNotifications(): Promise<void> {
    return this.executeWithRetry(async () => {
      if (!this.isSupported) return;

      try {
        if ("serviceWorker" in navigator) {
          const registration = await navigator.serviceWorker.ready;
          const notifications = await registration.getNotifications();
          notifications.forEach((notification) => notification.close());
        }
        this.log("Toutes les notifications annulées");
      } catch (error) {
        this.error("Erreur annulation notifications", error as Error);
      }
    }, "clearAllNotifications");
  }

  /**
   * Vérifie si le service est prêt
   */
  isReady(): boolean {
    return this.isSupported;
  }

  /**
   * Libère les ressources du service
   */
  dispose(): void {
    // Annuler les rappels récurrents
    if (this.recurringIntervalId) {
      clearInterval(this.recurringIntervalId);
      this.recurringIntervalId = undefined;
    }
    this.log("PushNotificationService disposed");
  }
}
