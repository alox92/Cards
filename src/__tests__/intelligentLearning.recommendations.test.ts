import { describe, it, expect } from 'vitest'
import { getIntelligentLearningSystem } from '@/core/IntelligentLearningSystem'

describe('IntelligentLearningSystem recommendations (Phase 5)', () => {
  it('génère des recommandations variées selon performance', async () => {
    const ils: any = getIntelligentLearningSystem()
    const profile = ils.getLearningProfile()
    if(profile){
      profile.performance.overallAccuracy = 92
      profile.performance.retentionRate = 55
      profile.streaks.currentStreak = 6
      ;(ils as any).profile = profile
      const recs = await ils.generateRecommendations()
      const actions = recs.map((r:any)=>r.action)
      expect(actions).toEqual(expect.arrayContaining([
        'adjust-difficulty-up',
        'add-micro-session'
      ]))
    }
  })
})
