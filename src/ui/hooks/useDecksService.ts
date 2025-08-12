import { useEffect, useState } from 'react'
import { container } from '@/application/Container'
import { DECK_SERVICE_TOKEN, DeckService } from '@/application/services/DeckService'
import { initializeDemoDataServices } from '@/data/demoData'
import { CARD_SERVICE_TOKEN, CardService } from '@/application/services/CardService'
import type { DeckEntity } from '@/domain/entities/Deck'

export function useDecksService(){
  const [decks, setDecks] = useState<DeckEntity[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string|null>(null)
  useEffect(() => { (async () => { setLoading(true); setError(null); try { const svc = container.resolve<DeckService>(DECK_SERVICE_TOKEN); const cardSvc = container.resolve<CardService>(CARD_SERVICE_TOKEN); let list = await (svc.listDecksWithStats?.() || svc.listDecks()); if(list.length===0){ await initializeDemoDataServices(svc, cardSvc); list = await (svc.listDecksWithStats?.() || svc.listDecks()) } setDecks(list) } catch(e:any){ setError(e.message||'Erreur decks') } finally { setLoading(false) } })() }, [])
  return { decks, loading, error, refresh: async () => { const svc = container.resolve<DeckService>(DECK_SERVICE_TOKEN); setDecks(await (svc.listDecksWithStats?.() || svc.listDecks())) } }
}
export default useDecksService
