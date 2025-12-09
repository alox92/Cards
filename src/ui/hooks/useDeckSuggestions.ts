import { useState, useEffect } from 'react'
import { container } from '@/application/Container'
import { DECK_SERVICE_TOKEN, DeckService } from '@/application/services/DeckService'
import { SuggestionService } from '@/application/services/SuggestionService'
import type { DeckSuggestion } from '@/types/deckStatus'

/**
 * Hook personnalisé pour gérer les suggestions de paquets
 * Utilise le SuggestionService pour calculer les priorités et générer les recommandations
 */
export const useDeckSuggestions = () => {
  const [suggestions, setSuggestions] = useState<DeckSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const deckService = container.resolve<DeckService>(DECK_SERVICE_TOKEN)
  const suggestionService = new SuggestionService()

  useEffect(() => {
    loadSuggestions()
  }, [])

  const loadSuggestions = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Charger tous les paquets
      const decks = await deckService.listDecks()

      // Générer les suggestions pour chaque paquet
      const allSuggestions: DeckSuggestion[] = []

      for (const deck of decks) {
        // Charger les cartes du paquet
        const cards = await deckService.getDeckCards(deck.id)

        // Générer la suggestion
        const suggestion = suggestionService.generateSuggestion(deck, cards)
        allSuggestions.push(suggestion)
      }

      // Trier par score de priorité décroissant
      const sortedSuggestions = allSuggestions.sort((a, b) => b.priorityScore - a.priorityScore)

      setSuggestions(sortedSuggestions)
    } catch (err) {
      // Erreur chargement suggestions
      setError('Erreur lors du chargement des suggestions')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Obtenir les suggestions pour aujourd'hui (priorité high ou medium)
   */
  const getTodaySuggestions = () => {
    return suggestionService.getTodaySuggestions(suggestions)
  }

  /**
   * Obtenir le taux de rétention global
   */
  const getGlobalRetention = () => {
    return suggestionService.getGlobalRetention(suggestions)
  }

  /**
   * Obtenir les statistiques globales
   */
  const getGlobalStats = () => {
    const totalDecks = suggestions.length
    const totalCards = suggestions.reduce((sum, s) => sum + s.stats.totalCards, 0)
    const dueToday = suggestions.reduce((sum, s) => sum + s.stats.dueToday, 0)
    const unlearnedCards = suggestions.reduce((sum, s) => sum + s.stats.unlearnedCount, 0)
    const masteredCards = suggestions.reduce((sum, s) => sum + s.stats.masteredCount, 0)
    const retention = getGlobalRetention()

    return {
      totalDecks,
      totalCards,
      dueToday,
      unlearnedCards,
      masteredCards,
      retention
    }
  }

  /**
   * Filtrer les suggestions par statut
   */
  const filterByStatus = (status: DeckSuggestion['status']) => {
    return suggestions.filter(s => s.status === status)
  }

  return {
    suggestions,
    isLoading,
    error,
    loadSuggestions,
    getTodaySuggestions,
    getGlobalRetention,
    getGlobalStats,
    filterByStatus
  }
}
