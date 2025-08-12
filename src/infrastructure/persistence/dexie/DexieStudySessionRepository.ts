import { aribaDB } from './AribaDB'
import type { StudySessionRepository } from '@/domain/repositories/StudySessionRepository'
import type { StudySession } from '@/domain/entities/StudySession'

/**
 * Repository Dexie pour les sessions d'étude
 */
export class DexieStudySessionRepository implements StudySessionRepository {
  private migrated = false
  private async migrateFromLocalIfNeeded(){
    if (this.migrated) return
    this.migrated = true
    try {
      const raw = localStorage.getItem('ariba-study-store')
      if (!raw) return
      const parsed = JSON.parse(raw)
      const sessions: StudySession[] | undefined = parsed?.state?.recentSessions || parsed?.recentSessions
      if (sessions && sessions.length){
        const existing = await aribaDB.sessions.count()
        if (existing === 0){
          await aribaDB.sessions.bulkPut(sessions)
          // Optionnel: ne pas supprimer tout de suite; pourrait servir de backup
          console.log(`🔄 Migration sessions => Dexie: ${sessions.length} sessions migrées`)
        }
      }
    } catch(e){
      console.warn('Migration sessions vers Dexie échouée', e)
    }
  }
  async getRecent(limit: number = 50): Promise<StudySession[]> {
    await this.migrateFromLocalIfNeeded()
    return (await aribaDB.sessions.orderBy('startTime').reverse().limit(limit).toArray())
  }
  async getByDeck(deckId: string): Promise<StudySession[]> {
    await this.migrateFromLocalIfNeeded()
    return aribaDB.sessions.where('deckId').equals(deckId).sortBy('startTime')
  }
  async create(session: StudySession): Promise<void> {
    await this.migrateFromLocalIfNeeded()
    await aribaDB.sessions.put(session)
  }
  async update(session: StudySession): Promise<void> {
    await this.migrateFromLocalIfNeeded()
    await aribaDB.sessions.put(session)
  }
  async clear(): Promise<void> {
    await this.migrateFromLocalIfNeeded()
    await aribaDB.sessions.clear()
  }
}
export const DEXIE_STUDY_SESSION_REPO_TOKEN = 'DexieStudySessionRepository'
