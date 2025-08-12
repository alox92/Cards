import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// État contrôlé pour mocks
let decksMock: any[] = []
let statsMock: any = null
let decksLoading = true
let statsLoading = true

vi.mock('@/ui/hooks/useDecksService', () => ({
  __esModule: true,
  default: () => ({ decks: decksMock, loading: decksLoading, error: null, refresh: vi.fn() }),
  useDecksService: () => ({ decks: decksMock, loading: decksLoading, error: null, refresh: vi.fn() })
}))
vi.mock('@/ui/hooks/useGlobalStats', () => ({
  __esModule: true,
  default: () => ({ stats: statsMock, loading: statsLoading, error: null, refresh: vi.fn() }),
  useGlobalStats: () => ({ stats: statsMock, loading: statsLoading, error: null, refresh: vi.fn() })
}))

import StudyHubPage from '@/ui/pages/hubs/StudyHubPage'

const baseStats = {
  totalDecks:2,totalCards:14,matureCards:3,averageRetention:0.5,dueToday:5,totalSessions:0,currentStreak:2,avgSessionAccuracy:0.55,
  newCardsToday:1,reviewsToday:7,accuracy:0.58,dueTomorrow:3
}

describe('StudyHubPage', () => {
  it('affiche skeleton puis stats', async () => {
    // Phase skeleton
    decksMock = []
    statsMock = null
    decksLoading = true
    statsLoading = true
    const { container, rerender } = render(<MemoryRouter><StudyHubPage /></MemoryRouter>)
    expect(container.querySelectorAll('.h-24.rounded-xl').length).toBeGreaterThan(0)
    // Phase stats
    decksMock = [
      { id:'d1', name:'Bio', description:'Desc', icon:'🧬', totalCards:10, masteredCards:2, averageSuccessRate:0.6 },
      { id:'d2', name:'Math', description:'', icon:'➗', totalCards:4, masteredCards:1, averageSuccessRate:0.75 }
    ]
    statsMock = baseStats
    decksLoading = false
    statsLoading = false
    rerender(<MemoryRouter><StudyHubPage /></MemoryRouter>)
    await waitFor(()=> expect(screen.getByText('Cartes')).toBeInTheDocument())
  })
  it('filtre les decks (compteur)', async () => {
    decksMock = [
      { id:'d1', name:'Biologie', description:'', icon:'🧬', totalCards:10, masteredCards:2, averageSuccessRate:0.6 },
      { id:'d2', name:'Math', description:'', icon:'➗', totalCards:4, masteredCards:1, averageSuccessRate:0.75 }
    ]
    statsMock = baseStats
    decksLoading = false
    statsLoading = false
    render(<MemoryRouter><StudyHubPage /></MemoryRouter>)
    // Le compteur reflète 2 decks
    await waitFor(()=> expect(screen.getByText(/Paquets \(2\)/)).toBeInTheDocument())
    const input = screen.getByPlaceholderText('Filtrer un paquet...') as HTMLInputElement
    fireEvent.change(input, { target:{ value:'math' } })
    await waitFor(()=> expect(screen.getByText(/Paquets \(1\)/)).toBeInTheDocument())
  })
})
