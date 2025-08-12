import { DeckEntity } from '../../domain/entities/Deck'
import { type DeckRepository } from '../../domain/repositories/DeckRepository'
const STORAGE_KEY = 'ariba-decks'
export class LocalDeckRepository implements DeckRepository {
  private loadRaw(): any[] { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') }
  private persist(decks: DeckEntity[]): void { localStorage.setItem(STORAGE_KEY, JSON.stringify(decks.map(d => d.toJSON()))) }
  async getAll(): Promise<DeckEntity[]> { return this.loadRaw().map(d => DeckEntity.fromJSON(d)) }
  async getById(id: string): Promise<DeckEntity | null> { return (await this.getAll()).find(d => d.id === id) || null }
  async create(deck: DeckEntity): Promise<DeckEntity> { const decks = await this.getAll(); decks.push(deck); this.persist(decks); return deck }
  async update(deck: DeckEntity): Promise<void> { const decks = await this.getAll(); const i = decks.findIndex(d => d.id === deck.id); if (i>=0){ decks[i]=deck; this.persist(decks) } }
  async delete(id: string): Promise<void> { const decks = (await this.getAll()).filter(d => d.id !== id); this.persist(decks) }
}
