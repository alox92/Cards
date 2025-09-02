import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import OfflineBanner from '@/ui/components/Connectivity/OfflineBanner'

describe('OfflineBanner', () => {
  const original = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(navigator), 'onLine')
  beforeEach(() => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
  })
  it('affiche la bannière quand offline', () => {
    render(<OfflineBanner />)
    expect(screen.getByText(/hors‑ligne/i)).toBeTruthy()
  })
  afterAll(() => {
    if(original) Object.defineProperty(navigator, 'onLine', original)
  })
})
