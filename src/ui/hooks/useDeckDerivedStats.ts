import { useEffect, useState, useRef } from 'react'
import type { CardEntity } from '@/domain/entities/Card'
import { container } from '@/application/Container'
import { CARD_SERVICE_TOKEN, CardService } from '@/application/services/CardService'
import { eventBus } from '@/core/events/EventBus'

export interface DeckDerivedStats { dueCards: number; newCards: number; mature: number }

/**
 * Calcule à la volée des stats dérivées basées sur les cartes d'un deck.
 * Léger: ne s'abonne pas en temps réel, fournit un refresh manuel.
 */
// Cache global simple avec TTL
interface CacheEntry { stats: DeckDerivedStats; timestamp: number; promise?: Promise<DeckDerivedStats> }
const CACHE_TTL_MS = 30_000
const deckStatsCache = new Map<string, CacheEntry>()

export function useDeckDerivedStats(deckId: string | undefined){
  const [stats, setStats] = useState<DeckDerivedStats>({ dueCards:0, newCards:0, mature:0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string|null>(null)
  const mountedRef = useRef(true)
  useEffect(()=>()=>{ mountedRef.current = false },[])

  useEffect(()=>{
    if(!deckId) return
    const entry = deckStatsCache.get(deckId)
    const now = Date.now()
    if(entry && (now - entry.timestamp) < CACHE_TTL_MS){
      setStats(entry.stats)
      return // cache frais, pas de fetch
    }
    // sinon fetch (sans forcer loading si on dispose déjà d'une valeur)
    refresh(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId])

  // Invalidation événementielle: si une carte du deck est revue ou créée, on invalide et recalcule paresseusement
  useEffect(()=>{
    if(!deckId) return
    const offReviewed = eventBus.subscribe('card.reviewed', (e:any)=>{
      if(e.payload.deckId === deckId){
        deckStatsCache.delete(deckId)
        // recalcul différé microtask pour regrouper plusieurs événements rapides
        queueMicrotask(()=>{ if(mountedRef.current) refresh(false) })
      }
    })
    const offCreated = eventBus.subscribe('card.created', (e:any)=>{
      if(e.payload.deckId === deckId){
        deckStatsCache.delete(deckId)
        queueMicrotask(()=>{ if(mountedRef.current) refresh(false) })
      }
    })
    return () => { offReviewed(); offCreated() }
  }, [deckId])

  async function compute(deckId: string): Promise<DeckDerivedStats>{
    const svc = container.resolve<CardService>(CARD_SERVICE_TOKEN)
    const cards = await svc.listByDeck(deckId) as CardEntity[]
    const now = Date.now()
    let due = 0, neu = 0, mat = 0
    for(const c of cards){
      if(c.nextReview <= now) due++
      if(c.totalReviews === 0) neu++
      if(c.interval >= 21) mat++
    }
    return { dueCards: due, newCards: neu, mature: mat }
  }

  async function refresh(force = true){
    if(!deckId) return
    const cacheEntry = deckStatsCache.get(deckId)
    const now = Date.now()
    if(!force && cacheEntry && (now - cacheEntry.timestamp) < CACHE_TTL_MS && cacheEntry.stats){
      // déjà couvert par useEffect mais on garde la sûreté
      setStats(cacheEntry.stats)
      return
    }
    if(cacheEntry?.promise){
      setLoading(true)
      try {
        const res = await cacheEntry.promise
        if(mountedRef.current) setStats(res)
      } finally { if(mountedRef.current) setLoading(false) }
      return
    }
    const p = compute(deckId)
    deckStatsCache.set(deckId, { stats: cacheEntry?.stats || { dueCards:0, newCards:0, mature:0 }, timestamp: cacheEntry?.timestamp || 0, promise: p })
    setLoading(true); setError(null)
    try {
      const stats = await p
      if(!mountedRef.current) return
      deckStatsCache.set(deckId, { stats, timestamp: Date.now() })
      setStats(stats)
    } catch(e:any){ if(mountedRef.current) setError(e.message||'Erreur stats deck') }
    finally { if(mountedRef.current) setLoading(false) }
  }
  return { ...stats, loading, error, refresh }
}
export default useDeckDerivedStats
