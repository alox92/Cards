/**
 * Entité Card - Représente une carte flash individuelle
 */

import { sm2Update, retentionScore } from '../algorithms/sm2'

export interface Card {
  id: string
  deckId: string
  frontText: string
  backText: string
  frontImage?: string
  backImage?: string
  // NOTE: frontImage/backImage peuvent contenir soit un DataURL legacy, soit un id de media (IndexedDB). mediaRefs liste toutes les références persistées.
  frontAudio?: string
  backAudio?: string
  // Liens multi-cartes / multi-decks
  relatedCardIds?: string[]
  relatedDeckIds?: string[]
  // Références média persistées (IndexedDB) { id, type, key }
  mediaRefs?: Array<{ id: string; type: 'image' | 'audio' | 'pdf'; key: string }>
  tags: string[]
  difficulty: number // 1-5
  created: number
  updated: number
  
  // Données SM-2 pour la répétition espacée
  easinessFactor: number
  interval: number
  repetition: number
  lastReview: number
  nextReview: number
  quality: number // Dernière qualité de réponse (0-5)
  
  // Statistiques
  totalReviews: number
  correctReviews: number
  averageResponseTime: number
  // Organisation & favoris
  sortIndex?: number
  favorite?: boolean
  
  // Métadonnées
  metadata?: Record<string, any>
  cardType?: 'basic' | 'cloze' | 'occlusion' | 'diagram'
  clozeMap?: Array<{ index: number; original: string }>
  occlusionRegions?: Array<{ id: string; x: number; y: number; width: number; height: number; label?: string }>
  occlusionRegionsBack?: Array<{ id: string; x: number; y: number; width: number; height: number; label?: string }>
}

export interface CardCreationData {
  frontText: string
  backText: string
  frontImage?: string
  backImage?: string
  frontAudio?: string
  backAudio?: string
  tags?: string[]
  difficulty?: number
  relatedCardIds?: string[]
  relatedDeckIds?: string[]
  // Extension champs avancés (facultatifs lors de la création)
  cardType?: 'basic' | 'cloze' | 'occlusion' | 'diagram'
  clozeMap?: Array<{ index: number; original: string }>
  occlusionRegions?: Array<{ id: string; x: number; y: number; width: number; height: number; label?: string }>
  occlusionRegionsBack?: Array<{ id: string; x: number; y: number; width: number; height: number; label?: string }>
  favorite?: boolean
}

export interface CardStats {
  cardId: string
  successRate: number
  averageTime: number
  totalAttempts: number
  lastAttempt: number
  isMatured: boolean
  retentionScore: number
}

export class CardEntity implements Card {
  id: string
  deckId: string
  frontText: string
  backText: string
  frontImage?: string
  backImage?: string
  frontAudio?: string
  backAudio?: string
  relatedCardIds?: string[]
  relatedDeckIds?: string[]
  mediaRefs?: Array<{ id: string; type: 'image' | 'audio' | 'pdf'; key: string }>
  tags: string[]
  difficulty: number
  created: number
  updated: number
  
  // SM-2 Algorithm data
  easinessFactor: number
  interval: number
  repetition: number
  lastReview: number
  nextReview: number
  quality: number
  
  // Statistics
  totalReviews: number
  correctReviews: number
  averageResponseTime: number
  sortIndex?: number
  favorite?: boolean
  
  metadata?: Record<string, any>
  cardType?: 'basic' | 'cloze' | 'occlusion' | 'diagram'
  clozeMap?: Array<{ index: number; original: string }>
  occlusionRegions?: Array<{ id: string; x: number; y: number; width: number; height: number; label?: string }>
  occlusionRegionsBack?: Array<{ id: string; x: number; y: number; width: number; height: number; label?: string }>

  constructor(data: CardCreationData & { id?: string; deckId: string }) {
    this.id = data.id || this.generateId()
    this.deckId = data.deckId
    this.frontText = data.frontText
    this.backText = data.backText
    this.frontImage = data.frontImage
    this.backImage = data.backImage
    this.frontAudio = data.frontAudio
    this.backAudio = data.backAudio
    this.tags = data.tags || []
  this.relatedCardIds = data.relatedCardIds || []
  this.relatedDeckIds = data.relatedDeckIds || []
  this.mediaRefs = []
    this.difficulty = data.difficulty || 3
    this.created = Date.now()
    this.updated = Date.now()
    
    // Initialiser les données SM-2
    this.easinessFactor = 2.5
    this.interval = 1
    this.repetition = 0
    this.lastReview = 0
    this.nextReview = Date.now()
    this.quality = 0
    
    // Initialiser les statistiques
    this.totalReviews = 0
    this.correctReviews = 0
    this.averageResponseTime = 0
  // Organisation / favoris
  this.sortIndex = Date.now()
  this.favorite = data.favorite ?? false
  this.cardType = data.cardType || 'basic'
  this.clozeMap = data.clozeMap || []
  this.occlusionRegions = data.occlusionRegions || []
  this.occlusionRegionsBack = (data as any).occlusionRegionsBack || []
  }

  /**
   * Génère un ID unique pour la carte
   */
  private generateId(): string {
    return `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Met à jour la carte avec de nouvelles données
   */
  update(updates: Partial<CardCreationData>): void {
    if (updates.frontText !== undefined) this.frontText = updates.frontText
    if (updates.backText !== undefined) this.backText = updates.backText
    if (updates.frontImage !== undefined) this.frontImage = updates.frontImage
    if (updates.backImage !== undefined) this.backImage = updates.backImage
    if (updates.frontAudio !== undefined) this.frontAudio = updates.frontAudio
    if (updates.backAudio !== undefined) this.backAudio = updates.backAudio
    if (updates.tags !== undefined) this.tags = updates.tags
    if (updates.difficulty !== undefined) this.difficulty = updates.difficulty
    
    this.updated = Date.now()
  }

  /**
   * Enregistre une réponse et met à jour les données SM-2
   */
  recordResponse(quality: number, responseTime: number): void {
    this.totalReviews++
    this.lastReview = Date.now()
    this.quality = quality
    
    if (quality >= 3) {
      this.correctReviews++
    }
    
    // Mettre à jour le temps de réponse moyen
    this.averageResponseTime = (
      (this.averageResponseTime * (this.totalReviews - 1) + responseTime) / 
      this.totalReviews
    )
    
    // Calculer les nouveaux intervalles SM-2
    this.updateSM2Data(quality)
    
    this.updated = Date.now()
  }

  /**
   * Met à jour les données SM-2 selon l'algorithme
   */
  private updateSM2Data(quality: number): void {
  const updated = sm2Update({
      easinessFactor: this.easinessFactor,
      interval: this.interval,
      repetition: this.repetition,
      lastReview: this.lastReview,
      nextReview: this.nextReview,
      quality
    })
    this.easinessFactor = updated.easinessFactor
    this.interval = updated.interval
    this.repetition = updated.repetition
    this.lastReview = updated.lastReview
    this.nextReview = updated.nextReview
  }

  /**
   * Calcule le taux de réussite
   */
  getSuccessRate(): number {
    return this.totalReviews > 0 ? this.correctReviews / this.totalReviews : 0
  }

  /**
   * Vérifie si la carte est due pour révision
   */
  isDue(): boolean {
    return Date.now() >= this.nextReview
  }

  /**
   * Vérifie si la carte est mature (>= 21 jours d'intervalle)
   */
  isMature(): boolean {
    return this.interval >= 21
  }

  /**
   * Calcule le score de rétention basé sur l'algorithme SM-2
   */
  getRetentionScore(): number {
  return retentionScore(this.totalReviews, this.correctReviews, this.easinessFactor, this.interval)
  }

  /**
   * Obtient les statistiques de la carte
   */
  getStats(): CardStats {
    return {
      cardId: this.id,
      successRate: this.getSuccessRate(),
      averageTime: this.averageResponseTime,
      totalAttempts: this.totalReviews,
      lastAttempt: this.lastReview,
      isMatured: this.isMature(),
      retentionScore: this.getRetentionScore()
    }
  }

  /**
   * Clone la carte
   */
  clone(): CardEntity {
    const cloned = new CardEntity({
      frontText: this.frontText,
      backText: this.backText,
      frontImage: this.frontImage,
      backImage: this.backImage,
      frontAudio: this.frontAudio,
      backAudio: this.backAudio,
      tags: [...this.tags],
      difficulty: this.difficulty,
      deckId: this.deckId
    })
    
    // Copier toutes les propriétés
    Object.assign(cloned, this)
    cloned.id = this.generateId() // Nouveau ID pour le clone
    
    return cloned
  }

  /**
   * Sérialise la carte en JSON
   */
  toJSON(): Record<string, any> {
  const { id, deckId, frontText, backText, frontImage, backImage, frontAudio, backAudio, tags, difficulty, created, updated, easinessFactor, interval, repetition, lastReview, nextReview, quality, totalReviews, correctReviews, averageResponseTime, metadata, relatedCardIds, relatedDeckIds, mediaRefs, cardType, clozeMap, occlusionRegions, occlusionRegionsBack } = this
  return { id, deckId, frontText, backText, frontImage, backImage, frontAudio, backAudio, tags, difficulty, created, updated, easinessFactor, interval, repetition, lastReview, nextReview, quality, totalReviews, correctReviews, averageResponseTime, metadata, relatedCardIds, relatedDeckIds, mediaRefs, cardType, clozeMap, occlusionRegions, occlusionRegionsBack }
  }

  /**
   * Crée une carte depuis des données JSON
   */
  static fromJSON(json: any): CardEntity {
  const c = new CardEntity({ frontText: json.frontText, backText: json.backText, deckId: json.deckId, id: json.id, tags: json.tags, difficulty: json.difficulty, cardType: json.cardType, clozeMap: json.clozeMap, occlusionRegions: json.occlusionRegions, occlusionRegionsBack: json.occlusionRegionsBack })
    Object.assign(c, json)
    // Fallback migration: champs manquants (anciennes versions)
    if(!c.cardType) c.cardType = 'basic'
    if(!Array.isArray(c.clozeMap)) c.clozeMap = []
  if(!Array.isArray(c.occlusionRegions)) c.occlusionRegions = []
  if(!Array.isArray((c as any).occlusionRegionsBack)) (c as any).occlusionRegionsBack = []
  if(!Array.isArray(c.mediaRefs)) c.mediaRefs = []
  // Migration: si frontImage/backImage sont DataURLs mais pas de mediaRefs, ils seront convertis lors d'une future opération de normalisation
    return c
  }
}
