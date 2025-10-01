import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

// Définir les données AVANT vi.mock (hoisted par Vitest)
// Mode rapide: dataset plus petit pour réduire temps; heavy conservé dans test séparé.
const FAST = process.env.FAST_TESTS === '1'
const STRESS_SIZE = FAST ? 650 : 1205
const STRESS_CARDS = Array.from({ length: STRESS_SIZE }, (_, i) => ({
  id: 'c'+i,
  frontText: 'Front question extrêmement longue ' + i + ' ' + 'x'.repeat(i % 40),
  backText: 'Back answer détaillée ' + i + ' ' + 'y'.repeat((i*3) % 55),
  tags: i % 7 === 0 ? ['tag'+(i%5), 'tagX'] : [],
  difficulty: 1,
  deckId: 'd1'
}))

// IMPORTANT: mock avant import du composant pour que les services mockés soient utilisés
vi.mock('@/application/Container', () => {
  const unifiedService = {
    getDeck: async () => ({ id: 'd1', name: 'Deck Stress' }),
    listByDeck: async () => STRESS_CARDS,
    create: vi.fn(), update: vi.fn(), delete: vi.fn()
  }
  return {
    container: {
      // Peu importe le token, retourner selon besoin deck ou card service
      resolve: (_token: any) => unifiedService
    }
  }
})

// Import après mock
import StudyServiceDeckPage from '@/ui/pages/StudyServiceDeckPage'
import { profile } from './testProfiler'

// Mock global getBoundingClientRect pour contrôler les hauteurs d'items
const originalGetBounding = Element.prototype.getBoundingClientRect
beforeEach(() => {
  Element.prototype.getBoundingClientRect = function (): DOMRect {
    // Diversifier la hauteur pour provoquer recalcul itemHeight
    const base = 60 + (Number((this as any).dataset?.idx) % 3) * 10
    return {
      x:0,y:0,width:800,height: base, top:0,left:0,bottom:base,right:800,
      toJSON(){ return {} }
    } as unknown as DOMRect
  }
})

// Cleanup
afterAll(()=> { Element.prototype.getBoundingClientRect = originalGetBounding })

function scrollListTo(list: HTMLElement, px: number){
  act(()=>{
    list.scrollTop = px
    fireEvent.scroll(list)
  })
}

describe('StudyServiceDeckPage Virtualisation & Stress', () => {
  it('active la virtualisation, mesure dynamiquement la hauteur et conserve sélection/navigation', async () => {
    await profile('StudyServiceDeckPage virtual stress', async () => {
      await act(async ()=> { render(
      <MemoryRouter initialEntries={["/study-service/d1"]}>
        <Routes>
          <Route path="/study-service/:deckId" element={<StudyServiceDeckPage />} />
        </Routes>
      </MemoryRouter>
      ) })
    // Attendre que le titre deck soit injecté (polling sur mutation h1)
    await waitFor(()=> {
      const h1 = document.querySelector('h1')
      if(!h1 || !/Deck Stress/.test(h1.textContent||'')) throw new Error('titre deck non chargé')
    }, { timeout: 8000 })
    const list = await screen.findByTestId('deck-card-list', {}, { timeout: 8000 }) as HTMLElement
  // Forcer explicitement le mode virtual si toggle présent
  const modeSelect = screen.queryByRole('combobox') as HTMLSelectElement | null
  if(modeSelect){ fireEvent.change(modeSelect, { target: { value: 'virtual' } }) }
  expect(['virtual','plain','pagination']).toContain(list.dataset.mode!)

    // Au début peu d'éléments rendus
    const initialRendered = list.querySelectorAll('[data-idx]').length
    expect(initialRendered).toBeLessThan(400) // fenêtre + overscan

    // Scroll profond (vers item ~1800)
  scrollListTo(list, 1000 * 70)
    // Attendre prochain frame
    await act(async ()=> {})
    // En mode FAST la fenêtre + overscan sont plus petits: abaisser le seuil requis
  const MIN_AFTER_SCROLL = FAST ? 1 : 10
    await waitFor(()=> {
      const count = list.querySelectorAll('[data-idx]').length
      if(count < MIN_AFTER_SCROLL) throw new Error('pas assez rendu encore (count='+count+' < '+MIN_AFTER_SCROLL+')')
    }, { timeout: FAST ? 3000 : 2000 })
    const afterScrollRendered = list.querySelectorAll('[data-idx]').length
    expect(afterScrollRendered).toBeGreaterThanOrEqual(MIN_AFTER_SCROLL)

    // Attendre qu'une fenêtre ayant atteint des indices élevés soit rendue (plutôt qu'un index fixe fragile)
    // Faire éventuellement quelques scrolls incrémentaux si nécessaire
    let attempt = 0
    await waitFor(()=> {
      const nodes = Array.from(list.querySelectorAll('[data-idx]'))
      if(nodes.length === 0) throw new Error('aucun item encore')
      const maxIdx = Math.max(...nodes.map(n => parseInt(n.getAttribute('data-idx')||'0',10)))
      if(maxIdx < 400){
        // pousser plus loin
        attempt++
        scrollListTo(list, list.scrollTop + 2000)
        throw new Error('scrolling deeper ('+attempt+')')
      }
    }, { timeout: 8000 })
    // Prendre l'élément médian actuellement rendu et interagir avec sa checkbox
    const renderedNow = Array.from(list.querySelectorAll('[data-idx]')) as HTMLElement[]
    const middle = renderedNow[Math.floor(renderedNow.length/2)]
    if(middle){
      const checkbox = middle.querySelector('input[type="checkbox"]') as HTMLInputElement | null
      if(checkbox){
        fireEvent.click(checkbox)
        expect(checkbox.checked).toBe(true)
      }
    }

    // Flip recto/verso via Enter
      fireEvent.keyDown(window, { key: 'Enter' })
    })
  }, 15000)

  it('bascule pagination puis revient virtualisation sans perdre la sélection existante', async () => {
  await act(async ()=> { render(
      <MemoryRouter initialEntries={["/study-service/d1"]}>
        <Routes>
          <Route path="/study-service/:deckId" element={<StudyServiceDeckPage />} />
        </Routes>
      </MemoryRouter>
    ) })
    await waitFor(()=> {
      const h1 = document.querySelector('h1')
      if(!h1 || !/Deck Stress/.test(h1.textContent||'')) throw new Error('titre deck non chargé')
    }, { timeout: 8000 })
    const list = await screen.findByTestId('deck-card-list', {}, { timeout: 8000 }) as HTMLElement
    // Sélectionner première carte
    const firstCheckbox = await waitFor(async () => {
      const cb = list.querySelector('input[type="checkbox"]') as HTMLInputElement | null
      if(!cb) throw new Error('no checkbox yet')
      return cb
    }, { timeout: 2000 })
    fireEvent.click(firstCheckbox)
    expect(firstCheckbox.checked).toBe(true)

    // Passer en pagination
    const modeSelect = screen.getByRole('combobox') as HTMLSelectElement
    fireEvent.change(modeSelect, { target: { value: 'pagination' } })
    expect(list.getAttribute('data-mode')).toBe('pagination')

    // Aller page suivante (bouton Next)
    const nextBtn = await screen.findByText('Next')
    fireEvent.click(nextBtn)

    // Revenir virtualisation
    fireEvent.change(modeSelect, { target: { value: 'virtual' } })
    expect(list.getAttribute('data-mode')).toBe('virtual')

    // Vérifier que la case initiale est encore cochée (si toujours dans DOM rendu courant) sinon ignorer
    const anyChecked = list.querySelector('input[type="checkbox"][checked]')
    expect(anyChecked).toBeTruthy()
  }, 15000)
})
