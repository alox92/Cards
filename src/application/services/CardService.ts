import type { CardRepository } from '../../domain/repositories/CardRepository'
import { CardEntity, type CardCreationData } from '../../domain/entities/Card'
import { logger } from '@/utils/logger'

// Helper local pour créer des erreurs typées avec un code + message lisible attendu par les tests
function svcError(code: string, message: string) {
  const e: any = new Error(message)
  e.code = code
  return e
}

export class CardService {
  private repo: CardRepository
  constructor(repo: CardRepository) { this.repo = repo }
  async create(deckId: string, data: CardCreationData): Promise<CardEntity> {
    if(!deckId) throw svcError('CARD_CREATE_MISSING_DECK','deckId requis')
    if(!data.frontText || !data.backText) throw svcError('CARD_CREATE_VALIDATION','frontText/backText requis')
    try {
      const entity = new CardEntity({ ...data, deckId })
      return await this.repo.create(entity)
    } catch(e){
      logger.error('CardService','Echec création carte',{error:e})
      throw svcError('CARD_CREATE_FAILED','échec création carte')
    }
  }
  async update(card: CardEntity): Promise<void> {
    if(!card.id) throw svcError('CARD_UPDATE_NO_ID','ID carte requis')
    try { await this.repo.update(card) } catch(e){
      logger.error('CardService','Echec maj carte',{error:e, id: card.id})
      throw svcError('CARD_UPDATE_FAILED','échec mise à jour carte')
    }
  }
  async delete(id: string): Promise<void> { 
    if(!id) throw svcError('CARD_DELETE_NO_ID','ID requis')
    try { await this.repo.delete(id) } catch(e){
      logger.error('CardService','Echec suppression carte',{error:e,id})
      throw svcError('CARD_DELETE_FAILED','échec suppression carte')
    }
  }
  async get(id: string): Promise<CardEntity | null> { 
    if(!id) throw svcError('CARD_GET_NO_ID','ID requis')
    try { return await this.repo.getById(id) || null } catch(e){
      logger.error('CardService','Echec get carte',{error:e,id})
      throw svcError('CARD_GET_FAILED','échec récupération carte')
    }
  }
  async listByDeck(deckId: string): Promise<CardEntity[]> { 
    if(!deckId) throw svcError('CARD_LIST_NO_DECK','deckId requis')
    try { return await this.repo.getByDeck(deckId) } catch(e){
      logger.error('CardService','Echec listByDeck',{error:e,deckId})
      throw svcError('CARD_LIST_FAILED','échec listByDeck')
    }
  }
  async listAll(): Promise<CardEntity[]> { 
    try { return await this.repo.getAll() } catch(e){
      logger.error('CardService','Echec listAll',{error:e})
      throw svcError('CARD_LIST_ALL_FAILED','échec listAll')
    }
  }
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
