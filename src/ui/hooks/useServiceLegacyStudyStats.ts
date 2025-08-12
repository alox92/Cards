import { useEffect, useState } from 'react'
import { container } from '@/application/Container'
import { CARD_SERVICE_TOKEN, CardService } from '@/application/services/CardService'
import { DECK_SERVICE_TOKEN, DeckService } from '@/application/services/DeckService'

interface QuickStats { decks: number; due: number; fresh: number }

export function useServiceLegacyStudyStats() {
  const [stats, setStats] = useState<QuickStats>({ decks: 0, due: 0, fresh: 0 })
  useEffect(()=>{ let cancelled=false; (async()=>{
    const deckSvc = container.resolve<DeckService>(DECK_SERVICE_TOKEN)
    const cardSvc = container.resolve<CardService>(CARD_SERVICE_TOKEN)
    const decks = await deckSvc.listDecks()
    const cards = await cardSvc.listAll()
    const now = Date.now()
    const due = cards.filter(c=>c.nextReview <= now).length
    const fresh = cards.filter(c=>c.totalReviews===0).length
    if(!cancelled) setStats({ decks: decks.length, due, fresh })
  })(); return ()=>{ cancelled=true }
  },[])
  return stats
}
export default useServiceLegacyStudyStats
