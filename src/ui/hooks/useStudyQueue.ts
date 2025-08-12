import { useCallback, useEffect, useState } from 'react'
import { container } from '@/application/Container'
import { STUDY_SESSION_SERVICE_TOKEN, StudySessionService } from '@/application/services/StudySessionService'
import type { CardEntity } from '@/domain/entities/Card'

interface UseStudyQueueOptions { deckId: string; dailyNewLimit: number }

export function useStudyQueue({ deckId, dailyNewLimit }: UseStudyQueueOptions) {
  const [queue, setQueue] = useState<CardEntity[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const service = container.resolve<StudySessionService>(STUDY_SESSION_SERVICE_TOKEN)

  const build = useCallback(async () => {
    setLoading(true); setError(null)
    try { setQueue(await service.buildQueue(deckId, dailyNewLimit)) } catch(e:any){ setError(e.message||'Erreur queue') } finally { setLoading(false) }
  }, [service, deckId, dailyNewLimit])

  const record = useCallback(async (card: CardEntity, quality: number, responseTimeMs: number) => {
    await service.recordAnswer(card, quality, responseTimeMs)
    // Supprime la carte du début de file si c'est celle traitée
    setQueue(q => q.filter(c => c.id !== card.id))
  }, [service])

  useEffect(() => { void build() }, [build])

  return { queue, loading, error, rebuild: build, record }
}

export default useStudyQueue
