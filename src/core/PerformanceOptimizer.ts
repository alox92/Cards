/**
 * Performance Optimizer - Système de monitoring et optimisation temps réel
 * 
 * Ce système surveille en permanence les performances de l'application
 * et applique des optimisations automatiques pour maintenir une UX fluide.
 */

import { logger } from '@/utils/logger'

export interface PerformanceMetrics {
  // Métriques temporelles
  fps: number
  frameTime: number
  renderTime: number
  scriptTime: number
  
  // Métriques mémoire
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
  memoryUsagePercent: number
  
  // Métriques réseau
  loadTime: number
  domContentLoaded: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  
  // Métriques interaction
  firstInputDelay: number
  cumulativeLayoutShift: number
  totalBlockingTime: number
  
  // Métriques personnalisées
  cacheHitRate: number
  activeElements: number
  pendingRequests: number
  backgroundTasks: number
  workerQueueLength?: number
  cacheEntries?: number
}

export interface OptimizationRule {
  id: string
  name: string
  condition: (metrics: PerformanceMetrics) => boolean
  action: () => Promise<void> | void
  priority: number
  cooldown: number
  lastExecuted: number
}

export interface PerformanceBudget {
  maxFps: number
  minFps: number
  maxMemoryUsage: number // En MB
  maxLoadTime: number // En ms
  maxFrameTime: number // En ms
  maxCLS: number
  maxFID: number // En ms
  maxLCP: number // En ms
}

export type PerformanceLevel = 'critical' | 'warning' | 'good' | 'excellent'

import { globalEventBus } from './eventBus'
import { defaultOptimizationRules } from '@/core/perf/rules'
import { getPendingRequests } from '@/core/net/fetchTracker'
import { WorkerPool, createComputationWorker } from '@/core/workers/workerPool'

export class PerformanceOptimizer extends EventTarget {
  private metrics: PerformanceMetrics = {
    fps: 60,
    frameTime: 16.67,
    renderTime: 0,
    scriptTime: 0,
    usedJSHeapSize: 0,
    totalJSHeapSize: 0,
    jsHeapSizeLimit: 0,
    memoryUsagePercent: 0,
    loadTime: 0,
    domContentLoaded: 0,
    firstContentfulPaint: 0,
    largestContentfulPaint: 0,
    firstInputDelay: 0,
    cumulativeLayoutShift: 0,
    totalBlockingTime: 0,
    cacheHitRate: 100,
    activeElements: 0,
    pendingRequests: 0,
  backgroundTasks: 0,
  workerQueueLength: 0,
  cacheEntries: 0
  }

  private budget: PerformanceBudget = {
    maxFps: 60,
    minFps: 30,
    maxMemoryUsage: 100, // 100MB
    maxLoadTime: 3000,
    maxFrameTime: 16.67,
    maxCLS: 0.1,
    maxFID: 100,
    maxLCP: 2500
  }

  private optimizationRules: Map<string, OptimizationRule> = new Map()
  private observers: {
    performance?: PerformanceObserver
    memory?: any
    intersection?: IntersectionObserver
    mutation?: MutationObserver
  } = {}

  private monitoringInterval: number | null = null
  private isMonitoring = false
  private fpsHistory: number[] = []
  private memoryHistory: number[] = []
  private frameBudgetMs = 16.7
  private lastFrameTs = performance.now()
  private rafId: number | null = null
  private longTaskObserver?: PerformanceObserver
  private calmFrames = 0
  
  private webWorkers: Map<string, Worker> = new Map()
  private workerPool: WorkerPool | null = null
  private taskQueue: Array<() => Promise<void>> = []
  private isProcessingTasks = false
  // Scheduler multi‑priorités
  private schedQueues: Record<'critical'|'high'|'normal'|'background', Array<{ fn: ()=>void|Promise<void>; added:number; id:number }>> = {
    critical: [], high: [], normal: [], background: []
  }
  private schedLastId = 0
  private schedStats = { executed: 0, dropped: 0, lastExecDur: 0 }
  private fpsSamples: number[] = []
  private fpsP95 = 0
  private fpsP99 = 0

  constructor() {
    super()
    // Charger les règles via le module externalisé
    const rules = defaultOptimizationRules({
      budget: this.budget,
  run: (detail: any) => { this.dispatchEvent(new CustomEvent('optimize', { detail })) },
      helpers: {
        performMemoryCleanup: () => this.performMemoryCleanup(),
        enableLazyLoading: () => this.enableLazyLoading(),
        offloadTasksToWorkers: () => this.offloadTasksToWorkers(),
        performIntelligentPreload: () => this.performIntelligentPreload()
      }
    } as any)
    rules.forEach(r => this.addOptimizationRule(r))
    this.initializeMonitoring()
  }

  /**
   * Initialise le monitoring des performances
   */
  private initializeMonitoring(): void {
    this.setupPerformanceObserver()
    this.setupMemoryMonitoring()
    this.setupIntersectionObserver()
    this.setupMutationObserver()
    this.collectWebVitals()
  this.setupLongTaskObserver()
  this.startRafLoop()
  }

  /**
   * Configure le Performance Observer
   */
  private setupPerformanceObserver(): void {
    if (!('PerformanceObserver' in window)) return

    this.observers.performance = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.processPerformanceEntry(entry)
      }
    })

    // Observer différents types d'entrées
    try {
      this.observers.performance.observe({ 
        entryTypes: ['measure', 'navigation', 'paint', 'layout-shift', 'first-input']
      })
    } catch (error) {
      logger.warn('PerformanceOptimizer', 'Certaines métriques Performance API non supportées', { error })
    }
  }

  private setupLongTaskObserver(){
    if(!('PerformanceObserver' in window)) return
    try {
      this.longTaskObserver = new PerformanceObserver((list)=>{
        for(const entry of list.getEntries()){
          // long task budgeting: si >50ms, augmenter budget adaptatif / réduire tâches background
          if(entry.duration > 50){
            this.metrics.totalBlockingTime += entry.duration
            // Ajuster frame budget (dégrader) pour laisser respirer UI
            this.frameBudgetMs = Math.min(25, this.frameBudgetMs + 1)
            this.calmFrames = 0 // reset calm sequence
          }
        }
      })
      this.longTaskObserver.observe({ entryTypes: ['longtask'] as any })
    } catch {}
  }

  private startRafLoop(){
    const loop = ()=>{
      const now = performance.now()
      const dt = now - this.lastFrameTs
      this.lastFrameTs = now
      const fps = 1000 / dt
      if(isFinite(fps)) this.updateFPS(fps)
      // Frame budget tracker: temps restant pour tâches coopératives
      const remaining = this.frameBudgetMs - dt
      ;(this as any).frameRemaining = remaining
      // Exécuter scheduler tant qu'il reste du temps (>2ms) en priorité décroissante
      try {
        let guard = 0
        const startExec = performance.now()
        while(performance.now() - startExec < remaining - 2 && guard < 50){
          guard++
          const next = this.dequeueSchedTask()
          if(!next) break
          const t0 = performance.now()
          try { const r = next.fn(); if(r && typeof (r as any).then === 'function') (r as Promise<any>).catch(()=>{}) } catch{/* ignore */}
          this.schedStats.lastExecDur = performance.now() - t0
          this.schedStats.executed++
        }
      } catch {/* ignore scheduler errors */}
      // Auto-downgrade frameBudget si frames calmes successives
      if(dt < (this.frameBudgetMs * 0.7)) this.calmFrames++; else this.calmFrames = 0
      if(this.calmFrames > 120 && this.frameBudgetMs > 12){
        this.frameBudgetMs -= 1
        this.calmFrames = 0
      }
      this.rafId = requestAnimationFrame(loop)
    }
    this.rafId = requestAnimationFrame(loop)
  }
  /** Ajoute une tâche planifiée avec priorité */
  public schedule(fn: ()=>void|Promise<void>, priority: 'critical'|'high'|'normal'|'background'='normal'){
    const q = this.schedQueues[priority]
    q.push({ fn, added: performance.now(), id: ++this.schedLastId })
    // Petit contrôle anti-gonflement: si trop d'éléments background, purge anciens
    if(priority==='background' && q.length > 500){ q.splice(0, q.length-500); this.schedStats.dropped += q.length-500 }
  }
  private dequeueSchedTask(){
    if(this.schedQueues.critical.length) return this.schedQueues.critical.shift()
    if(this.schedQueues.high.length) return this.schedQueues.high.shift()
    if(this.schedQueues.normal.length) return this.schedQueues.normal.shift()
    if(this.schedQueues.background.length) return this.schedQueues.background.shift()
    return null
  }

  /**
   * Traite une entrée de performance
   */
  private processPerformanceEntry(entry: PerformanceEntry): void {
    switch (entry.entryType) {
      case 'navigation':
        const navEntry = entry as PerformanceNavigationTiming
        this.metrics.loadTime = navEntry.loadEventEnd - navEntry.fetchStart
        this.metrics.domContentLoaded = navEntry.domContentLoadedEventEnd - navEntry.fetchStart
        break

      case 'paint':
        const paintEntry = entry as PerformancePaintTiming
        if (paintEntry.name === 'first-contentful-paint') {
          this.metrics.firstContentfulPaint = paintEntry.startTime
        }
        break

      case 'largest-contentful-paint':
        const lcpEntry = entry as any // PerformanceLargestContentfulPaint
        this.metrics.largestContentfulPaint = lcpEntry.startTime
        break

      case 'layout-shift':
        const clsEntry = entry as any // PerformanceLayoutShift
        if (!clsEntry.hadRecentInput) {
          this.metrics.cumulativeLayoutShift += clsEntry.value
        }
        break

      case 'first-input':
        const fidEntry = entry as any // PerformanceFirstInputTiming
        this.metrics.firstInputDelay = fidEntry.processingStart - fidEntry.startTime
        break

      case 'measure':
        if (entry.name.startsWith('render-')) {
          this.metrics.renderTime = entry.duration
        } else if (entry.name.startsWith('script-')) {
          this.metrics.scriptTime = entry.duration
        }
        break
    }
  }

  /**
   * Configure le monitoring mémoire
   */
  private setupMemoryMonitoring(): void {
    // Utiliser performance.memory si disponible (Chrome)
    if ('memory' in performance) {
      this.observers.memory = performance.memory
    }
  }

  /**
   * Configure l'Intersection Observer pour le lazy loading
   */
  private setupIntersectionObserver(): void {
    this.observers.intersection = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Élément devient visible
            this.metrics.activeElements++
          } else {
            // Élément sort de la vue
            this.metrics.activeElements = Math.max(0, this.metrics.activeElements - 1)
          }
        })
      },
      { rootMargin: '50px' }
    )
  }

  /**
   * Configure le Mutation Observer
   */
  private setupMutationObserver(): void {
    this.observers.mutation = new MutationObserver((mutations) => {
      // Compter les nouveaux éléments ajoutés
      let addedNodes = 0
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          addedNodes += mutation.addedNodes.length
        }
      })
      
      if (addedNodes > 10) {
        // Beaucoup d'éléments ajoutés d'un coup, potentiel problème de performance
        this.queueTask(() => this.optimizeDOMChanges())
      }
    })

    this.observers.mutation.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false
    })
  }

  /**
   * Collecte les Web Vitals
   */
  private collectWebVitals(): void {
    // Cette fonction sera étendue avec les vraies Web Vitals
    // Pour l'instant, simulation des valeurs
    
    setTimeout(() => {
      this.metrics.firstContentfulPaint = performance.now()
    }, 100)

    setTimeout(() => {
      this.metrics.largestContentfulPaint = performance.now()
    }, 500)
  }

  /**
   * Démarre le monitoring continu
   */
  public startMonitoring(): void {
    if (this.isMonitoring) return

    this.isMonitoring = true
    
    this.monitoringInterval = window.setInterval(() => {
      this.updateMetrics()
      this.checkOptimizationRules()
      this.dispatchMetricsUpdate()
    }, 1000) // Toutes les secondes

    logger.info('PerformanceOptimizer', '📊 Performance Optimizer - Monitoring démarré')
  }

  /**
   * Arrête le monitoring
   */
  public stopMonitoring(): void {
    if (!this.isMonitoring) return

    this.isMonitoring = false
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }

    logger.info('PerformanceOptimizer', '📊 Performance Optimizer - Monitoring arrêté')
  }

  /**
   * Met à jour les métriques
   */
  private updateMetrics(): void {
    // Métriques mémoire
    if (this.observers.memory) {
      const memory = this.observers.memory as any
      this.metrics.usedJSHeapSize = memory.usedJSHeapSize
      this.metrics.totalJSHeapSize = memory.totalJSHeapSize
      this.metrics.jsHeapSizeLimit = memory.jsHeapSizeLimit
      this.metrics.memoryUsagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
    }

    // Métriques de tâches
    this.metrics.backgroundTasks = this.taskQueue.length
    this.metrics.pendingRequests = this.getPendingRequestsCount()

    // Historique pour analyse de tendance
    this.fpsHistory.push(this.metrics.fps)
    this.memoryHistory.push(this.metrics.memoryUsagePercent)

    // Garder seulement les 60 dernières valeurs
    if (this.fpsHistory.length > 60) this.fpsHistory.shift()
    if (this.memoryHistory.length > 60) this.memoryHistory.shift()
  }

  /**
   * Compte les requêtes en attente
   */
  private getPendingRequestsCount(): number {
    return getPendingRequests()
  }

  /**
   * Vérifie et applique les règles d'optimisation
   */
  private checkOptimizationRules(): void {
    const now = Date.now()
    
    // Trier par priorité
    const sortedRules = Array.from(this.optimizationRules.values())
      .sort((a, b) => a.priority - b.priority)

    for (const rule of sortedRules) {
      // Vérifier le cooldown
      if (now - rule.lastExecuted < rule.cooldown) continue

      // Vérifier la condition
      if (rule.condition(this.metrics)) {
        this.executeOptimizationRule(rule)
      }
    }
  }

  /**
   * Exécute une règle d'optimisation
   */
  private async executeOptimizationRule(rule: OptimizationRule): Promise<void> {
    try {
      logger.debug('PerformanceOptimizer', `🔧 Exécution règle: ${rule.name}`)
      
      await rule.action()
      rule.lastExecuted = Date.now()
      
  const payload = { rule: rule.name, timestamp: rule.lastExecuted }
  this.dispatchEvent(new CustomEvent('optimizationApplied', { detail: payload }))
  globalEventBus.emit('optimization', payload)
      
    } catch (error) {
      logger.error('PerformanceOptimizer', `Erreur lors de l'exécution de la règle ${rule.name}`, { error })
    }
  }

  /**
   * Ajoute une règle d'optimisation
   */
  public addOptimizationRule(rule: OptimizationRule): void {
    this.optimizationRules.set(rule.id, rule)
  }

  /**
   * Supprime une règle d'optimisation
   */
  public removeOptimizationRule(id: string): void {
    this.optimizationRules.delete(id)
  }

  /**
   * Effectue un nettoyage mémoire
   */
  private async performMemoryCleanup(): Promise<void> {
    logger.info('PerformanceOptimizer', '🧹 Nettoyage mémoire en cours...')
    
    // Nettoyer les caches inutilisés
    this.dispatchEvent(new CustomEvent('optimize', {
      detail: { type: 'memory', action: 'clearCaches' }
    }))

    // Forcer le garbage collection si possible
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc()
    }

    // Simulation du nettoyage
    await new Promise(resolve => setTimeout(resolve, 100))
    
    logger.info('PerformanceOptimizer', '✅ Nettoyage mémoire terminé')
  }

  /**
   * Active le lazy loading pour les éléments
   */
  private enableLazyLoading(): void {
    logger.info('PerformanceOptimizer', '⚡ Activation du lazy loading...')
    
    const imageElements = document.querySelectorAll('img[src]:not([data-lazy])')
    const videoElements = document.querySelectorAll('video[src]:not([data-lazy])')
    
    const allElements = [...Array.from(imageElements), ...Array.from(videoElements)]
    
    allElements.forEach((element: Element) => {
      if (this.observers.intersection) {
        this.observers.intersection.observe(element)
        element.setAttribute('data-lazy', 'true')
      }
    })
  }

  /**
   * Délègue les tâches aux Web Workers
   */
  private offloadTasksToWorkers(): void {
  logger.info('PerformanceOptimizer', '👷 Délégation aux Web Workers via WorkerPool...')
  if(!this.workerPool){ this.workerPool = new WorkerPool(2, createComputationWorker) }
  }

  /**
   * Effectue un preload intelligent
   */
  private async performIntelligentPreload(): Promise<void> {
    logger.info('PerformanceOptimizer', '🧠 Preload intelligent en cours...')
    
  const detail = { type: 'preload', action: 'anticipate' }
  this.dispatchEvent(new CustomEvent('optimize', { detail }))
  globalEventBus.emit('optimization', { rule: 'preload-intelligent-scan', timestamp: Date.now() })
    
    // Simulation du preload intelligent
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  /**
   * Optimise les changements DOM
   */
  private async optimizeDOMChanges(): Promise<void> {
    logger.info('PerformanceOptimizer', '📝 Optimisation des changements DOM...')
    
    // Utiliser DocumentFragment pour les modifications en lot
  const detail = { type: 'dom', action: 'batchUpdates' }
  this.dispatchEvent(new CustomEvent('optimize', { detail }))
  globalEventBus.emit('optimization', { rule: 'dom-batch-updates', timestamp: Date.now() })
  }

  /**
   * Ajoute une tâche à la queue
   */
  public queueTask(task: () => Promise<void>): void {
    this.taskQueue.push(task)
    this.processTasks()
  }

  /**
   * Traite la queue de tâches
   */
  private async processTasks(): Promise<void> {
    if (this.isProcessingTasks || this.taskQueue.length === 0) return

    this.isProcessingTasks = true

    while (this.taskQueue.length > 0) {
      const task = this.taskQueue.shift()
      if (task) {
        try {
          await task()
        } catch (error) {
          logger.error('PerformanceOptimizer', 'Erreur lors du traitement de tâche', { error })
        }
      }
      
      // Pause pour éviter de bloquer le thread principal
      await new Promise(resolve => setTimeout(resolve, 0))
    }

    this.isProcessingTasks = false
  }

  /**
   * Met à jour les FPS
   */
  public updateFPS(fps: number): void {
    this.metrics.fps = fps
    this.metrics.frameTime = 1000 / fps
    // Collecter échantillons pour percentiles
    this.fpsSamples.push(fps)
    if(this.fpsSamples.length > 120) this.fpsSamples.shift()
    if(this.fpsSamples.length >= 10){
      const sorted = [...this.fpsSamples].sort((a,b)=> a-b)
      const p95Idx = Math.min(sorted.length-1, Math.floor(sorted.length*0.95))
      const p99Idx = Math.min(sorted.length-1, Math.floor(sorted.length*0.99))
      this.fpsP95 = sorted[p95Idx]
      this.fpsP99 = sorted[p99Idx]
    }
  }

  /**
   * Dispatche la mise à jour des métriques
   */
  private dispatchMetricsUpdate(): void {
  this.dispatchEvent(new CustomEvent('metricsUpdate', { detail: this.metrics }))
  try {
    // Enrichissement Phase 4 : tentative extraction MemoryManager globale s'il est exposé sur window
    const mm: any = (globalThis as any).memoryManagerInstance
    let cacheStats: any = null
    if(mm && typeof mm.getCacheStats === 'function'){
      try { cacheStats = mm.getCacheStats() } catch { /* ignore */ }
    }
    // WorkerPool metrics
    if(this.workerPool){
      this.metrics.workerQueueLength = (this.workerPool as any).getQueueLength?.() ?? 0
    }
    if(cacheStats){
      this.metrics.cacheHitRate = cacheStats.hitRate ?? this.metrics.cacheHitRate
      this.metrics.cacheEntries = cacheStats.totalEntries ?? this.metrics.cacheEntries
    }
    globalEventBus.emit('performance', { metrics: { ...this.metrics } })
  } catch { globalEventBus.emit('performance', { metrics: { ...this.metrics } }) }
  ;(window as any).__PERF_SCHED__ = {
    queues: Object.fromEntries(Object.entries(this.schedQueues).map(([k,v])=> [k, v.length])),
    stats: { ...this.schedStats },
    fpsP95: this.fpsP95, fpsP99: this.fpsP99
  }
  }

  /**
   * Retourne le niveau de performance actuel
   */
  public getPerformanceLevel(): PerformanceLevel {
    const { fps, memoryUsagePercent, cumulativeLayoutShift, firstInputDelay } = this.metrics
    
    // Algorithme de scoring basé sur les métriques clés
    let score = 100
    
    if (fps < this.budget.minFps) score -= 30
    else if (fps < 50) score -= 15
    
    if (memoryUsagePercent > 90) score -= 25
    else if (memoryUsagePercent > 75) score -= 10
    
    if (cumulativeLayoutShift > this.budget.maxCLS) score -= 20
    if (firstInputDelay > this.budget.maxFID) score -= 15
    
    if (score >= 90) return 'excellent'
    if (score >= 70) return 'good'
    if (score >= 50) return 'warning'
    return 'critical'
  }

  /**
   * Retourne les métriques actuelles
   */
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  /**
   * Retourne le budget de performance
   */
  public getBudget(): PerformanceBudget {
    return { ...this.budget }
  }

  /**
   * Met à jour le budget de performance
   */
  public setBudget(budget: Partial<PerformanceBudget>): void {
    this.budget = { ...this.budget, ...budget }
  }

  /**
   * Nettoie les ressources
   */
  public cleanup(): void {
    this.stopMonitoring()
  if(this.rafId){ cancelAnimationFrame(this.rafId); this.rafId = null }
    
    // Nettoyer les observers
    Object.values(this.observers).forEach(observer => {
      if (observer && 'disconnect' in observer) {
        observer.disconnect()
      }
    })

    // Terminer les web workers
    this.webWorkers.forEach(worker => {
      worker.terminate()
    })
    this.webWorkers.clear()

    // Vider les queues
    this.taskQueue = []
    this.optimizationRules.clear()
    
    logger.info('PerformanceOptimizer', '🧹 Performance Optimizer nettoyé')
  }
}
