/**
 * Interface Repository pour les Sessions d'étude
 */
import type { StudySession } from '../entities/StudySession'

export interface StudySessionRepository {
  getRecent(limit?: number): Promise<StudySession[]>
  getByDeck(deckId: string): Promise<StudySession[]>
  create(session: StudySession): Promise<void>
  update(session: StudySession): Promise<void>
  clear(): Promise<void>
}

export const STUDY_SESSION_REPOSITORY_TOKEN = 'StudySessionRepository'
