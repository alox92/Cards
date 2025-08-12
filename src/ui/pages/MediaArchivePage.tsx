import React, { useState, useCallback, useRef } from 'react'
import { exportMediaZip, importMediaZip, exportMediaArchive, exportMediaZipIncremental } from '@/application/media/mediaExportImport'
import { importDeckMultiFormat } from '@/application/import/deckMultiFormatImport'
import { container } from '@/application/Container'
import { MEDIA_REPOSITORY_TOKEN, DexieMediaRepository } from '@/infrastructure/persistence/dexie/DexieMediaRepository'
import { useFeedback } from '@/ui/components/feedback/FeedbackCenter'

// Heuristique: considérer "récemment modifié" si created >= now - delta
const RECENT_DELTA_MS = 1000 * 60 * 60 * 24 * 7 // 7 jours

const MediaArchivePage: React.FC = () => {
  const [status, setStatus] = useState<string>('Idle')
  const [progress, setProgress] = useState<number>(0)
  const [resultMsg, setResultMsg] = useState<string>('')
  const [columnMap, setColumnMap] = useState<{ front?: string; back?: string; tags?: string }>({})
  const [showMapping, setShowMapping] = useState(false)
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [previewRows, setPreviewRows] = useState<string[][]>([])
  const [pdfPerHeading, setPdfPerHeading] = useState<boolean>(false)
  const [xlsxSheets, setXlsxSheets] = useState<string[]>([])
  const [selectedXlsxSheet, setSelectedXlsxSheet] = useState<string>('')
  const [useWorker, setUseWorker] = useState<boolean>(true)
  const [importPhase, setImportPhase] = useState<string>('')
  const [recentOnly, setRecentOnly] = useState<boolean>(false)
  const [integrityIssues, setIntegrityIssues] = useState<string[]>([])
  const [lastExportTs, setLastExportTs] = useState<number>(()=>{ try { const v = localStorage.getItem('ariba_last_media_export'); return v? parseInt(v,10):0 } catch{ return 0 } })
  const fileInputRef = useRef<HTMLInputElement|null>(null)
  const deckImportInputRef = useRef<HTMLInputElement|null>(null)
  const feedback = useFeedback()

  // const cardRepo = container.resolve<CardRepository>(CARD_REPOSITORY_TOKEN) // réserve future (stats rapides)
  const mediaRepo = container.resolve<DexieMediaRepository>(MEDIA_REPOSITORY_TOKEN)

  // Export sélectif: construit un zip à partir d'un sous-ensemble quand recentOnly
  const handleExport = useCallback(async () => {
    try {
      setStatus('Préparation export...')
      setProgress(0)
      setIntegrityIssues([])
      const full = await exportMediaArchive()
      let filtered = full
      if(recentOnly){
        const cutoff = Date.now() - RECENT_DELTA_MS
        filtered = {
          ...full,
          manifest: full.manifest.filter(m => m.created >= cutoff),
          blobs: Object.fromEntries(Object.entries(full.blobs).filter(([id]) => full.manifest.find(m=>m.id===id && m.created>=cutoff)))
        }
      }
      // construction streaming-like (JSZip interne) -> on simule progression sur nombre de médias
      const total = filtered.manifest.length || 1
      let current = 0
      setStatus('Construction ZIP...')
      // On réutilise exportMediaZip si pas de filtrage, sinon reconstruire JSZip localement
      let blob: Blob
      if(!recentOnly){
        blob = await exportMediaZip()
        setProgress(100)
      } else {
        const JSZip = (await import('jszip')).default
        const zip = new JSZip()
        zip.file('manifest.json', JSON.stringify({ manifest: filtered.manifest }, null, 2))
        zip.file('cards.json', JSON.stringify(filtered.cards, null, 2))
        const folder = zip.folder('media')!
        for(const m of filtered.manifest){
          folder.file(m.id, filtered.blobs[m.id])
          current++
          setProgress(Math.round((current/total)*100))
        }
        blob = await zip.generateAsync({ type: 'blob' }, meta => {
          if(meta.percent) setProgress(Math.round(meta.percent))
        })
      }
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const ts = new Date().toISOString().replace(/[:.]/g,'-')
      a.download = `media-archive${recentOnly?'-recent':''}-${ts}.zip`
      a.click()
  setStatus('Export terminé')
  feedback.play('success')
  setResultMsg(`Archive générée (${filtered.manifest.length} médias, ${filtered.cards.length} cartes)`)    
  try { const v = localStorage.getItem('ariba_last_media_export'); if(v) setLastExportTs(parseInt(v,10)||0) } catch {}
      setTimeout(()=> URL.revokeObjectURL(url), 10_000)
    } catch(e){
      setStatus('Échec export')
  feedback.play('error')
  setResultMsg(String(e))
    }
  }, [recentOnly])

  const handleImportClick = () => { fileInputRef.current?.click() }
  const handleDeckImportClick = () => { deckImportInputRef.current?.click() }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if(!file) return
    setProgress(0)
    setStatus('Lecture ZIP...')
    setIntegrityIssues([])
    try {
      // Pas de vrai streaming JSZip ici; on simule progression par étapes
      setProgress(10)
      const res = await importMediaZip(file)
      setProgress(90)
      // Vérification d'intégrité double (on re-calcule manifest sur DB et compare checksums)
      const arch = await exportMediaArchive() // recalcul après import
      const mismatch: string[] = []
      for(const entry of arch.manifest){
        const dbRow = await mediaRepo.get(entry.id)
        if(dbRow){
          // Pas de checksum stocké côté DB (pas de champ), on recalcule juste size
          if(dbRow.blob.size !== entry.size){ mismatch.push(entry.id+':size') }
        } else {
          mismatch.push(entry.id+':missing')
        }
      }
      setIntegrityIssues(mismatch)
      setProgress(100)
      setStatus('Import terminé')
      feedback.play('success')
      setResultMsg(`Import: ${res.media} médias / ${res.cards} cartes; anomalies: ${mismatch.length}`)
    } catch(err){
      setStatus('Échec import')
      feedback.play('error')
      setResultMsg(String(err))
    } finally {
      e.target.value = ''
    }
  }

  const handleDeckFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if(!file) return
    const isCsvLike = /\.(csv|xlsx?)$/i.test(file.name)
  if(isCsvLike){
      try {
        const text = await file.text()
        const lines = text.split(/\r?\n/).filter(l=> l.trim().length).slice(0,6)
        if(!lines.length) { await performDeckImport(file); e.target.value=''; return }
        const rows = lines.map(l=> l.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map(c=> c.replace(/^\"|\"$/g,'')))
        const headerCandidate = rows[0]
        const headerLooks = headerCandidate.some(h=> /front|back|question|answer|tags/i.test(h))
        if(headerLooks){
          setCsvHeaders(headerCandidate)
          setPreviewRows(rows.slice(1))
          setShowMapping(true)
          ;(deckImportInputRef.current as any)._pendingFile = file
          e.target.value = ''
          return
        }
      } catch { /* ignore */ }
    }
    // XLSX introspection
    if(/\.xlsx?$/i.test(file.name)){
      try {
        const XLSX = await import('xlsx')
        const data = new Uint8Array(await file.arrayBuffer())
        const wb = XLSX.read(data, { type: 'array' })
        const sheetNames = wb.SheetNames.slice(0,10)
        const firstSheet = wb.Sheets[sheetNames[0]]
        const rows: any[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1, blankrows: false }) as any
        if(rows.length){
          const header = rows[0].map((h:any)=> String(h).trim())
          const body = rows.slice(1, 6)
          setCsvHeaders(header)
          setPreviewRows(body)
          setXlsxSheets(sheetNames)
          setSelectedXlsxSheet(sheetNames[0])
          setShowMapping(true)
          ;(deckImportInputRef.current as any)._pendingFile = file
          e.target.value=''
          return
        }
      } catch { /* ignore */ }
    }
    await performDeckImport(file)
    e.target.value = ''
  }

  const performDeckImport = async (file: File) => {
    try {
      setStatus('Import deck...')
      setProgress(0)
      const res = await importDeckMultiFormat(file, { columnMap, pdfPerHeading, xlsxSheetName: selectedXlsxSheet || undefined, useWorker, onProgress: ({ phase, progress }) => {
        setImportPhase(phase)
        setProgress(Math.round(progress*100))
        setStatus(`Import deck (${phase})...`)
      } })
      setProgress(100)
      setStatus('Import deck terminé')
      feedback.play(res.warnings.length? 'warning':'success')
      setResultMsg(`Deck '${res.deck.name}' importé: ${res.cards.length} cartes, médias ${res.media}${res.warnings.length? '\nWarnings: '+res.warnings.join('; '):''}`)
    } catch(err){
      setStatus('Échec import deck')
      feedback.play('error')
      setResultMsg(String(err))
    }
  }

  const handleApplyMapping = async () => {
    const node: any = (deckImportInputRef.current as any)
    const file: File | undefined = node?._pendingFile
    if(!file){ setShowMapping(false); return }
    setShowMapping(false)
    await performDeckImport(file)
    node._pendingFile = undefined
  }

  const handleExportIncremental = useCallback(async () => {
    try {
      setStatus('Export incrémental...')
      setProgress(0)
      const blob = await exportMediaZipIncremental()
      const url = URL.createObjectURL(blob)
      const ts = new Date().toISOString().replace(/[:.]/g,'-')
      const a = document.createElement('a')
      a.href = url
      a.download = `media-archive-incremental-${ts}.zip`
      a.click()
      setProgress(100)
      setStatus('Export incrémental terminé')
      feedback.play('success')
      setResultMsg('Archive incrémentale générée')
  try { const v = localStorage.getItem('ariba_last_media_export'); if(v) setLastExportTs(parseInt(v,10)||0) } catch {}
      setTimeout(()=> URL.revokeObjectURL(url), 10_000)
    } catch(e){
      setStatus('Échec export incrémental')
      feedback.play('error')
      setResultMsg(String(e))
    }
  }, [feedback])

  const handleIntegrityRescan = useCallback( async () => {
    try {
      setStatus('Scan intégrité...')
      setProgress(0)
      setIntegrityIssues([])
      const arch = await exportMediaArchive()
      const mismatch: string[] = []
      let processed = 0
      for(const entry of arch.manifest){
        const row = await mediaRepo.get(entry.id)
        if(!row){ mismatch.push(entry.id+':missing') }
        else if(row.blob.size !== entry.size){ mismatch.push(entry.id+':size') }
        processed++
        if(processed % 5 === 0){ setProgress(Math.round((processed/arch.manifest.length)*100)) }
      }
      setIntegrityIssues(mismatch)
      setProgress(100)
      setStatus('Scan terminé')
      feedback.play(mismatch.length? 'warning':'success')
      setResultMsg(`Scan: ${arch.manifest.length} médias, anomalies ${mismatch.length}`)
    } catch(e){
      setStatus('Échec scan')
      feedback.play('error')
      setResultMsg(String(e))
    }
  }, [feedback, mediaRepo])

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-semibold mb-4">Archive Médias</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Export / import des cartes et médias avec checksums. Option export récent (7 jours). Intégrité double: taille & présence.
      </p>
      <div className="space-y-6">
        <div className="p-4 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800">
          <h2 className="font-medium mb-2">Export</h2>
          <label className="flex items-center gap-2 text-xs mb-3">
            <input type="checkbox" checked={recentOnly} onChange={e=> setRecentOnly(e.target.checked)} />
            N'inclure que les médias récents (7 jours)
          </label>
          <div className="flex flex-wrap gap-2 items-center">
            <button onClick={handleExport} className="px-3 py-1.5 text-sm rounded bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50" disabled={status.startsWith('Préparation') || status.startsWith('Construction')}>📦 Export complet</button>
            <button onClick={handleExportIncremental} className="px-3 py-1.5 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50" disabled={status.startsWith('Export incrémental')}>🧩 Export incrémental</button>
            <button onClick={handleIntegrityRescan} className="px-3 py-1.5 text-sm rounded bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50" disabled={status.startsWith('Scan')}>🩺 Re-scan intégrité</button>
            {lastExportTs>0 && <span className="text-[11px] text-gray-500 dark:text-gray-400">Dernier export: {new Date(lastExportTs).toLocaleString()}</span>}
          </div>
        </div>
        <div className="p-4 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800">
          <h2 className="font-medium mb-2">Import</h2>
          <button onClick={handleImportClick} className="px-3 py-1.5 text-sm rounded bg-emerald-600 hover:bg-emerald-700 text-white">📥 Importer archive ZIP</button>
          <input ref={fileInputRef} type="file" accept="application/zip" className="hidden" onChange={handleFileChange} />
          <div className="mt-4">
            <h3 className="font-medium text-sm mb-1">Import Deck multi-format</h3>
            <p className="text-[11px] text-gray-500 mb-2">Formats: csv, txt, json, pdf, xlsx, apkg. CSV/XLSX: mapping colonnes possible. PDF: option segmentation titres.</p>
            <label className="flex items-center gap-2 text-[11px] mb-2">
              <input type="checkbox" checked={useWorker} onChange={e=> setUseWorker(e.target.checked)} />
              Utiliser worker (apkg/pdf) pour parsing non bloquant
            </label>
            <label className="flex items-center gap-2 text-[11px] mb-2">
              <input type="checkbox" checked={pdfPerHeading} onChange={e=> setPdfPerHeading(e.target.checked)} />
              Segmenter PDF par titres (expérimental)
            </label>
            <button onClick={handleDeckImportClick} className="px-3 py-1.5 text-sm rounded bg-teal-600 hover:bg-teal-700 text-white">📥 Importer deck (multi-format)</button>
            <input ref={deckImportInputRef} type="file" accept=".csv,.txt,.json,.pdf,.xls,.xlsx,.apkg" className="hidden" onChange={handleDeckFileChange} />
            {showMapping && (
              <div className="mt-4 p-3 border rounded bg-gray-50 dark:bg-gray-900 dark:border-gray-700">
                <h4 className="font-medium text-xs mb-2">Mapping des colonnes {xlsxSheets.length>1 && '(XLSX)'} </h4>
                {xlsxSheets.length>0 && (
                  <div className="mb-2 flex items-center gap-2 text-[11px]">
                    <label>Feuille:</label>
                    <select value={selectedXlsxSheet} onChange={e=> setSelectedXlsxSheet(e.target.value)} className="px-1 py-0.5 text-xs border rounded bg-white dark:bg-gray-800">
                      {xlsxSheets.map(s=> <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <label className="block mb-1">Front</label>
                    <select value={columnMap.front||''} onChange={e=> setColumnMap(m=> ({ ...m, front: e.target.value || undefined }))} className="w-full px-1 py-0.5 text-xs border rounded bg-white dark:bg-gray-800">
                      <option value="">Auto</option>
                      {csvHeaders.map(h=> <option key={h} value={h}>{h}</option>)}
                      {csvHeaders.length>0 && csvHeaders.map((_,i)=> <option key={'idx-'+i} value={String(i)}>Index {i}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1">Back</label>
                    <select value={columnMap.back||''} onChange={e=> setColumnMap(m=> ({ ...m, back: e.target.value || undefined }))} className="w-full px-1 py-0.5 text-xs border rounded bg-white dark:bg-gray-800">
                      <option value="">Auto</option>
                      {csvHeaders.map(h=> <option key={h} value={h}>{h}</option>)}
                      {csvHeaders.length>0 && csvHeaders.map((_,i)=> <option key={'idxb-'+i} value={String(i)}>Index {i}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1">Tags</label>
                    <select value={columnMap.tags||''} onChange={e=> setColumnMap(m=> ({ ...m, tags: e.target.value || undefined }))} className="w-full px-1 py-0.5 text-xs border rounded bg-white dark:bg-gray-800">
                      <option value="">Auto</option>
                      {csvHeaders.map(h=> <option key={h} value={h}>{h}</option>)}
                      {csvHeaders.length>0 && csvHeaders.map((_,i)=> <option key={'idxt-'+i} value={String(i)}>Index {i}</option>)}
                    </select>
                  </div>
                </div>
                {previewRows.length>0 && (
                  <div className="mt-3 text-[10px] text-gray-600 dark:text-gray-400">
                    <div className="font-semibold mb-1">Aperçu (premières lignes)</div>
                    <div className="space-y-1 max-h-24 overflow-auto border border-dashed p-1 rounded">
                      {previewRows.map((r,i)=>(
                        <div key={i} className="font-mono truncate">{r.map((c,j)=>`[${j}] ${c}`).join(' | ')}</div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-2 mt-3">
                  <button onClick={handleApplyMapping} className="px-3 py-1.5 text-xs rounded bg-indigo-600 hover:bg-indigo-700 text-white">Appliquer & Importer</button>
                  <button onClick={()=> { setShowMapping(false); setColumnMap({}) }} className="px-3 py-1.5 text-xs rounded bg-gray-400 hover:bg-gray-500 text-white">Annuler</button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="p-4 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800">
          <h2 className="font-medium mb-2">Statut</h2>
          <div className="text-xs mb-2">{status}{importPhase && status.includes('Import deck') && ` · Phase: ${importPhase}`}</div>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
            <div className="h-full bg-indigo-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
          {resultMsg && <div className="mt-2 text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{resultMsg}</div>}
          {integrityIssues.length>0 && (
            <details className="mt-2 text-xs">
              <summary className="cursor-pointer text-red-500">Anomalies ({integrityIssues.length})</summary>
              <ul className="mt-1 list-disc pl-4 space-y-0.5">
                {integrityIssues.slice(0,50).map(id=> <li key={id}>{id}</li>)}
                {integrityIssues.length>50 && <li>... {integrityIssues.length-50} de plus</li>}
              </ul>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}

export default MediaArchivePage
