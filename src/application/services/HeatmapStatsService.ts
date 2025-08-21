import type { StudySessionRepository } from '@/domain/repositories/StudySessionRepository'
import { WorkerPool } from '@/workers/WorkerPool'

export interface DayHeat { date: string; reviews: number }

export class HeatmapStatsService {
  constructor(private repo: Pick<StudySessionRepository,'getRecent'>){}
  async getLastNDays(n=180): Promise<DayHeat[]> {
    const recent = await this.repo.getRecent(2000)
    // Utilise WorkerPool si beaucoup de sessions
    if (recent.length > 500 && typeof navigator !== 'undefined' && (navigator as any).hardwareConcurrency) {
      try {
        const workerModule = await import('@/workers/heatmapStatsWorker?worker')
        const threads = Math.min((navigator as any).hardwareConcurrency || 4, 8)
        const chunkSize = Math.ceil(recent.length / threads)
        const chunks: Array<Array<{ startTime: number, cardsStudied: number }>> = []
        for (let i = 0; i < recent.length; i += chunkSize) {
          chunks.push(recent.slice(i, i + chunkSize).map(s => ({ startTime: s.startTime, cardsStudied: s.cardsStudied })))
        }
        const pool = new WorkerPool<{ sessions: Array<{ startTime: number, cardsStudied: number }> }, { map: Record<string, number> }>(
          () => new workerModule.default(),
          threads
        )
        const results = await Promise.all(chunks.map(chunk => pool.run({ sessions: chunk })))
        await pool.terminate()
        // Fusionne les maps
        const map = new Map<string, number>()
        for (const r of results) {
          for (const [k, v] of Object.entries(r.map)) {
            map.set(k, (map.get(k) || 0) + v)
          }
        }
        const out: DayHeat[] = []
        for (let i = 0; i < n; i++) {
          const d = new Date(); d.setDate(d.getDate() - i)
          const key = d.toISOString().substring(0, 10)
          out.push({ date: key, reviews: map.get(key) || 0 })
        }
        return out.reverse()
      } catch {
        // fallback séquentiel
      }
    }
    // Fallback séquentiel
    const map = new Map<string, number>()
    recent.forEach((s: any) => {
      const d = new Date(s.startTime)
      const key = d.toISOString().substring(0, 10)
      map.set(key, (map.get(key) || 0) + (s.cardsStudied || 0))
    })
    const out: DayHeat[] = []
    for (let i = 0; i < n; i++) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const key = d.toISOString().substring(0, 10)
      out.push({ date: key, reviews: map.get(key) || 0 })
    }
    return out.reverse()
  }
}
export const HEATMAP_STATS_SERVICE_TOKEN = 'HeatmapStatsService'
export default HeatmapStatsService
