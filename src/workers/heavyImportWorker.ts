// Web Worker pour parsing lourd (pdf, apkg) afin de ne pas bloquer le thread UI
// NOTE: Build Vite: utiliser ?worker ou config spécifique lors de l'import côté appelant.

import JSZip from 'jszip'
// @ts-ignore
import initSqlJs from 'sql.js'

interface PdfTask { type: 'pdf'; arrayBuffer: ArrayBuffer; perHeading?: boolean }
interface ApkgTask { type: 'apkg'; arrayBuffer: ArrayBuffer }
export type HeavyImportTask = PdfTask | ApkgTask

self.onmessage = async (e: MessageEvent<HeavyImportTask>) => {
  const task = e.data
  try {
    if(task.type === 'apkg'){
      const { arrayBuffer } = task
      const u8 = new Uint8Array(arrayBuffer)
      const zip = await JSZip.loadAsync(u8)
      const collection = zip.file('collection.anki2') || zip.file('collection.anki21')
      if(!collection){ (self as any).postMessage({ ok: true, data: [] }); return }
      const buf = await collection.async('uint8array')
      const SQL = await initSqlJs({})
      const db = new SQL.Database(buf)
      let modelFields: Record<string, { fields: string[]; frontIdx?: number; backIdx?: number }> = {}
      try {
        const colRes = db.exec('SELECT models FROM col LIMIT 1')
        if(colRes.length){
          const raw = colRes[0].values[0][0] as string
          const models = JSON.parse(raw).models
          for(const mid in models){
            const mdl = models[mid]
            const fields: string[] = mdl.flds.map((f:any)=> f.name)
            let frontIdx: number | undefined
            let backIdx: number | undefined
            try {
              const tmpl = Array.isArray(mdl.tmpls) && mdl.tmpls.length? mdl.tmpls[0]: null
              if(tmpl){
                const extractFields = (fmt: string) => Array.from(new Set((fmt.match(/{{([^}]+)}}/g)||[]).map((m:string)=> m.replace(/^{*{|}*}$/g,'').trim())))
                const qFields = extractFields(tmpl.qfmt||'')
                const aFields = extractFields(tmpl.afmt||'')
                if(qFields.length){ frontIdx = fields.map(f=> f.toLowerCase()).indexOf(qFields[0].toLowerCase()) }
                for(const q of aFields){ const idx = fields.map(f=> f.toLowerCase()).indexOf(q.toLowerCase()); if(idx>=0 && idx!==frontIdx){ backIdx = idx; break } }
                if(backIdx===undefined && qFields.length>1){ const idx = fields.map(f=> f.toLowerCase()).indexOf(qFields[1].toLowerCase()); if(idx>=0) backIdx = idx }
              }
            } catch {}
            modelFields[mid] = { fields, frontIdx, backIdx }
          }
        }
      } catch {}
      const res = db.exec('SELECT flds, tags, mid FROM notes LIMIT 2000')
      if(!res.length){ (self as any).postMessage({ ok: true, data: [] }); return }
      const rows = res[0].values as any[]
      const frontSyn = ['Front','Recto','Question']
      const backSyn = ['Back','Verso','Answer','Réponse']
      // media mapping
       const mediaMappingFile = zip.file('media') || zip.file('media.json')
       let mediaMap: Record<string,string> = {}
       if(mediaMappingFile){ try { mediaMap = JSON.parse(await mediaMappingFile.async('string')) } catch {} }
       const mediaAssetsAll: Record<string, ArrayBuffer> = {}
       const mediaKeys = Object.keys(mediaMap).slice(0,500)
       for(let i=0;i<mediaKeys.length;i++){
         const key = mediaKeys[i]
         const fileEntry = zip.file(key); if(!fileEntry) continue
         mediaAssetsAll[mediaMap[key]] = await fileEntry.async('arraybuffer')
         if(i % 25 === 0){ (self as any).postMessage({ progress: i / Math.max(1,mediaKeys.length), phase: 'media' }) }
       }
      const out = rows.map(r => {
        const flds: string = r[0] || ''
        const tagsStr: string = r[1] || ''
        const mid: string = String(r[2]||'')
        const parts = flds.split('\u001f')
        let front = parts[0]||''; let back = parts.slice(1).join('\n')
        const meta = modelFields[mid]
        if(meta){
          const fields = meta.fields
          const lower = fields.map(f=> f.toLowerCase())
          let fi = meta.frontIdx!==undefined? meta.frontIdx: -1
            let bi = meta.backIdx!==undefined? meta.backIdx: -1
            const findIdx = (names: string[]) => { for(const n of names){ const i = lower.indexOf(n.toLowerCase()); if(i>=0) return i } return -1 }
            if(fi<0) fi = findIdx(frontSyn)
            if(bi<0) bi = findIdx(backSyn)
            if(fi>=0) front = parts[fi]||front
            if(bi>=0) back = parts[bi]||back
            if(fi>=0 && bi>=0 && fi!==bi){ const extra = parts.filter((_,i)=> i!==fi && i!==bi).join('\n'); if(extra) back += '\n'+extra }
        }
        const mediaAssets: Record<string, ArrayBuffer> = {}
        const mediaRefRegex = /(?:<img[^>]+src="([^"]+)"|\[sound:([^\]]+)\])/gi
        let m: RegExpExecArray | null
        while((m = mediaRefRegex.exec(flds))){
          const fname = (m[1]||m[2])?.split(/[#?]/)[0]
          if(fname && mediaAssetsAll[fname]) mediaAssets[fname] = mediaAssetsAll[fname]
        }
        return { front, back, tags: tagsStr.trim().split(' ').filter(Boolean), mediaAssets }
      })
      ;(self as any).postMessage({ ok: true, data: out })
      return
    }
    if(task.type==='pdf'){
      try {
        // Import minimal build for worker context
  // @ts-ignore dyn import fallback
  const pdfjs: any = await import('pdfjs-dist')
        const data = new Uint8Array(task.arrayBuffer)
        const doc = await pdfjs.getDocument({ data }).promise
        const pages: { text: string; page: number; thumb?: ArrayBuffer }[] = []
        for(let i=1;i<=doc.numPages;i++){
          const page = await doc.getPage(i)
          const content = await page.getTextContent()
          const text = content.items.map((it:any)=> it.str).join('\n')
          let thumb: ArrayBuffer | undefined
          try {
            const viewport = page.getViewport({ scale: 0.2 })
            if(typeof OffscreenCanvas !== 'undefined'){
              const canvas = new OffscreenCanvas(viewport.width, viewport.height)
              const ctx = canvas.getContext('2d') as any
              if(ctx){
                await page.render({ canvasContext: ctx, viewport }).promise
                const blob = await canvas.convertToBlob({ type: 'image/png' })
                thumb = await blob.arrayBuffer()
              }
            }
          } catch {}
          pages.push({ text: text.trim(), page: i, thumb })
          if(i % 3 === 0){ (self as any).postMessage({ progress: i / doc.numPages, phase: 'pages' }) }
        }
        let results: any[] = []
        if(task.perHeading){
          const lines = pages.map(p=> p.text).join('\n').split(/\n+/)
          const sections: { heading: string; body: string[] }[] = []
          let current: { heading: string; body: string[] } | null = null
          const headingRegex = /^(?:[A-Z][A-Z0-9 \-]{2,80}|\d+(?:\.\d+)*\s+.+)$/
          for(const line of lines){
            const trimmed = line.trim(); if(!trimmed) continue
            if(headingRegex.test(trimmed)){ if(current) sections.push(current); current = { heading: trimmed.slice(0,120), body: [] } }
            else if(current){ current.body.push(trimmed) }
            else { current = { heading: trimmed.slice(0,60)||'Intro', body: [] } }
          }
          if(current) sections.push(current)
          results = sections.map(sec=> ({ front: sec.heading, back: sec.body.join('\n\n') }))
        } else {
          results = pages.map(p=> ({ front: p.text.slice(0,200)+'…', back: p.text, mediaAssets: p.thumb? { ['thumb-page-'+p.page+'.png']: p.thumb }: undefined }))
        }
        ;(self as any).postMessage({ ok: true, data: results })
      } catch(err){ (self as any).postMessage({ ok: false, reason: 'pdf-worker-failed', error: String(err) }) }
      return
    }
  } catch(err){
    ;(self as any).postMessage({ ok: false, error: String(err) })
  }
}
