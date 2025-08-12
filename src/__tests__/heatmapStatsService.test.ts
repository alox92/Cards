import { describe, it, expect } from 'vitest'
import { HeatmapStatsService } from '@/application/services/HeatmapStatsService'

class FakeSessionRepo { constructor(private sessions:any[]){} async getRecent(){ return this.sessions } }

describe('HeatmapStatsService', () => {
  it('aggregates last days', async () => {
    const now = Date.now()
    const sessions = [
      { startTime: now, cardsStudied: 10 },
      { startTime: now - 24*3600*1000, cardsStudied: 5 }
    ]
  const svc = new HeatmapStatsService(new FakeSessionRepo(sessions) as any)
    const data = await svc.getLastNDays(2)
    expect(data.length).toBe(2)
    expect(data[1].reviews).toBe(10)
  })
})
