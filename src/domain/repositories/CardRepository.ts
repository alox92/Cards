/**
 * Interface Repository pour les Cartes
 */
import type { CardEntity } from '../entities/Card'

export interface CardRepository {
  getAll(): Promise<CardEntity[]>
  getByDeck(deckId: string): Promise<CardEntity[]>
  getById(id: string): Promise<CardEntity | null>
  create(card: CardEntity): Promise<CardEntity>
  update(card: CardEntity): Promise<void>
  delete(id: string): Promise<void>
  deleteByDeck(deckId: string): Promise<void>
}
export const CARD_REPOSITORY_TOKEN = 'CardRepository'
