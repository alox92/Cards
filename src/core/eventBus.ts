// Simple event bus (Phase 2) pour remplacer l'usage dispersé de EventTarget.
// Pattern minimal inspiré de mitt, typable via generics.

import { logger } from '@/utils/logger'

export type EventMap = Record<string, any>

export interface EventBus<Events extends EventMap> {
  on<K extends keyof Events>(type: K, handler: (event: Events[K]) => void): void
  off<K extends keyof Events>(type: K, handler: (event: Events[K]) => void): void
  emit<K extends keyof Events>(type: K, event: Events[K]): void
  clear(): void
}

export function createEventBus<Events extends EventMap = any>(): EventBus<Events> {
  const all = new Map<string, Set<Function>>()
  return {
    on(type, handler){
      const set = all.get(type as string) || new Set()
      set.add(handler)
      all.set(type as string, set)
    },
    off(type, handler){
      const set = all.get(type as string)
      if(!set) return
      set.delete(handler)
      if(set.size === 0) all.delete(type as string)
    },
    emit(type, event){
      const set = all.get(type as string)
      if(!set) return
      for(const fn of Array.from(set)){
        try { fn(event) } catch(e){ logger.error('EventBus', 'EventBus handler error', { error: e }) }
      }
    },
    clear(){ all.clear() }
  }
}

// Instance globale (peut être scindée plus tard par domaine)
export const globalEventBus = createEventBus<{
  performance: { metrics: any }
  optimization: { rule: string; timestamp: number }
  cache: { action: string; key?: string }
}>()
