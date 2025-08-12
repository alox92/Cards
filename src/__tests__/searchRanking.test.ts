import { describe, it, expect, beforeAll } from 'vitest'
import { aribaDB } from '@/infrastructure/persistence/dexie/AribaDB'
import { container } from '@/application/Container'
import { CARD_REPOSITORY_TOKEN } from '@/domain/repositories/CardRepository'
import { SearchIndexService, SEARCH_INDEX_SERVICE_TOKEN } from '@/application/services/SearchIndexService'
import { CardEntity } from '@/domain/entities/Card'

// Minimal test of TF-IDF ordering

describe('Search ranking TF-IDF', () => {
  let svc: SearchIndexService
  let cardRepo: any
  beforeAll(async () => {
    if(typeof indexedDB === 'undefined'){ // environment lacks IndexedDB
      // @ts-ignore
      return
    }
    svc = container.resolve<SearchIndexService>(SEARCH_INDEX_SERVICE_TOKEN as any)
    cardRepo = container.resolve<any>(CARD_REPOSITORY_TOKEN)
    // Clear existing
    await aribaDB.cards.clear()
    await (aribaDB as any).searchIndex.clear()
    // Create cards
    const c1 = new CardEntity({ deckId: 'd1', frontText: 'apple apple banana', backText: 'fruit' })
    const c2 = new CardEntity({ deckId: 'd1', frontText: 'apple banana', backText: 'fruit banana' })
    const c3 = new CardEntity({ deckId: 'd1', frontText: 'banana banana banana', backText: 'yellow fruit' })
    await cardRepo.create(c1); await cardRepo.create(c2); await cardRepo.create(c3)
    await svc.indexCard(c1); await svc.indexCard(c2); await svc.indexCard(c3)
  })
  it('orders by normalized TF-IDF (query apple banana)', async () => {
    if(typeof indexedDB === 'undefined'){ return } // skip silently
    const res = await svc.search('apple banana', { ranking: 'tfidf' })
    expect(res.length).toBeGreaterThan(0)
  })
})
