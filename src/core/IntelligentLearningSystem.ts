/**
 * Intelligent Learning System - Système d'apprentissage intelligent
 * 
 * Ce système combine l'IA d'apprentissage, la répétition espacée SM-2,
 * l'analyse comportementale et l'adaptation personnalisée pour optimiser l'apprentissage.
 */

export interface LearningProfile {
  userId: string
  learningStyle: LearningStyle
  preferences: LearningPreferences
  performance: PerformanceProfile
  streaks: StreakData
  goals: LearningGoals
  adaptations: AdaptationHistory[]
}

export type LearningStyle = 'visual' | 'auditory' | 'kinesthetic' | 'reading' | 'mixed'

export interface LearningPreferences {
  sessionDuration: number // minutes
  dailyGoal: number // cartes par jour
  difficultyPreference: 'easy' | 'medium' | 'hard' | 'adaptive'
  studyTime: 'morning' | 'afternoon' | 'evening' | 'night' | 'flexible'
  reminderFrequency: number // heures
  audioEnabled: boolean
  animationsEnabled: boolean
  darkMode: boolean
}

export interface PerformanceProfile {
  overallAccuracy: number
  averageResponseTime: number
  strongSubjects: string[]
  weakSubjects: string[]
  improvementRate: number
  retentionRate: number
  consistencyScore: number
  masteryLevel: number
}

export interface StreakData {
  currentStreak: number
  longestStreak: number
  totalSessions: number
  lastSessionDate: number
  streakStartDate: number
  weeklyGoalProgress: number
  monthlyGoalProgress: number
  streakMaintained?: boolean
}

export interface LearningGoals {
  dailyCards: number
  weeklyCards: number
  monthlyCards: number
  accuracyTarget: number
  masteryTarget: number
  customGoals: CustomGoal[]
}

export interface CustomGoal {
  id: string
  title: string
  description: string
  target: number
  current: number
  deadline?: number
  type: 'cards' | 'accuracy' | 'time' | 'streak'
}

export interface AdaptationHistory {
  timestamp: number
  type: AdaptationType
  reason: string
  oldValue: any
  newValue: any
  effectiveness: number // 0-1
}

export type AdaptationType = 
  | 'difficulty'
  | 'interval'
  | 'content'
  | 'presentation'
  | 'timing'
  | 'feedback'

export interface LearningRecommendation {
  type: 'study' | 'review' | 'break' | 'difficulty' | 'content'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  title: string
  description: string
  action: string
  estimatedBenefit: number
  confidence: number
  metadata?: Record<string, any>
}

export interface StudySession {
  id: string
  startTime: number
  endTime?: number
  cards: StudyCard[]
  performance: SessionPerformance
  adaptations: AdaptationHistory[]
  feedback: SessionFeedback
}

export interface StudyCard {
  cardId: string
  deckId: string
  difficulty: number
  easinessFactor: number
  interval: number
  repetition: number
  lastReview: number
  nextReview: number
  responses: CardResponse[]
}

export interface CardResponse {
  timestamp: number
  responseTime: number
  quality: number // 0-5 (SM-2 scale)
  correct: boolean
  confidence: number
  hints: number
  studyMode: 'quiz' | 'speed' | 'matching' | 'writing'
}

export interface SessionPerformance {
  totalCards: number
  correctAnswers: number
  averageResponseTime: number
  averageQuality: number
  difficultiesEncountered: string[]
  timeSpent: number
  streakMaintained: boolean
  goalsAchieved: string[]
}

export interface SessionFeedback {
  overallRating: number
  strengths: string[]
  improvements: string[]
  recommendations: LearningRecommendation[]
  nextSessionSuggestion: number // timestamp
}

import { logger } from '@/utils/logger'
import { eventBus } from '@/core/events/EventBus'

export class IntelligentLearningSystem extends EventTarget {
  private profile: LearningProfile | null = null
  private currentSession: StudySession | null = null
  private recommendations: LearningRecommendation[] = []
  // Batching interne des événements (sauvegardes / cleanup) pour réduire le bruit console
  private _batch = {
    saves: 0,
    cleanups: 0,
    timer: 0 as any,
    lastFlush: Date.now()
  }
  
  private readonly INITIAL_INTERVAL = 1
  // Statistiques internes (non persistées directement) utilisées pour recalculer la performance
  private _counters = { totalReviews: 0, correctReviews: 0 }

  constructor() {
    super()
    // Empêcher double initialisation en dev (StrictMode) via flag statique
    if((IntelligentLearningSystem as any)._initialized){
      return
    }
    ;(IntelligentLearningSystem as any)._initialized = true
    this.initialize()
  }

  /**
   * Initialise le système d'apprentissage
   */
  private async initialize(): Promise<void> {
    console.log('🧠 Initialisation de l\'Intelligent Learning System...')
    
    // Charger ou créer le profil d'apprentissage
    await this.loadOrCreateProfile()
    
    // Analyser les patterns d'apprentissage
    await this.analyzeUserBehavior()
    
    // Générer les recommandations initiales
    await this.generateRecommendations()

    // S'abonner aux événements d'étude (card.reviewed) pour mises à jour en temps réel (Phase 5)
    eventBus.subscribe('card.reviewed', (ev: any) => {
      try { this._onCardReviewed(ev.payload) } catch(e){ /* eslint-disable no-console */ console.warn('ILS card.reviewed handler error', e) }
    })
    
    console.log('✅ Intelligent Learning System initialisé')
  }

  /** Gestion d'un événement card.reviewed pour ajuster le profil et potentiellement régénérer les recommandations */
  private _onCardReviewed(payload: { quality: number }){
    if(!this.profile) return
    this._counters.totalReviews++
    if(payload.quality >= 3) this._counters.correctReviews++
    const acc = this._counters.totalReviews ? (this._counters.correctReviews / this._counters.totalReviews) * 100 : 0
    // Lissage simple EMA pour éviter oscillations extrêmes
    const alpha = 0.3
    this.profile.performance.overallAccuracy = this.profile.performance.overallAccuracy === 0
      ? acc
      : (alpha * acc + (1-alpha) * this.profile.performance.overallAccuracy)
    // Mise à jour rétention approximative (placeholder) : retenir EF moyenne implicite
    this.profile.performance.retentionRate = Math.min(100, Math.max(0, this.profile.performance.overallAccuracy * 0.9))
    // Maîtrise basique : log transform des revues correctes
    this.profile.performance.masteryLevel = Math.round(Math.log10(1 + this._counters.correctReviews) * 25)
    // Sauvegarde batchée
    this.saveProfile()
    // Régénérer toutes les 5 revues pour limiter le coût
    if(this._counters.totalReviews % 5 === 0){
      void this.generateRecommendations()
    }
    // Émettre un event DOM pour UI fine-grain (ex: hooks)
    try { this.dispatchEvent(new CustomEvent('learningProfileUpdated', { detail: { performance: { ...this.profile.performance } } })) } catch {}
  }

  /**
   * Charge ou crée un profil d'apprentissage
   */
  private async loadOrCreateProfile(): Promise<void> {
    // Simuler le chargement depuis le stockage
    const savedProfile = localStorage.getItem('ariba-learning-profile')
    
    if (savedProfile) {
      try {
        this.profile = JSON.parse(savedProfile)
        console.log('📊 Profil d\'apprentissage chargé')
      } catch (error) {
        console.warn('Erreur lors du chargement du profil:', error)
        this.createNewProfile()
      }
    } else {
      this.createNewProfile()
    }
  }

  /**
   * Crée un nouveau profil d'apprentissage
   */
  private createNewProfile(): void {
    this.profile = {
      userId: Math.random().toString(36).substring(2),
      learningStyle: 'mixed',
      preferences: {
        sessionDuration: 20,
        dailyGoal: 50,
        difficultyPreference: 'adaptive',
        studyTime: 'flexible',
        reminderFrequency: 24,
        audioEnabled: true,
        animationsEnabled: true,
        darkMode: false
      },
      performance: {
        overallAccuracy: 0,
        averageResponseTime: 0,
        strongSubjects: [],
        weakSubjects: [],
        improvementRate: 0,
        retentionRate: 0,
        consistencyScore: 0,
        masteryLevel: 0
      },
      streaks: {
        currentStreak: 0,
        longestStreak: 0,
        totalSessions: 0,
        lastSessionDate: 0,
        streakStartDate: Date.now(),
        weeklyGoalProgress: 0,
        monthlyGoalProgress: 0
      },
      goals: {
        dailyCards: 50,
        weeklyCards: 300,
        monthlyCards: 1200,
        accuracyTarget: 85,
        masteryTarget: 70,
        customGoals: []
      },
      adaptations: []
    }

    console.log('👤 Nouveau profil d\'apprentissage créé')
  }

  /**
   * Démarre une nouvelle session d'étude
   */
  public async startStudySession(): Promise<StudySession> {
    if (!this.profile) {
      throw new Error('Profil d\'apprentissage non initialisé')
    }

    this.currentSession = {
      id: Math.random().toString(36).substring(2),
      startTime: Date.now(),
      cards: [],
      performance: {
        totalCards: 0,
        correctAnswers: 0,
        averageResponseTime: 0,
        averageQuality: 0,
        difficultiesEncountered: [],
        timeSpent: 0,
        streakMaintained: false,
        goalsAchieved: []
      },
      adaptations: [],
      feedback: {
        overallRating: 0,
        strengths: [],
        improvements: [],
        recommendations: [],
        nextSessionSuggestion: 0
      }
    }

    console.log('🎯 Session d\'étude démarrée:', this.currentSession.id)
    
    this.dispatchEvent(new CustomEvent('sessionStarted', {
      detail: this.currentSession
    }))

    return this.currentSession
  }

  /**
   * Termine la session d'étude actuelle
   */
  public async endStudySession(): Promise<SessionFeedback> {
    if (!this.currentSession || !this.profile) {
      throw new Error('Aucune session active')
    }

    this.currentSession.endTime = Date.now()
    this.currentSession.performance.timeSpent = 
      this.currentSession.endTime - this.currentSession.startTime

    // Analyser la performance de la session
    await this.analyzeSessionPerformance()
    
    // Mettre à jour le profil d'apprentissage
    this.updateLearningProfile()
    
    // Générer le feedback
    const feedback = await this.generateSessionFeedback()
    this.currentSession.feedback = feedback
    
    // Sauvegarder le profil
    this.saveProfile()
    
    console.log('📈 Session d\'étude terminée avec succès')
    
    this.dispatchEvent(new CustomEvent('sessionEnded', {
      detail: { session: this.currentSession, feedback }
    }))

    this.currentSession = null
    
    return feedback
  }

  /**
   * Traite une réponse à une carte
   */
  public async processCardResponse(
    cardId: string,
    deckId: string,
    response: Omit<CardResponse, 'timestamp'>
  ): Promise<StudyCard> {
    if (!this.currentSession || !this.profile) {
      throw new Error('Aucune session active')
    }

    // Trouver ou créer la carte d'étude
    let studyCard = this.currentSession.cards.find(c => c.cardId === cardId)
    
    if (!studyCard) {
      studyCard = await this.createStudyCard(cardId, deckId)
      this.currentSession.cards.push(studyCard)
    }

    // Ajouter la réponse
    const fullResponse: CardResponse = {
      ...response,
      timestamp: Date.now()
    }
    
    studyCard.responses.push(fullResponse)

    // Calculer les nouveaux paramètres SM-2
    const sm2Result = this.calculateSM2(studyCard, response.quality)
    
    studyCard.easinessFactor = sm2Result.easinessFactor
    studyCard.interval = sm2Result.interval
    studyCard.repetition = sm2Result.repetition
    studyCard.lastReview = Date.now()
    studyCard.nextReview = Date.now() + (sm2Result.interval * 24 * 60 * 60 * 1000)

    // Mettre à jour les statistiques de session
    this.updateSessionStats(fullResponse)

    // Analyser et adapter si nécessaire
    if (this.shouldAdaptDifficulty(studyCard)) {
      await this.adaptCardDifficulty(studyCard)
    }

    console.log(`📝 Réponse traitée pour carte ${cardId}: qualité ${response.quality}`)
    
    this.dispatchEvent(new CustomEvent('cardProcessed', {
      detail: { cardId, studyCard, response: fullResponse }
    }))

    return studyCard
  }

  /**
   * Crée une nouvelle carte d'étude
   */
  private async createStudyCard(cardId: string, deckId: string): Promise<StudyCard> {
    // Charger les données existantes ou initialiser
    return {
      cardId,
      deckId,
      difficulty: 5, // Difficulté moyenne par défaut
      easinessFactor: 2.5, // Valeur initiale SM-2
      interval: this.INITIAL_INTERVAL,
      repetition: 0,
      lastReview: 0,
      nextReview: Date.now(),
      responses: []
    }
  }

  /**
   * Calcule les nouveaux paramètres selon l'algorithme SM-2
   */
  private calculateSM2(
    card: StudyCard, 
    quality: number
  ): { easinessFactor: number; interval: number; repetition: number } {
    // Utilisation de l'implémentation centralisée SM-2
    const { sm2Update } = require('../domain/algorithms/sm2') as typeof import('../domain/algorithms/sm2')
    const updated = sm2Update({
      easinessFactor: card.easinessFactor,
      interval: card.interval,
      repetition: card.repetition,
      lastReview: 0,
      nextReview: 0,
      quality
    })
    return { easinessFactor: updated.easinessFactor, interval: updated.interval, repetition: updated.repetition }
  }

  /**
   * Met à jour les statistiques de session
   */
  private updateSessionStats(response: CardResponse): void {
    if (!this.currentSession) return

    const stats = this.currentSession.performance
    stats.totalCards++
    
    if (response.correct) {
      stats.correctAnswers++
    }

    // Recalcul des moyennes
    const totalResponses = this.currentSession.cards
      .reduce((sum, card) => sum + card.responses.length, 0)
    
    if (totalResponses > 0) {
      const allResponses = this.currentSession.cards
        .flatMap(card => card.responses)
      
      stats.averageResponseTime = allResponses
        .reduce((sum, r) => sum + r.responseTime, 0) / totalResponses
      
      stats.averageQuality = allResponses
        .reduce((sum, r) => sum + r.quality, 0) / totalResponses
    }
  }

  /**
   * Vérifie si la difficulté doit être adaptée
   */
  private shouldAdaptDifficulty(card: StudyCard): boolean {
    if (card.responses.length < 3) return false

    const recentResponses = card.responses.slice(-3)
    const avgQuality = recentResponses.reduce((sum, r) => sum + r.quality, 0) / 3
    const avgTime = recentResponses.reduce((sum, r) => sum + r.responseTime, 0) / 3

    // Adaptation si performance très bonne ou très mauvaise
    return avgQuality <= 2 || avgQuality >= 4.5 || avgTime > 15000 || avgTime < 2000
  }

  /**
   * Adapte la difficulté d'une carte
   */
  private async adaptCardDifficulty(card: StudyCard): Promise<void> {
    if (!this.profile) return

    const recentResponses = card.responses.slice(-3)
    const avgQuality = recentResponses.reduce((sum, r) => sum + r.quality, 0) / 3
    const avgTime = recentResponses.reduce((sum, r) => sum + r.responseTime, 0) / 3
    
    const oldDifficulty = card.difficulty
    let newDifficulty = card.difficulty

    // Logique d'adaptation
    if (avgQuality <= 2) {
      // Trop difficile, réduire
      newDifficulty = Math.max(1, card.difficulty - 1)
    } else if (avgQuality >= 4.5 && avgTime < 5000) {
      // Trop facile, augmenter
      newDifficulty = Math.min(10, card.difficulty + 1)
    }

    if (newDifficulty !== oldDifficulty) {
      card.difficulty = newDifficulty
      
      // Enregistrer l'adaptation
      const adaptation: AdaptationHistory = {
        timestamp: Date.now(),
        type: 'difficulty',
        reason: `Qualité moyenne: ${avgQuality.toFixed(2)}, Temps: ${avgTime.toFixed(0)}ms`,
        oldValue: oldDifficulty,
        newValue: newDifficulty,
        effectiveness: 0 // Sera calculé plus tard
      }

      this.profile.adaptations.push(adaptation)
      this.currentSession?.adaptations.push(adaptation)

      console.log(`🎯 Difficulté adaptée pour carte ${card.cardId}: ${oldDifficulty} → ${newDifficulty}`)
    }
  }

  /**
   * Analyse la performance de la session
   */
  private async analyzeSessionPerformance(): Promise<void> {
    if (!this.currentSession || !this.profile) return

  // Analyse démarrée


    // Analyser la précision
    const accuracy = this.currentSession.performance.totalCards > 0 
      ? (this.currentSession.performance.correctAnswers / this.currentSession.performance.totalCards) * 100 
      : 0

    // Analyser la consistance
    const qualityVariance = this.calculateQualityVariance()
    
    // Analyser les sujets forts/faibles
  // Résultat non utilisé pour le moment (placeholder futur) -> calcul déclenché sans stocker
  void this.analyzeSubjectPerformance()
    
    // Détecter les patterns d'erreur
    const errorPatterns = this.detectErrorPatterns()

    // Mettre à jour les statistiques
  this.currentSession.performance.difficultiesEncountered = errorPatterns
    
    console.log(`📊 Analyse de session: ${accuracy.toFixed(1)}% précision, variance qualité: ${qualityVariance.toFixed(2)}`)

  // Analyse terminée
  }

  /**
   * Calcule la variance de qualité
   */
  private calculateQualityVariance(): number {
    if (!this.currentSession) return 0

    const allQualities = this.currentSession.cards
      .flatMap(card => card.responses.map(r => r.quality))

    if (allQualities.length < 2) return 0

    const mean = allQualities.reduce((sum, q) => sum + q, 0) / allQualities.length
    const variance = allQualities.reduce((sum, q) => sum + Math.pow(q - mean, 2), 0) / allQualities.length

    return variance
  }

  /**
   * Analyse la performance par sujet
   */
  private analyzeSubjectPerformance(): { strong: string[]; weak: string[] } {
    // Implémentation simplifiée - serait étendue avec de vraies données de sujet
    return { strong: [], weak: [] }
  }

  /**
   * Détecte les patterns d'erreur
   */
  private detectErrorPatterns(): string[] {
    if (!this.currentSession) return []

    const patterns: string[] = []
    
    const allResponses = this.currentSession.cards
      .flatMap(card => card.responses)

    // Pattern: Réponses trop rapides
    const fastResponses = allResponses.filter(r => r.responseTime < 1000)
    if (fastResponses.length > allResponses.length * 0.3) {
      patterns.push('responses-too-fast')
    }

    // Pattern: Réponses trop lentes
    const slowResponses = allResponses.filter(r => r.responseTime > 20000)
    if (slowResponses.length > allResponses.length * 0.2) {
      patterns.push('responses-too-slow')
    }

    // Pattern: Qualité incohérente
    const qualityVariance = this.calculateQualityVariance()
    if (qualityVariance > 2) {
      patterns.push('inconsistent-quality')
    }

    return patterns
  }

  /**
   * Met à jour le profil d'apprentissage
   */
  private updateLearningProfile(): void {
    if (!this.currentSession || !this.profile) return


    // Mettre à jour les statistiques globales
    this.profile.performance.overallAccuracy = this.calculateOverallAccuracy()
    this.profile.performance.averageResponseTime = this.calculateOverallResponseTime()
    
    // Mettre à jour les streaks
    this.updateStreaks()
    
    // Mettre à jour les objectifs
    this.updateGoalProgress()

    console.log('📈 Profil d\'apprentissage mis à jour')
  }

  /**
   * Calcule la précision globale
   */
  private calculateOverallAccuracy(): number {
    // Simulation - serait calculé à partir de toutes les sessions historiques
    return this.currentSession ? 
      (this.currentSession.performance.correctAnswers / this.currentSession.performance.totalCards) * 100 
      : 0
  }

  /**
   * Calcule le temps de réponse global moyen
   */
  private calculateOverallResponseTime(): number {
    return this.currentSession?.performance.averageResponseTime || 0
  }

  /**
   * Met à jour les données de streak
   */
  private updateStreaks(): void {
    if (!this.profile) return

    const now = Date.now()
    const lastSession = this.profile.streaks.lastSessionDate
    const oneDayMs = 24 * 60 * 60 * 1000

    // Vérifier si le streak continue
    if (lastSession && (now - lastSession) <= oneDayMs * 1.5) {
      // Dans la fenêtre de tolérance, maintenir le streak
      this.profile.streaks.currentStreak++
      this.profile.streaks.streakMaintained = true
    } else if (!lastSession || (now - lastSession) > oneDayMs * 2) {
      // Trop de temps écoulé, reset du streak
      this.profile.streaks.currentStreak = 1
      this.profile.streaks.streakStartDate = now
    }

    // Mettre à jour le plus long streak
    if (this.profile.streaks.currentStreak > this.profile.streaks.longestStreak) {
      this.profile.streaks.longestStreak = this.profile.streaks.currentStreak
    }

    this.profile.streaks.totalSessions++
    this.profile.streaks.lastSessionDate = now
  }

  /**
   * Met à jour le progrès des objectifs
   */
  private updateGoalProgress(): void {
    if (!this.profile || !this.currentSession) return

    const cardsStudied = this.currentSession.performance.totalCards

    // Mise à jour des objectifs quotidiens/hebdomadaires/mensuels
    // Ici on simule, mais il faudrait gérer les vraies dates et compteurs
    this.profile.streaks.weeklyGoalProgress += cardsStudied
    this.profile.streaks.monthlyGoalProgress += cardsStudied
  }

  /**
   * Génère le feedback de session
   */
  private async generateSessionFeedback(): Promise<SessionFeedback> {
    if (!this.currentSession || !this.profile) {
      throw new Error('Session ou profil manquant')
    }

  const performance = this.currentSession.performance
    
    const accuracy = performance.totalCards > 0 
      ? (performance.correctAnswers / performance.totalCards) * 100 
      : 0

    // Générer les points forts
    const strengths: string[] = []
    if (accuracy >= 90) strengths.push('Excellente précision')
    if (performance.averageResponseTime < 5000) strengths.push('Temps de réponse rapide')
    if (this.profile.streaks.streakMaintained) strengths.push('Streak maintenu')

    // Générer les améliorations
    const improvements: string[] = []
    if (accuracy < 70) improvements.push('Améliorer la précision')
    if (performance.averageResponseTime > 15000) improvements.push('Réduire le temps de réponse')
    if (performance.difficultiesEncountered.includes('inconsistent-quality')) {
      improvements.push('Maintenir une qualité constante')
    }

    // Générer les recommandations
    const recommendations = await this.generateRecommendations()

    // Calculer le rating global
    let overallRating = 3 // Base
    if (accuracy >= 85) overallRating += 1
    if (accuracy >= 95) overallRating += 1
    if (performance.averageResponseTime < 5000) overallRating += 0.5
    if (this.profile.streaks.streakMaintained) overallRating += 0.5
    overallRating = Math.min(5, Math.max(1, overallRating))

    // Suggérer la prochaine session
    const nextSessionSuggestion = this.calculateNextSessionTime()

    return {
      overallRating,
      strengths,
      improvements,
      recommendations: recommendations.slice(0, 3), // Top 3 recommandations
      nextSessionSuggestion
    }
  }

  /**
   * Calcule le moment optimal pour la prochaine session
   */
  private calculateNextSessionTime(): number {
    if (!this.profile) return Date.now() + 24 * 60 * 60 * 1000 // 24h par défaut

    // Basé sur les préférences et la performance
    const preferredHour = this.getPreferredStudyHour()
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(preferredHour, 0, 0, 0)

    return tomorrow.getTime()
  }

  /**
   * Retourne l'heure préférée d'étude
   */
  private getPreferredStudyHour(): number {
    if (!this.profile) return 9 // 9h par défaut

    switch (this.profile.preferences.studyTime) {
      case 'morning': return 8
      case 'afternoon': return 14
      case 'evening': return 18
      case 'night': return 21
      default: return 9
    }
  }

  /**
   * Analyse le comportement utilisateur
   */
  private async analyzeUserBehavior(): Promise<void> {
    if (!this.profile) return

    console.log('🔍 Analyse du comportement utilisateur...')

    // Analyser les patterns temporels
    // Analyser les préférences de difficulté
    // Analyser les styles d'apprentissage
    // Cette méthode serait étendue avec de vraies analyses ML

    console.log('✅ Analyse comportementale terminée')
  }

  /**
   * Génère des recommandations personnalisées
   */
  public async generateRecommendations(): Promise<LearningRecommendation[]> {
    if (!this.profile) return []

    const recommendations: LearningRecommendation[] = []

    // Recommandation basée sur la performance
    if (this.profile.performance.overallAccuracy < 70) {
      recommendations.push({
        type: 'difficulty',
        priority: 'high',
        title: 'Réduire la difficulté',
        description: 'Votre précision est faible. Essayez des cartes plus faciles pour renforcer vos bases.',
        action: 'adjust-difficulty-down',
        estimatedBenefit: 0.8,
        confidence: 0.9
      })
    }

    // Haute précision -> proposer d'augmenter la difficulté / nouveaux contenus
    if (this.profile.performance.overallAccuracy >= 90) {
      recommendations.push({
        type: 'difficulty',
        priority: 'medium',
        title: 'Augmenter la difficulté',
        description: 'Votre précision est élevée. Introduisez des cartes plus complexes pour stimuler la progression.',
        action: 'adjust-difficulty-up',
        estimatedBenefit: 0.7,
        confidence: 0.85
      })
    }

    // Rétention faible -> sessions courtes supplémentaires
    if (this.profile.performance.retentionRate > 0 && this.profile.performance.retentionRate < 60) {
      recommendations.push({
        type: 'review',
        priority: 'high',
        title: 'Renforcer la rétention',
        description: 'Ajoutez 1–2 micro‑sessions (5 min) aujourd\'hui pour consolider les cartes fragiles.',
        action: 'add-micro-session',
        estimatedBenefit: 0.75,
        confidence: 0.75
      })
    }

    // Streak élevé mais précision moyenne -> introduire challenge contrôlé
    if (this.profile.streaks.currentStreak >= 5 && this.profile.performance.overallAccuracy >= 70 && this.profile.performance.overallAccuracy < 90) {
      recommendations.push({
        type: 'study',
        priority: 'medium',
        title: 'Session challenge',
        description: 'Introduisez un lot restreint de cartes plus difficiles pour accélérer la maîtrise.',
        action: 'start-challenge-set',
        estimatedBenefit: 0.65,
        confidence: 0.7
      })
    }

    // Recommandation basée sur les streaks
    if (this.profile.streaks.currentStreak === 0) {
      recommendations.push({
        type: 'study',
        priority: 'medium',
        title: 'Redémarrer votre routine',
        description: 'Commencez une nouvelle série d\'étude pour construire une habitude régulière.',
        action: 'start-streak',
        estimatedBenefit: 0.7,
        confidence: 0.8
      })
    }

    // Recommandation basée sur les objectifs
    const dailyProgress = this.profile.streaks.weeklyGoalProgress / 7
    if (dailyProgress < this.profile.goals.dailyCards * 0.8) {
      recommendations.push({
        type: 'study',
        priority: 'medium',
        title: 'Augmenter le volume d\'étude',
        description: 'Vous êtes en dessous de votre objectif quotidien. Considérez une session supplémentaire.',
        action: 'increase-volume',
        estimatedBenefit: 0.6,
        confidence: 0.7
      })
    }

    // Trier par priorité et bénéfice estimé
    recommendations.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
      if (priorityDiff !== 0) return priorityDiff
      return b.estimatedBenefit - a.estimatedBenefit
    })

    // Dédupliquer par action (garde la première de plus haute priorité déjà triée)
    const seen = new Set<string>()
    const deduped: LearningRecommendation[] = []
    for(const r of recommendations){
      if(!seen.has(r.action)) { seen.add(r.action); deduped.push(r) }
    }

    // Limiter stockage interne (ex: top 10) pour éviter croissance mémoire
    this.recommendations = deduped.slice(0, 10)

    // Émettre un événement pour la couche UI (EventTarget)
    try { this.dispatchEvent(new CustomEvent('recommendations', { detail: this.recommendations })) } catch {}

    return this.recommendations
  }

  /**
   * Sauvegarde le profil d'apprentissage
   */
  private saveProfile(): void {
    if (!this.profile) return

    try {
      localStorage.setItem('ariba-learning-profile', JSON.stringify(this.profile))
  this._recordILSEvent('save')
      // Phase 5: export public (dev tooling) – tentative (ignore si non navigateur ou FS non dispo)
      try {
        // Expose sur window pour scripts externes qui écrivent le fichier côté build step
        ;(globalThis as any).__ARIBA_LAST_PROFILE__ = this.profile
      } catch { /* ignore */ }
    } catch (error) {
  logger.error('ILS','Erreur sauvegarde profil',{ error: (error as any)?.message || error })
    }
  }

  /**
   * Retourne le profil d'apprentissage
   */
  public getLearningProfile(): LearningProfile | null {
    return this.profile ? { ...this.profile } : null
  }

  /**
   * Met à jour les préférences d'apprentissage
   */
  public updatePreferences(preferences: Partial<LearningPreferences>): void {
    if (!this.profile) return

    this.profile.preferences = { ...this.profile.preferences, ...preferences }
    this.saveProfile()

    this.dispatchEvent(new CustomEvent('preferencesUpdated', {
      detail: this.profile.preferences
    }))
  }

  /**
   * Retourne les recommandations actuelles
   */
  public getRecommendations(): LearningRecommendation[] {
    return [...this.recommendations]
  }

  /**
   * Retourne la session actuelle
   */
  public getCurrentSession(): StudySession | null {
    return this.currentSession ? { ...this.currentSession } : null
  }

  /**
   * Nettoie les ressources
   */
  public cleanup(): void {
    // Terminer la session en cours si nécessaire
    if (this.currentSession) {
      this.endStudySession()
    }

    // Sauvegarder le profil final
    this.saveProfile()
    this._recordILSEvent('cleanup', true)
    // Flush immédiat pour que le dernier état soit visible
    this._flushILSEvents()
    // Nettoyage timer si existant
    if(this._batch.timer){
      clearTimeout(this._batch.timer)
      this._batch.timer = 0 as any
    }
  }

  /** Enregistre un évènement interne (save/cleanup) et programme un flush batché */
  private _recordILSEvent(type: 'save' | 'cleanup', forceFlush = false){
    if(type === 'save') this._batch.saves++
    else if(type === 'cleanup') this._batch.cleanups++

    if(forceFlush){
      this._flushILSEvents()
      return
    }
    // Si aucun timer actif on programme un flush (5s) – agrégation des rafales fréquentes
    if(!this._batch.timer){
      this._batch.timer = setTimeout(()=>{
        this._flushILSEvents()
        this._batch.timer = 0 as any
      }, 5000)
    }
    // Si rafale très importante, flush anticipé
    if(this._batch.saves + this._batch.cleanups >= 25){
      this._flushILSEvents()
    }
  }

  /** Émet un log agrégé ILS et réinitialise les compteurs */
  private _flushILSEvents(){
    const { saves, cleanups, lastFlush } = this._batch
    if(!saves && !cleanups) return
    const delta = Date.now() - lastFlush
    logger.info('ILS', 'Batch profil', { saves, cleanups, windowMs: delta })
    this._batch.saves = 0
    this._batch.cleanups = 0
    this._batch.lastFlush = Date.now()
  }
}

// Singleton global simple pour éviter multiples cycles init/cleanup
let __ilsSingleton: IntelligentLearningSystem | null = null
export function getIntelligentLearningSystem(): IntelligentLearningSystem {
  if(!__ilsSingleton){ __ilsSingleton = new IntelligentLearningSystem() }
  return __ilsSingleton
}
