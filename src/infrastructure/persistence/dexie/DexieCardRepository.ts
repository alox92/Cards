import { type CardRepository } from '@/domain/repositories/CardRepository'
import { CardEntity } from '@/domain/entities/Card'
import { aribaDB } from './AribaDB'

export class DexieCardRepository implements CardRepository {
  async getAll(): Promise<CardEntity[]> { const rows = await aribaDB.cards.toArray(); return rows.map(r => CardEntity.fromJSON(r as any)) }
  async getByDeck(deckId: string): Promise<CardEntity[]> { const rows = await aribaDB.cards.where('deckId').equals(deckId).toArray(); return rows.map(r => CardEntity.fromJSON(r as any)) }
  async getById(id: string): Promise<CardEntity | null> { const row = await aribaDB.cards.get(id); return row? CardEntity.fromJSON(row as any): null }
  async create(card: CardEntity): Promise<CardEntity> { await aribaDB.cards.put(card.toJSON() as any); return card }
  async update(card: CardEntity): Promise<void> { await aribaDB.cards.put(card.toJSON() as any) }
  async delete(id: string): Promise<void> { await aribaDB.cards.delete(id) }
  async deleteByDeck(deckId: string): Promise<void> { await aribaDB.cards.where('deckId').equals(deckId).delete() }
}
