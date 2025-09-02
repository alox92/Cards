import type { CardEntity } from '@/domain/entities/Card'

export interface AdaptiveScoreInput {
  now: number
  targetDeck: string
  recencyWeight?: number
  difficultyWeight?: number
  retentionWeight?: number
}

export interface ScoredCard { card: CardEntity; score: number; factors: { due: number; difficulty: number; retention: number } }

/**
 * Phase 5 – Scoring adaptatif des cartes pour prioriser la file d'étude.
 * Combine:
 *  - due factor (proximité nextReview)
 *  - difficulty factor (cartes encore peu maîtrisées: faibles totalReviews / EF modérée)
 *  - retention factor (interval court ou révision récente ratée)
 */
export class AdaptiveStudyScorer {
  scoreCards(cards: CardEntity[], input: AdaptiveScoreInput): ScoredCard[] {
    const { now, recencyWeight = 0.5, difficultyWeight = 0.3, retentionWeight = 0.2 } = input
    // Pré‑calcul bornes
    const intervals = cards.map(c=> c.interval || 0)
    const maxInterval = Math.max(...intervals, 1)
    return cards.map(c => {
      const dueIn = Math.max(0, (c.nextReview||now) - now)
      // due factor: cartes en retard ou imminentes -> proche de 1
      const dueFactor = 1 - Math.min(1, dueIn / (1000*60*60*24*7)) // clamp 7 jours
      // difficulty factor: inverse du nombre de reviews pondéré par EF
      const reviews = c.totalReviews || 0
      const ef = (c as any).easinessFactor || 2.5
      const difficultyFactor = Math.min(1, (1 / Math.max(1, reviews)) * (ef < 2.4 ? 1.0 : 0.7))
      // retention factor: intervalles courts ou faibles -> besoin consolidation
      const intervalDays = (c.interval || 0)
      const retentionFactor = 1 - Math.min(1, intervalDays / Math.max(1, maxInterval))
      const score = dueFactor*recencyWeight + difficultyFactor*difficultyWeight + retentionFactor*retentionWeight
      return { card: c, score, factors: { due: dueFactor, difficulty: difficultyFactor, retention: retentionFactor } }
    }).sort((a,b)=> b.score - a.score)
  }
}

export const adaptiveStudyScorer = new AdaptiveStudyScorer()
