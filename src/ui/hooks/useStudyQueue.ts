import { useCallback, useEffect, useState, useMemo } from 'react'
import { container } from '@/application/Container'
import { STUDY_SESSION_SERVICE_TOKEN, StudySessionService } from '@/application/services/StudySessionService'
import type { CardEntity } from '@/domain/entities/Card'
import { useConcurrentTransition } from '@/utils/reactConcurrentFeatures'
import { webWorkerManager } from '@/utils/webWorkerManager'

interface UseStudyQueueOptions { deckId: string; dailyNewLimit: number }

export function useStudyQueue({ deckId, dailyNewLimit }: UseStudyQueueOptions) {
  const [queue, setQueue] = useState<CardEntity[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { executeTransition } = useConcurrentTransition()
  
  // Memoize service resolution to avoid recreation
  const service = useMemo(() => 
    container.resolve<StudySessionService>(STUDY_SESSION_SERVICE_TOKEN), 
    []
  )

  const build = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const newQueue = await service.buildQueue(deckId, dailyNewLimit)
      
      // Use transition for large queue updates to avoid blocking UI
      if (newQueue.length > 50) {
        executeTransition(() => {
          setQueue(newQueue)
        })
      } else {
        setQueue(newQueue)
      }
    } catch(e: any) {
      setError(e.message || 'Erreur queue')
    } finally {
      setLoading(false)
    }
  }, [service, deckId, dailyNewLimit, executeTransition])

  const record = useCallback(async (card: CardEntity, quality: number, responseTimeMs: number) => {
    try {
      // Record answer - potentially expensive operation
      await service.recordAnswer(card, quality, responseTimeMs)
      
      // Use web worker for SM-2 calculation if enabled
      if (quality !== undefined && card.easinessFactor !== undefined) {
        try {
          const sm2Result = await webWorkerManager.executeSpacedRepetition({
            cardData: {
              easinessFactor: card.easinessFactor,
              interval: card.interval || 1,
              repetition: card.repetition || 0
            },
            quality
          })
          
          console.log('✅ SM-2 calculation completed in worker:', sm2Result)
        } catch (workerError) {
          console.warn('SM-2 worker calculation failed, using fallback:', workerError)
        }
      }
      
      // Remove card from queue using transition for smooth UI
      executeTransition(() => {
        setQueue(q => q.filter(c => c.id !== card.id))
      })
    } catch (error) {
      console.error('Failed to record answer:', error)
      throw error
    }
  }, [service, executeTransition])

  // Memoize the dependencies to prevent unnecessary rebuilds
  const dependencies = useMemo(() => ({ deckId, dailyNewLimit }), [deckId, dailyNewLimit])

  useEffect(() => { 
    void build() 
  }, [build, dependencies.deckId, dependencies.dailyNewLimit])

  // Memoize return value to prevent unnecessary re-renders
  return useMemo(() => ({
    queue,
    loading,
    error,
    rebuild: build,
    record
  }), [queue, loading, error, build, record])
}

export default useStudyQueue
