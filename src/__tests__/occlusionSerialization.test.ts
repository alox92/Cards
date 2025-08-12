import { describe, test, expect } from 'vitest'
import './setupTestEnv'
import { CardEntity } from '@/domain/entities/Card'

describe('Occlusion card serialization & migration', () => {
  test('serialize & deserialize preserves regions', () => {
    const card = new CardEntity({ deckId: 'd1', frontText: 'F', backText: 'B', cardType:'occlusion', occlusionRegions:[{ id:'occ_1', x:0.1, y:0.2, width:0.3, height:0.15, label:'A' }] })
    const json = card.toJSON()
    const restored = CardEntity.fromJSON(json)
    expect(restored.cardType).toBe('occlusion')
    expect(restored.occlusionRegions?.length).toBe(1)
    expect(restored.occlusionRegions?.[0].x).toBeCloseTo(0.1)
  })

  test('migration fallback fills missing fields', () => {
    const legacy: any = { id:'legacy1', deckId:'d2', frontText:'Q', backText:'A', tags:[], difficulty:2 }
    const restored = CardEntity.fromJSON(legacy)
    expect(restored.cardType).toBe('basic')
    expect(Array.isArray(restored.clozeMap)).toBe(true)
    expect(Array.isArray(restored.occlusionRegions)).toBe(true)
  })

  test('labels persist through serialization', () => {
    const card = new CardEntity({ deckId:'d3', frontText:'F', backText:'B', cardType:'occlusion', occlusionRegions:[{ id:'occ_lab', x:0, y:0, width:0.2, height:0.2, label:'Foie' }] })
    const restored = CardEntity.fromJSON(card.toJSON())
    expect(restored.occlusionRegions?.[0].label).toBe('Foie')
  })
})
