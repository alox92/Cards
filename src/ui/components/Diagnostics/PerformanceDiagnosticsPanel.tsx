import React, { useEffect, useState } from 'react'
import useLearningProfile from '@/ui/hooks/useLearningProfile'
import useInsights from '@/ui/hooks/useInsights'
import type { StudyInsight } from '@/domain/entities/StudyInsight'
import { getFPSMonitor } from '@/utils/fpsMonitor'
import { logger } from '@/utils/logger'
import { aribaDB } from '@/infrastructure/persistence/dexie/AribaDB'
import { LEARNING_FORECAST_SERVICE_TOKEN, LearningForecastService } from '@/application/services/LearningForecastService'
import { container } from '@/application/Container'
import FLAGS from '@/utils/featureFlags'
import { usePerformanceStore } from '@/data/stores/performanceStore'
// Chargement lazy des historiques JSON (bench/smoke) – best effort côté dev panel

function usePerfHistoryFiles(){
  const [data, setData] = useState<{ bench?: any; smoke?: any }>({})
  const [disabled, setDisabled] = useState(false)
  useEffect(()=>{
    let mounted = true
    ;(async()=>{
      try {
        const bench = await fetch('/bench-history.json').then(r=> r.ok? r.json(): null).catch(()=>null)
        const smoke = await fetch('/perf-history.json').then(r=> r.ok? r.json(): null).catch(()=>null)
        if(mounted) setData({ bench, smoke })
      } catch(e){ setDisabled(true) }
    })()
    const id = setInterval(()=>{
      (async()=>{
        try {
          const bench = await fetch('/bench-history.json').then(r=> r.ok? r.json(): null).catch(()=>null)
          const smoke = await fetch('/perf-history.json').then(r=> r.ok? r.json(): null).catch(()=>null)
          if(mounted) setData({ bench, smoke })
        } catch { if(mounted) setDisabled(true) }
      })()
    }, 15000)
    return ()=> { mounted=false; clearInterval(id) }
  }, [])
  return disabled ? {} : data
}

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
  const metrics = usePerformanceStore(s=> s.metrics)
  const history = usePerformanceStore(s=> s.history)
  const lastOpt = usePerformanceStore(s=> s.lastOptimization)
  const external = usePerfHistoryFiles()
  const learning = useLearningProfile()
  const [learningSeries, setLearningSeries] = useState<{ ts:number; acc:number; mastery:number }[]>([])
  const [searchStats, setSearchStats] = useState<{ top: { term:string; count:number }[]; lastMode?: string }>({ top: [] })
  const insights: StudyInsight[] = useInsights()
  const [forecast, setForecast] = useState<{ avg?: number; high?: number; ts?: number; items?: any[] }>({})
  const [vitals, setVitals] = useState<any[]>([])
  const [idleTasks, setIdleTasks] = useState<any[]>([])
  const [vitalsAgg, setVitalsAgg] = useState<{ name:string; p75:number; median:number; count:number }[]>([])
  // Simple polling of top search terms (dev only)
  useEffect(()=>{
    let mounted = true
    const load = async ()=>{
      try {
        // @ts-ignore
        const rows = await (aribaDB as any).searchTermStats.orderBy('count').reverse().limit(10).toArray().catch(()=>[])
        if(mounted) setSearchStats(s=> ({ ...s, top: rows }))
      } catch{/* ignore */}
    }
    load()
    const id = setInterval(load, 15000)
    return ()=> { mounted=false; clearInterval(id) }
  }, [])
  // Forecast polling (Phase 7)
  useEffect(()=>{
    let mounted = true
    const svc = container.resolve<LearningForecastService>(LEARNING_FORECAST_SERVICE_TOKEN as any)
    const pull = async ()=>{
      try { const snap = await svc.getForecast(); if(mounted) setForecast({ avg: snap.averageRisk, high: snap.highRiskCount, ts: snap.generatedAt, items: snap.items.slice(0,5) }) } catch{}
    }
    pull()
    const id = setInterval(pull, 30000)
    return ()=> { mounted=false; clearInterval(id) }
  }, [])
  // Chargement périodique fichier historique persistant (si servi)
  useEffect(()=>{
    let mounted = true
    const load = async () => {
      try {
        const res = await fetch('/learning-history.json').then(r=> r.ok? r.json(): null).catch(()=>null)
        if(res && Array.isArray(res) && mounted){
          setLearningSeries(res.filter((x:any)=> typeof x.accuracy==='number').map((x:any)=> ({ ts: x.ts, acc: x.accuracy, mastery: x.mastery ?? 0 })))
        }
      } catch {/* ignore */}
    }
    load()
    const id = setInterval(load, 20000)
    return ()=> { mounted = false; clearInterval(id) }
  }, [])

  // Accumulation simple en mémoire (Phase 5) – future persistance: learning-history.json
  // Enrichir série locale (mix persistence + temps réel) pour réactivité avant flush vers fichier
  useEffect(()=>{
    const p = learning.profile
    if(p && learningSeries.length){ // n'ajouter qu'après premier chargement fichier
      setLearningSeries(s=> [...s.slice(-199), { ts: Date.now(), acc: p.performance.overallAccuracy, mastery: p.performance.masteryLevel }])
    }
  }, [learning.profile?.performance.overallAccuracy, learning.profile?.performance.masteryLevel])

  useEffect(() => {
    const id = setInterval(()=>{
  setState(s => ({ ...s, fps: monitor.getStats() as any, suppressed: logger.getSuppressionSummary() }))
      // Pull web vitals + idle task history (non réactif sinon)
      try {
        const w: any = window as any
        const latestObj = w.__WEB_VITALS__ || {}
        const history: any[] = w.__WEB_VITALS_HISTORY__ || []
        const latestArr = Object.values(latestObj)
        setVitals(latestArr as any[])
        // Agrégations sur historique par metric
        const by: Record<string, number[]> = {}
        history.forEach(m => { (by[m.name] ||= []).push(m.value) })
        const agg = Object.entries(by).map(([name, arr])=>{
          const sorted = [...arr].sort((a,b)=> a-b)
          const median = sorted[Math.floor(sorted.length/2)]
          const p75 = sorted[Math.floor(sorted.length*0.75)]
          return { name, median: Math.round(median), p75: Math.round(p75), count: arr.length }
        })
        setVitalsAgg(agg)
      } catch {/* ignore */}
      try {
        const it = (window as any).__IDLE_TASKS__
        if(Array.isArray(it)) setIdleTasks(it.slice(-15))
      } catch {}
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
              <button
                onClick={async ()=>{
                  try {
                    // Clear insight + forecast caches
                    const insightSvc: any = (container as any).safeResolve?.('InsightService') || container.resolve?.('InsightService' as any)
                    const forecastSvc: any = (container as any).safeResolve?.('LearningForecastService') || container.resolve?.('LearningForecastService' as any)
                    insightSvc?.resetCache?.(); forecastSvc?.clearSnapshot?.();
                    setForecast({})
                    await insightSvc?.generate?.(true)
                    await forecastSvc?.getForecast?.(true)
                  } catch {/* ignore */}
                }}
                className="px-2 py-0.5 rounded bg-amber-600/70 hover:bg-amber-600"
              >Recalc</button>
              <button
                onClick={async ()=>{
                  try {
                    // force rebuild search index
                    const searchSvc: any = (container as any).safeResolve?.('SearchIndexService') || container.resolve?.('SearchIndexService' as any)
                    await searchSvc?.rebuildAll?.()
                    logger.info('Diag','Search index rebuilt manually')
                  } catch {/* ignore */}
                }}
                className="px-2 py-0.5 rounded bg-fuchsia-700/70 hover:bg-fuchsia-700"
              >Reindex</button>
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
          {metrics && (
            <div className="grid grid-cols-3 gap-2 text-center text-[10px] border-t border-gray-700 pt-2">
              <div><div className="text-gray-400">Req</div><div className="text-white font-semibold">{metrics.pendingRequests}</div></div>
              <div><div className="text-gray-400">Mem%</div><div className="text-white font-semibold">{metrics.memoryUsagePercent?.toFixed?.(1) ?? '–'}</div></div>
              <div><div className="text-gray-400">Tasks</div><div className="text-white font-semibold">{metrics.backgroundTasks}</div></div>
            </div>
          )}
          {metrics && (
            <div className="grid grid-cols-3 gap-2 text-center text-[10px] border-t border-gray-700 pt-2">
              <div><div className="text-gray-400">Hit%</div><div className="text-white font-semibold">{metrics.cacheHitRate?.toFixed?.(0) ?? '–'}</div></div>
              <div><div className="text-gray-400">Cache</div><div className="text-white font-semibold">{metrics.cacheEntries ?? '–'}</div></div>
              <div><div className="text-gray-400">WQ</div><div className="text-white font-semibold">{metrics.workerQueueLength ?? 0}</div></div>
            </div>
          )}
          {history && history.length > 5 && (
            <div className="h-6 w-full relative">
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                {(() => {
                  const data = history.slice(-60)
                  const vals = data.map(d=> d.memory || 0)
                  const max = Math.max(...vals, 100)
                  const min = Math.min(...vals, 0)
                  const range = max - min || 1
                  const path = data.map((d,i)=>{
                    const x = (i/(data.length-1))*100
                    const y = 100 - (((d.memory||0) - min)/range)*100
                    return `${i===0?'M':'L'}${x},${y}`
                  }).join(' ')
                  return <path d={path} stroke="#f59e0b" strokeWidth={1} fill="none" vectorEffect="non-scaling-stroke" />
                })()}
              </svg>
              <div className="absolute top-0 left-0 text-[9px] text-gray-500">Mem</div>
            </div>
          )}
          {lastOpt && (
            <div className="text-[10px] text-gray-400 flex gap-2 border-t border-gray-700 pt-1">
              <span className="text-gray-300">Last Opt:</span>
              <span className="text-blue-300 truncate">{lastOpt.rule}</span>
              <span>{Math.round((Date.now()-lastOpt.timestamp)/1000)}s</span>
            </div>
          )}
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
          {/* Mini historiques externes */}
          {external.bench && Array.isArray(external.bench) && external.bench.length > 0 && (
            <div className="border-t border-gray-700 pt-1">
              <div className="text-[10px] text-gray-300 font-semibold mb-0.5">Bench ops (sm2 single)</div>
              {(() => {
                const last = external.bench.slice(-30)
                const series = last.map((s:any)=> {
                  const b = (s.benches||[]).find((x:any)=> x.name.includes('sm2Update single'))
                  return b? b.ops: null
                }).filter((v:any)=> v!=null)
                if(series.length<2) return <div className="text-[10px] text-gray-500">Insuffisant</div>
                const max = Math.max(...series)
                const min = Math.min(...series)
                const range = max-min || 1
                const path = series.map((v:number,i:number)=>{
                  const x = (i/(series.length-1))*100
                  const y = 100 - ((v-min)/range)*100
                  return `${i===0?'M':'L'}${x},${y}`
                }).join(' ')
                return <div className="h-6 relative"><svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none"><path d={path} stroke="#10b981" strokeWidth={1} fill="none" vectorEffect="non-scaling-stroke" /></svg><div className="absolute top-0 left-0 text-[9px] text-gray-500">Bench</div></div>
              })()}
            </div>
          )}
          {external.smoke && Array.isArray(external.smoke) && external.smoke.length > 0 && (
            <div className="border-t border-gray-700 pt-1">
              <div className="text-[10px] text-gray-300 font-semibold mb-0.5">Smoke buildQueueMs</div>
              {(() => {
                const last = external.smoke.slice(-30)
                const series = last.map((s:any)=> s.buildQueueMs).filter((v:any)=> typeof v==='number')
                if(series.length<2) return <div className="text-[10px] text-gray-500">Insuffisant</div>
                const max = Math.max(...series)
                const min = Math.min(...series)
                const range = max-min || 1
                const path = series.map((v:number,i:number)=>{
                  const x = (i/(series.length-1))*100
                  const y = 100 - ((v-min)/range)*100
                  return `${i===0?'M':'L'}${x},${y}`
                }).join(' ')
                return <div className="h-6 relative"><svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none"><path d={path} stroke="#ec4899" strokeWidth={1} fill="none" vectorEffect="non-scaling-stroke" /></svg><div className="absolute top-0 left-0 text-[9px] text-gray-500">Smoke</div></div>
              })()}
            </div>
          )}
          {learningSeries.length > 5 && (
            <div className="border-t border-gray-700 pt-1 space-y-1">
              <div className="text-[10px] text-gray-300 font-semibold">Learning Accuracy</div>
              {(() => {
                const data = learningSeries.slice(-60)
                const vals = data.map(d=> d.acc)
                const max = Math.max(...vals, 100)
                const min = Math.min(...vals, 0)
                const range = max-min || 1
                const path = data.map((d,i)=>{
                  const x = (i/(data.length-1))*100
                  const y = 100 - ((d.acc-min)/range)*100
                  return `${i===0?'M':'L'}${x},${y}`
                }).join(' ')
                return <div className="h-6 relative"><svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none"><path d={path} stroke="#6366f1" strokeWidth={1} fill="none" vectorEffect="non-scaling-stroke" /></svg><div className="absolute top-0 left-0 text-[9px] text-gray-500">Acc%</div></div>
              })()}
              <div className="text-[10px] text-gray-300 font-semibold">Learning Mastery</div>
              {(() => {
                const data = learningSeries.slice(-60)
                const vals = data.map(d=> d.mastery)
                const max = Math.max(...vals, 100)
                const min = Math.min(...vals, 0)
                const range = max-min || 1
                const path = data.map((d,i)=>{
                  const x = (i/(data.length-1))*100
                  const y = 100 - ((d.mastery-min)/range)*100
                  return `${i===0?'M':'L'}${x},${y}`
                }).join(' ')
                return <div className="h-6 relative"><svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none"><path d={path} stroke="#a855f7" strokeWidth={1} fill="none" vectorEffect="non-scaling-stroke" /></svg><div className="absolute top-0 left-0 text-[9px] text-gray-500">Mast</div></div>
              })()}
            </div>
          )}
          {learning.recommendations.length > 0 && (
            <div className="border-t border-gray-700 pt-1 max-h-28 overflow-auto">
              <div className="text-[10px] text-gray-300 font-semibold mb-0.5">Recs</div>
              {learning.recommendations.slice(0,5).map(r => (
                <div key={r.action} className="text-[10px] flex justify-between gap-2 opacity-90">
                  <span className="truncate">{r.title}</span>
                  <span className="text-gray-400">{Math.round(r.estimatedBenefit*100)}%</span>
                </div>
              ))}
            </div>
          )}
          {searchStats.top.length > 0 && (
            <div className="border-t border-gray-700 pt-1">
              <div className="text-[10px] text-gray-300 font-semibold mb-0.5">Search Terms</div>
              {searchStats.top.map(t => (
                <div key={t.term} className="flex justify-between text-[10px]">
                  <span className="truncate max-w-[120px]">{t.term}</span>
                  <span className="text-gray-400">{t.count}</span>
                </div>
              ))}
            </div>
          )}
          {forecast.avg != null && (
            <div className="border-t border-gray-700 pt-1">
              <div className="text-[10px] text-gray-300 font-semibold mb-0.5">Forgetting Risk</div>
              <div className="grid grid-cols-3 text-center text-[10px] mb-1">
                <div><div className="text-gray-400">AVG</div><div className="text-orange-400 font-semibold">{(forecast.avg*100).toFixed(0)}%</div></div>
                <div><div className="text-gray-400">HIGH</div><div className="text-red-400 font-semibold">{forecast.high}</div></div>
                <div><div className="text-gray-400">Age</div><div className="text-gray-300">{forecast.ts? Math.round((Date.now()-forecast.ts)/1000):'–'}s</div></div>
              </div>
              {forecast.items && forecast.items.length>0 && (
                <div className="space-y-0.5 max-h-16 overflow-auto">
                  {forecast.items.map(i=> (
                    <div key={i.cardId} className="flex justify-between text-[10px]">
                      <span className="truncate">{i.cardId.slice(0,6)}</span>
                      <span className="text-orange-300">{(i.risk*100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {vitals.length > 0 && (
            <div className="border-t border-gray-700 pt-1">
              <div className="text-[10px] text-gray-300 font-semibold mb-0.5">Web Vitals</div>
              <div className="grid grid-cols-3 gap-1 text-[9px] mb-1">
                {vitals.map((m:any,i)=> (
                  <div key={i} className="flex flex-col bg-gray-800/60 rounded p-1">
                    <span className="text-gray-400 truncate">{m.name}</span>
                    <span className="text-white font-semibold">{Math.round(m.value)}</span>
                  </div>
                ))}
              </div>
              {vitalsAgg.length>0 && (
                <div className="space-y-0.5 max-h-24 overflow-auto">
                  {vitalsAgg.map(a=> (
                    <div key={a.name} className="flex justify-between text-[9px] text-gray-400">
                      <span className="truncate max-w-[80px]">{a.name}</span>
                      <span className={a.p75 < 100 ? 'text-green-400' : a.p75 < 200 ? 'text-yellow-400':'text-red-400'}>P75:{a.p75}</span>
                      <span className="text-teal-300">Med:{a.median}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {idleTasks.length > 0 && (
            <div className="border-t border-gray-700 pt-1">
              <div className="text-[10px] text-gray-300 font-semibold mb-0.5">Idle Tasks</div>
              <div className="space-y-0.5 max-h-20 overflow-auto">
                {idleTasks.slice(-12).reverse().map((t:any,i)=> (
                  <div key={i} className="flex justify-between text-[9px]">
                    <span className="truncate max-w-[120px]">{t.name}</span>
                    <span className="text-gray-400">{t.duration}ms</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {insights.length > 0 && (
            <div className="border-t border-gray-700 pt-1 max-h-28 overflow-auto">
              <div className="text-[10px] text-gray-300 font-semibold mb-0.5">Insights</div>
              {insights.slice(0,5).map(i => (
                <div key={i.id} className="text-[10px] flex flex-col gap-0.5">
                  <div className="flex justify-between">
                    <span className="truncate max-w-[150px]">{i.title}</span>
                    <span className={i.severity==='critical'?'text-red-400': i.severity==='warn'?'text-yellow-400':'text-gray-400'}>{i.severity[0].toUpperCase()}</span>
                  </div>
                  <div className="text-[9px] text-gray-500 truncate">{i.detail}</div>
                </div>
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
