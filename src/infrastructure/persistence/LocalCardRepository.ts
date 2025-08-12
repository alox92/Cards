import { CardEntity } from '../../domain/entities/Card'
import { type CardRepository } from '../../domain/repositories/CardRepository'

const STORAGE_KEY = 'ariba-cards'
// Fallback mémoire pour environnement (tests / SSR) sans localStorage
const hasLocalStorage = (() => {
  try { return typeof globalThis !== 'undefined' && typeof (globalThis as any).localStorage !== 'undefined' } catch { return false }
})()
const memoryStore: any[] = []

export class LocalCardRepository implements CardRepository {
  private loadRaw(): any[] {
    if (hasLocalStorage) {
      try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
    }
    return memoryStore
  }
  private persist(cards: CardEntity[]): void {
    if (hasLocalStorage) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cards.map(c => c.toJSON()))) } catch { /* ignore quota */ }
    } else {
      // Remplace le contenu mémoire
      memoryStore.length = 0
      memoryStore.push(...cards.map(c => c.toJSON()))
    }
  }
  async getAll(): Promise<CardEntity[]> { return this.loadRaw().map(c => CardEntity.fromJSON(c)) }
  async getByDeck(deckId: string): Promise<CardEntity[]> { return (await this.getAll()).filter(c => c.deckId === deckId) }
  async getById(id: string): Promise<CardEntity | null> { return (await this.getAll()).find(c => c.id === id) || null }
  async create(card: CardEntity): Promise<CardEntity> { const cards = await this.getAll(); cards.push(card); this.persist(cards); return card }
  async update(card: CardEntity): Promise<void> { const cards = await this.getAll(); const i = cards.findIndex(c => c.id === card.id); if (i>=0){ cards[i]=card; this.persist(cards) } }
  async delete(id: string): Promise<void> { const cards = (await this.getAll()).filter(c => c.id !== id); this.persist(cards) }
  async deleteByDeck(deckId: string): Promise<void> { const cards = (await this.getAll()).filter(c => c.deckId !== deckId); this.persist(cards) }
}
