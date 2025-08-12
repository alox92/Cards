import { useEffect, useRef } from 'react'

export interface OcclusionRegion { id:string; x:number; y:number; width:number; height:number; label?:string }

export function useOcclusionCanvas(params:{
  regions: OcclusionRegion[]
  unrevealed: OcclusionRegion[]
  enabled: boolean
  threshold: number
  showBack: boolean
  containerRef: React.RefObject<HTMLDivElement>
  canvasRef: React.RefObject<HTMLCanvasElement>
}){
  const prevHashRef = useRef('')
  useEffect(()=>{
    const { regions, unrevealed, enabled, threshold, showBack, containerRef, canvasRef } = params
    if(!enabled || showBack || regions.length < threshold) return
    const canvas = canvasRef.current; const container = containerRef.current
    if(!canvas || !container) return
    const ctx = canvas.getContext('2d'); if(!ctx) return
    const { width, height } = container.getBoundingClientRect()
    canvas.width = width; canvas.height = height
    const hash = unrevealed.map(r=>r.id).join(',')+`|${width}x${height}`
    if(hash === prevHashRef.current) return
    prevHashRef.current = hash
    ctx.clearRect(0,0,width,height)
    unrevealed.forEach(r => {
      const x = r.x*width, y = r.y*height, w = r.width*width, h = r.height*height
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(x,y,w,h)
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1; ctx.strokeRect(x+0.5,y+0.5,w-1,h-1)
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = '10px system-ui,sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('?', x+w/2, y+h/2)
    })
  }, [params])
}
