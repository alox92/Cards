import { type DeckRepository } from '@/domain/repositories/DeckRepository'
import { DeckEntity } from '@/domain/entities/Deck'
import { aribaDB } from './AribaDB'

export class DexieDeckRepository implements DeckRepository {
  async getAll(): Promise<DeckEntity[]> { const rows = await aribaDB.decks.toArray(); return rows.map(r => DeckEntity.fromJSON(r as any)) }
  async getById(id: string): Promise<DeckEntity | null> { const row = await aribaDB.decks.get(id); return row? DeckEntity.fromJSON(row as any): null }
  async create(deck: DeckEntity): Promise<DeckEntity> { await aribaDB.decks.put(deck.toJSON() as any); return deck }
  async update(deck: DeckEntity): Promise<void> { await aribaDB.decks.put(deck.toJSON() as any) }
  async delete(id: string): Promise<void> { await aribaDB.decks.delete(id) }
}
