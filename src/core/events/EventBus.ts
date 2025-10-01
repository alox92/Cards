// Simple typed EventBus (pub/sub) pour orchestrer mises à jour UI et invalidations caches.
import { logger } from '@/utils/logger'

export interface BaseEvent<T extends string = string, P = any> { type: T; payload: P; timestamp: number }

export type EventHandler<E extends BaseEvent = BaseEvent> = (event: E) => void

class EventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map()
  private queue: BaseEvent[] = []
  private scheduled = false
  private batching = true
  enableBatching(v: boolean){ this.batching = v }

  publish<E extends BaseEvent>(event: Omit<E, 'timestamp'>) {
    const full = { ...event, timestamp: Date.now() } as BaseEvent
    if(this.batching){
      this.queue.push(full)
      if(!this.scheduled){
        this.scheduled = true
        queueMicrotask(()=> this.flush())
      }
      return
    }
    this.dispatch(full)
  }

  private flush(){
    const toProcess = this.queue
    this.queue = []
    this.scheduled = false
    if(!toProcess.length) return
    // Regroupement par type (optimisation simple)
    for(const ev of toProcess){ this.dispatch(ev) }
  }

  private dispatch(ev: BaseEvent){
    const set = this.handlers.get(ev.type)
    if(!set) return
    for(const h of Array.from(set)){
      try { h(ev) } catch(e){ logger.error('EventBus', 'Event handler error', { error: e }) }
    }
  }

  subscribe<T extends string, P>(type: T, handler: EventHandler<BaseEvent<T,P>>): () => void {
    let set = this.handlers.get(type)
    if(!set){ set = new Set(); this.handlers.set(type, set) }
    set.add(handler as any)
    return () => { set!.delete(handler as any); if(set!.size===0) this.handlers.delete(type) }
  }

  clear(){ this.handlers.clear() }
}

export const eventBus = new EventBus()

// Types d'événements principaux
export type CardReviewedEvent = BaseEvent<'card.reviewed', { cardId: string; deckId: string; quality: number; nextReview: number }>
export type CardCreatedEvent  = BaseEvent<'card.created', { cardId: string; deckId: string }>
export type DeckMutatedEvent  = BaseEvent<'deck.mutated', { deckId: string; op: 'add'|'update'|'remove' }>
export type SessionProgressEvent = BaseEvent<'session.progress', { sessionId: string; studied: number; correct: number }>
