// Bridge Phase 3 : relie les événements métier (review, session) à la gamification
// Attribution XP immédiate et émission d'évènements gamification.

import { eventBus } from '@/core/events/EventBus'

interface WindowWithGamification extends Window {
  aribaGamification?: {
    addXP: (xp: number, reason?: string) => void
    triggerEvent?: (event: string, data?: any) => void
  }
}

const w = window as WindowWithGamification

if(!(w as any)._gamificationBridgeInstalled){
  ;(w as any)._gamificationBridgeInstalled = true
  const sessionProgress: Record<string, { studied: number; correct: number }> = {}

  eventBus.subscribe('card.reviewed', (ev: any) => {
    const quality = ev.payload.quality ?? 0
    const base = 2
    const bonus = quality >=4 ? 3 : quality >=3 ? 1 : 0
    w.aribaGamification?.addXP(base + bonus, 'review')
    w.aribaGamification?.triggerEvent?.('card_reviewed', { quality, deckId: ev.payload.deckId })
  })

  eventBus.subscribe('session.progress', (ev: any) => {
    const { sessionId, studied, correct } = ev.payload
    const prev = sessionProgress[sessionId] || { studied:0, correct:0 }
    const dStudied = Math.max(0, studied - prev.studied)
    const dCorrect = Math.max(0, correct - prev.correct)
    if(dStudied>0){
      const xp = dStudied + dCorrect
      if(xp>0) w.aribaGamification?.addXP(xp, 'session')
      w.aribaGamification?.triggerEvent?.('session_progress', { sessionId, studied, correct })
    }
    sessionProgress[sessionId] = { studied, correct }
  })
}
