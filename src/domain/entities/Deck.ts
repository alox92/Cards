/**
 * Entité Deck - Représente un paquet de cartes flash
 */

import type { Card } from './Card'

export interface Deck {
  id: string
  name: string
  description: string
  color: string
  icon: string
  tags: string[]
  isPublic: boolean
  created: number
  updated: number
  
  // Statistiques
  totalCards: number
  studiedCards: number
  masteredCards: number
  averageSuccessRate: number
  totalStudyTime: number
  lastStudied: number
  
  // Configuration
  settings: DeckSettings
  
  // Métadonnées
  metadata?: Record<string, any>
}

export interface DeckSettings {
  dailyNewCards: number
  dailyReviews: number
  enableAudio: boolean
  enableImages: boolean
  randomizeOrder: boolean
  showHints: boolean
  autoPlay: boolean
  studyMode: 'quiz' | 'speed' | 'matching' | 'writing' | 'mixed'
}

export interface DeckStats {
  deckId: string
  totalCards: number
  newCards: number
  dueCards: number
  studiedToday: number
  averageRetention: number
  studyStreak: number
  timeSpentToday: number
  progressPercentage: number
  difficultyDistribution: {
    easy: number
    medium: number
    hard: number
  }
}

export interface DeckCreationData {
  name: string
  description?: string
  color?: string
  icon?: string
  tags?: string[]
  isPublic?: boolean
  settings?: Partial<DeckSettings>
}

export class DeckEntity implements Deck {
  id: string
  name: string
  description: string
  color: string
  icon: string
  tags: string[]
  isPublic: boolean
  created: number
  updated: number
  
  // Statistics
  totalCards: number
  studiedCards: number
  masteredCards: number
  averageSuccessRate: number
  totalStudyTime: number
  lastStudied: number
  
  // Configuration
  settings: DeckSettings
  
  metadata?: Record<string, any>

  constructor(data: DeckCreationData & { id?: string }) {
    this.id = data.id || this.generateId()
    this.name = data.name
    this.description = data.description || ''
    this.color = data.color || '#3B82F6'
    this.icon = data.icon || '📚'
    this.tags = data.tags || []
    this.isPublic = data.isPublic || false
    this.created = Date.now()
    this.updated = Date.now()
    
    // Initialiser les statistiques
    this.totalCards = 0
    this.studiedCards = 0
    this.masteredCards = 0
    this.averageSuccessRate = 0
    this.totalStudyTime = 0
    this.lastStudied = 0
    
    // Configuration par défaut
    this.settings = {
      dailyNewCards: 20,
      dailyReviews: 100,
      enableAudio: true,
      enableImages: true,
      randomizeOrder: true,
      showHints: true,
      autoPlay: false,
      studyMode: 'quiz',
      ...data.settings
    }
  }

  /**
   * Génère un ID unique pour le deck
   */
  private generateId(): string {
    return `deck_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Met à jour le deck avec de nouvelles données
   */
  update(updates: Partial<DeckCreationData>): void {
    if (updates.name !== undefined) this.name = updates.name
    if (updates.description !== undefined) this.description = updates.description
    if (updates.color !== undefined) this.color = updates.color
    if (updates.icon !== undefined) this.icon = updates.icon
    if (updates.tags !== undefined) this.tags = updates.tags
    if (updates.isPublic !== undefined) this.isPublic = updates.isPublic
    if (updates.settings !== undefined) {
      this.settings = { ...this.settings, ...updates.settings }
    }
    
    this.updated = Date.now()
  }

  /**
   * Met à jour les statistiques basées sur les cartes
   */
  updateStats(cards: Card[]): void {
    this.totalCards = cards.length
    this.studiedCards = cards.filter(card => card.totalReviews > 0).length
    this.masteredCards = cards.filter(card => card.interval >= 21).length
    
    if (cards.length > 0) {
      const totalSuccessRate = cards.reduce((sum, card) => {
        return sum + (card.totalReviews > 0 ? card.correctReviews / card.totalReviews : 0)
      }, 0)
      this.averageSuccessRate = totalSuccessRate / cards.length
    } else {
      this.averageSuccessRate = 0
    }
    
    this.updated = Date.now()
  }

  /**
   * Enregistre une session d'étude
   */
  recordStudySession(duration: number, _cardsStudied: number): void {
    this.totalStudyTime += duration
    this.lastStudied = Date.now()
    this.updated = Date.now()
  }

  /**
   * Calcule les statistiques détaillées
   */
  calculateStats(cards: Card[]): DeckStats {
    const now = Date.now()
    const oneDayAgo = now - (24 * 60 * 60 * 1000)
    
    const newCards = cards.filter(card => card.totalReviews === 0).length
    const dueCards = cards.filter(card => card.nextReview <= now).length
    const studiedToday = cards.filter(card => card.lastReview >= oneDayAgo).length
    
    const totalRetention = cards.reduce((sum, card) => {
      return sum + (card.totalReviews > 0 ? card.correctReviews / card.totalReviews : 0)
    }, 0)
    const averageRetention = cards.length > 0 ? totalRetention / cards.length : 0
    
    // Calculer le streak d'étude (jours consécutifs)
    const studyStreak = this.calculateStudyStreak()
    
    // Distribution de difficulté
    const difficultyDistribution = {
      easy: cards.filter(card => card.difficulty <= 2).length,
      medium: cards.filter(card => card.difficulty === 3).length,
      hard: cards.filter(card => card.difficulty >= 4).length
    }
    
    const progressPercentage = this.totalCards > 0 ? 
      (this.masteredCards / this.totalCards) * 100 : 0
    
    return {
      deckId: this.id,
      totalCards: this.totalCards,
      newCards,
      dueCards,
      studiedToday,
      averageRetention,
      studyStreak,
      timeSpentToday: this.calculateTimeSpentToday(),
      progressPercentage,
      difficultyDistribution
    }
  }

  /**
   * Calcule le streak d'étude
   */
  private calculateStudyStreak(): number {
    // Simulation - en réalité, cela nécessiterait un historique des sessions
    const daysSinceLastStudy = Math.floor((Date.now() - this.lastStudied) / (24 * 60 * 60 * 1000))
    return daysSinceLastStudy <= 1 ? Math.floor(Math.random() * 10) + 1 : 0
  }

  /**
   * Calcule le temps passé aujourd'hui
   */
  private calculateTimeSpentToday(): number {
    // Simulation - en réalité, cela nécessiterait un tracking des sessions
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000)
    return this.lastStudied >= oneDayAgo ? Math.floor(Math.random() * 60) + 5 : 0
  }

  /**
   * Obtient les cartes dues pour révision
   */
  getDueCards(cards: Card[]): Card[] {
    const now = Date.now()
    return cards
      .filter(card => card.deckId === this.id && card.nextReview <= now)
      .sort((a, b) => a.nextReview - b.nextReview)
  }

  /**
   * Obtient les nouvelles cartes selon les paramètres
   */
  getNewCards(cards: Card[]): Card[] {
    return cards
      .filter(card => card.deckId === this.id && card.totalReviews === 0)
      .slice(0, this.settings.dailyNewCards)
  }

  /**
   * Obtient les cartes pour une session d'étude
   */
  getStudyCards(cards: Card[]): Card[] {
    const dueCards = this.getDueCards(cards)
    const newCards = this.getNewCards(cards)
    
    const studyCards = [...dueCards, ...newCards]
    
    if (this.settings.randomizeOrder) {
      return this.shuffleArray(studyCards)
    }
    
    return studyCards
  }

  /**
   * Mélange un tableau
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  /**
   * Vérifie si le deck est vide
   */
  isEmpty(): boolean {
    return this.totalCards === 0
  }

  /**
   * Calcule le pourcentage de progression
   */
  getProgressPercentage(): number {
    return this.totalCards > 0 ? (this.masteredCards / this.totalCards) * 100 : 0
  }

  /**
   * Obtient la couleur du deck en format CSS
   */
  getColorCSS(): string {
    return this.color.startsWith('#') ? this.color : `#${this.color}`
  }

  /**
   * Clone le deck
   */
  clone(): DeckEntity {
    const cloned = new DeckEntity({
      name: `${this.name} (Copy)`,
      description: this.description,
      color: this.color,
      icon: this.icon,
      tags: [...this.tags],
      isPublic: false,
      settings: { ...this.settings }
    })
    
    return cloned
  }

  /**
   * Exporte le deck en format JSON
   */
  toJSON(): Record<string, any> { const { id, name, description, color, icon, tags, isPublic, created, updated, totalCards, studiedCards, masteredCards, averageSuccessRate, totalStudyTime, lastStudied, settings, metadata } = this; return { id, name, description, color, icon, tags, isPublic, created, updated, totalCards, studiedCards, masteredCards, averageSuccessRate, totalStudyTime, lastStudied, settings, metadata } }
  static fromJSON(json: any): DeckEntity { const d = new DeckEntity({ name: json.name, id: json.id, description: json.description, color: json.color, icon: json.icon, tags: json.tags, isPublic: json.isPublic, settings: json.settings }); Object.assign(d, json); return d }
}
