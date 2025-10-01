// Outil léger d'audit des reflows forcés (layout thrash) en dev
// Stratégie: wrapper des points d'entrée lecture/écriture layout (manuels) et batcher les signaux.
// Objectif: détecter les séquences read->write->read rapides susceptibles de provoquer des forced reflows.

import { logger } from '@/utils/logger'

interface ReflowEvent { t: number; phase: 'read' | 'write'; note?: string }

class ReflowAuditor {
  private events: ReflowEvent[] = []
  private enabled = false
  private flushTimer: number | null = null
  private lastFlush = Date.now()

  enable(){
    if(this.enabled) return
    this.enabled = true
    logger.info('ReflowAudit','Activé')
  }

  disable(){
    if(!this.enabled) return
    this.enabled = false
    this.cleanup()
    logger.info('ReflowAudit','Désactivé')
  }

  cleanup(){
    if(this.flushTimer !== null){
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }
  }

  markRead(note?: string){ if(this.enabled) this._push('read', note) }
  markWrite(note?: string){ if(this.enabled) this._push('write', note) }

  private _push(phase: 'read'|'write', note?: string){
    this.events.push({ t: performance.now(), phase, note })
    if(this.flushTimer === null){
      this.flushTimer = window.setTimeout(()=>{ this.flush(); this.flushTimer = null }, 4000)
    }
    if(this.events.length > 200){ this.flush() }
  }

  flush(){
    if(!this.events.length) return
    const evts = this.events
    this.events = []
    const windowMs = Date.now() - this.lastFlush
    this.lastFlush = Date.now()
    // Heuristique: séquences read->write->read rapides = risques reflow thrash
    let thrashPatterns = 0
    for(let i=2;i<evts.length;i++){
      const a = evts[i-2], b = evts[i-1], c = evts[i]
      if(a.phase==='read' && b.phase==='write' && c.phase==='read' && (c.t - a.t) < 8){
        thrashPatterns++
      }
    }
    logger.info('ReflowAudit','Batch', { total: evts.length, thrashPatterns, windowMs })
  }
}

export const reflowAuditor = new ReflowAuditor()

// Helpers ergonomiques (à utiliser dans composants critiques si besoin)
export function markLayoutRead(note?: string){ reflowAuditor.markRead(note) }
export function markLayoutWrite(note?: string){ reflowAuditor.markWrite(note) }
