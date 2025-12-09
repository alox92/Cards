/**
 * Interface pour le service de planification circadienne
 * Analyse la performance par heure pour optimiser les sessions d'étude
 */

// Types exportés
export interface CircadianPerformanceData {
  hour: number // 0-23
  reviewCount: number
  correctCount: number
  averageResponseTime: number // ms
  accuracyRate: number // 0-1
  energyLevel: number // 0-10 (estimé)
  focusScore: number // 0-10 (calculé)
}

export interface CircadianProfile {
  userId: string
  chronotype: 'lark' | 'owl' | 'intermediate' // Alouette, Hibou, Intermédiaire
  peakHours: number[] // Heures optimales [8, 9, 10]
  lowHours: number[] // Heures à éviter [1, 2, 3]
  hourlyPerformance: Map<number, CircadianPerformanceData>
  lastUpdated: number
  totalDataPoints: number
}

export interface StudyRecommendation {
  recommendedHour: number
  currentHour: number
  shouldStudyNow: boolean
  energyLevel: 'high' | 'medium' | 'low'
  optimalDuration: number // minutes
  difficulty: 'easy' | 'medium' | 'hard'
  message: string
}

/**
 * Interface du service de planification circadienne
 */
export interface ICircadianSchedulerService {
  /**
   * Initialise un profil circadien pour un utilisateur
   */
  initializeProfile(userId: string): Promise<CircadianProfile>

  /**
   * Enregistre une session d'étude et met à jour le profil
   */
  recordStudySession(
    profile: CircadianProfile,
    reviewCount: number,
    correctCount: number,
    averageResponseTime: number,
    timestamp?: number
  ): Promise<CircadianProfile>

  /**
   * Obtient une recommandation d'étude basée sur le profil
   */
  getStudyRecommendation(profile: CircadianProfile): Promise<StudyRecommendation>

  /**
   * Exporte le profil pour stockage
   */
  exportProfile(profile: CircadianProfile): Promise<any>

  /**
   * Importe le profil depuis le stockage
   */
  importProfile(stored: any): Promise<CircadianProfile>

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
export const CIRCADIAN_SCHEDULER_SERVICE_TOKEN = Symbol('ICircadianSchedulerService')
