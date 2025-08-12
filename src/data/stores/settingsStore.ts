import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Settings {
  theme: 'light' | 'dark' | 'system'
  language: string
  studyReminders: boolean
  dailyGoal: number
  soundEnabled: boolean
  animationsEnabled: boolean
  autoPlayAudio: boolean
  showProgress: boolean
  difficultyAlgorithm: 'sm2' | 'basic'
  defaultDeckCategory: string
  gamificationEnabled?: boolean
  gamificationCompact?: boolean
  /* === Nouveaux paramètres UI avancés === */
  uiScale?: number            // facteur de zoom global (1 par défaut)
  accentColor?: string        // couleur d'accent personnalisée
  fontFamily?: string         // famille de police UI
  highContrast?: boolean      // mode contraste élevé
  enable3D?: boolean          // activer effets 3D
  cardFlipSpeedMs?: number    // vitesse flip carte
  card3DDepth?: number        // profondeur perspective
  showStudyTimer?: boolean    // afficher timer session
  studyShortcuts?: boolean    // raccourcis clavier étude
  reducedMotionOverride?: boolean // forcer réduction animations
  themePreset?: string            // nom du preset de thème (solarized, nord...)
  fontWeight?: number             // poids typographique principal (100-900)
}

interface SettingsStore {
  settings: Settings
  loadSettings: () => Promise<void>
  updateSettings: (newSettings: Partial<Settings>) => void
  resetSettings: () => void
  isLoading: boolean
  error: string | null
}

const defaultSettings: Settings = {
  theme: 'system',
  language: 'fr',
  studyReminders: true,
  dailyGoal: 20,
  soundEnabled: true,
  animationsEnabled: true,
  autoPlayAudio: false,
  showProgress: true,
  difficultyAlgorithm: 'sm2',
  defaultDeckCategory: 'Général',
  gamificationEnabled: true,
  gamificationCompact: false,
  uiScale: 1,
  accentColor: '#3b82f6',
  fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
  highContrast: false,
  enable3D: true,
  cardFlipSpeedMs: 500,
  card3DDepth: 1000,
  showStudyTimer: true,
  studyShortcuts: true,
  reducedMotionOverride: false
  ,themePreset: undefined
  ,fontWeight: 400
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      isLoading: false,
      error: null,

      loadSettings: async () => {
        set({ isLoading: true, error: null })
        try {
          // Dans cette version, les paramètres sont gérés par Zustand persist
          // Plus tard, on pourra charger depuis IndexedDB si nécessaire
          set({ isLoading: false })
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Erreur de chargement des paramètres',
            isLoading: false 
          })
        }
      },

      updateSettings: (newSettings: Partial<Settings>) => {
        const currentSettings = get().settings
        set({ 
          settings: { ...currentSettings, ...newSettings },
          error: null 
        })
      },

      resetSettings: () => {
        set({ 
          settings: defaultSettings,
          error: null 
        })
      }
    }),
    {
      name: 'ariba-settings',
      version: 2,
      migrate: (persistedState: any) => {
        // Ajouter les nouvelles clés si absentes
        if (!persistedState.settings) return persistedState
        if (persistedState.settings.gamificationEnabled === undefined) {
          persistedState.settings.gamificationEnabled = true
        }
        if (persistedState.settings.gamificationCompact === undefined) {
          persistedState.settings.gamificationCompact = false
        }
  const s = persistedState.settings
  if (s.uiScale === undefined) s.uiScale = 1
  if (s.accentColor === undefined) s.accentColor = '#3b82f6'
  if (s.fontFamily === undefined) s.fontFamily = defaultSettings.fontFamily
  if (s.highContrast === undefined) s.highContrast = false
  if (s.enable3D === undefined) s.enable3D = true
  if (s.cardFlipSpeedMs === undefined) s.cardFlipSpeedMs = 500
  if (s.card3DDepth === undefined) s.card3DDepth = 1000
  if (s.showStudyTimer === undefined) s.showStudyTimer = true
  if (s.studyShortcuts === undefined) s.studyShortcuts = true
  if (s.reducedMotionOverride === undefined) s.reducedMotionOverride = false
  if (s.themePreset === undefined) s.themePreset = undefined
  if (s.fontWeight === undefined) s.fontWeight = 400
        return persistedState
      }
    }
  )
)
