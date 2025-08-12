/**
 * Performance Optimizer - Système de monitoring et optimisation temps réel
 * 
 * Ce système surveille en permanence les performances de l'application
 * et applique des optimisations automatiques pour maintenir une UX fluide.
 */

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
    backgroundTasks: 0
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
  
  private webWorkers: Map<string, Worker> = new Map()
  private taskQueue: Array<() => Promise<void>> = []
  private isProcessingTasks = false

  constructor() {
    super()
    this.setupOptimizationRules()
    this.initializeMonitoring()
  }

  /**
   * Configure les règles d'optimisation par défaut
   */
  private setupOptimizationRules(): void {
    // Règle 1: Réduction qualité si FPS faible
    this.addOptimizationRule({
      id: 'reduce-quality-low-fps',
      name: 'Réduction qualité (FPS faible)',
      condition: (metrics) => metrics.fps < this.budget.minFps,
      action: async () => {
        this.dispatchEvent(new CustomEvent('optimize', {
          detail: { type: 'rendering', action: 'reduceQuality', reason: 'low-fps' }
        }))
      },
      priority: 1,
      cooldown: 5000,
      lastExecuted: 0
    })

    // Règle 2: Nettoyage mémoire si usage élevé
    this.addOptimizationRule({
      id: 'cleanup-memory-high-usage',
      name: 'Nettoyage mémoire',
      condition: (metrics) => metrics.memoryUsagePercent > 80,
      action: async () => {
        await this.performMemoryCleanup()
      },
      priority: 2,
      cooldown: 10000,
      lastExecuted: 0
    })

    // Règle 3: Lazy loading si beaucoup d'éléments actifs
    this.addOptimizationRule({
      id: 'enable-lazy-loading',
      name: 'Activation lazy loading',
      condition: (metrics) => metrics.activeElements > 100,
      action: async () => {
        this.enableLazyLoading()
      },
      priority: 3,
      cooldown: 15000,
      lastExecuted: 0
    })

    // Règle 4: Utilisation Web Workers pour tâches lourdes
    this.addOptimizationRule({
      id: 'offload-to-workers',
      name: 'Délégation aux Web Workers',
      condition: (metrics) => metrics.scriptTime > 50,
      action: async () => {
        this.offloadTasksToWorkers()
      },
      priority: 4,
      cooldown: 20000,
      lastExecuted: 0
    })

    // Règle 5: Preload intelligent basé sur les patterns
    this.addOptimizationRule({
      id: 'intelligent-preload',
      name: 'Preload intelligent',
      condition: (metrics) => metrics.cacheHitRate < 90 && metrics.pendingRequests < 3,
      action: async () => {
        this.performIntelligentPreload()
      },
      priority: 5,
      cooldown: 30000,
      lastExecuted: 0
    })
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
      console.warn('Certaines métriques Performance API non supportées:', error)
    }
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

    console.log('📊 Performance Optimizer - Monitoring démarré')
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

    console.log('📊 Performance Optimizer - Monitoring arrêté')
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
    // Simulation - sera remplacé par le vrai comptage
    return Math.floor(Math.random() * 5)
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
      console.log(`🔧 Exécution règle: ${rule.name}`)
      
      await rule.action()
      rule.lastExecuted = Date.now()
      
      this.dispatchEvent(new CustomEvent('optimizationApplied', {
        detail: { rule: rule.name, timestamp: rule.lastExecuted }
      }))
      
    } catch (error) {
      console.error(`Erreur lors de l'exécution de la règle ${rule.name}:`, error)
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
    console.log('🧹 Nettoyage mémoire en cours...')
    
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
    
    console.log('✅ Nettoyage mémoire terminé')
  }

  /**
   * Active le lazy loading pour les éléments
   */
  private enableLazyLoading(): void {
    console.log('⚡ Activation du lazy loading...')
    
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
    console.log('👷 Délégation aux Web Workers...')
    
    // Créer un worker pour les calculs intensifs si pas déjà fait
    if (!this.webWorkers.has('calculations')) {
      const workerCode = `
        self.onmessage = function(e) {
          const { type, data } = e.data
          
          switch(type) {
            case 'sort':
              const sorted = data.sort()
              self.postMessage({ type: 'sort', result: sorted })
              break
            case 'calculate':
              // Simulation de calcul intensif
              const result = data.reduce((sum, val) => sum + val, 0)
              self.postMessage({ type: 'calculate', result })
              break
          }
        }
      `
      
      const blob = new Blob([workerCode], { type: 'application/javascript' })
      const worker = new Worker(URL.createObjectURL(blob))
      
      worker.onmessage = (e) => {
        console.log('Résultat du worker:', e.data)
      }
      
      this.webWorkers.set('calculations', worker)
    }
  }

  /**
   * Effectue un preload intelligent
   */
  private async performIntelligentPreload(): Promise<void> {
    console.log('🧠 Preload intelligent en cours...')
    
    this.dispatchEvent(new CustomEvent('optimize', {
      detail: { type: 'preload', action: 'anticipate' }
    }))
    
    // Simulation du preload intelligent
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  /**
   * Optimise les changements DOM
   */
  private async optimizeDOMChanges(): Promise<void> {
    console.log('📝 Optimisation des changements DOM...')
    
    // Utiliser DocumentFragment pour les modifications en lot
    this.dispatchEvent(new CustomEvent('optimize', {
      detail: { type: 'dom', action: 'batchUpdates' }
    }))
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
          console.error('Erreur lors du traitement de tâche:', error)
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
  }

  /**
   * Dispatche la mise à jour des métriques
   */
  private dispatchMetricsUpdate(): void {
    this.dispatchEvent(new CustomEvent('metricsUpdate', {
      detail: this.metrics
    }))
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
    
    console.log('🧹 Performance Optimizer nettoyé')
  }
}
