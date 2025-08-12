import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { container } from '@/application/Container'
import { STUDY_SESSION_SERVICE_TOKEN, StudySessionService } from '@/application/services/StudySessionService'
import type { CardEntity } from '@/domain/entities/Card'
import type { StudySession } from '@/domain/entities/StudySession'

interface Options { deckId?: string; dailyNewLimit?: number }
interface SessionState {
  loading: boolean
  error: string | null
  currentCard: CardEntity | null
  remaining: number
  answering: boolean
  session: StudySession | null
  finished: boolean
  answer: (quality: number) => Promise<void>
  rebuild: () => Promise<void>
  resume: () => Promise<void>
  bury?: (cardIds: string[]) => void
}

export function useServiceStudySession({ deckId, dailyNewLimit = 15 }: Options): SessionState {
  const service = useMemo(() => container.resolve<StudySessionService>(STUDY_SESSION_SERVICE_TOKEN), [])
  const [queue, setQueue] = useState<CardEntity[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [answering, setAnswering] = useState(false)
  const [finished, setFinished] = useState(false)
  const sessionRef = useRef<StudySession | null>(null)

  const buildQueue = useCallback(async () => {
  if(!deckId){ return }
    setLoading(true); setError(null)
    try {
      const q = await service.buildQueue(deckId, dailyNewLimit)
      setQueue(q)
      // Crée une nouvelle session si besoin
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2,9)}`
      sessionRef.current = {
        id: sessionId,
        deckId,
        startTime: Date.now(),
        cardsStudied: 0,
        correctAnswers: 0,
        totalTimeSpent: 0,
        averageResponseTime: 0,
        studyMode: 'quiz',
        performance: { accuracy: 0, speed: 0, consistency: 0, improvement: 0, streak: 0 }
      }
      setFinished(false)
  try { localStorage.setItem(`cards.activeSession.${deckId}`, JSON.stringify({ session: sessionRef.current, queue: q.map(c=>c.id) })) } catch { /* ignore */ }
    } catch(e:any){ setError(e.message || 'Erreur construction session') }
    finally { setLoading(false) }
  }, [deckId, dailyNewLimit, service])

  // Reprise de session
  const resume = useCallback(async () => {
  if(!deckId) return
    try {
  const raw = localStorage.getItem(`cards.activeSession.${deckId}`)
      if(!raw) return
      const parsed = JSON.parse(raw) as { session: StudySession; queue: string[] }
      // reconstruire les cartes
      const q = await service.buildQueue(deckId, dailyNewLimit) // full candidate queue
      const map = new Map(q.map(c=>[c.id,c]))
      const remainingCards: CardEntity[] = []
      for(const id of parsed.queue){ const card = map.get(id); if(card) remainingCards.push(card) }
      if(remainingCards.length){
        setQueue(remainingCards)
        sessionRef.current = parsed.session
        setFinished(false)
      }
    } catch { /* ignore */ }
  }, [deckId, dailyNewLimit, service])

  useEffect(() => { void buildQueue() }, [buildQueue])

  const answer = useCallback(async (quality: number) => {
  if(!deckId || answering || !queue.length) return
    const current = queue[0]
    if(!current) return
    setAnswering(true)
    try {
      const start = performance.now()
      await service.recordAnswer(current, quality, 0) // responseTime non mesuré précisément ici
      const elapsed = performance.now() - start
      // Mettre à jour session
      if(sessionRef.current){
        sessionRef.current.cardsStudied += 1
        sessionRef.current.correctAnswers += (quality >= 3 ? 1 : 0)
        // recalcul simple
        sessionRef.current.averageResponseTime = sessionRef.current.cardsStudied ? ((sessionRef.current.averageResponseTime * (sessionRef.current.cardsStudied - 1)) + elapsed) / sessionRef.current.cardsStudied : 0
      }
      setQueue(q => {
        const next = q.filter(c => c.id !== current.id)
        if(sessionRef.current){
          try { localStorage.setItem(`cards.activeSession.${deckId}`, JSON.stringify({ session: sessionRef.current, queue: next.map(c=>c.id) })) } catch { /* ignore */ }
        }
        return next
      })
      if(queue.length === 1){
        // Session terminée après retrait de la dernière carte
        if(sessionRef.current){
          const completed = await service.endSession(sessionRef.current)
          sessionRef.current = completed
          setFinished(true)
          try { localStorage.removeItem(`cards.activeSession.${deckId}`) } catch { /* ignore */ }
        }
      }
    } catch(e:any){ setError(e.message || 'Erreur réponse') }
    finally { setAnswering(false) }
  }, [answering, queue, service])

  return {
    loading,
    error,
    currentCard: queue[0] || null,
  remaining: queue.length,
    answering,
    session: sessionRef.current,
    finished,
    answer,
  rebuild: buildQueue,
  resume,
  bury: (ids: string[]) => { try { (service as any).srs?.bury?.(ids) } catch {/* ignore */} }
  }
}

export default useServiceStudySession
