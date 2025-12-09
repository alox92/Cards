import { BaseService } from '../base/BaseService'
import { Card } from '@/domain/entities/Card'
import type {
  IForgettingCurveService,
  ForgettingCurveData,
  RetentionDataPoint,
  ForgettingCurveStats
} from './IForgettingCurveService'

/**
 * Service de calcul des courbes d'oubli d'Ebbinghaus
 * Analyse l'historique des révisions pour prédire la rétention
 */
export class ForgettingCurveService extends BaseService implements IForgettingCurveService {
  private ready: boolean = true

  constructor() {
    super({ 
      name: 'ForgettingCurveService',
      retryAttempts: 1,
      retryDelay: 500,
      timeout: 5000
    })
    this.log('ForgettingCurveService initialisé')
  }

  /**
   * Calcule la courbe d'oubli pour une carte
   */
  async calculateCurveForCard(card: Card): Promise<ForgettingCurveData> {
    return this.executeWithRetry(async () => {
      const dataPoints: RetentionDataPoint[] = []
      const totalReviews = card.totalReviews || 0

      if (totalReviews === 0) {
        return {
          cardId: card.id,
          dataPoints: [],
          predictedRetention: 1,
          halfLife: 24,
          stability: 5
        }
      }

      // Calculer la rétention basée sur les stats existantes
      const successRate = card.correctReviews / card.totalReviews
      const correctStreak = this.estimateCorrectStreak(card)
      
      // Générer des points de données historiques estimés
      const created = card.created
      const now = Date.now()
      const totalTime = (now - created) / 60000 // Minutes

      // Créer des points de données échantillonnés
      const sampleCount = Math.min(totalReviews, 10)
      for (let i = 0; i <= sampleCount; i++) {
        const time = (totalTime * i) / sampleCount
        const progress = i / sampleCount
        const retention = successRate * (0.5 + 0.5 * Math.tanh(4 * (progress - 0.5)))
        
        dataPoints.push({
          time,
          retention: Math.max(0.1, Math.min(1, retention)),
          reviewCount: Math.floor((totalReviews * i) / sampleCount)
        })
      }

      // Prédiction de rétention actuelle
      const timeSinceLastReview = (now - card.lastReview) / 3600000 // Heures

      const predictedRetention = this.calculateEbbinghausRetention(
        timeSinceLastReview,
        card.easinessFactor || 2.5,
        correctStreak
      )

      // Calcul demi-vie
      const halfLife = this.calculateHalfLife(card.easinessFactor || 2.5, correctStreak)

      // Score de stabilité (0-10)
      const stability = Math.min(10, correctStreak * 0.5 + (card.easinessFactor || 2.5))

      return {
        cardId: card.id,
        dataPoints,
        predictedRetention,
        halfLife,
        stability
      }
    }, 'calculateCurveForCard')
  }

  /**
   * Prédit la rétention future
   */
  async predictRetention(card: Card, daysFromNow: number): Promise<number> {
    return this.executeWithRetry(async () => {
      const now = Date.now()
      const lastReview = card.lastReview || now
      const timeSinceLastReview = (now - lastReview) / 3600000 // Heures
      const futureHours = timeSinceLastReview + (daysFromNow * 24)
      
      const correctStreak = this.estimateCorrectStreak(card)
      const easinessFactor = card.easinessFactor || 2.5
      
      return this.calculateEbbinghausRetention(futureHours, easinessFactor, correctStreak)
    }, 'predictRetention')
  }

  /**
   * Calcule le temps optimal pour la prochaine révision
   */
  async getOptimalReviewTime(card: Card): Promise<number> {
    return this.executeWithRetry(async () => {
      const targetRetention = 0.8
      const easinessFactor = card.easinessFactor || 2.5
      const correctStreak = this.estimateCorrectStreak(card)
      const strength = easinessFactor * (1 + correctStreak * 0.2)

      // Résoudre t dans R = e^(-t/S) pour R = targetRetention
      const hoursUntilTarget = -strength * 24 * Math.log(targetRetention)
      return hoursUntilTarget * 3600000 // Convertir en millisecondes
    }, 'getOptimalReviewTime')
  }

  /**
   * Calcule les courbes pour plusieurs cartes
   */
  async calculateCurvesForCards(cards: Card[]): Promise<ForgettingCurveData[]> {
    return this.executeWithRetry(async () => {
      const curves = await Promise.all(
        cards.map(card => this.calculateCurveForCard(card))
      )
      return curves
    }, 'calculateCurvesForCards')
  }

  /**
   * Obtient des statistiques globales
   */
  async getGlobalStats(cards: Card[]): Promise<ForgettingCurveStats> {
    return this.executeWithRetry(async () => {
      if (cards.length === 0) {
        return {
          averageRetention: 1,
          totalCards: 0,
          cardsAtRisk: 0,
          strongCards: 0,
          averageHalfLife: 24
        }
      }

      const curves = await this.calculateCurvesForCards(cards)
      
      const totalRetention = curves.reduce((sum, c) => sum + c.predictedRetention, 0)
      const totalHalfLife = curves.reduce((sum, c) => sum + c.halfLife, 0)
      const cardsAtRisk = curves.filter(c => c.predictedRetention < 0.5).length
      const strongCards = curves.filter(c => c.predictedRetention > 0.8).length

      return {
        averageRetention: totalRetention / curves.length,
        totalCards: cards.length,
        cardsAtRisk,
        strongCards,
        averageHalfLife: totalHalfLife / curves.length
      }
    }, 'getGlobalStats')
  }

  isReady(): boolean {
    return this.ready
  }

  dispose(): void {
    this.ready = false
    this.log('ForgettingCurveService disposed')
  }

  // === MÉTHODES PRIVÉES ===

  /**
   * Calcule la rétention selon la courbe d'Ebbinghaus
   * R = e^(-t/S) où t = temps écoulé, S = force du souvenir
   */
  private calculateEbbinghausRetention(
    hoursElapsed: number,
    easinessFactor: number,
    correctStreak: number
  ): number {
    const strength = easinessFactor * (1 + correctStreak * 0.2)
    const retention = Math.exp(-hoursElapsed / (strength * 24))
    return Math.max(0, Math.min(1, retention))
  }

  /**
   * Calcule la demi-vie (temps pour atteindre 50% rétention)
   */
  private calculateHalfLife(easinessFactor: number, correctStreak: number): number {
    const strength = easinessFactor * (1 + correctStreak * 0.2)
    return strength * 24 * Math.log(2) // En heures
  }

  /**
   * Estime le nombre de réponses correctes consécutives
   */
  private estimateCorrectStreak(card: Card): number {
    const successRate = card.totalReviews > 0 ? card.correctReviews / card.totalReviews : 0
    const easinessFactor = card.easinessFactor || 2.5
    const estimatedStreak = Math.floor(successRate * easinessFactor * 2)
    return Math.max(0, Math.min(10, estimatedStreak))
  }
}
