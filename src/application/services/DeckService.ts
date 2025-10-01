import type { DeckRepository } from '../../domain/repositories/DeckRepository'
import type { CardRepository } from '../../domain/repositories/CardRepository'
import { DeckEntity, type DeckCreationData } from '../../domain/entities/Deck'
import type { CardEntity } from '../../domain/entities/Card'
import { logger } from '@/utils/logger'

function svcError(code: string, message: string){ const e:any = new Error(message); e.code = code; return e }
// Certains tests mockent logger en ne fournissant que error/debug -> safe wrapper pour warn
const safeWarn = (cat: string, msg: string, data?: any) => {
  try {
    const anyLogger = logger as any
    if (typeof anyLogger.warn === 'function') {
      anyLogger.warn(cat, msg, data)
    } else if (typeof anyLogger.debug === 'function') {
      anyLogger.debug(cat, msg, data)
    }
  } catch {
    /* ignore logging errors */
  }
}

export class DeckService {
  private deckRepo: DeckRepository
  private cardRepo: CardRepository
  constructor(deckRepo: DeckRepository, cardRepo: CardRepository) {
    this.deckRepo = deckRepo
    this.cardRepo = cardRepo
  }
  async listDecks(): Promise<DeckEntity[]> {
    try { return await this.deckRepo.getAll() } catch(e){
      logger.error('DeckService','Erreur récupération decks', e)
      throw svcError('DECK_LIST_FAILED','échec list decks')
    }
  }
  async listDecksWithStats(): Promise<DeckEntity[]> {
    try {
      const decks = await this.deckRepo.getAll()
      for (const d of decks) {
        if (d.totalCards === 0 || d.updated === 0) {
          const cards = await this.cardRepo.getByDeck(d.id)
          d.updateStats(cards as any)
        }
      }
      return decks
    } catch(e){
      logger.error('DeckService','Erreur récupération decks with stats', e)
      throw svcError('DECK_LIST_STATS_FAILED','échec list decks stats')
    }
  }
  async getDeck(id: string): Promise<DeckEntity> {
    if(!id) { safeWarn('DeckService','getDeck: ID deck requis'); throw svcError('DECK_GET_NO_ID','ID deck requis') }
    try {
      const d = await this.deckRepo.getById(id)
      if(!d){ safeWarn('DeckService','getDeck: Deck introuvable',{id}); throw svcError('DECK_NOT_FOUND','Deck introuvable') }
      return d
    } catch(e){
      if(e instanceof Error && (e as any).code?.startsWith?.('DECK_')) throw e
      logger.error('DeckService','getDeck: Erreur inattendue', e)
      throw svcError('DECK_GET_FAILED','échec get deck')
    }
  }
  async createDeck(data: DeckCreationData): Promise<DeckEntity> {
    if(!data.name){ safeWarn('DeckService','createDeck: Nom requis'); throw svcError('DECK_CREATE_VALIDATION','Nom requis') }
    try { const deck = new DeckEntity(data); return await this.deckRepo.create(deck) } catch(e){
      logger.error('DeckService','Échec création deck', e)
      throw svcError('DECK_CREATE_FAILED','échec création deck')
    }
  }
  async updateDeck(deck: DeckEntity): Promise<void> {
    if(!deck.id){ safeWarn('DeckService','updateDeck: ID deck manquant'); throw svcError('DECK_UPDATE_NO_ID','ID deck manquant') }
    try { await this.deckRepo.update(deck) } catch(e){
      logger.error('DeckService','Échec mise à jour deck', e)
      throw svcError('DECK_UPDATE_FAILED','échec mise à jour deck')
    }
  }
  async deleteDeck(id: string): Promise<void> {
    if(!id){ safeWarn('DeckService','deleteDeck: ID requis'); throw svcError('DECK_DELETE_NO_ID','ID requis') }
    try { await this.deckRepo.delete(id); await this.cardRepo.deleteByDeck(id) } catch(e){
      logger.error('DeckService','Échec suppression deck', e)
      throw svcError('DECK_DELETE_FAILED','échec suppression deck')
    }
  }
  async getDeckCards(deckId: string): Promise<CardEntity[]> {
    if(!deckId){ safeWarn('DeckService','getDeckCards: deckId requis'); throw svcError('DECK_LIST_CARDS_NO_ID','deckId requis') }
    try { return await this.cardRepo.getByDeck(deckId) } catch(e){
      logger.error('DeckService','Erreur récupération cartes deck', e)
      throw svcError('DECK_LIST_CARDS_FAILED','échec list cards deck')
    }
  }
}
export const DECK_SERVICE_TOKEN = 'DeckService'
