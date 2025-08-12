// Import multi-format des decks et cartes
// Formats ciblés: csv, txt, json, apkg (Anki), xls/xlsx, pdf
// Gestion médias: image, audio, video, emoji, mise en forme texte basique

import { container } from '@/application/Container'
import { CARD_REPOSITORY_TOKEN } from '@/domain/repositories/CardRepository'
import { DECK_REPOSITORY_TOKEN } from '@/domain/repositories/DeckRepository'
import { CardEntity } from '@/domain/entities/Card'
import { DeckEntity } from '@/domain/entities/Deck'
import { MEDIA_REPOSITORY_TOKEN, DexieMediaRepository } from '@/infrastructure/persistence/dexie/DexieMediaRepository'
import { SEARCH_INDEX_SERVICE_TOKEN } from '@/application/services/SearchIndexService'
import JSZip from 'jszip'
// @ts-ignore sql.js no types default import nuance
import initSqlJs from 'sql.js'

export interface ImportResult { deck: DeckEntity; cards: CardEntity[]; media: number; warnings: string[] }

function detectFormat(file: File): string {
  const name = file.name.toLowerCase()
  if(name.endsWith('.csv')) return 'csv'
  if(name.endsWith('.json')) return 'json'
  if(name.endsWith('.txt')) return 'txt'
  if(name.endsWith('.apkg')) return 'apkg'
  if(name.endsWith('.xls') || name.endsWith('.xlsx')) return 'xlsx'
  if(name.endsWith('.pdf')) return 'pdf'
  if(name.endsWith('.zip')) return 'zip'
  return 'auto'
}

async function parseText(content: string): Promise<Array<{ front: string; back: string }>> {
  // Format txt: chaque ligne "front<TAB>back" ou séparateur ;
  const lines = content.split(/\r?\n/).filter(l=>l.trim().length)
  return lines.map(l => {
    const parts = l.split(/\t|;|\|/)
    return { front: parts[0]||'', back: parts.slice(1).join(' | ') || '' }
  })
}

interface ParsedCSV { rows: string[][]; header: string[] }
function parseCSVRaw(content: string): ParsedCSV {
  const lines = content.split(/\r?\n/).filter(l=>l.trim().length)
  if(!lines.length) return { rows: [], header: [] }
  const rows = lines.map(l => l.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map(c=> c.replace(/^\"|\"$/g,'')))
  let header: string[] = []
  if(rows.length){
    header = rows[0].map(h=>h.trim())
    // Assume header if contains typical keywords or any non-numeric cell
    const looksHeader = header.some(h=> /front|back|tags|question|answer/i.test(h))
    if(looksHeader) return { header, rows: rows.slice(1) }
  }
  return { header, rows }
}
async function parseCSV(content: string, columnMap?: { front?: string; back?: string; tags?: string }): Promise<Array<{ front: string; back: string; tags?: string }>> {
  const { header, rows } = parseCSVRaw(content)
  if(!rows.length) return []
  const lower = header.map(h=> h.toLowerCase())
  const resolveIdx = (val: string|undefined, fallbackNames: string[], fallbackIndex: number): number => {
    if(!header.length){ return fallbackIndex }
    if(!val){
      for(const n of fallbackNames){ const i = lower.indexOf(n.toLowerCase()); if(i>=0) return i }
      return Math.min(fallbackIndex, header.length-1)
    }
    const num = /^\d+$/.test(val)? parseInt(val,10): -1
    if(num>=0 && num < (rows[0]?.length||0)) return num
    const i = lower.indexOf(val.toLowerCase()); if(i>=0) return i
    return Math.min(fallbackIndex, header.length-1)
  }
  const fi = resolveIdx(columnMap?.front, ['front','question','recto'], 0)
  const bi = resolveIdx(columnMap?.back, ['back','answer','verso'], 1)
  const ti = header.length? resolveIdx(columnMap?.tags, ['tags','tag'], -1): -1
  return rows.map(r => ({ front: r[fi]||'', back: r[bi]||'', tags: ti>=0? r[ti]: undefined }))
}

async function parseJSON(content: string): Promise<Array<{ front: string; back: string; tags?: string[]; media?: any[] }>> {
  const data = JSON.parse(content)
  if(Array.isArray(data)){
    return data.map(d => ({ front: d.front||d.frontText||'', back: d.back||d.backText||'', tags: d.tags||[], media: d.media }))
  }
  if(Array.isArray(data.cards)){
    return data.cards.map((d:any) => ({ front: d.frontText||d.front||'', back: d.backText||d.back||'', tags: d.tags||[], media: d.mediaRefs }))
  }
  return []
}

async function parsePDF(file: File, opts?: { perHeading?: boolean }): Promise<Array<{ front: string; back: string; mediaAssets?: Record<string, Blob> }>> {
  try {
    const pdfjs = await import('pdfjs-dist') as any
    const array = new Uint8Array(await file.arrayBuffer())
    const doc = await pdfjs.getDocument({ data: array }).promise
    interface PageData { text: string; pageNum: number; imageBlob?: Blob }
    const pages: PageData[] = []
    for(let i=1;i<=doc.numPages;i++){
      const page = await doc.getPage(i)
      const textContent = await page.getTextContent()
      const text = textContent.items.map((it:any)=> it.str).join('\n')
      // tentative image extraction: capture full page render as PNG (fallback if canvas available)
      let imageBlob: Blob | undefined
      try {
        const viewport = page.getViewport({ scale: 1 })
        const canvas = (typeof document!=='undefined'? document.createElement('canvas'): undefined) as HTMLCanvasElement | undefined
        if(canvas){
          canvas.width = viewport.width
          canvas.height = viewport.height
          const ctx = canvas.getContext('2d')
          if(ctx){
            await page.render({ canvasContext: ctx, viewport }).promise
            const b = await new Promise<Blob>((res)=> canvas.toBlob(b=> res(b||new Blob()), 'image/png'))
            imageBlob = b
          }
        }
      } catch { /* ignore */ }
      pages.push({ text: text.trim(), pageNum: i, imageBlob })
    }
    if(!opts?.perHeading){
      return pages.map(p => ({ front: p.text.slice(0,200)+'…', back: p.text, mediaAssets: p.imageBlob? { ['page-'+p.pageNum+'.png']: p.imageBlob }: undefined }))
    }
    // Heading-based segmentation
    const lines = pages.map(p=> p.text).join('\n').split(/\n+/)
    const sections: { heading: string; body: string[] }[] = []
    let current: { heading: string; body: string[] } | null = null
    const headingRegex = /^(?:[A-Z][A-Z0-9 \-]{2,80}|\d+(?:\.\d+)*\s+.+)$/
    for(const line of lines){
      const trimmed = line.trim()
      if(!trimmed) continue
      if(headingRegex.test(trimmed)){
        if(current) sections.push(current)
        current = { heading: trimmed.slice(0,120), body: [] }
      } else if(current){
        current.body.push(trimmed)
      } else {
        // preamble before first heading
        current = { heading: trimmed.slice(0,60)||'Intro', body: [] }
      }
    }
    if(current) sections.push(current)
    // Map page images to nearest heading by occurrence order
    const results: Array<{ front: string; back: string; mediaAssets?: Record<string, Blob> }> = []
    let pageImageIdx = 0
    for(const sec of sections){
      const mediaAssets: Record<string, Blob> = {}
      if(pages[pageImageIdx]?.imageBlob){
        mediaAssets['section-'+(results.length+1)+'-page-'+pages[pageImageIdx].pageNum+'.png'] = pages[pageImageIdx].imageBlob!
        pageImageIdx++
      }
      results.push({ front: sec.heading, back: sec.body.join('\n\n'), mediaAssets: Object.keys(mediaAssets).length? mediaAssets: undefined })
    }
    return results
  } catch {
    return []
  }
}

async function parseXLSX(file: File, columnMap?: { front?: string; back?: string; tags?: string }, sheetNameOpt?: string): Promise<Array<{ front: string; back: string; tags?: string }>> {
  try {
    const XLSX = await import('xlsx')
    const data = new Uint8Array(await file.arrayBuffer())
    const wb = XLSX.read(data, { type: 'array' })
  const sheetName = sheetNameOpt && wb.SheetNames.includes(sheetNameOpt) ? sheetNameOpt : wb.SheetNames[0]
    const sheet = wb.Sheets[sheetName]
    if(columnMap){
      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false }) as any
      if(!rows.length) return []
      const header: string[] = rows[0].map((h:any)=> String(h).trim())
      const body = rows.slice(1)
      const lower = header.map(h=> h.toLowerCase())
      const resolveIdx = (val: string|undefined, fallbackNames: string[], fallbackIndex: number): number => {
        if(!header.length){ return fallbackIndex }
        if(!val){ for(const n of fallbackNames){ const i = lower.indexOf(n.toLowerCase()); if(i>=0) return i } return Math.min(fallbackIndex, header.length-1) }
        const num = /^\d+$/.test(val)? parseInt(val,10): -1
        if(num>=0 && num < (body[0]?.length||0)) return num
        const i = lower.indexOf(val.toLowerCase()); if(i>=0) return i
        return Math.min(fallbackIndex, header.length-1)
      }
      const fi = resolveIdx(columnMap.front, ['front','question','recto'], 0)
      const bi = resolveIdx(columnMap.back, ['back','answer','verso'], 1)
      const ti = header.length? resolveIdx(columnMap.tags, ['tags','tag'], -1): -1
      return body.map(r=> ({ front: r[fi]||'', back: r[bi]||'', tags: ti>=0? r[ti]: undefined }))
    }
    const json = XLSX.utils.sheet_to_json<any>(sheet, { defval: '' })
    return json.map((row:any) => ({ front: row.front || row.Front || row.question || Object.values(row)[0] || '', back: row.back || row.Back || row.answer || Object.values(row)[1] || '', tags: row.tags || row.Tags }))
  } catch { return [] }
}

async function parseApkg(file: File): Promise<Array<{ front: string; back: string; tags?: string[]; mediaAssets?: Record<string, Blob> }>> {
  try {
    const zip = await JSZip.loadAsync(file)
    const collection = zip.file('collection.anki2') || zip.file('collection.anki21')
    if(!collection) return []
    const buf = await collection.async('uint8array')
    const SQL = await initSqlJs({})
    const db = new SQL.Database(buf)
    // models metadata (fields + templates for better front/back detection)
    interface ModelMeta { fields: string[]; frontIdx?: number; backIdx?: number }
    let modelFields: Record<string, ModelMeta> = {}
    try {
      const colRes = db.exec('SELECT models FROM col LIMIT 1')
      if(colRes.length){
        const raw = colRes[0].values[0][0] as string
        const models = JSON.parse(raw).models
        for(const mid in models){
          const mdl = models[mid]
            const fields: string[] = mdl.flds.map((f:any)=> f.name)
            // Parse first template qfmt/afmt to derive field ordering
            let frontIdx: number | undefined
            let backIdx: number | undefined
            try {
              const tmpl = Array.isArray(mdl.tmpls) && mdl.tmpls.length? mdl.tmpls[0]: null
              if(tmpl){
                const extractFields = (fmt: string) => Array.from(new Set((fmt.match(/{{([^}]+)}}/g)||[]).map((m:string)=> m.replace(/^{*{|}*}$/g,'').trim())))
                const qFields = extractFields(tmpl.qfmt||'')
                const aFields = extractFields(tmpl.afmt||'')
                if(qFields.length){ frontIdx = fields.map(f=> f.toLowerCase()).indexOf(qFields[0].toLowerCase()) }
                // back field = first field appearing in answer format that is different or second question field
                for(const q of aFields){
                  const idx = fields.map(f=> f.toLowerCase()).indexOf(q.toLowerCase())
                  if(idx>=0 && idx !== frontIdx){ backIdx = idx; break }
                }
                if(backIdx===undefined && qFields.length>1){
                  const idx = fields.map(f=> f.toLowerCase()).indexOf(qFields[1].toLowerCase())
                  if(idx>=0) backIdx = idx
                }
              }
            } catch { /* ignore */ }
            modelFields[mid] = { fields, frontIdx, backIdx }
        }
      }
    } catch { /* ignore */ }
    const res = db.exec('SELECT flds, tags, mid FROM notes LIMIT 1000') // soft limit
    if(!res.length) return []
    const rows = res[0].values as any[]
    // media mapping
    const mediaMappingFile = zip.file('media') || zip.file('media.json')
    let mediaMap: Record<string,string> = {}
    if(mediaMappingFile){
      try { mediaMap = JSON.parse(await mediaMappingFile.async('string')) } catch { /* ignore */ }
    }
    const mediaAssetsAll: Record<string, Blob> = {}
    // load all mapped numeric files (bounded)
    for(const key of Object.keys(mediaMap).slice(0,500)){
      const fileEntry = zip.file(key)
      if(!fileEntry) continue
      const u8 = await fileEntry.async('uint8array')
      mediaAssetsAll[mediaMap[key]] = new Blob([new Uint8Array(u8)])
    }
    const frontSyn = ['Front','Recto','Question']
    const backSyn = ['Back','Verso','Answer','Réponse']
    return rows.map(r => {
      const flds: string = r[0] || ''
      const tagsStr: string = r[1] || ''
      const mid: string = String(r[2]||'')
      const parts = flds.split('\u001f')
      let front = parts[0]||''; let back = parts.slice(1).join('\n')
      const meta = modelFields[mid]
      if(meta){
        const fields = meta.fields
        const lower = fields.map(f=> f.toLowerCase())
        // If template-derived indices exist, prefer them
        let fi = meta.frontIdx !== undefined? meta.frontIdx: -1
        let bi = meta.backIdx !== undefined? meta.backIdx: -1
        const findIdx = (names: string[]) => {
          for(const n of names){ const i = lower.indexOf(n.toLowerCase()); if(i>=0) return i }
          return -1
        }
        if(fi<0) fi = findIdx(frontSyn)
        if(bi<0) bi = findIdx(backSyn)
        if(fi>=0) front = parts[fi] || front
        if(bi>=0) back = parts[bi] || back
        if(fi>=0 && bi>=0 && fi!==bi){
          const extra = parts.filter((_,i)=> i!==fi && i!==bi).join('\n')
          if(extra) back += '\n'+extra
        }
      }
      // media references
      const mediaAssets: Record<string, Blob> = {}
      const mediaRefRegex = /(?:<img[^>]+src="([^">]+)"|\[sound:([^\]]+)\])/gi
      let m: RegExpExecArray | null
      while((m = mediaRefRegex.exec(flds))){
        const fname = (m[1]||m[2])?.split(/[#?]/)[0]
        if(fname && mediaAssetsAll[fname]) mediaAssets[fname] = mediaAssetsAll[fname]
      }
      return { front, back, tags: tagsStr.trim().split(' ').filter(Boolean), mediaAssets: Object.keys(mediaAssets).length? mediaAssets: undefined }
    })
  } catch { return [] }
}

async function parseZip(file: File): Promise<{ entries: any[]; media: Record<string, Blob>; warnings: string[] }> {
  const warnings: string[] = []
  try {
    const zip = await JSZip.loadAsync(file)
    // Chercher manifest.csv / manifest.json
    let manifestType: 'csv'|'json'|'none' = 'none'
    let manifestContent = ''
    const csvFile = zip.file(/manifest.*\.csv/i)[0]
    const jsonFile = zip.file(/manifest.*\.json/i)[0]
    if(jsonFile){ manifestType='json'; manifestContent = await jsonFile.async('string') }
    else if(csvFile){ manifestType='csv'; manifestContent = await csvFile.async('string') }
    else warnings.push('Manifest absent, tentative scan fallback')
    let entries: any[] = []
    if(manifestType==='json'){ try { const data = JSON.parse(manifestContent); entries = Array.isArray(data)? data: data.cards||[] } catch { warnings.push('Manifest JSON invalide') } }
    if(manifestType==='csv'){ entries = await parseCSV(manifestContent) }
    if(entries.length===0){
      // fallback: chaque .txt -> carte unique (front=nom, back=contenu)
      const txtFiles = zip.file(/\.txt$/i)
      for(const f of txtFiles){ entries.push({ front: f.name, back: await f.async('string') }) }
    }
    const media: Record<string, Blob> = {}
    // Collecter fichiers media/ ou assets/
    for(const path in zip.files){
      if(/\.(png|jpe?g|gif|webp|mp3|wav|ogg|mp4|m4a|pdf)$/i.test(path)){
        const fileEntry = zip.file(path); if(!fileEntry) continue
  const u8 = await fileEntry.async('uint8array')
  media[path.split('/').pop()||path] = new Blob([new Uint8Array(u8)])
      }
    }
    return { entries, media, warnings }
  } catch { return { entries: [], media: {}, warnings: ['Échec lecture zip'] } }
}

// Basic emoji & formatting normalization
function normalizeRichText(input: string): string {
  // Conserver emoji (UTF-16) - juste trimming et conversion <br> -> \n
  return input.replace(/<br\s*\/>/gi,'\n').replace(/<[^>]+>/g,'').trim()
}

interface ImportOptions { deckName?: string; targetDeckId?: string; columnMap?: { front?: string; back?: string; tags?: string }; pdfPerHeading?: boolean; useWorker?: boolean; xlsxSheetName?: string; onProgress?: (info: { phase: string; progress: number }) => void }

export async function importDeckMultiFormat(file: File, opts: ImportOptions = {}): Promise<ImportResult> {
  const format = detectFormat(file)
  const textFormats = ['csv','txt','json']
  const binary = ['apkg','xlsx','pdf','zip']
  const warnings: string[] = []
  const deckRepo = container.resolve<any>(DECK_REPOSITORY_TOKEN)
  const cardRepo = container.resolve<any>(CARD_REPOSITORY_TOKEN)
  const mediaRepo = container.resolve<DexieMediaRepository>(MEDIA_REPOSITORY_TOKEN)
  const indexService = container.resolve<any>(SEARCH_INDEX_SERVICE_TOKEN)
  let deck: DeckEntity | null = null
  if(opts.targetDeckId){ deck = await deckRepo.getById(opts.targetDeckId) }
  if(!deck){ deck = new DeckEntity({ name: opts.deckName || file.name.replace(/\.[^.]+$/,'') }) ; await deckRepo.create(deck) }

  let parsed: any[] = []
  let extraMedia: Record<string, Blob> = {}
  if(textFormats.includes(format)){
    const content = await file.text()
    if(format==='csv') parsed = await parseCSV(content, opts.columnMap)
    else if(format==='json') parsed = await parseJSON(content)
    else parsed = await parseText(content)
  } else if(binary.includes(format)) {
    if(format==='pdf') {
      if(opts.useWorker){
        try {
          // @ts-ignore
          const Mod = await import('@/workers/heavyImportWorker.ts?worker')
          const worker: Worker = new Mod.default()
          const arrayBuffer = await file.arrayBuffer()
          parsed = await new Promise<any[]>((resolve) => {
            worker.onmessage = (ev: MessageEvent<any>) => {
              if(ev.data?.progress && opts.onProgress){ opts.onProgress({ phase: ev.data.phase||'pages', progress: ev.data.progress }) }
              if(ev.data?.ok){ resolve(ev.data.data||[]); worker.terminate() }
              else if(ev.data?.error || ev.data?.reason){ resolve([]); worker.terminate() }
            }
            worker.postMessage({ type: 'pdf', arrayBuffer, perHeading: opts.pdfPerHeading })
          })
        } catch { parsed = await parsePDF(file, { perHeading: opts.pdfPerHeading }) }
      } else {
        parsed = await parsePDF(file, { perHeading: opts.pdfPerHeading })
      }
    }
  else if(format==='xlsx') parsed = await parseXLSX(file, opts.columnMap, opts.xlsxSheetName)
  else if(format==='apkg') {
      if(opts.useWorker){
        try {
          // Dynamically import worker via Vite ?worker syntax if available
          // @ts-ignore
          const Mod = await import('@/workers/heavyImportWorker.ts?worker')
          const worker: Worker = new Mod.default()
          const arrayBuffer = await file.arrayBuffer()
          parsed = await new Promise<any[]>((resolve) => {
            worker.onmessage = (ev: MessageEvent<any>) => {
        if(ev.data?.progress && opts.onProgress){ opts.onProgress({ phase: ev.data.phase||'notes', progress: ev.data.progress }) }
        if(ev.data?.ok){
                resolve(
                  (ev.data.data||[]).map((r:any)=> ({
                    ...r,
                    mediaAssets: Object.fromEntries(
                      Object.entries(r.mediaAssets||{}).map(([k,ab])=> [k, new Blob([ab as ArrayBuffer])])
                    )
                  }))
                )
              } else {
                resolve([])
              }
              worker.terminate()
            }
            worker.postMessage({ type: 'apkg', arrayBuffer })
          })
        } catch { parsed = await parseApkg(file) }
      } else {
        parsed = await parseApkg(file)
      }
    }
    else if(format==='zip') { const z = await parseZip(file); parsed = z.entries; Object.assign(extraMedia, z.media); warnings.push(...z.warnings) }
    if(parsed.length===0) warnings.push('Support partiel ou échec parsing ' + format)
  } else {
    warnings.push('Format non détecté, aucun enregistrement')
  }

  const cards: CardEntity[] = []
  // extraMedia déjà défini pour zip, sinon vide
  for(const row of parsed){
    const front = normalizeRichText(row.front||'')
    const back = normalizeRichText(row.back||'')
    const card = new CardEntity({ deckId: deck.id, frontText: front, backText: back, tags: Array.isArray(row.tags)? row.tags : (row.tags? String(row.tags).split(/\s+/): [] ) })
    // Traitement assets média inline (DataURL) -> stocker via mediaRepo
    const mediaAssets: Array<{ blob: Blob; type: 'image' | 'audio' | 'pdf'; mime: string }> = []
    const dataUrlRegex = /data:(image|audio|video)\/(\w+);base64,([A-Za-z0-9+/=]+)/g
    let match: RegExpExecArray | null
    while((match = dataUrlRegex.exec(front + '\n' + back))){
      const mime = `${match[1]}/${match[2]}`
      try {
        const b = atob(match[3])
        const arr = new Uint8Array(b.length); for(let i=0;i<b.length;i++) arr[i]=b.charCodeAt(i)
        mediaAssets.push({ blob: new Blob([arr], { type: mime }), type: match[1]==='image'?'image':'audio', mime })
      } catch { warnings.push('Échec décodage média inline') }
    }
    for(const asset of mediaAssets){
      const saved = await mediaRepo.save(asset.blob, asset.type, asset.mime)
      card.mediaRefs = card.mediaRefs || []
      card.mediaRefs.push({ id: saved.id, key: saved.key, type: saved.type })
    }
    // Ajouter mediaAssets spécifiques à la ligne (ex: PDF/apkg extraction)
    if(row.mediaAssets){
      for(const [fname, blob] of Object.entries(row.mediaAssets)){
        try {
          const mime = fname.match(/\.pdf$/i)? 'application/pdf' : fname.match(/\.mp3$/i)? 'audio/mpeg' : fname.match(/\.wav$/i)? 'audio/wav' : fname.match(/\.ogg$/i)? 'audio/ogg' : fname.match(/\.mp4$/i)? 'video/mp4' : fname.match(/\.m4a$/i)? 'audio/mp4' : 'image/'+(fname.split('.').pop()||'png')
          const saved = await mediaRepo.save(blob as Blob, mime.startsWith('image')?'image': mime.startsWith('audio')?'audio':'pdf', mime)
          card.mediaRefs = card.mediaRefs || []
          card.mediaRefs.push({ id: saved.id, key: saved.key, type: saved.type })
        } catch { warnings.push('Échec sauvegarde média extrait '+fname) }
      }
    }
    // Link external media referenced by filename patterns [[file.ext]]
    const filenameRegex = /\[\[([^\]\[]+\.(?:png|jpe?g|gif|webp|mp3|wav|ogg|mp4|pdf))\]\]/gi
    let m: RegExpExecArray | null
    while((m = filenameRegex.exec(front + '\n' + back))){
      const fname = m[1]
      const blob = extraMedia[fname]
      if(blob){
        const mime = fname.match(/\.pdf$/i)? 'application/pdf' : fname.match(/\.mp3$/i)? 'audio/mpeg' : fname.match(/\.wav$/i)? 'audio/wav' : fname.match(/\.ogg$/i)? 'audio/ogg' : fname.match(/\.mp4$/i)? 'video/mp4' : fname.match(/\.m4a$/i)? 'audio/mp4' : 'image/'+(fname.split('.').pop()||'png')
        const saved = await mediaRepo.save(blob, mime.startsWith('image')?'image': mime.startsWith('audio')?'audio':'pdf', mime)
        card.mediaRefs = card.mediaRefs || []
        card.mediaRefs.push({ id: saved.id, key: saved.key, type: saved.type })
      } else {
        warnings.push('Média non trouvé: '+fname)
      }
    }
    await cardRepo.create(card)
    cards.push(card)
  }
  // Indexation plein texte
  try { for(const c of cards){ await indexService.indexCard(c) } } catch { warnings.push('Indexation partielle échouée') }
  return { deck, cards, media: cards.reduce((acc,c)=> acc + (c.mediaRefs?.length||0),0), warnings }
}
