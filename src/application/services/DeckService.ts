import { DECK_REPOSITORY_TOKEN, type DeckRepository } from '../../domain/repositories/DeckRepository'
import { CARD_REPOSITORY_TOKEN, type CardRepository } from '../../domain/repositories/CardRepository'
import { DeckEntity, type DeckCreationData } from '../../domain/entities/Deck'
import type { CardEntity } from '../../domain/entities/Card'
import { container } from '../Container'
import { ValidationError, NotFoundError, ServiceError } from '@/utils/errors'
import { logger } from '@/utils/logger'

export class DeckService {
  private deckRepo: DeckRepository
  private cardRepo: CardRepository
  constructor(deckRepo?: DeckRepository, cardRepo?: CardRepository) {
    this.deckRepo = deckRepo || container.resolve<DeckRepository>(DECK_REPOSITORY_TOKEN)
    this.cardRepo = cardRepo || container.resolve<CardRepository>(CARD_REPOSITORY_TOKEN)
  }
  async listDecks(): Promise<DeckEntity[]> { return this.deckRepo.getAll() }
  async listDecksWithStats(): Promise<DeckEntity[]> {
    const decks = await this.deckRepo.getAll()
    // enrichir stats basiques (totalCards/masteredCards) si manquantes
    for (const d of decks) {
      if (d.totalCards === 0 || d.updated === 0) {
        const cards = await this.cardRepo.getByDeck(d.id)
        d.updateStats(cards as any)
      }
    }
    return decks
  }
  async getDeck(id: string): Promise<DeckEntity | null> { 
    if(!id) throw new ValidationError('ID deck requis','DECK_GET_NO_ID')
    const d = await this.deckRepo.getById(id)
    if(!d) throw new NotFoundError('Deck introuvable','DECK_NOT_FOUND',{ id })
    return d
  }
  async createDeck(data: DeckCreationData): Promise<DeckEntity> { 
    if(!data.name) throw new ValidationError('Nom requis','DECK_CREATE_VALIDATION')
    try { const deck = new DeckEntity(data); return await this.deckRepo.create(deck) } catch(e){
      logger.error('DeckService','Echec création deck',{error:e})
      throw new ServiceError('Erreur création deck','DECK_CREATE_FAILED',{ cause: e })
    }
  }
  async updateDeck(deck: DeckEntity): Promise<void> { 
    if(!deck.id) throw new ValidationError('ID deck manquant','DECK_UPDATE_NO_ID')
    try { await this.deckRepo.update(deck) } catch(e){
      logger.error('DeckService','Echec maj deck',{error:e, id: deck.id})
      throw new ServiceError('Erreur mise à jour deck','DECK_UPDATE_FAILED',{ cause: e, id: deck.id })
    }
  }
  async deleteDeck(id: string): Promise<void> { 
    if(!id) throw new ValidationError('ID requis','DECK_DELETE_NO_ID')
    try { await this.deckRepo.delete(id); await this.cardRepo.deleteByDeck(id) } catch(e){
      logger.error('DeckService','Echec suppression deck',{error:e,id})
      throw new ServiceError('Erreur suppression deck','DECK_DELETE_FAILED',{ cause: e, id })
    }
  }
  async getDeckCards(deckId: string): Promise<CardEntity[]> { 
    if(!deckId) throw new ValidationError('deckId requis','DECK_LIST_CARDS_NO_ID')
    return this.cardRepo.getByDeck(deckId) 
  }
}
export const DECK_SERVICE_TOKEN = 'DeckService'
