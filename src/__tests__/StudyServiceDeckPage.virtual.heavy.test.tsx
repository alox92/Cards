import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

// Heavy dataset explicit (exécuté seulement hors FAST_TESTS)
const HEAVY = Array.from({ length: 4000 }, (_, i) => ({
  id: 'H'+i,
  frontText: 'HeavyFront '+i,
  backText: 'HeavyBack '+i,
  tags: [],
  difficulty: 1,
  deckId: 'heavy'
}))

let cardsRef: any[] = []

vi.mock('@/application/Container', () => {
  const svc = {
    getDeck: async () => ({ id: 'heavy', name: 'Deck Heavy' }),
    listByDeck: async () => cardsRef
  }
  return { container: { resolve: () => svc } }
})

import StudyServiceDeckPage from '@/ui/pages/StudyServiceDeckPage'

// Skip automatiquement si FAST_TESTS activé
const SKIP = process.env.FAST_TESTS === '1'

const d = SKIP ? describe.skip : describe

d('StudyServiceDeckPage Heavy dataset (performance boundary)', () => {
  beforeAll(()=> { cardsRef = HEAVY })

  it('virtualise correctement 4000 items et maintient borne de rendu', async () => {
    await act(async ()=> { render(
      <MemoryRouter initialEntries={["/study-service/heavy"]}>
        <Routes>
          <Route path="/study-service/:deckId" element={<StudyServiceDeckPage />} />
        </Routes>
      </MemoryRouter>
    ) })
    const list = await screen.findByTestId('deck-card-list', {}, { timeout: 8000 }) as HTMLElement
    const select = screen.getByRole('combobox') as HTMLSelectElement
    fireEvent.change(select, { target: { value: 'virtual' } })
    await waitFor(()=> { if(list.querySelectorAll('[data-idx]').length === 0) throw new Error('no items yet') })
    const rendered = list.querySelectorAll('[data-idx]').length
    expect(rendered).toBeGreaterThan(5)
    expect(rendered).toBeLessThan(120) // borne de sécurité
  }, 20000)
})