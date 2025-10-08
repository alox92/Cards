/**
 * 🔗 TESTS CRITIQUES D'INTÉGRATION
 * Validation complète des flux métier critiques
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { container } from '@/application/Container'
import { DECK_SERVICE_TOKEN, DeckService } from '@/application/services/DeckService'
import { CARD_SERVICE_TOKEN, CardService } from '@/application/services/CardService'
import { SPACED_REPETITION_SERVICE_TOKEN, SpacedRepetitionService } from '@/application/services/SpacedRepetitionService'

describe('🔗 TESTS CRITIQUES - Intégration complète', () => {
  let deckService: DeckService
  let cardService: CardService
  let spacedRepetitionService: SpacedRepetitionService

  beforeEach(() => {
    deckService = container.resolve<DeckService>(DECK_SERVICE_TOKEN)
    cardService = container.resolve<CardService>(CARD_SERVICE_TOKEN)
    spacedRepetitionService = container.resolve<SpacedRepetitionService>(SPACED_REPETITION_SERVICE_TOKEN)
  })

  describe('📝 Flux complet de création', () => {
    it('DOIT créer un deck complet avec 50 cartes et les étudier', async () => {
      // Étape 1: Créer le deck
      const deck = await deckService.createDeck({
        name: 'Mathématiques',
        description: 'Révisions algèbre',
        color: '#3B82F6',
        icon: '🔢',
        tags: ['math', 'algèbre'],
        isPublic: false
      })

      expect(deck.id).toBeDefined()
      expect(deck.name).toBe('Mathématiques')

      // Étape 2: Créer 50 cartes
      const cards = await cardService.createMany(
        deck.id,
        Array.from({ length: 50 }, (_, i) => ({
          frontText: `Question ${i + 1}`,
          backText: `Réponse ${i + 1}`,
          tags: ['math'],
          difficulty: Math.floor(Math.random() * 5) + 1
        })),
        { batchSize: 50 }
      )

      expect(cards).toHaveLength(50)
      cards.forEach(card => {
        expect(card.deckId).toBe(deck.id)
        expect(card.totalReviews).toBe(0)
      })

      // Étape 3: Construire la queue d'étude avec maxTotal
      const queueResult = spacedRepetitionService.getStudyQueue(cards, deck.id, 20, 20)
      expect(queueResult.ok).toBe(true)
      
      if (queueResult.ok) {
        expect(queueResult.value.length).toBeLessThanOrEqual(20)

        // Étape 4: Simuler une session d'étude
        for (const card of queueResult.value) {
          const quality = Math.floor(Math.random() * 3) + 3 // 3-5
          const result = spacedRepetitionService.schedule(card, quality, 2000)
          
          expect(result.ok).toBe(true)
          if (result.ok) {
            expect(result.value.card.totalReviews).toBe(1)
            await cardService.update(result.value.card)
          }
        }

        // Petit délai pour IndexedDB
        await new Promise(resolve => setTimeout(resolve, 50))

        // Étape 5: Vérifier la progression
        const updatedCards = await cardService.listByDeck(deck.id)
        const reviewedCount = updatedCards.filter(c => c.totalReviews > 0).length
        expect(reviewedCount).toBeGreaterThan(0)
      }
    })

    it('DOIT gérer un flux de création/édition/suppression complet', async () => {
      // Créer
      const deck = await deckService.createDeck({
        name: 'Test Deck',
        description: 'Original',
        color: '#000',
        icon: '📚',
        tags: ['test'],
        isPublic: false
      })

      const card = await cardService.create(deck.id, {
        frontText: 'Q Original',
        backText: 'R Original',
        tags: ['v1'],
        difficulty: 3
      })

      // Éditer
      card.frontText = 'Q Modifiée'
      card.backText = 'R Modifiée'
      card.tags = ['v2']
      await cardService.update(card)

      const updated = await cardService.get(card.id)
      expect(updated?.frontText).toBe('Q Modifiée')
      expect(updated?.tags).toContain('v2')

      // Supprimer
      await cardService.delete(card.id)
      const deleted = await cardService.get(card.id)
      expect(deleted).toBeNull()
    })
  })

  describe('📊 Flux de révision progressive', () => {
    it('DOIT suivre la progression d\'un étudiant sur 7 jours', async () => {
      const deck = await deckService.createDeck({
        name: '7-Day Challenge',
        description: '',
        color: '#000',
        icon: '📚',
        tags: [],
        isPublic: false
      })

      // Créer 100 cartes avec createMany
      await cardService.createMany(
        deck.id,
        Array.from({ length: 100 }, (_, i) => ({
          frontText: `Q${i}`,
          backText: `R${i}`,
          tags: [],
          difficulty: 3
        })),
        { batchSize: 50 }
      )

      // Simuler 7 jours d'étude
      const dailyStats: number[] = []

      for (let day = 0; day < 7; day++) {
        // Récupérer les cartes à étudier
        const allCards = await cardService.listByDeck(deck.id)
        const queueResult = spacedRepetitionService.getStudyQueue(allCards, deck.id, 15, 20)
        
        expect(queueResult.ok).toBe(true)
        if (!queueResult.ok) continue

        let dayReviews = 0

        // Étudier les cartes
        for (const card of queueResult.value) {
          const quality = day < 3 ? 3 : 4 // Amélioration progressive
          const result = spacedRepetitionService.schedule(card, quality, 2000)
          
          if (result.ok) {
            await cardService.update(result.value.card)
            dayReviews++
          }
        }

        dailyStats.push(dayReviews)

        // Avancer le temps de 24h
        const allCardsUpdated = await cardService.listByDeck(deck.id)
        for (const card of allCardsUpdated) {
          if (card.nextReview > Date.now()) {
            card.nextReview -= 24 * 60 * 60 * 1000
            await cardService.update(card)
          }
        }
      }

      // Vérifications
      expect(dailyStats).toHaveLength(7)
      expect(dailyStats.reduce((a, b) => a + b, 0)).toBeGreaterThan(0)

      // Vérifier que toutes les cartes ont été revues au moins une fois
      const finalCards = await cardService.listByDeck(deck.id)
      const reviewedCards = finalCards.filter(c => c.totalReviews > 0)
      expect(reviewedCards.length).toBeGreaterThan(50) // Au moins 50%
    }, 10000)
  })

  describe('🎯 Flux de gestion multi-decks', () => {
    it('DOIT gérer simultanément 10 decks avec des cartes', async () => {
      // Créer 10 decks avec createMany
      const decks = await deckService.createMany(
        Array.from({ length: 10 }, (_, i) => ({
          name: `Deck ${i}`,
          description: `Subject ${i}`,
          color: '#000',
          icon: '📚',
          tags: [`subject-${i}`],
          isPublic: false
        })),
        { batchSize: 10 }
      )

      // Créer 20 cartes par deck (200 total) - SÉQUENTIELLEMENT pour éviter les conflits
      for (const deck of decks) {
        const cards = await cardService.createMany(
          deck.id,
          Array.from({ length: 20 }, (_, i) => ({
            frontText: `Q${i}-${deck.name}`,
            backText: `R${i}-${deck.name}`,
            tags: [],
            difficulty: 3
          })),
          { batchSize: 20 }
        )
        expect(cards).toHaveLength(20) // Vérifier immédiatement
      }

      // Vérifier l'intégrité
      for (const deck of decks) {
        const cards = await cardService.listByDeck(deck.id)
        expect(cards).toHaveLength(20)
        cards.forEach(card => {
          expect(card.deckId).toBe(deck.id)
        })
      }

      // Supprimer un deck au milieu
      await deckService.deleteDeck(decks[5].id)

      // Vérifier que les autres decks sont intacts
      const remainingDecks = await deckService.listDecks()
      expect(remainingDecks.length).toBeGreaterThanOrEqual(9)
    })

    it('DOIT isoler les études entre différents decks', async () => {
      // Créer 2 decks
      const deck1 = await deckService.createDeck({
        name: 'Français',
        description: '',
        color: '#000',
        icon: '🇫🇷',
        tags: [],
        isPublic: false
      })

      const deck2 = await deckService.createDeck({
        name: 'Anglais',
        description: '',
        color: '#000',
        icon: '🇬🇧',
        tags: [],
        isPublic: false
      })

      // Créer 50 cartes dans chaque
      await Promise.all(
        Array.from({ length: 50 }, (_, i) =>
          cardService.create(deck1.id, {
            frontText: `FR-Q${i}`,
            backText: `FR-R${i}`,
            tags: ['français'],
            difficulty: 3
          })
        )
      )

      await Promise.all(
        Array.from({ length: 50 }, (_, i) =>
          cardService.create(deck2.id, {
            frontText: `EN-Q${i}`,
            backText: `EN-R${i}`,
            tags: ['anglais'],
            difficulty: 3
          })
        )
      )

      // Récupérer les cartes
      const cards1 = await cardService.listByDeck(deck1.id)
      const cards2 = await cardService.listByDeck(deck2.id)

      // Construire les queues séparément
      const queue1 = spacedRepetitionService.getStudyQueue(cards1, deck1.id, 20)
      const queue2 = spacedRepetitionService.getStudyQueue(cards2, deck2.id, 20)

      expect(queue1.ok && queue2.ok).toBe(true)

      if (queue1.ok && queue2.ok) {
        // Vérifier qu'il n'y a pas de mélange
        queue1.value.forEach(card => {
          expect(card.deckId).toBe(deck1.id)
          expect(card.frontText).toMatch(/^FR-/)
        })

        queue2.value.forEach(card => {
          expect(card.deckId).toBe(deck2.id)
          expect(card.frontText).toMatch(/^EN-/)
        })
      }
    })
  })

  describe('🔄 Flux de récupération après erreur', () => {
    it('DOIT récupérer après une création partielle échouée', async () => {
      const deck = await deckService.createDeck({
        name: 'Recovery Test',
        description: '',
        color: '#000',
        icon: '📚',
        tags: [],
        isPublic: false
      })

      // Essayer de créer 10 cartes dont une invalide
      const results = await Promise.allSettled([
        cardService.create(deck.id, {
          frontText: 'Q1',
          backText: 'R1',
          tags: [],
          difficulty: 3
        }),
        cardService.create(deck.id, {
          frontText: '', // Invalide
          backText: 'R2',
          tags: [],
          difficulty: 3
        }),
        cardService.create(deck.id, {
          frontText: 'Q3',
          backText: 'R3',
          tags: [],
          difficulty: 3
        })
      ])

      const succeeded = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length

      expect(succeeded).toBe(2)
      expect(failed).toBe(1)

      // Vérifier que les cartes valides sont bien créées
      const cards = await cardService.listByDeck(deck.id)
      expect(cards.length).toBe(2)
    })

    it('DOIT maintenir la cohérence après suppression partielle', async () => {
      const deck = await deckService.createDeck({
        name: 'Partial Delete Test',
        description: '',
        color: '#000',
        icon: '📚',
        tags: [],
        isPublic: false
      })

      // Créer 10 cartes
      const cards = await cardService.createMany(
        deck.id,
        Array.from({ length: 10 }, (_, i) => ({
          frontText: `Q${i}`,
          backText: `R${i}`,
          tags: [],
          difficulty: 3
        })),
        { batchSize: 10 }
      )

      // Supprimer 5 cartes + 1 ID invalide
      const deletePromises = [
        ...cards.slice(0, 5).map(c => cardService.delete(c.id)),
        cardService.delete('invalid-id-xyz').catch(() => null) // Ignore l'erreur
      ]

      await Promise.allSettled(deletePromises)

      // Vérifier qu'il reste exactement 5 cartes
      const remaining = await cardService.listByDeck(deck.id)
      expect(remaining).toHaveLength(5)
    })
  })

  describe('⚡ Flux de performance critique', () => {
    it('DOIT gérer un flux complet en moins de 1 seconde', async () => {
      const start = performance.now()

      // Créer deck
      const deck = await deckService.createDeck({
        name: 'Speed Test',
        description: '',
        color: '#000',
        icon: '📚',
        tags: [],
        isPublic: false
      })

      // Créer 20 cartes
      const cards = await Promise.all(
        Array.from({ length: 20 }, (_, i) =>
          cardService.create(deck.id, {
            frontText: `Q${i}`,
            backText: `R${i}`,
            tags: [],
            difficulty: 3
          })
        )
      )

      // Construire queue
      const queueResult = spacedRepetitionService.getStudyQueue(cards, deck.id, 10)

      // Simuler 5 reviews
      if (queueResult.ok) {
        for (let i = 0; i < 5; i++) {
          const card = queueResult.value[i]
          const result = spacedRepetitionService.schedule(card, 4, 1500)
          if (result.ok) {
            await cardService.update(result.value.card)
          }
        }
      }

      const duration = performance.now() - start
      expect(duration).toBeLessThan(1000)
    })
  })
})
