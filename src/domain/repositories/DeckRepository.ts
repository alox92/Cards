/**
 * Interface Repository pour les Decks
 */
import type { DeckEntity } from '../entities/Deck'

export interface DeckRepository {
  getAll(): Promise<DeckEntity[]>
  getById(id: string): Promise<DeckEntity | null>
  create(deck: DeckEntity): Promise<DeckEntity>
  update(deck: DeckEntity): Promise<void>
  delete(id: string): Promise<void>
}
export const DECK_REPOSITORY_TOKEN = 'DeckRepository'
