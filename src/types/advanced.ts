/**
 * 🎯 TYPES AVANCÉS POUR CARDS
 * 
 * Types TypeScript stricts pour améliorer la détection d'erreurs
 * et la sécurité du code, optimisés pour le débogage.
 */

// Types de base stricts
export type UUID = string & { readonly brand: unique symbol }
export type Timestamp = number & { readonly brand: unique symbol }
export type NonEmptyString = string & { readonly brand: unique symbol }

// Types de résultats avec gestion d'erreurs
export type Result<T, E = Error> = 
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: E }

export type AsyncResult<T, E = Error> = Promise<Result<T, E>>

// Types de performance et monitoring
export interface PerformanceMetrics {
  readonly startTime: Timestamp
  readonly endTime?: Timestamp
  readonly duration?: number
  readonly memoryUsage?: {
    readonly used: number
    readonly total: number
    readonly percentage: number
  }
  readonly fps?: number
  readonly renderTime?: number
}

export interface ComponentPerformance {
  readonly componentName: string
  readonly renderCount: number
  readonly avgRenderTime: number
  readonly lastRenderTime: Timestamp
  readonly memoryLeaks: boolean
}

// Types pour les événements et actions
export interface AppEvent<T = any> {
  readonly type: string
  readonly timestamp: Timestamp
  readonly data: T
  readonly source: string
  readonly userId?: UUID
  readonly sessionId: UUID
}

export interface UserAction extends AppEvent {
  readonly action: 'click' | 'keyboard' | 'gesture' | 'navigation'
  readonly target: string
  readonly coordinates?: { x: number; y: number }
}

// Types pour les erreurs structurées
export interface AppError {
  readonly id: UUID
  readonly type: ErrorType
  readonly message: string
  readonly severity: ErrorSeverity
  readonly timestamp: Timestamp
  readonly stack?: string
  readonly context?: Record<string, any>
  readonly recoverable: boolean
  readonly userId?: UUID
  readonly sessionId: UUID
}

export enum ErrorType {
  VALIDATION = 'validation',
  NETWORK = 'network',
  STORAGE = 'storage',
  PERFORMANCE = 'performance',
  AUTHENTICATION = 'authentication',
  PERMISSION = 'permission',
  BUSINESS_LOGIC = 'business_logic',
  SYSTEM = 'system',
  UNKNOWN = 'unknown'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Types pour les cartes avec validation stricte
export interface StrictCard {
  readonly id: UUID
  readonly frontText: NonEmptyString
  readonly backText: NonEmptyString
  readonly deckId: UUID
  readonly createdAt: Timestamp
  readonly updatedAt: Timestamp
  readonly difficulty: DifficultyLevel
  readonly tags: readonly string[]
  readonly metadata: Readonly<{
    studyCount: number
    correctCount: number
    lastStudied?: Timestamp
    averageResponseTime: number
    sm2Data: SM2Algorithm
  }>
}

export interface DifficultyLevel {
  readonly level: 1 | 2 | 3 | 4 | 5
  readonly description: string
  readonly color: string
}

export interface SM2Algorithm {
  readonly easinessFactor: number
  readonly interval: number
  readonly repetitions: number
  readonly nextReviewDate: Timestamp
}

// Types pour les decks avec validation
export interface StrictDeck {
  readonly id: UUID
  readonly name: NonEmptyString
  readonly description: string
  readonly color: string
  readonly icon: string
  readonly createdAt: Timestamp
  readonly updatedAt: Timestamp
  readonly isPublic: boolean
  readonly tags: readonly string[]
  readonly cardCount: number
  readonly metadata: Readonly<{
    studySessionCount: number
    totalStudyTime: number
    averageScore: number
    lastStudied?: Timestamp
    difficulty: DifficultyLevel
  }>
}

// Types pour les sessions d'étude
export interface StudySession {
  readonly id: UUID
  readonly deckId: UUID
  readonly userId?: UUID
  readonly startTime: Timestamp
  readonly endTime?: Timestamp
  readonly mode: StudyMode
  readonly cards: readonly StudyCard[]
  readonly performance: StudyPerformance
  readonly settings: StudySettings
}

export interface StudyCard {
  readonly cardId: UUID
  readonly shown: boolean
  readonly correct?: boolean
  readonly responseTime?: number
  readonly difficulty?: DifficultyLevel
  readonly timestamp: Timestamp
}

export interface StudyPerformance {
  readonly totalCards: number
  readonly correctAnswers: number
  readonly incorrectAnswers: number
  readonly skippedCards: number
  readonly averageResponseTime: number
  readonly accuracy: number
  readonly score: number
}

export interface StudySettings {
  readonly shuffleCards: boolean
  readonly showHints: boolean
  readonly timeLimit?: number
  readonly maxCards?: number
  readonly difficultyFilter?: DifficultyLevel
}

export enum StudyMode {
  CLASSIC = 'classic',
  QUIZ = 'quiz',
  SPEED = 'speed',
  MATCHING = 'matching',
  WRITING = 'writing'
}

// Types pour les stores avec état strict
export interface AppSettings {
  readonly theme: 'light' | 'dark' | 'system'
  readonly language: string
  readonly studyReminders: boolean
  readonly soundEnabled: boolean
  readonly animationsEnabled: boolean
  readonly performanceMode: 'high' | 'balanced' | 'power_saving'
  readonly autoSave: boolean
  readonly backupEnabled: boolean
  readonly debugMode: boolean
}

export interface AppState {
  readonly cards: StrictCard[]
  readonly decks: StrictDeck[]
  readonly currentSession?: StudySession
  readonly user: UserProfile
  readonly settings: AppSettings
  readonly ui: UIState
  readonly performance: PerformanceState
}

export interface UserProfile {
  readonly id?: UUID
  readonly name?: string
  readonly preferences: UserPreferences
  readonly statistics: UserStatistics
  readonly createdAt: Timestamp
}

export interface UserPreferences {
  readonly theme: 'light' | 'dark' | 'system'
  readonly language: string
  readonly studyReminders: boolean
  readonly soundEnabled: boolean
  readonly animationsEnabled: boolean
  readonly performanceMode: 'high' | 'balanced' | 'power_saving'
}

export interface UserStatistics {
  readonly totalStudyTime: number
  readonly totalCards: number
  readonly totalDecks: number
  readonly averageAccuracy: number
  readonly streak: number
  readonly level: number
  readonly experience: number
}

export interface UIState {
  readonly isLoading: boolean
  readonly currentPage: string
  readonly modal?: ModalState
  readonly toast?: ToastState
  readonly sidebar: SidebarState
}

export interface ModalState {
  readonly isOpen: boolean
  readonly type: string
  readonly data?: any
}

export interface ToastState {
  readonly id: UUID
  readonly type: 'success' | 'error' | 'warning' | 'info'
  readonly message: string
  readonly duration?: number
  readonly timestamp: Timestamp
}

export interface SidebarState {
  readonly isOpen: boolean
  readonly width: number
}

export interface PerformanceState {
  readonly fps: number
  readonly memoryUsage: number
  readonly renderTime: number
  readonly networkLatency: number
  readonly storagePerformance: number
}

// Types pour les API et networking
export interface APIResponse<T = any> {
  readonly success: boolean
  readonly data?: T
  readonly error?: APIError
  readonly metadata: {
    readonly timestamp: Timestamp
    readonly requestId: UUID
    readonly version: string
  }
}

export interface APIError {
  readonly code: string
  readonly message: string
  readonly details?: Record<string, any>
  readonly retryable: boolean
}

// Types pour la validation
export interface ValidationResult {
  readonly isValid: boolean
  readonly errors: ValidationError[]
  readonly warnings: ValidationWarning[]
}

export interface ValidationError {
  readonly field: string
  readonly message: string
  readonly code: string
  readonly value?: any
}

export interface ValidationWarning {
  readonly field: string
  readonly message: string
  readonly suggestion?: string
}

// Guards de type pour la sécurité
export function isUUID(value: any): value is UUID {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

export function isNonEmptyString(value: any): value is NonEmptyString {
  return typeof value === 'string' && value.trim().length > 0
}

export function isTimestamp(value: any): value is Timestamp {
  return typeof value === 'number' && value > 0 && Number.isInteger(value)
}

export function isResult<T>(value: any): value is Result<T> {
  return typeof value === 'object' && 
         value !== null && 
         typeof value.success === 'boolean' &&
         (value.success ? 'data' in value : 'error' in value)
}

// Helpers pour créer des types stricts
export function createUUID(): UUID {
  return crypto.randomUUID() as UUID
}

export function createTimestamp(): Timestamp {
  return Date.now() as Timestamp
}

export function createNonEmptyString(value: string): NonEmptyString | null {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed as NonEmptyString : null
}

export function createSuccess<T>(data: T): Result<T> {
  return { success: true, data }
}

export function createError<E = Error>(error: E): Result<never, E> {
  return { success: false, error }
}

// Types pour les hooks React avec état strict
export interface UseAsyncState<T> {
  readonly data: T | null
  readonly loading: boolean
  readonly error: Error | null
  readonly lastUpdated?: Timestamp
}

export interface UsePerformanceHook {
  readonly fps: number
  readonly memoryUsage: number
  readonly renderCount: number
  readonly isOptimized: boolean
  readonly recommendations: string[]
}

// Export des constantes de développement
export const DEV_CONSTANTS = {
  MAX_CARDS_PER_DECK: 10000,
  MAX_DECK_NAME_LENGTH: 100,
  MAX_CARD_TEXT_LENGTH: 2000,
  MIN_STUDY_SESSION_DURATION: 10000, // 10 seconds
  PERFORMANCE_FPS_TARGET: 120,
  MEMORY_WARNING_THRESHOLD: 100 * 1024 * 1024, // 100MB
} as const

export type DevConstants = typeof DEV_CONSTANTS
