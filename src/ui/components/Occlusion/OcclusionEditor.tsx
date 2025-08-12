import React, { useRef, useState, useCallback } from 'react'

export interface OcclusionRegion { id:string; x:number; y:number; width:number; height:number; label?:string }

interface OcclusionEditorProps {
  imageDataUrl?: string
  regions: OcclusionRegion[]
  onChange(regions: OcclusionRegion[]): void
  className?: string
  height?: number
}

// Editeur visuel simplifié (MVP): rectangles redimensionnables & déplaçables, coordonnées normalisées (0..1)
const OcclusionEditor: React.FC<OcclusionEditorProps> = ({ imageDataUrl, regions, onChange, className='', height=320 }) => {
  const containerRef = useRef<HTMLDivElement|null>(null)
  const [activeId, setActiveId] = useState<string|null>(null)
  const [mode, setMode] = useState<'move'|'resize'|'draw'|null>(null)
  const [editingId, setEditingId] = useState<string|null>(null)

  const updateRegion = (id:string, patch: Partial<OcclusionRegion>) => {
    onChange(regions.map(r => r.id===id ? { ...r, ...patch } : r))
  }

  const handlePointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if(!containerRef.current) return
    if((e.target as HTMLElement).dataset['handle']) return // resize handle case
    const rect = containerRef.current.getBoundingClientRect()
    if(e.shiftKey){
      // commencer un nouveau rectangle
      const startX = (e.clientX - rect.left)/rect.width
      const startY = (e.clientY - rect.top)/rect.height
      const id = `occ_${Date.now()}`
      const newRegion: OcclusionRegion = { id, x:startX, y:startY, width:0.12, height:0.08 }
      onChange([...regions, newRegion])
      setActiveId(id)
      setMode('resize')
    } else {
      // sélectionner
      const clickX = (e.clientX - rect.left)/rect.width
      const clickY = (e.clientY - rect.top)/rect.height
      const hit = [...regions].reverse().find(r => clickX>=r.x && clickX<=r.x+r.width && clickY>=r.y && clickY<=r.y+r.height)
      setActiveId(hit? hit.id : null)
      if(hit) setMode('move')
    }
  }

  const handlePointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if(!containerRef.current || !activeId || !mode) return
    e.preventDefault()
    const rect = containerRef.current.getBoundingClientRect()
    const relX = (e.clientX - rect.left)/rect.width
    const relY = (e.clientY - rect.top)/rect.height
    const region = regions.find(r => r.id===activeId)
    if(!region) return
    if(mode==='move'){
      const dx = relX - (region.x + region.width/2)
      const dy = relY - (region.y + region.height/2)
      let nx = region.x + dx
      let ny = region.y + dy
      nx = Math.min(1-region.width, Math.max(0, nx))
      ny = Math.min(1-region.height, Math.max(0, ny))
      updateRegion(region.id,{ x:nx, y:ny })
    } else if(mode==='resize'){
      // redimension: coin bas-droit suit la souris
      let newW = relX - region.x
      let newH = relY - region.y
      newW = Math.max(0.02, Math.min(1-region.x, newW))
      newH = Math.max(0.02, Math.min(1-region.y, newH))
      updateRegion(region.id,{ width:newW, height:newH })
    }
  }

  const endInteraction = useCallback(() => { setMode(null) }, [])

  return (
    <div className={`relative border rounded bg-gray-100 dark:bg-gray-800 overflow-hidden select-none ${className}`}
         style={{ height }}
         ref={containerRef}
         onPointerDown={handlePointerDown}
         onPointerMove={handlePointerMove}
         onPointerLeave={endInteraction}
         onPointerUp={endInteraction}
         tabIndex={0}
         aria-label="Éditeur d'occlusion image"
    >
      {imageDataUrl ? (
        <img src={imageDataUrl} alt="occlusion" className="absolute inset-0 w-full h-full object-contain" draggable={false} />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-[11px] text-gray-500 p-2 text-center">
          Aucune image fournie. (MVP) Shift+Cliquer pour créer une zone. Glisser pour déplacer. Poignée coin pour redimensionner.
        </div>
      )}
      {regions.map(r => (
        <div key={r.id} className={`absolute border-[2px] backdrop-blur-sm ${r.id===activeId? 'border-amber-400 bg-amber-300/25' : 'border-blue-400 bg-blue-300/15'} cursor-move transition-colors focus:outline-none focus:ring-1 focus:ring-amber-400`}
             style={{ left:`${r.x*100}%`, top:`${r.y*100}%`, width:`${r.width*100}%`, height:`${r.height*100}%` }}
             tabIndex={0}
             role="group"
             aria-label={`Zone ${r.label || r.id}`}
             onDoubleClick={(e)=>{ e.stopPropagation(); setEditingId(r.id); setActiveId(r.id) }}
             onKeyDown={(e)=> { if(e.key==='Enter'){ e.preventDefault(); setEditingId(r.id) } else if(e.key==='Delete'){ onChange(regions.filter(z=>z.id!==r.id)) } }}
             onPointerDown={(e)=>{ e.stopPropagation(); setActiveId(r.id); setMode('move') }}
        >
          <div className="absolute right-0 bottom-0 w-3 h-3 bg-white/80 dark:bg-gray-900/60 border border-gray-400 cursor-se-resize" data-handle
               onPointerDown={(e)=>{ e.stopPropagation(); setActiveId(r.id); setMode('resize') }} />
          {editingId===r.id ? (
            <input autoFocus className="absolute -top-5 left-0 text-[10px] bg-white dark:bg-gray-900 border border-amber-400 text-gray-900 dark:text-gray-100 px-1 rounded w-24"
                   defaultValue={r.label || ''}
                   aria-label="Modifier label zone"
                   onBlur={(e)=> { updateRegion(r.id,{ label: e.target.value.trim() || undefined }); setEditingId(null) }}
                   onKeyDown={(e)=> { if(e.key==='Enter'){ (e.target as HTMLInputElement).blur() } else if(e.key==='Escape'){ setEditingId(null) } }} />
          ) : (
            <div className="absolute -top-4 left-0 text-[10px] bg-black/60 text-white px-1 rounded max-w-[120px] truncate" title="Double-clic pour renommer">{r.label || r.id.split('_').pop()}</div>
          )}
        </div>
      ))}
      <div className="absolute left-1 top-1 text-[10px] bg-black/50 text-white px-1 rounded">{regions.length} zones</div>
    </div>
  )
}

export default OcclusionEditor
