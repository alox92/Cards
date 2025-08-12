/**
 * Données de démonstration pour Cards
 */

import { DeckEntity } from '../domain/entities/Deck'
import type { DeckService } from '@/application/services/DeckService'
import type { CardService } from '@/application/services/CardService'

export const DEMO_DECKS = [
  { name: 'Vocabulaire Anglais - Niveau 1', description: 'Mots essentiels pour débuter en anglais', color: '#3B82F6', icon: '🇬🇧', tags: ['anglais', 'vocabulaire', 'débutant'], isPublic: false },
  { name: 'Mathématiques - Formules de Base', description: 'Formules mathématiques importantes à mémoriser', color: '#10B981', icon: '🔢', tags: ['mathématiques', 'formules'], isPublic: false },
  { name: 'Capitales du Monde', description: 'Géographie mondiale - pays et capitales', color: '#F59E0B', icon: '🌍', tags: ['géographie', 'capitales'], isPublic: false }
]

export const DEMO_CARDS = [
  { frontText: 'Hello', backText: 'Bonjour / Salut', tags: ['salutation'], difficulty: 1, category: 'Vocabulaire de base' },
  { frontText: 'Thank you', backText: 'Merci', tags: ['politesse'], difficulty: 1, category: 'Vocabulaire de base' },
  { frontText: 'How are you?', backText: 'Comment allez-vous ?', tags: ['question'], difficulty: 2, category: 'Vocabulaire de base' },
  { frontText: 'Goodbye', backText: 'Au revoir', tags: ['salutation'], difficulty: 1, category: 'Vocabulaire de base' },
  { frontText: 'Please', backText: "S'il vous plaît", tags: ['politesse'], difficulty: 1, category: 'Vocabulaire de base' },
  { frontText: 'Théorème de Pythagore', backText: 'a² + b² = c²', tags: ['géométrie', 'triangle'], difficulty: 3, category: 'Géométrie' },
  { frontText: "Aire d'un cercle", backText: 'π × r²', tags: ['géométrie', 'cercle'], difficulty: 2, category: 'Géométrie' },
  { frontText: "Périmètre d'un rectangle", backText: '2 × (longueur + largeur)', tags: ['géométrie', 'rectangle'], difficulty: 2, category: 'Géométrie' },
  { frontText: "Volume d'une sphère", backText: '(4/3) × π × r³', tags: ['géométrie', 'volume'], difficulty: 4, category: 'Géométrie' },
  { frontText: 'France', backText: 'Paris', tags: ['europe'], difficulty: 1, category: 'Europe' },
  { frontText: 'Allemagne', backText: 'Berlin', tags: ['europe'], difficulty: 2, category: 'Europe' },
  { frontText: 'Japon', backText: 'Tokyo', tags: ['asie'], difficulty: 2, category: 'Asie' },
  { frontText: 'Brésil', backText: 'Brasilia', tags: ['amérique'], difficulty: 3, category: 'Amérique du Sud' },
  { frontText: 'Australie', backText: 'Canberra', tags: ['océanie'], difficulty: 3, category: 'Océanie' }
]

// Initialisation via services (unique variante après suppression legacy stores)
export const initializeDemoDataServices = async (deckService: DeckService, cardService: CardService) => {
  try {
    console.log('🎯 Initialisation des données de démonstration (services)...')
    const existing = await deckService.listDecks()
    if (existing.length > 0) {
      console.log('📚 Données existantes détectées (services), skip demo init')
      return
    }
    const createdDecks: DeckEntity[] = []
    for (const deckData of DEMO_DECKS) {
      const deck = await deckService.createDeck(deckData as any)
      createdDecks.push(deck)
      console.log(`📚 Deck créé: ${deck.name}`)
    }
    let cardIndex = 0
    for (let deckIndex = 0; deckIndex < createdDecks.length; deckIndex++) {
      const deck = createdDecks[deckIndex]
      const cardsPerDeck = deckIndex === 0 ? 5 : 4
      for (let i = 0; i < cardsPerDeck; i++) {
        if (cardIndex < DEMO_CARDS.length) {
          const cardData = DEMO_CARDS[cardIndex]
          await cardService.create(deck.id, {
            frontText: cardData.frontText,
            backText: cardData.backText,
            tags: cardData.tags,
            difficulty: cardData.difficulty,
            category: (cardData as any).category
          } as any)
          cardIndex++
        }
      }
      console.log(`🃏 ${cardsPerDeck} cartes créées pour ${deck.name}`)
    }
    console.log('✅ Données de démonstration (services) initialisées')
  } catch (e) {
    console.error('❌ Erreur init demo (services):', e)
  }
}
