import { describe, it, expect } from 'vitest'
import { SearchService } from '@/application/services/SearchService'
import type { CardEntity } from '@/domain/entities/Card'

class FakeRepo { constructor(private cards: CardEntity[]){} async getAll(){ return this.cards } }

function makeCard(id:string, deck:string, tags:string[], text:string, nextReviewOffset=-1000): CardEntity {
  return { id, deckId: deck, frontText: text, backText: text+' back', tags, createdAt:Date.now(), nextReview: Date.now()+nextReviewOffset, interval:0, easinessFactor:2.5, totalReviews:0, correctReviews:0, lastReviewedAt:0, recordResponse(){}, cardType:'basic', clozeMap:[], difficulty:2 } as any
}

describe('SearchService', () => {
  it('filters by tag and due', async () => {
    const cards = [makeCard('1','d1',['tagA'],'hello', -1000), makeCard('2','d1',['tagB'],'world', 50000)]
    // patch container resolution minimal
  const svc = new SearchService(new FakeRepo(cards) as any)
    const res = await svc.search({ tag:'tagA', isDue:true })
    expect(res.length).toBe(1)
    expect(res[0].id).toBe('1')
  })
})
