import { DECK_REPOSITORY_TOKEN } from '../domain/repositories/DeckRepository'
import { CARD_REPOSITORY_TOKEN } from '../domain/repositories/CardRepository'
import { STUDY_SESSION_REPOSITORY_TOKEN } from '../domain/repositories/StudySessionRepository'
import { LocalDeckRepository } from '../infrastructure/persistence/LocalDeckRepository'
import { LocalCardRepository } from '../infrastructure/persistence/LocalCardRepository'
import { DexieDeckRepository } from '../infrastructure/persistence/dexie/DexieDeckRepository'
import { DexieCardRepository } from '../infrastructure/persistence/dexie/DexieCardRepository'
import { LocalStudySessionRepository } from '../infrastructure/persistence/LocalStudySessionRepository'
import { DexieStudySessionRepository } from '../infrastructure/persistence/dexie/DexieStudySessionRepository'
import { SPACED_REPETITION_SERVICE_TOKEN, SpacedRepetitionService } from './services/SpacedRepetitionService'
import { DECK_SERVICE_TOKEN, DeckService } from './services/DeckService'
import { CARD_SERVICE_TOKEN, CardService } from './services/CardService'
import { STUDY_SESSION_SERVICE_TOKEN, StudySessionService } from './services/StudySessionService'
import { STATISTICS_SERVICE_TOKEN, StatisticsService } from './services/StatisticsService'
import { THEME_SERVICE_TOKEN, ThemeService } from './services/ThemeService'
import { AGENDA_SCHEDULER_TOKEN, AgendaScheduler } from './services/AgendaScheduler'
import { SEARCH_SERVICE_TOKEN, SearchService } from './services/SearchService'
import { HEATMAP_STATS_SERVICE_TOKEN, HeatmapStatsService } from './services/HeatmapStatsService'
import { MEDIA_REPOSITORY_TOKEN, DexieMediaRepository } from '@/infrastructure/persistence/dexie/DexieMediaRepository'
import { SEARCH_INDEX_SERVICE_TOKEN, SearchIndexService } from './services/SearchIndexService'

class Container { private singletons = new Map<string, any>(); register(token: string, factory: () => any){ this.singletons.set(token, factory()) } resolve<T>(token: string): T { if(!this.singletons.has(token)) throw new Error(`Dépendance non enregistrée: ${token}`); return this.singletons.get(token) } }
export const container = new Container()
function pickDeckRepo(){ try { if (typeof indexedDB !== 'undefined') { return new DexieDeckRepository() } } catch(_) {} return new LocalDeckRepository() }
function pickCardRepo(){ try { if (typeof indexedDB !== 'undefined') { return new DexieCardRepository() } } catch(_) {} return new LocalCardRepository() }
function pickSessionRepo(){ try { if (typeof indexedDB !== 'undefined') { return new DexieStudySessionRepository() } } catch(_) {} return new LocalStudySessionRepository() }
container.register(DECK_REPOSITORY_TOKEN, () => pickDeckRepo())
container.register(CARD_REPOSITORY_TOKEN, () => pickCardRepo())
container.register(STUDY_SESSION_REPOSITORY_TOKEN, () => pickSessionRepo())
container.register(SPACED_REPETITION_SERVICE_TOKEN, () => new SpacedRepetitionService())
container.register(DECK_SERVICE_TOKEN, () => new DeckService())
container.register(CARD_SERVICE_TOKEN, () => new CardService())
container.register(STUDY_SESSION_SERVICE_TOKEN, () => new StudySessionService(
	container.resolve(SPACED_REPETITION_SERVICE_TOKEN),
	container.resolve(CARD_REPOSITORY_TOKEN),
	container.resolve(STUDY_SESSION_REPOSITORY_TOKEN)
))
container.register(STATISTICS_SERVICE_TOKEN, () => new StatisticsService(container.resolve(CARD_REPOSITORY_TOKEN), container.resolve(DECK_REPOSITORY_TOKEN), container.resolve(STUDY_SESSION_REPOSITORY_TOKEN)))
container.register(THEME_SERVICE_TOKEN, () => new ThemeService())
container.register(AGENDA_SCHEDULER_TOKEN, () => new AgendaScheduler())
container.register(SEARCH_SERVICE_TOKEN, () => new SearchService(container.resolve(CARD_REPOSITORY_TOKEN)))
container.register(HEATMAP_STATS_SERVICE_TOKEN, () => new HeatmapStatsService(container.resolve(STUDY_SESSION_REPOSITORY_TOKEN)))
container.register(MEDIA_REPOSITORY_TOKEN, () => new DexieMediaRepository())
container.register(SEARCH_INDEX_SERVICE_TOKEN, () => new SearchIndexService())
