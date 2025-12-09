/**
 * Algorithme SuperMemo SM-5
 * Version améliorée de SM-2 avec matrices optimales et stabilité
 * Basé sur les recherches de Piotr Wozniak (1987-1995)
 */

export interface SM5Data {
  // Paramètres de base
  easiness: number // OF (Optimal Factor) : 1.3 - 5.0
  interval: number // Intervalle en jours
  repetition: number // Nombre de répétitions réussies
  
  // Paramètres SM-5 avancés
  stability: number // S : Stabilité du souvenir (jours)
  difficulty: number // D : Difficulté de l'item (0-10)
  retrievability: number // R : Probabilité de rappel (0-1)
  
  // Matrices optimales (OF-matrix)
  ofMatrix: Map<string, number> // [difficulty][repetition] -> optimal factor
  
  // Historique et métadonnées
  lastQuality: number // Dernière qualité de réponse (0-5)
  lapses: number // Nombre d'échecs totaux
  consecutiveCorrect: number // Réponses correctes consécutives
  lastReview: number // Timestamp dernière révision
  nextReview: number // Timestamp prochaine révision
}

export interface SM5Config {
  initialEasiness: number // OF initial (défaut: 2.5)
  initialStability: number // S initial (défaut: 1 jour)
  minEasiness: number // OF minimum (défaut: 1.3)
  maxEasiness: number // OF maximum (défaut: 5.0)
  requestedFI: number // Requested First Interval (défaut: 1 jour)
  targetRetention: number // Rétention cible (défaut: 0.9 = 90%)
}

/**
 * Service d'algorithme SuperMemo SM-5
 */
export class SM5Service {
  private static instance: SM5Service
  private readonly defaultConfig: SM5Config = {
    initialEasiness: 2.5,
    initialStability: 1,
    minEasiness: 1.3,
    maxEasiness: 5.0,
    requestedFI: 1,
    targetRetention: 0.9
  }

  private constructor() {}

  static getInstance(): SM5Service {
    if (!SM5Service.instance) {
      SM5Service.instance = new SM5Service()
    }
    return SM5Service.instance
  }

  /**
   * Initialise les données SM-5 pour une nouvelle carte
   */
  initialize(config: Partial<SM5Config> = {}): SM5Data {
    const cfg = { ...this.defaultConfig, ...config }

    return {
      easiness: cfg.initialEasiness,
      interval: cfg.requestedFI,
      repetition: 0,
      stability: cfg.initialStability,
      difficulty: 5, // Difficulté moyenne par défaut
      retrievability: 1, // 100% au départ
      ofMatrix: new Map(),
      lastQuality: 0,
      lapses: 0,
      consecutiveCorrect: 0,
      lastReview: Date.now(),
      nextReview: Date.now() + cfg.requestedFI * 86400000 // +1 jour
    }
  }

  /**
   * Calcule la prochaine révision selon SM-5
   * @param data Données SM-5 actuelles
   * @param quality Qualité de la réponse (0-5)
   *   0: Échec total
   *   1: Réponse incorrecte, mais familière
   *   2: Réponse incorrecte, mais facile à rappeler
   *   3: Réponse correcte avec difficulté
   *   4: Réponse correcte après hésitation
   *   5: Réponse correcte parfaite
   * @param config Configuration optionnelle
   */
  calculate(
    data: SM5Data,
    quality: number,
    config: Partial<SM5Config> = {}
  ): SM5Data {
    const cfg = { ...this.defaultConfig, ...config }
    const now = Date.now()

    // Calculer le temps écoulé depuis la dernière révision
    const timeSinceLastReview = (now - data.lastReview) / 86400000 // en jours

    // Calculer la retrievability (probabilité de rappel)
    const retrievability = this.calculateRetrievability(
      timeSinceLastReview,
      data.stability,
      data.difficulty
    )

    // Mettre à jour la difficulté basée sur la performance
    const newDifficulty = this.updateDifficulty(data.difficulty, quality)

    // Vérifier si c'est une réponse correcte (quality >= 3)
    const isCorrect = quality >= 3

    // Incrémenter ou réinitialiser repetition
    const newRepetition = isCorrect ? data.repetition + 1 : 0
    const newConsecutiveCorrect = isCorrect ? data.consecutiveCorrect + 1 : 0
    const newLapses = !isCorrect ? data.lapses + 1 : data.lapses

    // Récupérer l'optimal factor de la matrice
    const ofMatrixKey = this.getOFMatrixKey(newDifficulty, newRepetition)
    let optimalFactor = data.ofMatrix.get(ofMatrixKey) || data.easiness

    // Ajuster l'optimal factor basé sur la qualité
    optimalFactor = this.adjustOptimalFactor(
      optimalFactor,
      quality,
      retrievability,
      cfg
    )

    // Mettre à jour la matrice OF
    const newOFMatrix = new Map(data.ofMatrix)
    newOFMatrix.set(ofMatrixKey, optimalFactor)

    // Calculer la nouvelle stabilité (S)
    const newStability = this.calculateStability(
      data.stability,
      optimalFactor,
      newDifficulty,
      retrievability,
      isCorrect
    )

    // Calculer le nouvel intervalle
    let newInterval: number
    if (newRepetition === 0) {
      // Échec : redémarrer avec intervalle court
      newInterval = cfg.requestedFI
    } else if (newRepetition === 1) {
      // Première répétition réussie
      newInterval = cfg.requestedFI
    } else if (newRepetition === 2) {
      // Deuxième répétition réussie
      newInterval = 6 // 6 jours
    } else {
      // Répétitions suivantes : utiliser OF et stabilité
      newInterval = Math.round(newStability * optimalFactor)
    }

    // Ajuster l'intervalle basé sur la qualité
    if (quality === 5) {
      // Réponse parfaite : augmenter légèrement
      newInterval = Math.round(newInterval * 1.1)
    } else if (quality === 3) {
      // Réponse difficile : réduire légèrement
      newInterval = Math.round(newInterval * 0.9)
    }

    // Contraintes d'intervalle
    newInterval = Math.max(cfg.requestedFI, newInterval)
    newInterval = Math.min(365, newInterval) // Max 1 an

    // Calculer la prochaine date de révision
    const nextReview = now + newInterval * 86400000

    return {
      easiness: optimalFactor,
      interval: newInterval,
      repetition: newRepetition,
      stability: newStability,
      difficulty: newDifficulty,
      retrievability,
      ofMatrix: newOFMatrix,
      lastQuality: quality,
      lapses: newLapses,
      consecutiveCorrect: newConsecutiveCorrect,
      lastReview: now,
      nextReview
    }
  }

  /**
   * Calcule la retrievability (probabilité de rappel)
   * Formule: R = e^(-t/S * ln(2))
   * où t = temps écoulé, S = stabilité
   */
  private calculateRetrievability(
    timeSinceReview: number,
    stability: number,
    difficulty: number
  ): number {
    // Ajuster la stabilité selon la difficulté
    const adjustedStability = stability * (1 + (10 - difficulty) * 0.1)
    
    // Formule exponentielle de décroissance
    const retrievability = Math.exp(-(timeSinceReview / adjustedStability) * Math.log(2))
    
    return Math.max(0, Math.min(1, retrievability))
  }

  /**
   * Met à jour la difficulté de l'item
   */
  private updateDifficulty(currentDifficulty: number, quality: number): number {
    // Ajustement basé sur la qualité
    const adjustment = 0.5 * (3 - quality)
    const newDifficulty = currentDifficulty + adjustment

    // Contraintes : 0-10
    return Math.max(0, Math.min(10, newDifficulty))
  }

  /**
   * Clé pour la matrice OF
   */
  private getOFMatrixKey(difficulty: number, repetition: number): string {
    const difficultyBucket = Math.floor(difficulty) // 0-10
    const repetitionBucket = Math.min(10, repetition) // 0-10
    return `${difficultyBucket}-${repetitionBucket}`
  }

  /**
   * Ajuste l'optimal factor selon la performance
   */
  private adjustOptimalFactor(
    currentOF: number,
    quality: number,
    retrievability: number,
    config: SM5Config
  ): number {
    // Formule SM-5 modifiée
    const retrievabilityImpact = (1 - retrievability) * 0.5
    const qualityImpact = (quality - 3) * 0.1
    
    let newOF = currentOF + retrievabilityImpact + qualityImpact

    // Contraintes
    newOF = Math.max(config.minEasiness, newOF)
    newOF = Math.min(config.maxEasiness, newOF)

    return Number(newOF.toFixed(2))
  }

  /**
   * Calcule la nouvelle stabilité
   */
  private calculateStability(
    currentStability: number,
    optimalFactor: number,
    difficulty: number,
    retrievability: number,
    isCorrect: boolean
  ): number {
    if (!isCorrect) {
      // Échec : réduire la stabilité
      return Math.max(0.5, currentStability * 0.3)
    }

    // Succès : augmenter la stabilité
    const difficultyMultiplier = 1 + (10 - difficulty) * 0.05
    const retrievabilityBonus = 1 + (1 - retrievability) * 0.2
    
    const newStability = currentStability * optimalFactor * difficultyMultiplier * retrievabilityBonus

    return Number(newStability.toFixed(2))
  }

  /**
   * Exporte les données pour stockage
   */
  export(data: SM5Data): any {
    return {
      ...data,
      ofMatrix: Array.from(data.ofMatrix.entries())
    }
  }

  /**
   * Importe les données depuis le stockage
   */
  import(stored: any): SM5Data {
    return {
      ...stored,
      ofMatrix: new Map(stored.ofMatrix || [])
    }
  }

  /**
   * Compare SM-5 vs SM-2 pour A/B testing
   */
  compareWithSM2(sm5Data: SM5Data, sm2Interval: number): {
    sm5Interval: number
    sm2Interval: number
    difference: number
    percentageDiff: number
  } {
    const difference = sm5Data.interval - sm2Interval
    const percentageDiff = ((sm5Data.interval - sm2Interval) / sm2Interval) * 100

    return {
      sm5Interval: sm5Data.interval,
      sm2Interval,
      difference,
      percentageDiff
    }
  }

  /**
   * Convertit des données SM-2 vers SM-5
   */
  migrateFromSM2(sm2Data: {
    easinessFactor: number
    interval: number
    repetition: number
    lastReview: number
  }): SM5Data {
    const sm5Data = this.initialize({
      initialEasiness: sm2Data.easinessFactor,
      requestedFI: Math.max(1, Math.floor(sm2Data.interval))
    })

    return {
      ...sm5Data,
      repetition: sm2Data.repetition,
      lastReview: sm2Data.lastReview,
      nextReview: sm2Data.lastReview + sm2Data.interval * 86400000
    }
  }
}

export default SM5Service.getInstance()
