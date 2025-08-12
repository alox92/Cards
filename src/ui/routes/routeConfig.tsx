import type { RouteCategory } from '@/ui/design/tokens'

// Phase 1: centralisation métadonnées routes (navigation, regroupement, future analytics / A/B).

export interface AppRouteMeta {
  id: string
  path: string
  label: string
  icon: string
  category: RouteCategory
  element: React.ComponentType<any>
  legacy?: boolean
  order?: number
}

import HomePage from '@/ui/pages/HomePageOptimized'
import DecksPage from '@/ui/pages/DecksPage'
import StudyPage from '@/ui/pages/StudyPage'
import StudyServiceDeckPage from '@/ui/pages/StudyServiceDeckPage'
import CardEditorPage from '@/ui/pages/CardEditorPage'
import StatsPage from '@/ui/pages/StatsPage'
import AdvancedStatsPage from '@/ui/pages/AdvancedStatsPage'
import MediaArchivePage from '@/ui/pages/MediaArchivePage'
import AgendaPage from '@/ui/pages/AgendaPage'
import SettingsPage from '@/ui/pages/SettingsPage'
import { TipsPage } from '@/ui/pages/TipsPage'
import DebugTestPage from '@/ui/pages/DebugTestPage'
import StudyHubPage from '@/ui/pages/hubs/StudyHubPage'
import StudyWorkspace from '@/features/study/workspace/StudyWorkspace'
import AnalyticsWorkspace from '@/ui/features/analytics/AnalyticsWorkspace'

export const appRoutes: AppRouteMeta[] = [
  { id:'home', path:'/', label:'Accueil', icon:'🏠', category:'organize', element: HomePage, order:0 },
  { id:'study-hub', path:'/study-hub', label:'Hub', icon:'🎯', category:'learn', element: StudyHubPage, order:-1 },
  { id:'study-workspace', path:'/workspace/study', label:'Workspace', icon:'🧠', category:'learn', element: StudyWorkspace, order:-2 },
  { id:'analytics-workspace', path:'/workspace/analytics', label:'Analytics', icon:'📊', category:'analyze', element: AnalyticsWorkspace, order:2 },
  { id:'decks', path:'/decks', label:'Paquets', icon:'📚', category:'organize', element: DecksPage, order:1 },
  { id:'study-service', path:'/study-service', label:'Étude', icon:'⚡', category:'learn', element: StudyServiceDeckPage, order:0 },
  { id:'study', path:'/study', label:'Étude (legacy)', icon:'🗂️', category:'learn', element: StudyPage, legacy:true, order:1 },
  { id:'card-editor', path:'/card-editor/:deckId', label:'Nouvelle carte', icon:'✍️', category:'create', element: CardEditorPage, order:0 },
  { id:'stats', path:'/stats', label:'Statistiques', icon:'📊', category:'analyze', element: StatsPage, order:0 },
  { id:'advanced-stats', path:'/advanced-stats', label:'Avancées', icon:'📈', category:'analyze', element: AdvancedStatsPage, order:1 },
  { id:'media-archive', path:'/media-archive', label:'Médias', icon:'🗄️', category:'organize', element: MediaArchivePage, order:2 },
  { id:'agenda', path:'/agenda', label:'Agenda', icon:'🗓️', category:'organize', element: AgendaPage, order:3 },
  { id:'tips', path:'/tips', label:'Conseils IA', icon:'💡', category:'learn', element: TipsPage, order:2 },
  { id:'debug-test', path:'/debug-test', label:'Debug', icon:'🧪', category:'system', element: DebugTestPage, order:9 },
  { id:'settings', path:'/settings', label:'Paramètres', icon:'⚙️', category:'system', element: SettingsPage, order:10 }
]

export const groupedRoutes = ((): Record<string, AppRouteMeta[]> => {
  return appRoutes.reduce((acc, r) => {
    acc[r.category] = acc[r.category] || []
    acc[r.category].push(r)
    acc[r.category].sort((a,b)=> (a.order??0)-(b.order??0))
    return acc
  }, {} as Record<string, AppRouteMeta[]>)
})()

export const primaryNavigationOrder: RouteCategory[] = ['learn','organize','create','analyze','system']
