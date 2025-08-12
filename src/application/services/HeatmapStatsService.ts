import type { StudySessionRepository } from '@/domain/repositories/StudySessionRepository'

export interface DayHeat { date: string; reviews: number }

export class HeatmapStatsService {
  constructor(private repo: Pick<StudySessionRepository,'getRecent'>){}
  async getLastNDays(n=180): Promise<DayHeat[]> {
    const recent = await this.repo.getRecent(1000)
    const map = new Map<string, number>()
  recent.forEach((s: any) => {
      const d = new Date(s.startTime)
      const key = d.toISOString().substring(0,10)
      map.set(key, (map.get(key)||0) + (s.cardsStudied||0))
    })
    const out: DayHeat[] = []
    for(let i=0;i<n;i++){
      const d = new Date(); d.setDate(d.getDate()-i)
      const key = d.toISOString().substring(0,10)
      out.push({ date: key, reviews: map.get(key)||0 })
    }
    return out.reverse()
  }
}
export const HEATMAP_STATS_SERVICE_TOKEN = 'HeatmapStatsService'
export default HeatmapStatsService
