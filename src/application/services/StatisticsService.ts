import type { CardRepository } from '../../domain/repositories/CardRepository'
import type { DeckRepository } from '../../domain/repositories/DeckRepository'
import type { StudySessionRepository } from '../../domain/repositories/StudySessionRepository'

export interface GlobalStatsSnapshot { 
  totalDecks: number; 
  totalCards: number; 
  matureCards: number; 
  averageRetention: number; 
  dueToday: number; 
  totalSessions: number; 
  currentStreak: number; 
  avgSessionAccuracy: number;
  // Nouveaux KPI
  newCardsToday: number; // cartes jamais revues créées aujourd'hui
  reviewsToday: number; // nombre de reviews effectuées aujourd'hui
  accuracy: number; // précision globale (correctReviews / totalReviews agrégé)
  dueTomorrow: number; // cartes qui seront dues demain
}

export class StatisticsService {
  private cardRepo: CardRepository
  private deckRepo: DeckRepository
  private sessionRepo: StudySessionRepository
  constructor(cardRepo: CardRepository, deckRepo: DeckRepository, sessionRepo: StudySessionRepository) {
    this.cardRepo = cardRepo
    this.deckRepo = deckRepo
    this.sessionRepo = sessionRepo
  }
  private computeStreak(sessions: { startTime: number }[]): number {
    if(!sessions.length) return 0
    // unique day strings
    const byDay = new Map<string, boolean>()
    sessions.forEach(s => { byDay.set(new Date(s.startTime).toDateString(), true) })
    let streak = 0
    for(let i=0;i<60;i++){ // look back up to 60 days
      const d = new Date(); d.setDate(d.getDate()-i)
      if(byDay.has(d.toDateString())) streak++
      else if(i>0) break
    }
    return streak
  }
  async snapshot(): Promise<GlobalStatsSnapshot> {
    const [cards, decks, sessions] = await Promise.all([
      this.cardRepo.getAll(),
      this.deckRepo.getAll(),
      this.sessionRepo.getRecent(200) // enough for streak + average
    ])
    const now = Date.now()
    const startOfToday = new Date(); startOfToday.setHours(0,0,0,0)
    const startOfTomorrow = new Date(startOfToday.getTime() + 24*60*60*1000)
    const endOfTomorrow = new Date(startOfTomorrow.getTime() + 24*60*60*1000)

    // Accumulateurs en une seule passe
    let matureCards = 0
    let retentionSum = 0
    let dueToday = 0
    let dueTomorrow = 0
    let newCardsToday = 0
    let reviewsToday = 0
    let totalCorrect = 0
    let totalReviewsGlobal = 0
    for(const c of cards){
      if(c.interval >= 21) matureCards++
      if(c.totalReviews) retentionSum += c.correctReviews / c.totalReviews
      if(c.nextReview <= now) dueToday++
      else if(c.nextReview <= endOfTomorrow.getTime()) dueTomorrow++
      if(c.created >= startOfToday.getTime() && c.totalReviews === 0) newCardsToday++
      if(c.lastReview >= startOfToday.getTime()) reviewsToday++
      totalCorrect += c.correctReviews
      totalReviewsGlobal += c.totalReviews
    }
    const averageRetention = cards.length ? retentionSum / cards.length : 0
    const totalSessions = sessions.length
    let avgSessionAccuracy = 0
    if(totalSessions){
      avgSessionAccuracy = sessions.reduce((s, ses: any) => s + (ses.cardsStudied ? ses.correctAnswers / ses.cardsStudied : 0), 0) / totalSessions
    }
    const accuracy = totalReviewsGlobal ? totalCorrect / totalReviewsGlobal : 0
    const currentStreak = this.computeStreak(sessions as any)
    return { 
      totalDecks: decks.length, totalCards: cards.length, matureCards, averageRetention, dueToday,
      totalSessions, currentStreak, avgSessionAccuracy,
      newCardsToday, reviewsToday, accuracy, dueTomorrow
    }
  }
}
export const STATISTICS_SERVICE_TOKEN = 'StatisticsService'
