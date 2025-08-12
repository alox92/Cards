import { useCallback, useEffect, useState } from 'react'
import { container } from '@/application/Container'
import { CARD_SERVICE_TOKEN, CardService } from '@/application/services/CardService'
import type { CardEntity } from '@/domain/entities/Card'

export function useCardsByDeck(deckId: string | null){
  const [cards, setCards] = useState<CardEntity[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string|null>(null)
  const load = useCallback(async () => {
    if(!deckId){ setCards([]); return }
    setLoading(true); setError(null)
    try { const svc = container.resolve<CardService>(CARD_SERVICE_TOKEN); setCards(await svc.listByDeck(deckId)) } catch(e:any){ setError(e.message||'Erreur cartes') } finally { setLoading(false) }
  }, [deckId])
  useEffect(() => { void load() }, [load])
  return { cards, loading, error, reload: load }
}
export default useCardsByDeck
