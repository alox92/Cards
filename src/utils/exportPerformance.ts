import { getFPSMonitor } from '@/utils/fpsMonitor'
import { PERFORMANCE_BUDGETS } from '@/utils/performanceBudgets'

export function exportPerformanceSnapshot(){
  const mon: any = getFPSMonitor()
  const stats = mon.getStats()
  const history = mon.exportHistory?.() || {}
  return JSON.stringify({
    ts: Date.now(),
    budgets: PERFORMANCE_BUDGETS,
    fps: stats,
    history,
  }, null, 2)
}
