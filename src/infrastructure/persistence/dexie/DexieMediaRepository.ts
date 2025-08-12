import { aribaDB, type MediaRow } from './AribaDB'

export interface MediaRepository {
  save(blob: Blob, type: MediaRow['type'], mime: string): Promise<{ id: string; key: string; type: MediaRow['type'] }>
  get(id: string): Promise<MediaRow | undefined>
  delete(id: string): Promise<void>
}

export class DexieMediaRepository implements MediaRepository {
  async save(blob: Blob, type: MediaRow['type'], mime: string){
    const genId = () => `media_${Date.now()}_${Math.random().toString(36).slice(2)}`
    // compute checksum (SHA-256 or fallback lightweight hash)
    async function computeChecksum(b: Blob){
      // streaming chunk (1MB) to avoid large memory spikes
      const CHUNK_SIZE = 1024 * 1024
      if(typeof crypto !== 'undefined' && (crypto as any).subtle && (window as any).ReadableStream){
        try {
          const reader = b.stream().getReader()
          const chunks: Uint8Array[] = []
          let total = 0
          while(true){
            const { done, value } = await reader.read()
            if(done) break
            if(value){
              chunks.push(value)
              total += value.length
              if(total > 50 * CHUNK_SIZE){ // hard limit ~50MB
                break
              }
            }
          }
          const merged = new Uint8Array(total)
          let offset = 0
            for(const c of chunks){ merged.set(c, offset); offset += c.length }
          const hash = await crypto.subtle.digest('SHA-256', merged)
          return Array.from(new Uint8Array(hash)).map(x=>x.toString(16).padStart(2,'0')).join('')
        } catch { /* fallback below */ }
      }
      const buf = await b.arrayBuffer()
      if(typeof crypto !== 'undefined' && crypto.subtle){
        try { const hash = await crypto.subtle.digest('SHA-256', buf); return Array.from(new Uint8Array(hash)).map(x=>x.toString(16).padStart(2,'0')).join('') } catch {}
      }
      let h=0; const view = new Uint8Array(buf); for(const x of view){ h = (h*31 + x) >>> 0 } return ('00000000'+h.toString(16)).slice(-8)
    }
    let checksum: string | undefined
    try { checksum = await computeChecksum(blob) } catch {}
    if(checksum){
      // Déduplication: rechercher média existant même checksum & mime (index checksum depuis v4)
      try {
        const existing = await aribaDB.media.where('checksum').equals(checksum).first()
        if(existing && existing.mime === mime){
          return { id: existing.id, key: existing.id, type: existing.type }
        }
      } catch { /* ignore */ }
    }
    const id = genId()
    await aribaDB.media.put({ id, type, mime, blob, created: Date.now(), checksum })
    return { id, key: id, type }
  }
  async get(id: string){ return aribaDB.media.get(id) }
  async delete(id: string){ await aribaDB.media.delete(id) }
}
  export const MEDIA_REPOSITORY_TOKEN = 'MEDIA_REPOSITORY'
