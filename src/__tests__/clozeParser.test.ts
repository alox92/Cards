import { describe, it, expect } from 'vitest'
import { parseCloze } from '@/utils/clozeParser'

describe('clozeParser', () => {
  it('parse simple clozes', () => {
    const { masked, map, count } = parseCloze('Bonjour {{c1::monde}} et {{c2::univers}}!')
    expect(masked).toContain('[...]')
    expect(count).toBe(2)
    expect(map.length).toBe(2)
  expect(map[0].index).toBe(1)
  })
  it('ignore malformed', () => {
    const { count } = parseCloze('Texte sans pattern')
    expect(count).toBe(0)
  })
})
