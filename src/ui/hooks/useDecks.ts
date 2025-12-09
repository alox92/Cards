import { useCallback, useEffect, useState } from 'react'
import { container } from '@/application/Container'
import { DECK_SERVICE_TOKEN, DeckService } from '@/application/services/DeckService'
import type { DeckEntity, DeckCreationData } from '@/domain/entities/Deck'
// Service legacy: valeurs directes + exceptions

interface UseDecksOptions { autoLoad?: boolean }

export function useDecks(opts: UseDecksOptions = {}) {
  const { autoLoad = true } = opts
  const [decks, setDecks] = useState<DeckEntity[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const svc = container.resolve<DeckService>(DECK_SERVICE_TOKEN)

  const refresh = useCallback(async () => {
    setLoading(true); setError(null)
    try { 
  const decksData = await svc.listDecks()
  setDecks(decksData || [])
    } catch(e:any){ setError(e.message||'Erreur decks') } finally { setLoading(false) }
  }, [svc])

  const create = useCallback(async (data: DeckCreationData) => { 
  const deck = await svc.createDeck(data)
    if (deck) {
      setDecks(d => [...d, deck])
      return deck
    }
    return null
  }, [svc])
  const update = useCallback(async (deck: DeckEntity) => { await svc.updateDeck(deck); setDecks(ds => ds.map(d => d.id===deck.id?deck:d)) }, [svc])
  const remove = useCallback(async (id: string) => { await svc.deleteDeck(id); setDecks(ds => ds.filter(d => d.id!==id)) }, [svc])

  useEffect(() => { if (autoLoad) { void refresh() } }, [autoLoad, refresh])

  return { decks, loading, error, refresh, create, update, remove }
}

export default useDecks
