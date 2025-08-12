import { describe, it, expect } from 'vitest'
import './setupTestEnv'
import { render, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OcclusionStudyCard from '@/ui/components/Occlusion/OcclusionStudyCard'

const makeCard = (regionsCount=3) => ({
  id: 'card_test', deckId: 'deck', frontText: 'front', backText: 'back', tags: [], difficulty:1,
  created: Date.now(), updated: Date.now(), easinessFactor:2.5, interval:1, repetition:0, lastReview:0, nextReview: Date.now(), quality:0,
  totalReviews:0, correctReviews:0, averageResponseTime:0, cardType:'occlusion', clozeMap:[], occlusionRegions: Array.from({length:regionsCount}).map((_,i)=>({ id:`occ_${i}`, x:0.1*i, y:0.1, width:0.1, height:0.1 }))
} as any)

describe('OcclusionStudyCard UI', () => {
  it('révèle une zone sur clic', () => {
    const card = makeCard(2)
    const { getAllByText, queryAllByText } = render(<div style={{width:300,height:200}}><OcclusionStudyCard card={card} showBack={false} /></div>)
    const before = getAllByText('?').length
    expect(before).toBeGreaterThan(0)
    fireEvent.click(getAllByText('?')[0])
    const after = queryAllByText('?').length
    expect(after).toBeLessThan(before)
  })

  it('bouton Révéler tout fonctionne', () => {
    const card = makeCard(3)
    const { getByText, queryAllByText } = render(<div style={{width:300,height:200}}><OcclusionStudyCard card={card} showBack={false} /></div>)
    const btn = getByText('Révéler tout')
    fireEvent.click(btn)
    // après révélation totale il ne doit plus rester de ?
    expect(queryAllByText('?').length).toBe(0)
  })
  it('clavier: espace révèle suivant puis a révèle tout', async () => {
    const user = userEvent.setup()
    const card = makeCard(4)
    const { getByLabelText, getAllByText, queryAllByText } = render(<div style={{width:300,height:200}}><OcclusionStudyCard card={card} showBack={false} /></div>)
    const container = getByLabelText('Carte occlusion')
    container.focus()
    const before = getAllByText('?').length
    await user.keyboard(' ') // révèle la première zone
    await waitFor(()=> {
      const mid = getAllByText('?').length
      expect(mid).toBeLessThan(before)
    })
    await user.keyboard('a') // révèle tout
    await waitFor(()=> {
      expect(queryAllByText('?').length).toBe(0)
    })
  })
})
