/**
 * Memory Manager - Système de gestion intelligente de la mémoire
 * 
 * Ce système optimise l'utilisation de la mémoire avec un cache intelligent,
 * un préchargement adaptatif et une gestion avancée du cycle de vie des objets.
 */

export interface CacheEntry<T = unknown> {
  key: string
  data: T
  timestamp: number
  accessCount: number
  lastAccessed: number
  size: number
  priority: CachePriority
  expiresAt?: number
  metadata?: Record<string, unknown>
}

export type CachePriority = 'low' | 'normal' | 'high' | 'critical'
import { globalEventBus } from './eventBus'
import { logger } from '@/utils/logger'

export interface CacheStats {
  totalEntries: number
  totalSize: number
  hitRate: number
  totalHits: number
  totalMisses: number
  evictionCount: number
  memoryUsage: number
  oldestEntry: number
  newestEntry: number
}

export interface MemoryConfig {
  maxCacheSize: number // En MB
  maxEntries: number
  defaultTTL: number // En ms
  cleanupInterval: number // En ms
  compressionThreshold: number // En bytes
  preloadEnabled: boolean
  adaptiveEnabled: boolean
}

export interface PreloadPattern {
  id: string
  pattern: RegExp | string
  priority: number
  condition?: () => boolean
  prefetchCount: number
  metadata?: Record<string, unknown>
}

export interface MemoryProfile {
  used: number
  allocated: number
  limit: number
  fragmentation: number
  gcCount: number
  cacheEfficiency: number
}

export class MemoryManager extends EventTarget {
  private cache = new Map<string, CacheEntry>()
  private compressionWorker: Worker | null = null
  private preloadPatterns = new Map<string, PreloadPattern>()
  private accessLog: Array<{ key: string; timestamp: number }> = []
  
  private stats: CacheStats = {
    totalEntries: 0,
    totalSize: 0,
    hitRate: 0,
    totalHits: 0,
    totalMisses: 0,
    evictionCount: 0,
    memoryUsage: 0,
    oldestEntry: 0,
    newestEntry: 0
  }

  private config: MemoryConfig = {
    maxCacheSize: 50, // 50MB par défaut
    maxEntries: 1000,
    defaultTTL: 30 * 60 * 1000, // 30 minutes
    cleanupInterval: 5 * 60 * 1000, // 5 minutes
    compressionThreshold: 1024 * 10, // 10KB
    preloadEnabled: true,
    adaptiveEnabled: true
  }

  private cleanupTimer: number | null = null
  private monitoringTimer: number | null = null
  private visibilityHandler: (() => void) | null = null
  private isInitialized = false
  private objectPool = new Map<string, unknown[]>()

  constructor(config?: Partial<MemoryConfig>) {
    super()
    
    if (config) {
      this.config = { ...this.config, ...config }
    }
    
    this.initialize()
  ;(globalThis as unknown as Record<string, unknown>).memoryManagerInstance = this
  }

  /**
   * Initialise le Memory Manager
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized) return

    logger.info('MemoryManager', 'Initialisation')

    // Démarrer le nettoyage automatique
    this.startPeriodicCleanup()

    // Initialiser le worker de compression
    await this.initializeCompressionWorker()

    // Configurer les patterns de preload par défaut
    this.setupDefaultPreloadPatterns()

    // Écouter les changements de visibilité de la page
    this.setupVisibilityHandlers()

    // Monitorer l'utilisation mémoire
    this.startMemoryMonitoring()

    this.isInitialized = true
    logger.info('MemoryManager', 'Initialisé avec succès')
  }

  /**
   * Initialise le worker de compression
   */
  private async initializeCompressionWorker(): Promise<void> {
    try {
      const workerCode = `
        // Simulation de compression simple
        function compress(data) {
          const str = JSON.stringify(data)
          // En réalité, on utiliserait un vrai algorithme de compression
          return { compressed: str, originalSize: str.length, compressedSize: str.length * 0.7 }
        }
        
        function decompress(compressed) {
          return JSON.parse(compressed.compressed)
        }
        
        self.onmessage = function(e) {
          const { id, action, data } = e.data
          
          try {
            if (action === 'compress') {
              const result = compress(data)
              self.postMessage({ id, action: 'compressed', result })
            } else if (action === 'decompress') {
              const result = decompress(data)
              self.postMessage({ id, action: 'decompressed', result })
            }
          } catch (error) {
            self.postMessage({ id, action: 'error', error: error.message })
          }
        }
      `

      const blob = new Blob([workerCode], { type: 'application/javascript' })
      this.compressionWorker = new Worker(URL.createObjectURL(blob))
      
      this.compressionWorker.onmessage = (e) => {
        this.handleCompressionResult(e.data)
      }
      
    } catch (error) {
      logger.warn('MemoryManager', 'Worker de compression non disponible', { error })
    }
  }

  /**
   * Configure les patterns de preload par défaut
   */
  private setupDefaultPreloadPatterns(): void {
    // Pattern pour les images
    this.addPreloadPattern({
      id: 'images',
      pattern: /\.(jpg|jpeg|png|webp|svg)$/i,
      priority: 2,
      prefetchCount: 5
    })

    // Pattern pour les données JSON
    this.addPreloadPattern({
      id: 'data',
      pattern: /\/api\/.*\.json$/i,
      priority: 3,
      prefetchCount: 3
    })

    // Pattern pour les composants
    this.addPreloadPattern({
      id: 'components',
      pattern: /\/components\/.*\.tsx?$/i,
      priority: 1,
      prefetchCount: 2
    })
  }

  /**
   * Configure les gestionnaires de visibilité
   */
  private setupVisibilityHandlers(): void {
    this.visibilityHandler = () => {
      if (document.hidden) {
        // Page cachée, nettoyer agressivement
        this.performAggressiveCleanup()
      } else {
        // Page visible, relancer le preload
        this.resumePreloading()
      }
    }
    document.addEventListener('visibilitychange', this.visibilityHandler)
  }

  /**
   * Démarre le monitoring mémoire
   */
  private startMemoryMonitoring(): void {
    this.monitoringTimer = window.setInterval(() => {
      this.updateMemoryStats()
      this.adaptCacheSize()
      this.triggerGCIfNeeded()
    }, 10000) // Toutes les 10 secondes
  }

  /**
   * Met en cache une valeur
   */
  public set<T>(
    key: string, 
    data: T, 
    options: {
      priority?: CachePriority
      ttl?: number
      compress?: boolean
      metadata?: Record<string, unknown>
    } = {}
  ): Promise<boolean> {
    return new Promise(async (resolve) => {
      try {
        const now = Date.now()
        const size = this.calculateSize(data)
        
        // Vérifier l'espace disponible
        if (!this.hasSpace(size)) {
          await this.makeSpace(size)
        }

        const entry: CacheEntry<T> = {
          key,
          data,
          timestamp: now,
          accessCount: 0,
          lastAccessed: now,
          size,
          priority: options.priority || 'normal',
          expiresAt: options.ttl ? now + options.ttl : now + this.config.defaultTTL,
          metadata: options.metadata
        }

        // Compresser si nécessaire
        if (options.compress && size > this.config.compressionThreshold) {
          await this.compressEntry(entry)
        }

        this.cache.set(key, entry)
        this.updateStats()
        
  this.dispatchEvent(new CustomEvent('cached', { detail: { key, size, compressed: options.compress } }))
  globalEventBus.emit('cache', { action: 'cached', key })
        // (Phase 2) Future: globalEventBus.emit('cache', { action: 'cached', key })

        resolve(true)
        
      } catch (error) {
        logger.error('MemoryManager', 'Erreur mise en cache', { key, error })
        resolve(false)
      }
    })
  }

  /**
   * Récupère une valeur du cache
   */
  public get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      this.stats.totalMisses++
      this.updateHitRate()
      return null
    }

    // Vérifier l'expiration
    const now = Date.now()
    if (entry.expiresAt && now > entry.expiresAt) {
      this.delete(key)
      this.stats.totalMisses++
      this.updateHitRate()
      return null
    }

    // Mettre à jour les statistiques d'accès
    entry.accessCount++
    entry.lastAccessed = now
    this.stats.totalHits++
    this.updateHitRate()

    // Enregistrer l'accès pour l'analyse
    this.recordAccess(key)

      // Décompresser si nécessaire
      if (entry.metadata?.compressed) {
        return this.decompressData(entry.data as { compressed: string }) as T
      }    return entry.data as T
  }

  /**
   * Supprime une entrée du cache
   */
  public delete(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    this.cache.delete(key)
    this.updateStats()
    
  this.dispatchEvent(new CustomEvent('evicted', { detail: { key, reason: 'manual' } }))
  globalEventBus.emit('cache', { action: 'evicted', key })

    return true
  }

  /**
   * Vide complètement le cache
   */
  public clear(): void {
    const oldSize = this.cache.size
    this.cache.clear()
    this.stats.evictionCount += oldSize
    this.updateStats()
    
  this.dispatchEvent(new CustomEvent('cleared', { detail: { entriesRemoved: oldSize } }))
  globalEventBus.emit('cache', { action: 'cleared' })
  }

  /**
   * Vérifie si une clé existe
   */
  public has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    // Vérifier l'expiration
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.delete(key)
      return false
    }

    return true
  }

  /**
   * Précharge des données basées sur les patterns
   */
  public async preload(keys: string[]): Promise<void> {
    if (!this.config.preloadEnabled) return

    logger.info('MemoryManager', 'Préchargement', { count: keys.length })

    const preloadPromises = keys.map(async (key) => {
      if (this.has(key)) return // Déjà en cache

      // Vérifier les patterns
      const matchingPattern = this.findMatchingPattern(key)
      if (!matchingPattern) return

      try {
        // Simuler le chargement des données
        const data = await this.loadData(key)
        await this.set(key, data, { 
          priority: 'low',
          metadata: { preloaded: true, pattern: matchingPattern.id }
        })
      } catch (error) {
        logger.warn('MemoryManager', 'Erreur préchargement', { key, error })
      }
    })

    await Promise.allSettled(preloadPromises)
  }

  /**
   * Trouve un pattern correspondant
   */
  private findMatchingPattern(key: string): PreloadPattern | null {
    for (const pattern of this.preloadPatterns.values()) {
      if (pattern.condition && !pattern.condition()) continue

      const regex = typeof pattern.pattern === 'string' 
        ? new RegExp(pattern.pattern) 
        : pattern.pattern

      if (regex.test(key)) {
        return pattern
      }
    }
    return null
  }

  /**
   * Charge des données (à implémenter selon l'usage)
   */
  private async loadData(key: string): Promise<unknown> {
    // Simulation - sera remplacé par le vrai système de chargement
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ key, data: `Données pour ${key}`, timestamp: Date.now() })
      }, Math.random() * 100)
    })
  }

  /**
   * Ajoute un pattern de preload
   */
  public addPreloadPattern(pattern: PreloadPattern): void {
    this.preloadPatterns.set(pattern.id, pattern)
  }

  /**
   * Supprime un pattern de preload
   */
  public removePreloadPattern(id: string): void {
    this.preloadPatterns.delete(id)
  }

  /**
   * Calcule la taille approximative d'un objet
   */
  private calculateSize(data: unknown): number {
    try {
      const json = JSON.stringify(data)
      return new Blob([json]).size
    } catch {
      // Estimation approximative pour les objets non sérialisables
      return 1024 // 1KB par défaut
    }
  }

  /**
   * Vérifie s'il y a assez d'espace
   */
  private hasSpace(requiredSize: number): boolean {
    const currentSize = this.stats.totalSize
    const maxSize = this.config.maxCacheSize * 1024 * 1024 // Convertir en bytes
    
    return (currentSize + requiredSize <= maxSize) && 
           (this.cache.size < this.config.maxEntries)
  }

  /**
   * Libère de l'espace en évictant des entrées
   */
  private async makeSpace(requiredSize: number): Promise<void> {
    logger.debug('MemoryManager', 'Libération espace', { requiredSize })

    // Stratégie LRU avec priorité
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => {
        // Trier par priorité d'abord, puis par dernière accès
        const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 }
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
        
        if (priorityDiff !== 0) return priorityDiff
        return a.lastAccessed - b.lastAccessed
      })

    let freedSpace = 0
    let removedCount = 0

    for (const [key, entry] of entries) {
      if (freedSpace >= requiredSize && removedCount >= 10) break

      // Ne pas supprimer les entrées critiques
      if (entry.priority === 'critical') continue

      this.cache.delete(key)
      freedSpace += entry.size
      removedCount++
      this.stats.evictionCount++

      this.dispatchEvent(new CustomEvent('evicted', {
        detail: { key, reason: 'space', size: entry.size }
      }))
    }

    this.updateStats()
    logger.debug('MemoryManager', 'Espace libéré', { freedSpace, removedCount })
  }

  /**
   * Compresse une entrée
   */
  private async compressEntry(entry: CacheEntry): Promise<void> {
    if (!this.compressionWorker) return

    return new Promise((resolve) => {
      const id = Math.random().toString(36)
      
      const handler = (e: MessageEvent) => {
        if (e.data.id === id) {
          this.compressionWorker?.removeEventListener('message', handler)
          
          if (e.data.action === 'compressed') {
            entry.data = e.data.result
            entry.metadata = { 
              ...entry.metadata, 
              compressed: true,
              originalSize: e.data.result.originalSize
            }
            entry.size = e.data.result.compressedSize
          }
          
          resolve()
        }
      }

      this.compressionWorker?.addEventListener('message', handler)
      this.compressionWorker?.postMessage({
        id,
        action: 'compress',
        data: entry.data
      })
    })
  }

  /**
   * Décompresse des données
   */
  private decompressData(compressedData: { compressed: string }): unknown {
    // Synchrone pour la simplicité, mais pourrait être async
    try {
      return JSON.parse(compressedData.compressed)
    } catch {
      return compressedData
    }
  }

  /**
   * Gère les résultats de compression
   */
  private handleCompressionResult(_result: unknown): void {
    // Traité dans compressEntry pour l'instant
  }

  /**
   * Démarre le nettoyage périodique
   */
  private startPeriodicCleanup(): void {
    this.cleanupTimer = window.setInterval(() => {
      this.performCleanup()
    }, this.config.cleanupInterval)
  }

  /**
   * Effectue un nettoyage du cache
   */
  private performCleanup(): void {
    const now = Date.now()
    const expiredKeys: string[] = []

    // Identifier les entrées expirées
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        expiredKeys.push(key)
      }
    }

    // Supprimer les entrées expirées
    expiredKeys.forEach(key => {
      this.cache.delete(key)
      this.stats.evictionCount++
    })

    if (expiredKeys.length > 0) {
      this.updateStats()
      logger.debug('MemoryManager', 'Nettoyage périodique', { expiredKeys: expiredKeys.length })
    }
  }

  /**
   * Effectue un nettoyage agressif
   */
  private performAggressiveCleanup(): void {
    logger.debug('MemoryManager', 'Nettoyage agressif démarré')

    let removedCount = 0
    const entries = Array.from(this.cache.entries())

    for (const [key, entry] of entries) {
      // Supprimer les entrées low priority et préchargées
      if (entry.priority === 'low' || entry.metadata?.preloaded) {
        this.cache.delete(key)
        removedCount++
        this.stats.evictionCount++
      }
    }

    this.updateStats()
    logger.debug('MemoryManager', 'Nettoyage agressif terminé', { removedCount })
  }

  /**
   * Reprend le préchargement
   */
  private resumePreloading(): void {
    if (!this.config.preloadEnabled) return
    
    logger.debug('MemoryManager', 'Reprise préchargement')
    
    // Analyser les patterns d'accès récents
    const recentAccesses = this.accessLog
      .filter(log => Date.now() - log.timestamp < 60000) // Dernière minute
      .map(log => log.key)

    // Prédire les prochains accès et précharger
    this.predictAndPreload(recentAccesses)
  }

  /**
   * Prédit et précharge les prochains accès
   */
  private async predictAndPreload(recentKeys: string[]): Promise<void> {
    // Algorithme simple de prédiction basé sur les patterns
    const predictions = new Set<string>()

    for (const key of recentKeys) {
      const pattern = this.findMatchingPattern(key)
      if (pattern) {
        // Générer des clés similaires à précharger
        for (let i = 1; i <= pattern.prefetchCount; i++) {
          const predictedKey = this.generatePredictedKey(key, i)
          predictions.add(predictedKey)
        }
      }
    }

    if (predictions.size > 0) {
      await this.preload(Array.from(predictions))
    }
  }

  /**
   * Génère une clé prédite
   */
  private generatePredictedKey(baseKey: string, index: number): string {
    // Stratégie simple: incrémenter les numéros dans la clé
  return baseKey.replace(/(\d+)/, (_m, num) => {
      return (parseInt(num) + index).toString()
    }) || `${baseKey}-${index}`
  }

  /**
   * Enregistre un accès pour l'analyse
   */
  private recordAccess(key: string): void {
    this.accessLog.push({ key, timestamp: Date.now() })
    
    // Garder seulement les 1000 derniers accès
    if (this.accessLog.length > 1000) {
      this.accessLog = this.accessLog.slice(-1000)
    }
  }

  /**
   * Met à jour les statistiques
   */
  private updateStats(): void {
    this.stats.totalEntries = this.cache.size
    this.stats.totalSize = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.size, 0)

    const timestamps = Array.from(this.cache.values()).map(e => e.timestamp)
    this.stats.oldestEntry = Math.min(...timestamps) || 0
    this.stats.newestEntry = Math.max(...timestamps) || 0

    this.updateMemoryStats()
  }

  /**
   * Met à jour le taux de hit
   */
  private updateHitRate(): void {
    const total = this.stats.totalHits + this.stats.totalMisses
    this.stats.hitRate = total > 0 ? (this.stats.totalHits / total) * 100 : 0
  }

  /** Accès externe lecture seule aux stats cache (Phase 4) */
  public getCacheStats(): CacheStats { return { ...this.stats } }

  /**
   * Met à jour les statistiques mémoire
   */
  private updateMemoryStats(): void {
    if ('memory' in performance) {
      const memory = (performance as unknown as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory
      if (memory) this.stats.memoryUsage = memory.usedJSHeapSize
    }
  }

  /**
   * Adapte la taille du cache selon l'utilisation
   */
  private adaptCacheSize(): void {
    if (!this.config.adaptiveEnabled) return

    const memoryPressure = this.getMemoryPressure()
    
    if (memoryPressure > 0.8) {
      // Réduire la taille du cache
      this.config.maxCacheSize = Math.max(10, this.config.maxCacheSize * 0.8)
      this.performAggressiveCleanup()
    } else if (memoryPressure < 0.4 && this.stats.hitRate > 90) {
      // Augmenter la taille du cache
      this.config.maxCacheSize = Math.min(100, this.config.maxCacheSize * 1.1)
    }
  }

  /**
   * Calcule la pression mémoire
   */
  private getMemoryPressure(): number {
    if ('memory' in performance) {
      const memory = (performance as unknown as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory
      if (memory) return memory.usedJSHeapSize / memory.jsHeapSizeLimit
    }
    return 0.5 // Valeur par défaut
  }

  /**
   * Déclenche le GC si nécessaire
   */
  private triggerGCIfNeeded(): void {
    const pressure = this.getMemoryPressure()
    
    if (pressure > 0.9 && 'gc' in window && typeof (window as unknown as { gc?: () => void }).gc === 'function') {
      logger.warn('Memory', 'Forçage GC manuel (pression critique)', { pressure })
      ;(window as unknown as { gc: () => void }).gc()
    }
  }

  /**
   * Retourne les statistiques du cache
   */
  public getStats(): CacheStats {
    return { ...this.stats }
  }

  /**
   * Retourne la configuration
   */
  public getConfig(): MemoryConfig {
    return { ...this.config }
  }

  /**
   * Met à jour la configuration
   */
  public setConfig(config: Partial<MemoryConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Retourne le profil mémoire
   */
  public getMemoryProfile(): MemoryProfile {
    const memory = 'memory' in performance ? (performance as unknown as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory : null
    
    return {
      used: memory?.usedJSHeapSize || 0,
      allocated: memory?.totalJSHeapSize || 0,
      limit: memory?.jsHeapSizeLimit || 0,
      fragmentation: this.calculateFragmentation(),
      gcCount: 0, // Non disponible via les APIs standard
      cacheEfficiency: this.stats.hitRate
    }
  }

  /**
   * Calcule la fragmentation approximative
   */
  private calculateFragmentation(): number {
    // Estimation simple basée sur la différence entre alloué et utilisé
    const memory = 'memory' in performance ? (performance as unknown as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory : null
    if (!memory) return 0

    const fragmentation = (memory.totalJSHeapSize - memory.usedJSHeapSize) / memory.totalJSHeapSize
    return Math.max(0, Math.min(1, fragmentation)) * 100
  }

  /**
   * Nettoie les ressources
   */
  public cleanup(): void {
    // Arrêter le nettoyage périodique
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }

    // Arrêter le monitoring mémoire
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer)
      this.monitoringTimer = null
    }

    // Retirer l'event listener de visibilité
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler)
      this.visibilityHandler = null
    }

    // Terminer le worker de compression
    if (this.compressionWorker) {
      this.compressionWorker.terminate()
      this.compressionWorker = null
    }

    // Vider le cache
    this.clear()

    // Nettoyer les références
    this.objectPool.clear()
    this.accessLog = []
    this.preloadPatterns.clear()

    logger.info('MemoryManager', 'Ressources nettoyées')
  }
}
