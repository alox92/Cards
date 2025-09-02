import type { CardEntity } from '@/domain/entities/Card'
import { adaptiveStudyScorer } from './AdaptiveStudyScorer'
import { InsightService } from './InsightService'
import { LearningForecastService } from './LearningForecastService'

export interface OrchestratorWeights {
  due: number
  difficulty: number
  retention: number
  forecast: number
  leechPenalty: number
}

interface FeedbackSample { predicted: number; quality: number; responseTime: number }

export class AdaptiveOrchestratorService {
  private weights: OrchestratorWeights = { due: 0.45, difficulty: 0.25, retention: 0.15, forecast: 0.15, leechPenalty: 0.2 }
  private feedback: FeedbackSample[] = []
  private lastAdjust = 0
  private adjustInterval = 60_000 // 1 min simple heuristique (dev)
  constructor(
    private readonly forecastSvc: LearningForecastService,
    private readonly insightSvc: InsightService
  ){}

  getWeights(){ return { ...this.weights } }

  async warmup(){
    // Préparer un snapshot forecast + insights pour éviter premier appel froid
    try {
      await Promise.allSettled([
        this.forecastSvc.getForecast?.(),
        Promise.resolve(this.insightSvc.getCached() || this.insightSvc.generate?.(false))
      ])
    } catch {/* ignore */}
    return { ready: true, weights: { ...this.weights } }
  }

  computeQueue(cards: CardEntity[], deckId: string): CardEntity[]{
    const base = adaptiveStudyScorer.scoreCards(cards, { now: Date.now(), targetDeck: deckId, recencyWeight: 1, difficultyWeight:1, retentionWeight:1 })
  const forecast = this.forecastSvc.getForecast?.()
  const insightSnapshot = this.insightSvc.getCached()
    const leechSet = new Set<string>((insightSnapshot?.insights||[]).filter(i=> i.type==='leech').map(i=> i.meta?.cardId))
    // For forecast risk we may not have snapshot yet -> treat as 0
    const forecastMap: Record<string, number> = {}
    if((forecast as any)?.items){ for(const it of (forecast as any).items){ forecastMap[it.cardId] = it.risk } }
    const w = this.weights
    const scored = base.map(b => {
      const f = b.factors
      const risk = forecastMap[b.card.id] || 0
      const leech = leechSet.has(b.card.id) ? 1 : 0
      const composite = f.due*w.due + f.difficulty*w.difficulty + f.retention*w.retention + risk*w.forecast - leech*w.leechPenalty
      return { card: b.card, composite }
    }).sort((a,b)=> b.composite - a.composite)
    return scored.map(s=> s.card)
  }

  recordFeedback(predicted: number, quality: number, responseTime: number){
    this.feedback.push({ predicted, quality, responseTime })
    if(this.feedback.length > 500) this.feedback.splice(0, this.feedback.length-500)
    this.maybeAdjust()
  }

  private maybeAdjust(){
    const now = Date.now()
    if(now - this.lastAdjust < this.adjustInterval || this.feedback.length < 30) return
    // Simple heuristic: if average quality < 0.6 boost due/forecast, else shift weight to difficulty to push challenge.
    const avgQ = this.feedback.reduce((s,f)=> s+f.quality,0)/this.feedback.length
    if(avgQ < 0.6){ this.weights.due = Math.min(0.6, this.weights.due + 0.02); this.weights.forecast = Math.min(0.25, this.weights.forecast + 0.01) }
    else { this.weights.difficulty = Math.min(0.35, this.weights.difficulty + 0.02); this.weights.retention = Math.min(0.25, this.weights.retention + 0.01) }
    // Light normalization
    const sum = this.weights.due + this.weights.difficulty + this.weights.retention + this.weights.forecast
    this.weights.due/=sum; this.weights.difficulty/=sum; this.weights.retention/=sum; this.weights.forecast/=sum
    this.lastAdjust = now
  }
}

export const ADAPTIVE_ORCHESTRATOR_TOKEN = 'AdaptiveOrchestratorService'
