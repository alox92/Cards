import { describe, it, expect } from 'vitest'
import { getFPSMonitor } from '@/utils/fpsMonitor'

// Test basique: après erreur FPS, quietUntil empêche WARN supplémentaires immédiats

describe('FPSMonitor quiet mode', () => {
  it('mute les WARN pendant la fenêtre quiet', async () => {
    const mon: any = getFPSMonitor()
    // Forcer conditions erreur: consecutiveLow >= lowThresholdBeforeError
  ;(mon as any).options.warnBelow = 1000 // assurer avg < warnBelow
  ;(mon as any).frames.push(1)
  ;(mon as any).consecutiveLow = (mon as any).options.lowThresholdBeforeError
  ;(mon as any).report() // devrait générer erreur + quiet
    const initialQuiet = (mon as any).quietUntil
  expect(typeof initialQuiet).toBe('number')
    // Simuler nouveau report pendant quiet: ne doit pas réémettre erreur (consecutiveLow incrementé mais quietUntil intact)
    const prevLastError = (mon as any).lastErrorTime
    ;(mon as any).frames.push(1)
    ;(mon as any).report()
    expect((mon as any).lastErrorTime).toBe(prevLastError)
  })
})
