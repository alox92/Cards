import type { StudySession } from '../../domain/entities/StudySession'
import { type StudySessionRepository } from '../../domain/repositories/StudySessionRepository'
const STORAGE_KEY = 'ariba-sessions'
export class LocalStudySessionRepository implements StudySessionRepository {
  private load(): StudySession[] { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') }
  private persist(s: StudySession[]): void { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) }
  async getRecent(limit = 50): Promise<StudySession[]> { return this.load().slice(0, limit) }
  async getByDeck(deckId: string): Promise<StudySession[]> { return this.load().filter(s => s.deckId === deckId) }
  async create(session: StudySession): Promise<void> { const all = this.load(); all.unshift(session); this.persist(all.slice(0,100)) }
  async update(session: StudySession): Promise<void> { const all = this.load(); const i = all.findIndex(s => s.id === session.id); if (i>=0){ all[i]=session; this.persist(all) } }
  async clear(): Promise<void> { this.persist([]) }
}
