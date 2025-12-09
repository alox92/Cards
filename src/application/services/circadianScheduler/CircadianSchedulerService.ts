import { BaseService } from '@/application/services/base/BaseService'
import type {
  ICircadianSchedulerService,
  CircadianProfile,
  CircadianPerformanceData,
  StudyRecommendation
} from './ICircadianSchedulerService'

/**
 * Service de planification circadienne
 * Analyse la performance de l'utilisateur par heure
 * Optimise les sessions d'étude selon les rythmes biologiques
 */
export class CircadianSchedulerService extends BaseService implements ICircadianSchedulerService {
  constructor() {
    super({
      name: 'CircadianSchedulerService',
      retryAttempts: 1,
      retryDelay: 500,
      timeout: 5000
    })
    this.log('CircadianSchedulerService initialisé')
  }

  /**
   * Initialise un profil circadien pour un utilisateur
   */
  async initializeProfile(userId: string): Promise<CircadianProfile> {
    return this.executeWithRetry(async () => {
      const hourlyPerformance = new Map<number, CircadianPerformanceData>()
      
      // Initialiser avec des données par défaut pour chaque heure
      for (let hour = 0; hour < 24; hour++) {
        hourlyPerformance.set(hour, {
          hour,
          reviewCount: 0,
          correctCount: 0,
          averageResponseTime: 0,
          accuracyRate: 0.5, // Neutre
          energyLevel: this.getDefaultEnergyLevel(hour),
          focusScore: this.getDefaultFocusScore(hour)
        })
      }

      return {
        userId,
        chronotype: 'intermediate',
        peakHours: [9, 10, 11, 14, 15],
        lowHours: [0, 1, 2, 3, 13, 22, 23],
        hourlyPerformance,
        lastUpdated: Date.now(),
        totalDataPoints: 0
      }
    }, 'initializeProfile')
  }

  /**
   * Enregistre une session d'étude et met à jour le profil
   */
  async recordStudySession(
    profile: CircadianProfile,
    reviewCount: number,
    correctCount: number,
    averageResponseTime: number,
    timestamp: number = Date.now()
  ): Promise<CircadianProfile> {
    return this.executeWithRetry(async () => {
      const hour = new Date(timestamp).getHours()
      const currentData = profile.hourlyPerformance.get(hour)!

      // Mettre à jour les statistiques avec moyenne pondérée
      const weight = Math.min(0.3, 1 / (currentData.reviewCount + 1))
      const newReviewCount = currentData.reviewCount + reviewCount
      const newCorrectCount = currentData.correctCount + correctCount
      const newAccuracy = newCorrectCount / newReviewCount
      
      const newAverageResponseTime = 
        currentData.averageResponseTime * (1 - weight) +
        averageResponseTime * weight

      // Calculer le score de focus basé sur temps de réponse et précision
      const focusScore = this.calculateFocusScore(newAccuracy, newAverageResponseTime)

      // Estimer le niveau d'énergie
      const energyLevel = this.estimateEnergyLevel(newAccuracy, focusScore, hour)

      // Mettre à jour les données
      const updatedPerformance = new Map(profile.hourlyPerformance)
      updatedPerformance.set(hour, {
        hour,
        reviewCount: newReviewCount,
        correctCount: newCorrectCount,
        averageResponseTime: newAverageResponseTime,
        accuracyRate: newAccuracy,
        energyLevel,
        focusScore
      })

      // Déterminer le chronotype
      const newChronotype = this.determineChronotype(updatedPerformance)

      // Recalculer les heures peak/low
      const { peakHours, lowHours } = this.calculatePeakAndLowHours(updatedPerformance)

      return {
        ...profile,
        chronotype: newChronotype,
        peakHours,
        lowHours,
        hourlyPerformance: updatedPerformance,
        lastUpdated: Date.now(),
        totalDataPoints: profile.totalDataPoints + reviewCount
      }
    }, 'recordStudySession')
  }

  /**
   * Obtient une recommandation d'étude basée sur le profil
   */
  async getStudyRecommendation(profile: CircadianProfile): Promise<StudyRecommendation> {
    return this.executeWithRetry(async () => {
      const currentHour = new Date().getHours()
      const currentData = profile.hourlyPerformance.get(currentHour)!

      // Trouver la meilleure heure dans les prochaines 12h
      const recommendedHour = this.findOptimalHour(profile, currentHour)
      
      // Déterminer si c'est un bon moment pour étudier
      const shouldStudyNow = this.shouldStudyAtHour(profile, currentHour)
      
      // Niveau d'énergie
      const energyLevel = currentData.energyLevel >= 7 
        ? 'high' 
        : currentData.energyLevel >= 4 
        ? 'medium' 
        : 'low'

      // Durée optimale basée sur l'énergie
      const optimalDuration = this.calculateOptimalDuration(currentData.energyLevel, currentData.focusScore)

      // Difficulté recommandée
      const difficulty = this.recommendDifficulty(currentData.energyLevel, currentData.focusScore)

      // Message personnalisé
      const message = this.generateRecommendationMessage(
        shouldStudyNow,
        energyLevel,
        currentHour,
        recommendedHour,
        profile.chronotype
      )

      return {
        recommendedHour,
        currentHour,
        shouldStudyNow,
        energyLevel,
        optimalDuration,
        difficulty,
        message
      }
    }, 'getStudyRecommendation')
  }

  /**
   * Exporte le profil pour stockage
   */
  async exportProfile(profile: CircadianProfile): Promise<any> {
    return this.executeWithRetry(async () => {
      return {
        ...profile,
        hourlyPerformance: Array.from(profile.hourlyPerformance.entries())
      }
    }, 'exportProfile')
  }

  /**
   * Importe le profil depuis le stockage
   */
  async importProfile(stored: any): Promise<CircadianProfile> {
    return this.executeWithRetry(async () => {
      return {
        ...stored,
        hourlyPerformance: new Map(stored.hourlyPerformance || [])
      }
    }, 'importProfile')
  }

  /**
   * Calcule le score de focus (0-10)
   */
  private calculateFocusScore(accuracy: number, responseTime: number): number {
    // Score basé sur précision (70%)
    const accuracyScore = accuracy * 7

    // Score basé sur vitesse (30%) - optimal = 2000ms
    const speedScore = Math.max(0, 3 - (responseTime - 2000) / 1000 * 0.5)

    return Math.min(10, Math.max(0, accuracyScore + speedScore))
  }

  /**
   * Estime le niveau d'énergie (0-10)
   */
  private estimateEnergyLevel(accuracy: number, focusScore: number, hour: number): number {
    // Combinaison de précision, focus et patterns circadiens naturels
    const performanceScore = (accuracy * 5 + focusScore * 0.5)
    const circadianBonus = this.getDefaultEnergyLevel(hour) * 0.3

    return Math.min(10, Math.max(0, performanceScore + circadianBonus))
  }

  /**
   * Niveau d'énergie par défaut selon l'heure (courbe circadienne typique)
   */
  private getDefaultEnergyLevel(hour: number): number {
    // Courbe circadienne typique
    const curve = [
      2, 1, 1, 1, 2, 3, 5, 6, 7, 8, 8, 7, // 0-11 (minuit à midi)
      5, 4, 6, 7, 8, 7, 6, 5, 4, 3, 2, 2  // 12-23 (midi à minuit)
    ]
    return curve[hour]
  }

  /**
   * Score de focus par défaut
   */
  private getDefaultFocusScore(hour: number): number {
    return this.getDefaultEnergyLevel(hour) * 0.8
  }

  /**
   * Détermine le chronotype de l'utilisateur
   */
  private determineChronotype(performanceMap: Map<number, CircadianPerformanceData>): 'lark' | 'owl' | 'intermediate' {
    // Calculer la performance moyenne matin (6-11), après-midi (12-17), soir (18-23)
    let morningScore = 0, afternoonScore = 0, eveningScore = 0
    let morningCount = 0, afternoonCount = 0, eveningCount = 0

    for (let hour = 6; hour <= 11; hour++) {
      const data = performanceMap.get(hour)!
      if (data.reviewCount > 0) {
        morningScore += data.accuracyRate
        morningCount++
      }
    }

    for (let hour = 12; hour <= 17; hour++) {
      const data = performanceMap.get(hour)!
      if (data.reviewCount > 0) {
        afternoonScore += data.accuracyRate
        afternoonCount++
      }
    }

    for (let hour = 18; hour <= 23; hour++) {
      const data = performanceMap.get(hour)!
      if (data.reviewCount > 0) {
        eveningScore += data.accuracyRate
        eveningCount++
      }
    }

    const avgMorning = morningCount > 0 ? morningScore / morningCount : 0
    const avgAfternoon = afternoonCount > 0 ? afternoonScore / afternoonCount : 0
    const avgEvening = eveningCount > 0 ? eveningScore / eveningCount : 0

    // Lark : meilleur le matin
    if (avgMorning > avgAfternoon && avgMorning > avgEvening) {
      return 'lark'
    }
    // Owl : meilleur le soir
    if (avgEvening > avgMorning && avgEvening > avgAfternoon) {
      return 'owl'
    }
    // Intermediate : équilibré ou meilleur l'après-midi
    return 'intermediate'
  }

  /**
   * Calcule les heures peak et low
   */
  private calculatePeakAndLowHours(performanceMap: Map<number, CircadianPerformanceData>): {
    peakHours: number[]
    lowHours: number[]
  } {
    // Trier les heures par focusScore
    const hoursSorted = Array.from(performanceMap.values())
      .filter(data => data.reviewCount > 0)
      .sort((a, b) => b.focusScore - a.focusScore)

    const peakHours = hoursSorted.slice(0, 5).map(data => data.hour)
    const lowHours = hoursSorted.slice(-5).map(data => data.hour)

    return { peakHours, lowHours }
  }

  /**
   * Trouve l'heure optimale dans les prochaines 12h
   */
  private findOptimalHour(profile: CircadianProfile, currentHour: number): number {
    let bestHour = currentHour
    let bestScore = 0

    for (let offset = 0; offset < 12; offset++) {
      const hour = (currentHour + offset) % 24
      const data = profile.hourlyPerformance.get(hour)!
      const score = data.energyLevel + data.focusScore

      if (score > bestScore) {
        bestScore = score
        bestHour = hour
      }
    }

    return bestHour
  }

  /**
   * Devrait-on étudier maintenant ?
   */
  private shouldStudyAtHour(profile: CircadianProfile, hour: number): boolean {
    const data = profile.hourlyPerformance.get(hour)!
    
    // Bon si niveau d'énergie >= 5 ET pas dans les heures low
    return data.energyLevel >= 5 && !profile.lowHours.includes(hour)
  }

  /**
   * Calcule la durée optimale (minutes)
   */
  private calculateOptimalDuration(energyLevel: number, focusScore: number): number {
    const baseMinutes = 20
    const energyBonus = energyLevel * 2 // 0-20 min
    const focusBonus = focusScore * 1.5 // 0-15 min

    return Math.round(baseMinutes + energyBonus + focusBonus)
  }

  /**
   * Recommande la difficulté
   */
  private recommendDifficulty(energyLevel: number, focusScore: number): 'easy' | 'medium' | 'hard' {
    const score = (energyLevel + focusScore) / 2

    if (score >= 7) return 'hard'
    if (score >= 4) return 'medium'
    return 'easy'
  }

  /**
   * Génère un message de recommandation
   */
  private generateRecommendationMessage(
    shouldStudyNow: boolean,
    energyLevel: string,
    currentHour: number,
    recommendedHour: number,
    chronotype: string
  ): string {
    if (shouldStudyNow) {
      return `✅ C'est un excellent moment pour étudier ! Votre niveau d'énergie est ${energyLevel}.`
    }

    const hoursUntilOptimal = (recommendedHour - currentHour + 24) % 24
    
    if (hoursUntilOptimal === 0) {
      return `⚠️ Votre énergie est actuellement ${energyLevel}. Considérez des cartes faciles.`
    }

    const timeString = hoursUntilOptimal === 1 
      ? 'dans 1 heure' 
      : `dans ${hoursUntilOptimal} heures`

    return `⏰ Votre moment optimal est ${timeString} (${recommendedHour}h). En tant que ${chronotype === 'lark' ? 'personne matinale' : chronotype === 'owl' ? 'personne du soir' : 'chronotype intermédiaire'}, vous performez mieux à ce moment.`
  }

  /**
   * Vérifie si le service est prêt
   */
  isReady(): boolean {
    return true
  }

  /**
   * Libère les ressources du service
   */
  dispose(): void {
    this.log('CircadianSchedulerService disposed')
  }
}
