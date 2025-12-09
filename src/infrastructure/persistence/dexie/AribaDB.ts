import Dexie, { Table } from 'dexie'
import { CardEntity } from '@/domain/entities/Card'
import { DeckEntity } from '@/domain/entities/Deck'
import type { StudySession } from '@/domain/entities/StudySession'

export type CardRow = Omit<CardEntity, 'toJSON' | 'clone' | 'getStats' | 'getSuccessRate' | 'isDue' | 'isMature' | 'getRetentionScore'>
export type DeckRow = Omit<DeckEntity, 'toJSON' | 'updateStats' | 'calculateStats' | 'recordStudySession'>

export class AribaDB extends Dexie {
  cards!: Table<CardRow, string>
  decks!: Table<DeckRow, string>
  sessions!: Table<StudySession, string>
  media!: Table<MediaRow, string>
  meta!: Table<any, string>
  constructor(){
    super('AribaDB')
    // v1: cards, decks
    this.version(1).stores({
      cards: 'id, deckId, nextReview',
      decks: 'id'
    })
    // v2: add sessions store
    this.version(2).stores({
      cards: 'id, deckId, nextReview',
      decks: 'id',
      sessions: 'id, deckId, startTime'
    })
    // v3: media storage (blobs) + keep previous stores
    this.version(3).stores({
      cards: 'id, deckId, nextReview',
      decks: 'id',
      sessions: 'id, deckId, startTime',
      media: 'id,type'
    })
    // v4: add checksum index for media integrity
    this.version(4).stores({
      cards: 'id, deckId, nextReview',
      decks: 'id',
      sessions: 'id, deckId, startTime',
      media: 'id,type,checksum'
    }).upgrade(async tx => {
      // Compute checksum for existing media lacking it
      const table = tx.table('media') as Table<any, string>
      const rows = await table.toArray()
      // Minimal hash impl if crypto.subtle unavailable (copied logic from export module)
      const sha256 = async (blob: Blob) => {
        const buf = await blob.arrayBuffer()
        if (typeof crypto !== 'undefined' && crypto.subtle){
          try { const hash = await crypto.subtle.digest('SHA-256', buf); return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('') } catch {}
        }
        let h = 0; const view = new Uint8Array(buf); for(const b of view){ h = (h*31 + b) >>> 0 } return ('00000000'+h.toString(16)).slice(-8)
      }
      for(const r of rows){
        if(!r.checksum){
          try { r.checksum = await sha256(r.blob); await table.put(r) } catch {}
        }
      }
    })
    // v5: full-text simple index (inverted) on terms
    this.version(5).stores({
      cards: 'id, deckId, nextReview',
      decks: 'id',
      sessions: 'id, deckId, startTime',
      media: 'id,type,checksum',
      searchIndex: '++id,term,cardId'
    })
    // v6: search term stats + trigram fuzzy index
    this.version(6).stores({
      cards: 'id, deckId, nextReview',
      decks: 'id',
      sessions: 'id, deckId, startTime',
      media: 'id,type,checksum',
      searchIndex: '++id,term,cardId',
      searchTermStats: 'term,count',
      searchTrigrams: '++id,tri,cardId'
    })
    // v7: table meta pour tracer les upgrades & permettre future stratégie de sauvegarde/wipe contrôlé
    this.version(7).stores({
      cards: 'id, deckId, nextReview',
      decks: 'id',
      sessions: 'id, deckId, startTime',
      media: 'id,type,checksum',
      searchIndex: '++id,term,cardId',
      searchTermStats: 'term,count',
      searchTrigrams: '++id,tri,cardId',
      meta: 'key'
    }).upgrade(async tx => {
      try {
        const meta = tx.table('meta') as Table<any,string>
        await meta.put({ key: 'schemaVersion', value: 7, upgradedAt: Date.now() })
      } catch {/* ignore */}
    })
  }
}

export const aribaDB = new AribaDB()
export interface MediaRow { id: string; type: 'image' | 'audio' | 'pdf'; mime: string; blob: Blob; created: number; checksum?: string }
export interface SearchIndexRow { id?: number; term: string; cardId: string }
export interface SearchTermStatRow { term: string; count: number }
export interface SearchTrigramRow { id?: number; tri: string; cardId: string }
