import { create } from 'zustand'
import { globalEventBus } from '@/core/eventBus'

export interface PerformanceState {
  metrics: Record<string, any> | null
  lastOptimization?: { rule: string; timestamp: number }
  history: Array<{ t: number; fps?: number; memory?: number }>
  setMetrics: (m: any) => void
  setOptimization: (r: { rule: string; timestamp: number }) => void
}

export const usePerformanceStore = create<PerformanceState>((set, get) => ({
  metrics: null,
  history: [],
  setMetrics: (m) => {
    const hist = get().history
    const next = [...hist, { t: Date.now(), fps: m.fps, memory: m.memoryUsagePercent }].slice(-120)
    set({ metrics: m, history: next })
  },
  setOptimization: (o) => set({ lastOptimization: o })
}))

// Auto-subscribe once when module imported
let subscribed = false
function ensureSubscribe(){
  if(subscribed) return
  subscribed = true
  globalEventBus.on('performance', (e) => {
    usePerformanceStore.getState().setMetrics(e.metrics)
  })
  globalEventBus.on('optimization', (o) => {
    usePerformanceStore.getState().setOptimization(o)
  })
}
ensureSubscribe()
