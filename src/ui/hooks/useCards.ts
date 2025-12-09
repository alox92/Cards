import { useCallback, useEffect, useState } from 'react'
import { container } from '@/application/Container'
import { CARD_SERVICE_TOKEN, CardService } from '@/application/services/CardService'
import type { CardEntity, CardCreationData } from '@/domain/entities/Card'
// Service legacy: méthodes lèvent exceptions et retournent valeurs directes

interface UseCardsOptions { deckId?: string; autoLoad?: boolean }

export function useCards(opts: UseCardsOptions = {}) {
  const { deckId, autoLoad = true } = opts
  const [cards, setCards] = useState<CardEntity[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const svc = container.resolve<CardService>(CARD_SERVICE_TOKEN)

  const refresh = useCallback(async () => {
    setLoading(true); setError(null)
    try {
  const cardsData = deckId ? await svc.listByDeck(deckId) : await svc.listAll()
  setCards(cardsData || [])
    } catch(e:any){ setError(e.message||'Erreur cartes') } finally { setLoading(false) }
  }, [svc, deckId])

  const create = useCallback(async (data: CardCreationData & { deckId: string }) => { 
  const card = await svc.create(data.deckId, data)
    if (card) {
      setCards(c => [...c, card])
      return card
    }
    return null
  }, [svc])

  const update = useCallback(async (card: CardEntity) => { 
  await svc.update(card)
  setCards(cs => cs.map(c => c.id===card.id?card:c))
  }, [svc])

  const remove = useCallback(async (id: string) => { 
  await svc.delete(id)
  setCards(cs => cs.filter(c => c.id!==id))
  }, [svc])

  useEffect(() => { if (autoLoad) { void refresh() } }, [autoLoad, refresh])

  return { cards, loading, error, refresh, create, update, remove }
}

export default useCards
