/** Module SM-2 centralisé pour éviter la duplication. */
export interface SM2State { easinessFactor: number; interval: number; repetition: number; lastReview: number; nextReview: number }
export interface SM2UpdateInput extends SM2State { quality: number; now?: number; minEF?: number; maxEF?: number; firstInterval?: number; secondInterval?: number }
export interface SM2Result extends SM2State { quality: number }
export const DEFAULT_SM2_CONSTANTS = { MIN_EF: 1.3, MAX_EF: 2.5, FIRST_INTERVAL: 1, SECOND_INTERVAL: 6 }
export function sm2Update(input: SM2UpdateInput): SM2Result {
  const { easinessFactor, interval, repetition, quality, now = Date.now(), minEF = DEFAULT_SM2_CONSTANTS.MIN_EF, maxEF = DEFAULT_SM2_CONSTANTS.MAX_EF, firstInterval = DEFAULT_SM2_CONSTANTS.FIRST_INTERVAL, secondInterval = DEFAULT_SM2_CONSTANTS.SECOND_INTERVAL } = input
  let newEF = easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  newEF = Math.max(minEF, Math.min(maxEF, newEF))
  let newInterval = interval
  let newRepetition = repetition
  if (quality < 3) { newRepetition = 0; newInterval = firstInterval } else { if (repetition === 0) newInterval = firstInterval; else if (repetition === 1) newInterval = secondInterval; else newInterval = Math.round(interval * newEF); newRepetition = repetition + 1 }
  return { easinessFactor: newEF, interval: newInterval, repetition: newRepetition, lastReview: now, nextReview: now + newInterval * 86400000, quality }
}
export function retentionScore(totalReviews: number, correctReviews: number, ef: number, interval: number): number {
  if (totalReviews === 0) return 0
  const successRate = correctReviews / totalReviews
  const maturityBonus = interval >= 21 ? 0.2 : 0
  const consistency = Math.min(ef / DEFAULT_SM2_CONSTANTS.MAX_EF, 1) * 0.2
  return Math.min(1, successRate * 0.6 + maturityBonus + consistency)
}
