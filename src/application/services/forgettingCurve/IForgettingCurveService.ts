import { Card } from '@/domain/entities/Card'

/**
 * Point de données de rétention
 */
export interface RetentionDataPoint {
  time: number // Minutes depuis première révision
  retention: number // 0-1
  reviewCount: number
}

/**
 * Données de courbe d'oubli
 */
export interface ForgettingCurveData {
  cardId: string
  dataPoints: RetentionDataPoint[]
  predictedRetention: number // Rétention prédite aujourd'hui (0-1)
  halfLife: number // Temps en heures pour atteindre 50% rétention
  stability: number // Score de stabilité (0-10)
}

/**
 * Options de prédiction
 */
export interface RetentionPredictionOptions {
  daysFromNow: number
  easinessFactor?: number
  correctStreak?: number
}

/**
 * Statistiques de courbe d'oubli
 */
export interface ForgettingCurveStats {
  averageRetention: number
  totalCards: number
  cardsAtRisk: number // < 50% rétention
  strongCards: number // > 80% rétention
  averageHalfLife: number
}

/**
 * Interface du service de courbes d'oubli d'Ebbinghaus
 * Analyse l'historique des révisions pour prédire la rétention
 */
export interface IForgettingCurveService {
  /**
   * Calcule la courbe d'oubli pour une carte
   */
  calculateCurveForCard(card: Card): Promise<ForgettingCurveData>

  /**
   * Prédit la rétention future
   */
  predictRetention(card: Card, daysFromNow: number): Promise<number>

  /**
   * Calcule le temps optimal pour la prochaine révision
   */
  getOptimalReviewTime(card: Card): Promise<number>

  /**
   * Calcule les courbes pour plusieurs cartes
   */
  calculateCurvesForCards(cards: Card[]): Promise<ForgettingCurveData[]>

  /**
   * Obtient des statistiques globales
   */
  getGlobalStats(cards: Card[]): Promise<ForgettingCurveStats>

  /**
   * Vérifie si le service est prêt
   */
  isReady(): boolean

  /**
   * Libère les ressources
   */
  dispose(): void
}

/**
 * Token d'injection de dépendance
 */
export const FORGETTING_CURVE_SERVICE_TOKEN = Symbol('IForgettingCurveService')
