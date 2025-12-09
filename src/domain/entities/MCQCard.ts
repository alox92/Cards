/**
 * Types pour le système de QCM (Questions à Choix Multiples)
 */

export interface MCQOption {
  id: string
  text: string
  isCorrect: boolean
  explanation?: string // Explication affichée après la réponse
}

export interface MCQCard {
  id: string
  deckId: string
  question: string
  options: MCQOption[] // 2 à 20 options
  multipleAnswers: boolean // true si plusieurs bonnes réponses possibles
  tags?: string[]
  difficulty?: number
  created: number
  lastReviewed?: number
  reviewCount: number
  correctCount: number
  // Stats distracteurs
  distractorStats?: Record<string, number> // optionId → nombre de fois choisi
}

export interface MCQResult {
  cardId: string
  selectedOptions: string[] // IDs des options choisies
  correctOptions: string[] // IDs des bonnes réponses
  isCorrect: boolean
  partialCredit?: number // 0-1 si plusieurs réponses
  timeSpent: number // millisecondes
  timestamp: number
}

export class MCQCardEntity {
  constructor(
    public id: string,
    public deckId: string,
    public question: string,
    public options: MCQOption[],
    public multipleAnswers: boolean = false,
    public tags: string[] = [],
    public difficulty: number = 5,
    public created: number = Date.now(),
    public lastReviewed?: number,
    public reviewCount: number = 0,
    public correctCount: number = 0,
    public distractorStats: Record<string, number> = {}
  ) {
    // Validation : au moins 2 options, au moins 1 correcte
    if (options.length < 2) {
      throw new Error('Un QCM doit avoir au moins 2 options')
    }
    if (options.length > 20) {
      throw new Error('Un QCM ne peut pas avoir plus de 20 options')
    }
    if (!options.some(opt => opt.isCorrect)) {
      throw new Error('Un QCM doit avoir au moins une réponse correcte')
    }
    if (multipleAnswers && options.filter(opt => opt.isCorrect).length < 2) {
      throw new Error('Un QCM à réponses multiples doit avoir au moins 2 bonnes réponses')
    }
  }

  /**
   * Mélange les options (pour éviter que la bonne réponse soit toujours en premier)
   */
  shuffleOptions(): MCQOption[] {
    const shuffled = [...this.options]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  /**
   * Vérifie si les options sélectionnées sont correctes
   */
  checkAnswers(selectedIds: string[]): {
    isCorrect: boolean
    correctIds: string[]
    partialCredit: number
  } {
    const correctIds = this.options.filter(opt => opt.isCorrect).map(opt => opt.id)
    
    if (this.multipleAnswers) {
      // Score partiel pour réponses multiples
      const correctSelected = selectedIds.filter(id => correctIds.includes(id)).length
      const incorrectSelected = selectedIds.filter(id => !correctIds.includes(id)).length
      const totalCorrect = correctIds.length
      
      const partialCredit = Math.max(0, (correctSelected - incorrectSelected) / totalCorrect)
      const isCorrect = partialCredit === 1
      
      return { isCorrect, correctIds, partialCredit }
    } else {
      // Réponse unique
      const isCorrect = selectedIds.length === 1 && correctIds.includes(selectedIds[0])
      return { isCorrect, correctIds, partialCredit: isCorrect ? 1 : 0 }
    }
  }

  /**
   * Enregistre le résultat d'une réponse
   */
  recordResult(result: MCQResult): void {
    this.reviewCount++
    this.lastReviewed = result.timestamp
    
    if (result.isCorrect) {
      this.correctCount++
    }

    // Mettre à jour les stats des distracteurs
    result.selectedOptions.forEach(optionId => {
      this.distractorStats[optionId] = (this.distractorStats[optionId] || 0) + 1
    })
  }

  /**
   * Obtient le taux de réussite
   */
  getSuccessRate(): number {
    if (this.reviewCount === 0) return 0
    return this.correctCount / this.reviewCount
  }

  /**
   * Identifie les distracteurs les plus trompeurs
   */
  getMostDeceptiveDistractors(): MCQOption[] {
    const incorrectOptions = this.options.filter(opt => !opt.isCorrect)
    return incorrectOptions
      .sort((a, b) => {
        const aCount = this.distractorStats[a.id] || 0
        const bCount = this.distractorStats[b.id] || 0
        return bCount - aCount
      })
      .slice(0, 3)
  }

  toJSON(): MCQCard {
    return {
      id: this.id,
      deckId: this.deckId,
      question: this.question,
      options: this.options,
      multipleAnswers: this.multipleAnswers,
      tags: this.tags,
      difficulty: this.difficulty,
      created: this.created,
      lastReviewed: this.lastReviewed,
      reviewCount: this.reviewCount,
      correctCount: this.correctCount,
      distractorStats: this.distractorStats
    }
  }

  static fromJSON(data: MCQCard): MCQCardEntity {
    return new MCQCardEntity(
      data.id,
      data.deckId,
      data.question,
      data.options,
      data.multipleAnswers,
      data.tags,
      data.difficulty,
      data.created,
      data.lastReviewed,
      data.reviewCount,
      data.correctCount,
      data.distractorStats
    )
  }
}
