import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useOcclusionCanvas } from './useOcclusionCanvas'
import type { CardEntity } from '@/domain/entities/Card'
import { container } from '@/application/Container'
import { MEDIA_REPOSITORY_TOKEN, DexieMediaRepository } from '@/infrastructure/persistence/dexie/DexieMediaRepository'

interface Props { card: CardEntity; showBack: boolean }

const supportsBackdrop = typeof window !== 'undefined' && (window as any).CSS?.supports?.('backdrop-filter','blur(4px)')

const CANVAS_THRESHOLD = 24 // au-delà on bascule en rendu canvas pour réduire les nodes

const OcclusionStudyCard: React.FC<Props> = ({ card, showBack }) => {
  const [revealed, setRevealed] = useState<Set<string>>(new Set())
  const containerRef = useRef<HTMLDivElement|null>(null)
  const canvasRef = useRef<HTMLCanvasElement|null>(null)
  useEffect(() => { setRevealed(new Set()) }, [card.id])
  const regions = showBack ? (card as any).occlusionRegionsBack || card.occlusionRegions || [] : card.occlusionRegions || []
  const revealRegion = useCallback((id:string) => setRevealed(r => { const n = new Set(r); n.add(id); return n }), [])
  const revealAll = useCallback(() => setRevealed(new Set(regions.map((r: any)=>r.id))), [regions])
  const unrevealedRegions = useMemo(()=> regions.filter((r: any) => !revealed.has(r.id)), [regions, revealed])

  // Keyboard shortcuts: espace = next, chiffres 1..9 = n-ième, 'a' = all
  useEffect(()=>{
    const handler = (e:KeyboardEvent) => {
      if(!containerRef.current) return
      if(!containerRef.current.contains(document.activeElement)) return
      if(e.key === ' '){
        e.preventDefault(); if(unrevealedRegions[0]) revealRegion(unrevealedRegions[0].id)
      } else if(/^[1-9]$/.test(e.key)) {
        const idx = parseInt(e.key,10)-1; if(unrevealedRegions[idx]) { revealRegion(unrevealedRegions[idx].id) }
      } else if(e.key.toLowerCase()==='a'){ revealAll() }
    }
    window.addEventListener('keydown', handler)
    return ()=> window.removeEventListener('keydown', handler)
  }, [unrevealedRegions, revealRegion, revealAll])

  // Canvas rendering for large number of regions (only unrevealed need overlay)
  const canvasDisabled = typeof window !== 'undefined' && (window as any).__DISABLE_CANVAS_OCCLUSION__
  useOcclusionCanvas({ regions, unrevealed: unrevealedRegions, enabled: !canvasDisabled, threshold: CANVAS_THRESHOLD, showBack, containerRef, canvasRef })

  const maskedOverlays = useMemo(() => regions.length >= CANVAS_THRESHOLD ? null : regions.map((r: any) => {
    const isRevealed = revealed.has(r.id) || showBack
    return (
      <div key={r.id}
           role={!isRevealed? 'button': undefined}
           aria-label={!isRevealed? `Révéler zone ${r.label || r.id}`: undefined}
           tabIndex={!isRevealed? 0 : -1}
           onKeyDown={(e)=> { if(!isRevealed && (e.key==='Enter'||e.key===' ')){ e.preventDefault(); revealRegion(r.id) } }}
           onClick={() => !isRevealed && revealRegion(r.id)}
           className={`absolute group cursor-pointer select-none rounded-sm border focus:outline-none focus:ring-1 focus:ring-amber-400 ${isRevealed? 'border-emerald-400/70' : 'border-transparent'} transition-colors`}
           style={{ left:`${r.x*100}%`, top:`${r.y*100}%`, width:`${r.width*100}%`, height:`${r.height*100}%` }}>
        {!isRevealed && (
          <div className={`w-full h-full flex items-center justify-center text-[10px] font-medium rounded-sm ${supportsBackdrop? 'backdrop-blur-sm bg-black/30 dark:bg-white/20' : 'bg-gray-900/80 dark:bg-gray-100/80 text-white dark:text-gray-900'}`}>?
          </div>
        )}
        {isRevealed && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-[10px] font-medium text-emerald-900 dark:text-emerald-200 bg-emerald-300/15 dark:bg-emerald-300/10">
            {r.label || 'Zone'}
          </div>
        )}
      </div>
    )
  }), [regions, revealed, showBack, revealRegion])

  const mediaRepo = container.resolve<DexieMediaRepository>(MEDIA_REPOSITORY_TOKEN)
  const [resolvedSrc, setResolvedSrc] = useState<string|undefined>(undefined)
  const imageIdOrData = showBack ? card.backImage : card.frontImage
  useEffect(()=> {
    let revoke: string | null = null
    if(!imageIdOrData){ setResolvedSrc(undefined); return }
    if(imageIdOrData.startsWith('data:')) { setResolvedSrc(imageIdOrData); return }
    (async ()=> { try { const row = await mediaRepo.get(imageIdOrData); if(row){ const url = URL.createObjectURL(row.blob); revoke = url; setResolvedSrc(url) } } catch(e){ console.warn('Media load failed', e); setResolvedSrc(undefined) } })()
    return ()=> { if(revoke) URL.revokeObjectURL(revoke) }
  }, [imageIdOrData, mediaRepo])

  return (
    <div ref={containerRef} className="relative w-full h-full" tabIndex={0} aria-label="Carte occlusion" data-occlusion-container>
      <div className="absolute inset-0 rounded overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
        {resolvedSrc ? (
          <img src={resolvedSrc} alt="occlusion" className="max-w-full max-h-full object-contain select-none pointer-events-none" draggable={false} />
        ) : (
          <div className="text-xs text-gray-500 px-2 text-center">(Pas d'image) Ajoutez-en via l'éditeur pour une vraie occlusion.</div>
        )}
        {maskedOverlays}
  {regions.length >= CANVAS_THRESHOLD && !showBack && !canvasDisabled && (
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true" />
        )}
      </div>
      {!showBack && regions.length>0 && revealed.size < regions.length && (
        <div className="absolute bottom-2 left-2 flex gap-1 flex-wrap">
          <button type="button" onClick={revealAll} className="px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-600 text-white text-[11px]">Révéler tout</button>
          {[...regions].filter(r=>!revealed.has(r.id)).slice(0,6).map(r => (
            <button key={r.id} onClick={()=>revealRegion(r.id)} className="px-2 py-0.5 rounded bg-gray-900/60 dark:bg-gray-100/30 text-white dark:text-gray-100 text-[10px] hover:bg-gray-900/80">{r.label || r.id.split('_').pop()}</button>
          ))}
        </div>
      )}
    </div>
  )
}

export default React.memo(OcclusionStudyCard)
