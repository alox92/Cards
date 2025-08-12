import React, { useEffect, useState } from 'react'
import { getFPSMonitor } from '@/utils/fpsMonitor'
import { logger } from '@/utils/logger'
import FLAGS from '@/utils/featureFlags'

// Shape des stats FPS
interface FpsDiagStats { running: boolean; paused: boolean; samples: number; avg: number; min: number; max: number; consecutiveLow: number; warnBelow: number; adaptiveApplied: number; adaptationsHistory?: {ts:number; newWarnBelow:number}[]; lowSeries?: {ts:number; avg:number}[] }
interface PanelState { fps: FpsDiagStats; suppressed: { key: string; suppressed: number }[]; open: boolean }

export const PerformanceDiagnosticsPanel: React.FC = () => {
  const monitor = getFPSMonitor()
  const [state, setState] = useState<PanelState>(()=>({
    fps: monitor.getStats() as any,
    suppressed: logger.getSuppressionSummary(),
    open: false
  }))

  useEffect(() => {
    const id = setInterval(()=>{
  setState(s => ({ ...s, fps: monitor.getStats() as any, suppressed: logger.getSuppressionSummary() }))
    }, 1500)
    return () => clearInterval(id)
  }, [monitor])

  if(!FLAGS.diagnosticsEnabled) return null

  return (
    <div className="fixed bottom-4 left-4 z-[1000] text-xs font-mono">
      <button
        onClick={()=> setState(s=> ({ ...s, open: !s.open }))}
        className="px-2 py-1 rounded bg-black/60 text-white shadow hover:bg-black/70 transition"
      >{state.open ? '▼ Perf' : '▲ Perf'}</button>
      {state.open && (
        <div className="mt-2 w-80 max-h-[60vh] overflow-auto rounded-lg bg-gray-900/90 backdrop-blur text-gray-100 shadow-lg border border-gray-700 p-3 space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-sm">Performance</h3>
            <div className="flex gap-2">
              <button onClick={()=>{ logger.flushBatch(); }} className="px-2 py-0.5 rounded bg-indigo-600/70 hover:bg-indigo-600">Flush</button>
              <button onClick={()=>{ logger.resetSuppressionCounters(); }} className="px-2 py-0.5 rounded bg-gray-600/70 hover:bg-gray-600">Reset</button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
            <div><div className="text-gray-400">AVG</div><div className="text-white font-semibold">{state.fps.avg}</div></div>
            <div><div className="text-gray-400">MIN</div><div className="text-white font-semibold">{state.fps.min}</div></div>
            <div><div className="text-gray-400">MAX</div><div className="text-white font-semibold">{state.fps.max}</div></div>
            <div><div className="text-gray-400">WARN</div><div className="text-yellow-400 font-semibold">{state.fps.warnBelow}</div></div>
            <div><div className="text-gray-400">LOW</div><div className="text-red-400 font-semibold">{state.fps.consecutiveLow}</div></div>
            <div><div className="text-gray-400">ADAPT</div><div className="text-blue-400 font-semibold">{state.fps.adaptiveApplied}</div></div>
          </div>
          {/* Sparkline FPS (AVG séries) */}
          {state.fps.lowSeries && state.fps.lowSeries.length > 5 && (
            <div className="h-8 w-full relative">
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                {(() => {
                  const data = state.fps.lowSeries!.slice(-50)
                  const max = Math.max(...data.map(d=>d.avg),60)
                  const min = Math.min(...data.map(d=>d.avg),0)
                  const range = max - min || 1
                  const path = data.map((d,i)=>{
                    const x = (i/(data.length-1))*100
                    const y = 100 - ((d.avg - min)/range)*100
                    return `${i===0?'M':'L'}${x},${y}`
                  }).join(' ')
                  return <path d={path} stroke="#38bdf8" strokeWidth={1} fill="none" vectorEffect="non-scaling-stroke" />
                })()}
              </svg>
              <div className="absolute top-0 left-0 text-[9px] text-gray-500">Trend</div>
            </div>
          )}
          {state.fps.adaptationsHistory && state.fps.adaptationsHistory.length > 0 && (
            <div className="text-[10px] text-gray-400 space-y-0.5 max-h-16 overflow-auto border-t border-gray-700 pt-1">
              <div className="text-gray-300 font-semibold">Adaptations</div>
              {state.fps.adaptationsHistory.slice(-5).reverse().map((a,i)=>(
                <div key={i} className="flex justify-between"><span>{Math.round(a.ts/1000)}s</span><span className="text-blue-300">→ {a.newWarnBelow}</span></div>
              ))}
            </div>
          )}
          <div className="text-[10px] text-gray-400 flex gap-2 flex-wrap">
            <span>{state.fps.running ? (state.fps.paused?'⏸️':'▶️') : '■'}</span>
            <span>{state.fps.samples} samples</span>
            <span>Batch:{(logger as any).batchingEnabled ? 'on':'off'}</span>
            <span>Cat:{(logger as any).batchConfig?.categories?.size}</span>
          </div>
          <div>
            <h4 className="text-[11px] font-semibold mt-2 mb-1">Logs supprimés</h4>
            {state.suppressed.length === 0 && <div className="text-[10px] text-gray-500">Aucun</div>}
            {state.suppressed.slice(0,15).map(s => (
              <div key={s.key} className="truncate text-[10px] flex justify-between gap-2">
                <span className="flex-1 truncate">{s.key}</span>
                <span className="text-yellow-400">{s.suppressed}</span>
              </div>
            ))}
          </div>
          <div className="text-[10px] text-gray-500">Panel expérimental – gouverné par feature flag.</div>
        </div>
      )}
    </div>
  )
}

export default PerformanceDiagnosticsPanel
