import { describe, it, expect } from 'vitest'
import { getFPSMonitor } from '@/utils/fpsMonitor'

// Test adaptation history accumulation by simulating low FPS intervals

describe('FPSMonitor adaptationsHistory', () => {
  it('accumule des entrées après plusieurs intervalles bas', async () => {
    const mon: any = getFPSMonitor()
    if(!mon.running) mon.start()
    const originalReport = (mon as any).report?.bind(mon)
    // Forcer paramètres pour adaptation rapide
    ;(mon as any).options.warnBelow = 55
    ;(mon as any).options.minAdaptiveWarnBelow = 30
    for(let i=1;i<=12;i++){
      (mon as any).frames.push(20 + Math.random())
      if((mon as any).frames.length > (mon as any).options.sampleSize) (mon as any).frames.shift()
      ;(mon as any).consecutiveLow++
      if(i % 3 === 0){
        originalReport()
      }
    }
    const stats = mon.getStats()
    // Avec 12 itérations et adaptation modulo 3, on attend au moins 2 adaptations potentiellement (selon seuil min)
    expect(stats.adaptiveApplied).toBeGreaterThanOrEqual(1)
    if(stats.adaptiveApplied > 0){
      expect(stats.adaptationsHistory?.length).toBeGreaterThanOrEqual(1)
    }
  })
})
