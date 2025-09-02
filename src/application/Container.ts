import { DECK_REPOSITORY_TOKEN } from '../domain/repositories/DeckRepository'
import { CARD_REPOSITORY_TOKEN } from '../domain/repositories/CardRepository'
import { STUDY_SESSION_REPOSITORY_TOKEN } from '../domain/repositories/StudySessionRepository'
import { LocalDeckRepository } from '../infrastructure/persistence/LocalDeckRepository'
import { LocalCardRepository } from '../infrastructure/persistence/LocalCardRepository'
import { DexieDeckRepository } from '../infrastructure/persistence/dexie/DexieDeckRepository'
import { DexieCardRepository } from '../infrastructure/persistence/dexie/DexieCardRepository'
import { LocalStudySessionRepository } from '../infrastructure/persistence/LocalStudySessionRepository'
import { DexieStudySessionRepository } from '../infrastructure/persistence/dexie/DexieStudySessionRepository'
import { SpacedRepetitionService } from './services/SpacedRepetitionService'
import { DeckService } from './services/DeckService'
import { CardService } from './services/CardService'
import { StudySessionService } from './services/StudySessionService'
import { StatisticsService } from './services/StatisticsService'
import { ThemeService } from './services/ThemeService'
import { AgendaScheduler } from './services/AgendaScheduler'
import { SearchService } from './services/SearchService'
import { HeatmapStatsService } from './services/HeatmapStatsService'
import { MEDIA_REPOSITORY_TOKEN, DexieMediaRepository } from '@/infrastructure/persistence/dexie/DexieMediaRepository'
import { SearchIndexService } from './services/SearchIndexService'
import { LearningForecastService } from './services/LearningForecastService'
import { InsightService } from './services/InsightService'
import { AdaptiveOrchestratorService } from './services/AdaptiveOrchestratorService'

class Container {
	private instances = new Map<string, any>()
	private factories = new Map<string, () => any>()
	private initialized = false
	register(token: string, factory: () => any){ this.factories.set(token, factory) }
	private instantiate(token: string){
		const f = this.factories.get(token)
		if(!f) throw new Error(`Factory manquante: ${token}`)
		const inst = f()
		this.instances.set(token, inst)
		return inst
	}
	ensureInit(){ if(!this.initialized){ registerAll(); this.initialized = true } }
	resolve<T>(token: string): T {
		this.ensureInit()
		if(this.instances.has(token)) return this.instances.get(token)
		if(!this.factories.has(token)) throw new Error(`Dépendance non enregistrée: ${token}`)
		return this.instantiate(token)
	}
	safeResolve<T>(token: string): T | null {
		try { return this.resolve<T>(token) } catch { return null }
	}
}
export const container = new Container()
function pickDeckRepo(){ try { if (typeof indexedDB !== 'undefined') { return new DexieDeckRepository() } } catch(_) {} return new LocalDeckRepository() }
function pickCardRepo(){ try { if (typeof indexedDB !== 'undefined') { return new DexieCardRepository() } } catch(_) {} return new LocalCardRepository() }
function pickSessionRepo(){ try { if (typeof indexedDB !== 'undefined') { return new DexieStudySessionRepository() } } catch(_) {} return new LocalStudySessionRepository() }
// Enregistrement lazy pour éviter ReferenceError (TDZ) si cycle d'import
function registerAll(){
	container.register(DECK_REPOSITORY_TOKEN, () => pickDeckRepo())
	container.register(CARD_REPOSITORY_TOKEN, () => pickCardRepo())
	container.register(STUDY_SESSION_REPOSITORY_TOKEN, () => pickSessionRepo())
	container.register('SpacedRepetitionService', () => new SpacedRepetitionService())
	container.register('LearningForecastService', () => new LearningForecastService(container.resolve(CARD_REPOSITORY_TOKEN)))
	container.register('InsightService', () => new InsightService(
		() => container.resolve(CARD_REPOSITORY_TOKEN),
		() => container.resolve(STUDY_SESSION_REPOSITORY_TOKEN)
	))
	container.register('AdaptiveOrchestratorService', () => new AdaptiveOrchestratorService(
		container.resolve('LearningForecastService'),
		container.resolve('InsightService')
	))
	container.register('StudySessionService', () => new StudySessionService(
		container.resolve('SpacedRepetitionService'),
		container.resolve(CARD_REPOSITORY_TOKEN),
		container.resolve(STUDY_SESSION_REPOSITORY_TOKEN),
		container.resolve('AdaptiveOrchestratorService')
	))
	container.register('DeckService', () => new DeckService(
		container.resolve(DECK_REPOSITORY_TOKEN),
		container.resolve(CARD_REPOSITORY_TOKEN)
	))
	container.register('CardService', () => new CardService(
		container.resolve(CARD_REPOSITORY_TOKEN)
	))
	container.register('StatisticsService', () => new StatisticsService(container.resolve(CARD_REPOSITORY_TOKEN), container.resolve(DECK_REPOSITORY_TOKEN), container.resolve(STUDY_SESSION_REPOSITORY_TOKEN)))
	container.register('ThemeService', () => new ThemeService())
	container.register('AgendaScheduler', () => new AgendaScheduler(
		container.resolve(CARD_REPOSITORY_TOKEN)
	))
	container.register('SearchService', () => new SearchService(container.resolve(CARD_REPOSITORY_TOKEN)))
	container.register('HeatmapStatsService', () => new HeatmapStatsService(container.resolve(STUDY_SESSION_REPOSITORY_TOKEN)))
	container.register(MEDIA_REPOSITORY_TOKEN, () => new DexieMediaRepository())
	container.register('SearchIndexService', () => new SearchIndexService(
		container.resolve(CARD_REPOSITORY_TOKEN)
	))
}
