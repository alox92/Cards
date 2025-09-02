export interface CardForgettingRisk { cardId: string; dueInHours: number; risk: number }
export interface ForecastSnapshot { generatedAt: number; averageRisk: number; highRiskCount: number; horizonHours: number; items: CardForgettingRisk[] }

/**
 * Phase 7 – Service de prévision: estime le risque d'oubli à court terme (horizon glissant) basé sur intervalle, EF et révisions récentes.
 * Modèle heuristique léger (remplaçable par ML futur) :
 *   baseHalfLife = intervalJours * (ef / 2.5)
 *   decayFactor = exp(-elapsed / (baseHalfLife))
 *   risk = clamp(1 - decayFactor * accuracyBias, 0,1)
 */
export class LearningForecastService {
  private lastSnapshot: ForecastSnapshot | null = null
  private cacheTtlMs = 60_000
  private horizonHours = 48
  constructor(private cardRepo: { getAll: () => Promise<any[]> }) {}

  async getForecast(force = false): Promise<ForecastSnapshot>{
    if(!force && this.lastSnapshot && (Date.now()-this.lastSnapshot.generatedAt) < this.cacheTtlMs){
      return this.lastSnapshot
    }
  const cards = await this.cardRepo.getAll()
    const now = Date.now()
    const items: CardForgettingRisk[] = []
    const CHUNK = 250
    for(let i=0;i<cards.length;i+=CHUNK){
      const slice = cards.slice(i,i+CHUNK)
      for(const c of slice){
        try {
          const intervalDays = Math.max(1, c.interval || 1)
          const ef = c.easinessFactor || 2.5
          const last = c.lastReview || now
          const elapsedDays = (now - last)/86_400_000
          const baseHalfLife = intervalDays * (ef/2.5)
          const decay = Math.exp(- elapsedDays / baseHalfLife)
          const accuracyBias = c.totalReviews ? (c.correctReviews / c.totalReviews) : 0.6
          let risk = 1 - decay * (0.5 + 0.5*accuracyBias)
          risk = Math.min(1, Math.max(0, risk))
          const dueInHours = (c.nextReview ? (c.nextReview - now) : 0)/3600_000
          if(dueInHours < this.horizonHours){
            items.push({ cardId: c.id, dueInHours, risk })
          }
        } catch {/* ignore individual card errors */}
      }
      // légère cession après chaque chunk
      await new Promise(r=> setTimeout(r,0))
    }
    items.sort((a,b)=> b.risk - a.risk)
    const avg = items.reduce((s,i)=> s+i.risk,0)/(items.length||1)
    this.lastSnapshot = {
      generatedAt: now,
      averageRisk: avg,
      highRiskCount: items.filter(i=> i.risk >= 0.6).length,
      horizonHours: this.horizonHours,
      items: items.slice(0, 200) // cap pour éviter surcharge UI
    }
    return this.lastSnapshot
  }
  clearSnapshot(){ this.lastSnapshot = null }
}
export const LEARNING_FORECAST_SERVICE_TOKEN = 'LearningForecastService'
export default LearningForecastService
