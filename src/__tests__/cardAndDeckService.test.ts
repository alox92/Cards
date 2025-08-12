/// <reference types="vitest" />
import { describe, test, expect } from 'vitest'
import './setupTestEnv'
import { container } from '@/application/Container'
import { DECK_SERVICE_TOKEN, DeckService } from '@/application/services/DeckService'
import { CARD_SERVICE_TOKEN, CardService } from '@/application/services/CardService'

// Tests simples CRUD services (sans mocking avancé, base Dexie in-memory navigateur)

describe('DeckService & CardService integration', () => {
  const deckService = container.resolve<DeckService>(DECK_SERVICE_TOKEN)
  const cardService = container.resolve<CardService>(CARD_SERVICE_TOKEN)

  test('create deck then add cards and fetch', async () => {
    const deck = await deckService.createDeck({ name: 'Test Deck', description: 'Desc', color: '#000', icon: '🧪', tags: [], isPublic: false })
    expect(deck.id).toBeTruthy()

    const c1 = await cardService.create(deck.id, { frontText: 'Q1', backText: 'A1', tags: ['t'], difficulty: 2 })
    const c2 = await cardService.create(deck.id, { frontText: 'Q2', backText: 'A2', tags: [], difficulty: 3 })
    expect(c1.deckId).toBe(deck.id)
    expect(c2.deckId).toBe(deck.id)

    const cards = await deckService.getDeckCards(deck.id)
    expect(cards.length).toBeGreaterThanOrEqual(2)
  })

  test('update card then delete', async () => {
    const deck = await deckService.createDeck({ name: 'Temp', description: '', color: '#111', icon: '⚗️', tags: [], isPublic: false })
    const card = await cardService.create(deck.id, { frontText: 'Front', backText: 'Back', tags: [], difficulty: 1 })
    card.update({ frontText: 'Front2' })
    await cardService.update(card)
    const fetched = await cardService.get(card.id)
    expect(fetched?.frontText).toBe('Front2')
    await cardService.delete(card.id)
    const afterDelete = await cardService.get(card.id)
    expect(afterDelete).toBeNull()
  })
})
