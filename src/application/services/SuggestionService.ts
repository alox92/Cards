/**
 * 🎯 Service de Suggestions Intelligentes
 * 
 * Calcule les suggestions de révision basées sur :
 * - L'algorithme SM-2 (Spaced Repetition)
 * - Le nombre de cartes dues
 * - La rétention globale
 * - L'historique d'étude
 */

import type { CardEntity } from '@/domain/entities/Card'
import type { DeckEntity } from '@/domain/entities/Deck'
import type {
  DeckStatus,
  PriorityLevel,
  RetentionStats,
  DeckSuggestion
} from '@/types/deckStatus'
import { STATUS_THRESHOLDS } from '@/types/deckStatus'

export class SuggestionService {
  /**
   * Calcule les statistiques de rétention pour un deck
   */
  calculateRetentionStats(cards: CardEntity[]): RetentionStats {
    if (cards.length === 0) {
      return {
        retention: 0,
        dueToday: 0,
        dueSoon: 0,
        unlearnedCount: 0,
        masteredCount: 0,
        avgEasiness: 1.3,
        totalCards: 0
      }
    }

    const now = Date.now()
    const threeDaysFromNow = now + (3 * 24 * 60 * 60 * 1000)

    // Cartes jamais étudiées (repetition = 0)
    const unlearnedCards = cards.filter(c => c.repetition === 0)

    // Cartes dues aujourd'hui (nextReview <= now)
    const dueCards = cards.filter(c => 
      c.nextReview && c.nextReview <= now
    )

    // Cartes dues dans 1-3 jours
    const soonCards = cards.filter(c =>
      c.nextReview &&
      c.nextReview > now &&
      c.nextReview <= threeDaysFromNow
    )

    // Cartes bien maîtrisées (easinessFactor > 2.0 et pas de révision due)
    const masteredCards = cards.filter(c =>
      c.easinessFactor >= 2.0 &&
      (!c.nextReview || c.nextReview > now)
    )

    // Calcul de l'easinessFactor moyen
    const totalEasiness = cards.reduce((sum, c) => sum + c.easinessFactor, 0)
    const avgEasiness = totalEasiness / cards.length

    // Calcul du taux de rétention
    // Basé sur l'easinessFactor moyen (1.3 = 0%, 2.5 = 100%)
    const retention = Math.min(100, Math.max(0, 
      ((avgEasiness - 1.3) / (2.5 - 1.3)) * 100
    ))

    return {
      retention: Math.round(retention),
      dueToday: dueCards.length,
      dueSoon: soonCards.length,
      unlearnedCount: unlearnedCards.length,
      masteredCount: masteredCards.length,
      avgEasiness: Math.round(avgEasiness * 100) / 100,
      totalCards: cards.length
    }
  }

  /**
   * Détermine le status d'un deck
   */
  determineDeckStatus(stats: RetentionStats): DeckStatus {
    // Si aucune carte, considéré comme non appris
    if (stats.totalCards === 0 || stats.unlearnedCount === stats.totalCards) {
      return 'unlearned'
    }

    // Si des cartes jamais étudiées existent
    if (stats.unlearnedCount > 0) {
      return 'unlearned'
    }

    // Si beaucoup de cartes dues aujourd'hui
    if (stats.dueToday >= STATUS_THRESHOLDS.URGENT_DUE_COUNT) {
      return 'urgent'
    }

    // Si des cartes dues aujourd'hui ou bientôt
    if (stats.dueToday > 0 || stats.dueSoon > 0) {
      return 'soon'
    }

    // Si bonne rétention et pas de cartes dues
    if (stats.retention >= STATUS_THRESHOLDS.MASTERED_RETENTION) {
      return 'mastered'
    }

    // Par défaut, considéré comme nécessitant révision bientôt
    return 'soon'
  }

  /**
   * Calcule le niveau de priorité
   */
  calculatePriority(status: DeckStatus, stats: RetentionStats): PriorityLevel {
    switch (status) {
      case 'unlearned':
        return 'critical'
      case 'urgent':
        return 'high'
      case 'soon':
        return stats.dueToday > 0 ? 'medium' : 'low'
      case 'mastered':
        return 'none'
    }
  }

  /**
   * Calcule un score de priorité numérique (0-100)
   */
  calculatePriorityScore(stats: RetentionStats): number {
    // Facteurs de pondération
    const UNLEARNED_WEIGHT = 3
    const DUE_TODAY_WEIGHT = 2
    const DUE_SOON_WEIGHT = 1
    const RETENTION_PENALTY = 0.1

    const score =
      stats.unlearnedCount * UNLEARNED_WEIGHT +
      stats.dueToday * DUE_TODAY_WEIGHT +
      stats.dueSoon * DUE_SOON_WEIGHT -
      (stats.retention / 100) * 10 * RETENTION_PENALTY

    // Normaliser entre 0 et 100
    return Math.max(0, Math.min(100, Math.round(score)))
  }

  /**
   * Génère le message de recommandation
   */
  generateMessage(status: DeckStatus, stats: RetentionStats): string {
    switch (status) {
      case 'unlearned':
        return `${stats.unlearnedCount} nouvelle${stats.unlearnedCount > 1 ? 's' : ''} carte${stats.unlearnedCount > 1 ? 's' : ''} à apprendre`
      case 'urgent':
        return `${stats.dueToday} carte${stats.dueToday > 1 ? 's' : ''} à réviser maintenant`
      case 'soon':
        if (stats.dueToday > 0) {
          return `${stats.dueToday} carte${stats.dueToday > 1 ? 's' : ''} à réviser aujourd'hui`
        }
        return `${stats.dueSoon} carte${stats.dueSoon > 1 ? 's' : ''} à réviser bientôt`
      case 'mastered':
        return `Bien maîtrisé (${stats.retention}% rétention)`
    }
  }

  /**
   * Détermine l'action recommandée
   */
  determineAction(stats: RetentionStats): DeckSuggestion['action'] {
    if (stats.unlearnedCount > 0) {
      return 'study_new'
    }
    if (stats.dueToday > 0) {
      return 'review'
    }
    if (stats.dueSoon > 0) {
      return 'maintain'
    }
    return 'none'
  }

  /**
   * Génère une suggestion complète pour un deck
   */
  generateSuggestion(
    deck: DeckEntity,
    cards: CardEntity[]
  ): DeckSuggestion {
    const stats = this.calculateRetentionStats(cards)
    const status = this.determineDeckStatus(stats)
    const priority = this.calculatePriority(status, stats)
    const priorityScore = this.calculatePriorityScore(stats)
    const message = this.generateMessage(status, stats)
    const action = this.determineAction(stats)

    return {
      deckId: deck.id,
      deckName: deck.name,
      status,
      priority,
      priorityScore,
      stats,
      message,
      action
    }
  }

  /**
   * Génère des suggestions pour plusieurs decks et les trie par priorité
   */
  generateSuggestions(
    decks: DeckEntity[],
    cardsByDeck: Map<string, CardEntity[]>
  ): DeckSuggestion[] {
    const suggestions = decks.map(deck => {
      const cards = cardsByDeck.get(deck.id) || []
      return this.generateSuggestion(deck, cards)
    })

    // Trier par score de priorité (décroissant)
    return suggestions.sort((a, b) => b.priorityScore - a.priorityScore)
  }

  /**
   * Filtre les suggestions par niveau de priorité minimum
   */
  filterByPriority(
    suggestions: DeckSuggestion[],
    minPriority: PriorityLevel
  ): DeckSuggestion[] {
    const priorityOrder: PriorityLevel[] = ['critical', 'high', 'medium', 'low', 'none']
    const minIndex = priorityOrder.indexOf(minPriority)

    return suggestions.filter(s => {
      const currentIndex = priorityOrder.indexOf(s.priority)
      return currentIndex <= minIndex
    })
  }

  /**
   * Obtient les suggestions du jour (decks avec des cartes dues)
   */
  getTodaySuggestions(suggestions: DeckSuggestion[]): DeckSuggestion[] {
    return suggestions.filter(s =>
      s.stats.dueToday > 0 || s.stats.unlearnedCount > 0
    )
  }

  /**
   * Calcule le total de cartes à étudier aujourd'hui
   */
  getTotalDueToday(suggestions: DeckSuggestion[]): number {
    return suggestions.reduce((total, s) =>
      total + s.stats.dueToday + Math.min(s.stats.unlearnedCount, 5), // Max 5 nouvelles cartes par deck
      0
    )
  }

  /**
   * Calcule le pourcentage de rétention global
   */
  getGlobalRetention(suggestions: DeckSuggestion[]): number {
    if (suggestions.length === 0) return 0

    const totalCards = suggestions.reduce((sum, s) => sum + s.stats.totalCards, 0)
    if (totalCards === 0) return 0

    const weightedRetention = suggestions.reduce((sum, s) =>
      sum + (s.stats.retention * s.stats.totalCards),
      0
    )

    return Math.round(weightedRetention / totalCards)
  }
}

// Instance singleton
export const suggestionService = new SuggestionService()
