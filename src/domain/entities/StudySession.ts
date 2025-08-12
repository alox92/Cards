/**
 * Domain entities & types for Study Sessions (extraits du legacy studyStore)
 */
export interface SessionPerformance {
  accuracy: number
  speed: number
  consistency: number
  improvement: number
  streak: number
}

export type StudyMode = 'quiz' | 'speed' | 'matching' | 'writing'

export interface StudySession {
  id: string
  deckId: string
  startTime: number
  endTime?: number
  cardsStudied: number
  correctAnswers: number
  totalTimeSpent: number
  averageResponseTime: number
  studyMode: StudyMode
  performance: SessionPerformance
}

export interface StudyStats {
  totalSessions: number
  totalTimeSpent: number
  totalCardsStudied: number
  averageAccuracy: number
  currentStreak: number
  longestStreak: number
  studyDays: number
  lastStudyDate: number
}
