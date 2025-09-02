import type { CardRepository } from '../../domain/repositories/CardRepository'
import { CardEntity, type CardCreationData } from '../../domain/entities/Card'
import { ValidationError, ServiceError } from '@/utils/errors'
import { logger } from '@/utils/logger'

export class CardService {
  private repo: CardRepository
  constructor(repo: CardRepository) { this.repo = repo }
  async create(deckId: string, data: CardCreationData): Promise<CardEntity> {
    if(!deckId) throw new ValidationError('deckId requis pour créer une carte','CARD_CREATE_MISSING_DECK')
    if(!data.frontText || !data.backText) throw new ValidationError('frontText et backText requis','CARD_CREATE_VALIDATION')
    try {
      const entity = new CardEntity({ ...data, deckId })
      return await this.repo.create(entity)
    } catch(e){
      logger.error('CardService','Echec création carte',{error:e})
      throw new ServiceError('Erreur création carte','CARD_CREATE_FAILED',{ cause: e })
    }
  }
  async update(card: CardEntity): Promise<void> { 
    if(!card.id) throw new ValidationError('ID carte manquant','CARD_UPDATE_NO_ID')
    try { await this.repo.update(card) } catch(e){
      logger.error('CardService','Echec maj carte',{error:e, id: card.id})
      throw new ServiceError('Erreur mise à jour carte','CARD_UPDATE_FAILED',{ cause: e, id: card.id })
    }
  }
  async delete(id: string): Promise<void> { 
    if(!id) throw new ValidationError('ID requis','CARD_DELETE_NO_ID')
    try { await this.repo.delete(id) } catch(e){
      logger.error('CardService','Echec suppression carte',{error:e,id})
      throw new ServiceError('Erreur suppression carte','CARD_DELETE_FAILED',{ cause: e, id })
    }
  }
  async get(id: string): Promise<CardEntity | null> { 
    if(!id) throw new ValidationError('ID requis','CARD_GET_NO_ID')
  const c = await this.repo.getById(id)
  return c || null
  }
  async listByDeck(deckId: string): Promise<CardEntity[]> { 
    if(!deckId) throw new ValidationError('deckId requis','CARD_LIST_NO_DECK')
    return this.repo.getByDeck(deckId) 
  }
  async listAll(): Promise<CardEntity[]> { return this.repo.getAll() }
  async countAll(): Promise<number> {
    // Si le repo propose une méthode optimisée count, l'utiliser
    const anyRepo: any = this.repo as any
    if(typeof anyRepo.count === 'function') {
      try { return await anyRepo.count() } catch { /* fallback */ }
    }
    // Fallback: charger et compter (moins performant)
    const all = await this.repo.getAll()
    return all.length
  }
}
export const CARD_SERVICE_TOKEN = 'CardService'
