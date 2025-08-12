import { describe, it, expect } from 'vitest'
import { SpacedRepetitionService } from '@/application/services/SpacedRepetitionService'
import { CardEntity } from '@/domain/entities/Card'

function makeCard(id='temp'): CardEntity {
  return new CardEntity({ id, deckId:'d1', frontText:'F', backText:'B', tags:[], difficulty:2, cardType:'basic' })
}

describe('SRS leech detection', () => {
  it('tags leech after threshold low success', () => {
    const srs = new SpacedRepetitionService()
  const card = makeCard()
    for(let i=0;i<8;i++) srs.schedule(card, 1, 0)
    expect(card.tags.includes('leech')).toBe(true)
  })
  it('excludes buried cards from queue', () => {
    const srs = new SpacedRepetitionService()
  const due1 = makeCard('a'); due1.nextReview = Date.now()-1000
  const due2 = makeCard('b'); due2.nextReview = Date.now()-1000
    // bury due2
    srs.bury([due2.id])
    const queue = srs.getStudyQueue([due1, due2] as any, 'd1', 10)
    expect(queue.find(c=>c.id==='b')).toBeUndefined()
    expect(queue.find(c=>c.id==='a')).toBeDefined()
  })
})
