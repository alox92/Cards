/**
 * Algorithmic Optimization Engine - Moteur d'optimisation algorithmique
 * 
 * Ce système optimise les algorithmes d'apprentissage avec des Web Workers,
 * un cache intelligent et des stratégies adaptatives pour l'IA d'apprentissage.
 */

export interface AlgorithmConfig {
  enableWebWorkers: boolean
  maxWorkers: number
  batchSize: number
  cacheResults: boolean
  adaptiveThreshold: number
  optimizationLevel: 'basic' | 'standard' | 'aggressive'
}

export interface WorkerTask {
  id: string
  type: AlgorithmType
  data: unknown
  priority: number
  timestamp: number
  estimatedDuration: number
}

export type AlgorithmType = 
  | 'spaced-repetition'
  | 'difficulty-adjustment'
  | 'sorting'
  | 'statistics'
  | 'prediction'
  | 'optimization'

export interface SpacedRepetitionData {
  cardId: string
  easinessFactor: number
  interval: number
  repetition: number
  quality: number // 0-5 scale
  lastReview: number
  nextReview: number
}

export interface DifficultyAnalysis {
  cardId: string
  successRate: number
  averageTime: number
  errorPatterns: string[]
  recommendedDifficulty: number
  confidence: number
}

export interface AlgorithmResult<T = unknown> {
  taskId: string
  success: boolean
  result: T
  executionTime: number
  workerUsed: boolean
  cacheHit: boolean
  metadata?: Record<string, unknown>
}

export interface PerformanceMetrics {
  totalTasks: number
  completedTasks: number
  failedTasks: number
  averageExecutionTime: number
  workerUtilization: number
  cacheHitRate: number
  throughput: number // Tasks per second
}

export class AlgorithmicOptimizationEngine extends EventTarget {
  private config: AlgorithmConfig = {
    enableWebWorkers: true,
    maxWorkers: navigator.hardwareConcurrency || 4,
    batchSize: 100,
    cacheResults: true,
    adaptiveThreshold: 0.8,
    optimizationLevel: 'standard'
  }

  private workers = new Map<string, Worker>()
  private taskQueue: WorkerTask[] = []
  private activeTasks = new Map<string, WorkerTask>()
  private resultCache = new Map<string, unknown>()
  
  private metrics: PerformanceMetrics = {
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    averageExecutionTime: 0,
    workerUtilization: 0,
    cacheHitRate: 0,
    throughput: 0
  }

  private isInitialized = false
  private metricsInterval: number | null = null

  constructor(config?: Partial<AlgorithmConfig>) {
    super()
    
    if (config) {
      this.config = { ...this.config, ...config }
    }
    
    this.initialize()
  }

  /**
   * Initialise le moteur d'optimisation
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized) return

    // Initialisation Algorithmic Optimization Engine

    // Créer les Web Workers
    if (this.config.enableWebWorkers) {
      await this.createWorkers()
    }

    // Démarrer le monitoring des performances
    this.startPerformanceMonitoring()

    // Initialiser les algorithmes optimisés
    this.setupOptimizedAlgorithms()

    this.isInitialized = true
    // Algorithmic Optimization Engine initialisé
  }

  /**
   * Crée les Web Workers
   */
  private async createWorkers(): Promise<void> {
    const workerCode = this.generateWorkerCode()
    const blob = new Blob([workerCode], { type: 'application/javascript' })
    const workerUrl = URL.createObjectURL(blob)

    for (let i = 0; i < this.config.maxWorkers; i++) {
      const workerId = `worker-${i}`
      const worker = new Worker(workerUrl)
      
      worker.onmessage = (e) => this.handleWorkerMessage(workerId, e.data)
      worker.onerror = (error) => this.handleWorkerError(workerId, error)
      
      this.workers.set(workerId, worker)
    }

    // Web Workers créés
  }

  /**
   * Génère le code du Web Worker
   */
  private generateWorkerCode(): string {
    return `
      // Algorithme SM-2 pour la répétition espacée
      function calculateSpacedRepetition(data) {
        const { sm2Update } = require('../domain/algorithms/sm2')
        const result = sm2Update({
          easinessFactor: data.easinessFactor,
          interval: data.interval,
          repetition: data.repetition,
          lastReview: Date.now(),
            // nextReview sera recalculé par sm2Update mais nous recalerons comme worker attend ms
          nextReview: Date.now(),
          quality: data.quality
        })
        return result
      }
      
      // Analyse de difficulté adaptative
      function analyzeDifficulty(data) {
        const { responses, timeSpent, errorPatterns } = data
        
        const successRate = responses.filter(r => r.correct).length / responses.length
        const averageTime = timeSpent.reduce((sum, time) => sum + time, 0) / timeSpent.length
        
        // Calcul de la difficulté recommandée (0-10)
        let difficulty = 5 // Difficulté moyenne par défaut
        
        if (successRate > 0.9) difficulty -= 2
        else if (successRate > 0.7) difficulty -= 1
        else if (successRate < 0.3) difficulty += 2
        else if (successRate < 0.5) difficulty += 1
        
        if (averageTime > 10000) difficulty += 1 // Plus de 10 secondes
        else if (averageTime < 3000) difficulty -= 1 // Moins de 3 secondes
        
        difficulty = Math.max(1, Math.min(10, difficulty))
        
        const confidence = Math.min(responses.length / 10, 1) // Confiance basée sur le nombre de réponses
        
        return {
          successRate,
          averageTime,
          recommendedDifficulty: difficulty,
          confidence,
          errorPatterns: errorPatterns || []
        }
      }
      
      // Tri optimisé avec différents algorithmes
      function optimizedSort(data) {
        const { array, key, order = 'asc', algorithm = 'auto' } = data
        
        if (array.length < 10) {
          // Tri par insertion pour petits tableaux
          return insertionSort(array, key, order)
        } else if (array.length < 1000) {
          // Quick sort pour tableaux moyens
          return quickSort(array, key, order)
        } else {
          // Merge sort pour gros tableaux
          return mergeSort(array, key, order)
        }
      }
      
      function insertionSort(arr, key, order) {
        const sorted = [...arr]
        for (let i = 1; i < sorted.length; i++) {
          let current = sorted[i]
          let j = i - 1
          
          const getValue = (item) => key ? item[key] : item
          const compare = order === 'asc' 
            ? (a, b) => getValue(a) > getValue(b)
            : (a, b) => getValue(a) < getValue(b)
          
          while (j >= 0 && compare(sorted[j], current)) {
            sorted[j + 1] = sorted[j]
            j--
          }
          sorted[j + 1] = current
        }
        return sorted
      }
      
      function quickSort(arr, key, order) {
        if (arr.length <= 1) return arr
        
        const getValue = (item) => key ? item[key] : item
        const pivot = arr[Math.floor(arr.length / 2)]
        const pivotValue = getValue(pivot)
        
        const less = []
        const equal = []
        const greater = []
        
        for (const item of arr) {
          const value = getValue(item)
          if (value < pivotValue) {
            less.push(item)
          } else if (value > pivotValue) {
            greater.push(item)
          } else {
            equal.push(item)
          }
        }
        
        if (order === 'asc') {
          return [
            ...quickSort(less, key, order),
            ...equal,
            ...quickSort(greater, key, order)
          ]
        } else {
          return [
            ...quickSort(greater, key, order),
            ...equal,
            ...quickSort(less, key, order)
          ]
        }
      }
      
      function mergeSort(arr, key, order) {
        if (arr.length <= 1) return arr
        
        const mid = Math.floor(arr.length / 2)
        const left = mergeSort(arr.slice(0, mid), key, order)
        const right = mergeSort(arr.slice(mid), key, order)
        
        return merge(left, right, key, order)
      }
      
      function merge(left, right, key, order) {
        const result = []
        let i = 0, j = 0
        
        const getValue = (item) => key ? item[key] : item
        
        while (i < left.length && j < right.length) {
          const leftValue = getValue(left[i])
          const rightValue = getValue(right[j])
          
          const shouldTakeLeft = order === 'asc' 
            ? leftValue <= rightValue 
            : leftValue >= rightValue
          
          if (shouldTakeLeft) {
            result.push(left[i])
            i++
          } else {
            result.push(right[j])
            j++
          }
        }
        
        return result.concat(left.slice(i)).concat(right.slice(j))
      }
      
      // Calculs statistiques optimisés
      function calculateStatistics(data) {
        const { values, includeAdvanced = false } = data
        
        if (values.length === 0) {
          return { error: 'Pas de données' }
        }
        
        const sorted = [...values].sort((a, b) => a - b)
        const sum = values.reduce((acc, val) => acc + val, 0)
        const mean = sum / values.length
        
        // Médiane
        const median = sorted.length % 2 === 0
          ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
          : sorted[Math.floor(sorted.length / 2)]
        
        // Mode
        const frequency = {}
        values.forEach(val => frequency[val] = (frequency[val] || 0) + 1)
        const mode = Object.keys(frequency).reduce((a, b) => frequency[a] > frequency[b] ? a : b)
        
        const result = {
          count: values.length,
          sum,
          mean,
          median,
          mode: parseFloat(mode),
          min: sorted[0],
          max: sorted[sorted.length - 1],
          range: sorted[sorted.length - 1] - sorted[0]
        }
        
        if (includeAdvanced) {
          // Variance et écart-type
          const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length
          result.variance = variance
          result.standardDeviation = Math.sqrt(variance)
          
          // Quartiles
          const q1Index = Math.floor(sorted.length * 0.25)
          const q3Index = Math.floor(sorted.length * 0.75)
          result.q1 = sorted[q1Index]
          result.q3 = sorted[q3Index]
          result.iqr = result.q3 - result.q1
          
          // Asymétrie (skewness)
          const skewness = values.reduce((acc, val) => acc + Math.pow((val - mean) / Math.sqrt(variance), 3), 0) / values.length
          result.skewness = skewness
        }
        
        return result
      }
      
      // Prédictions basées sur les tendances
      function predictPerformance(data) {
        const { history, targetDays = 7 } = data
        
        if (history.length < 3) {
          return { error: 'Pas assez de données historiques' }
        }
        
        // Régression linéaire simple
        const n = history.length
        const x = history.map((_, i) => i)
        const y = history.map(item => item.score || item.value || 0)
        
        const sumX = x.reduce((a, b) => a + b, 0)
        const sumY = y.reduce((a, b) => a + b, 0)
        const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0)
        const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0)
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
        const intercept = (sumY - slope * sumX) / n
        
        // Prédictions
        const predictions = []
        for (let i = 0; i < targetDays; i++) {
          const futureX = n + i
          const predictedY = slope * futureX + intercept
          predictions.push({
            day: i + 1,
            predicted: Math.max(0, predictedY),
            confidence: Math.max(0, 1 - (i * 0.1)) // Confiance décroissante
          })
        }
        
        return {
          slope,
          trend: slope > 0 ? 'improving' : slope < 0 ? 'declining' : 'stable',
          predictions,
          r_squared: calculateRSquared(x, y, slope, intercept)
        }
      }
      
      function calculateRSquared(x, y, slope, intercept) {
        const yMean = y.reduce((a, b) => a + b, 0) / y.length
        const ssRes = y.reduce((acc, yi, i) => {
          const predicted = slope * x[i] + intercept
          return acc + Math.pow(yi - predicted, 2)
        }, 0)
        const ssTot = y.reduce((acc, yi) => acc + Math.pow(yi - yMean, 2), 0)
        
        return 1 - (ssRes / ssTot)
      }
      
      // Gestionnaire principal des tâches
      self.onmessage = function(e) {
        const { taskId, type, data, timestamp } = e.data
        const startTime = performance.now()
        
        try {
          let result
          
          switch (type) {
            case 'spaced-repetition':
              result = calculateSpacedRepetition(data)
              break
            case 'difficulty-adjustment':
              result = analyzeDifficulty(data)
              break
            case 'sorting':
              result = optimizedSort(data)
              break
            case 'statistics':
              result = calculateStatistics(data)
              break
            case 'prediction':
              result = predictPerformance(data)
              break
            default:
              throw new Error('Type de tâche non supporté: ' + type)
          }
          
          const executionTime = performance.now() - startTime
          
          self.postMessage({
            taskId,
            success: true,
            result,
            executionTime,
            timestamp: Date.now()
          })
          
        } catch (error) {
          self.postMessage({
            taskId,
            success: false,
            error: error.message,
            executionTime: performance.now() - startTime,
            timestamp: Date.now()
          })
        }
      }
    `
  }

  /**
   * Démarre le monitoring des performances
   */
  private startPerformanceMonitoring(): void {
    this.metricsInterval = window.setInterval(() => {
      this.updateMetrics()
      this.optimizePerformance()
    }, 5000) // Toutes les 5 secondes
  }

  /**
   * Met à jour les métriques de performance
   */
  private updateMetrics(): void {
    // Calcul du throughput
    const now = Date.now()
    const recentTasks = Array.from(this.activeTasks.values())
      .filter(task => now - task.timestamp < 10000) // 10 dernières secondes
    
    this.metrics.throughput = recentTasks.length / 10

    // Utilisation des workers
    this.metrics.workerUtilization = (this.activeTasks.size / this.workers.size) * 100

    // Autres métriques sont mises à jour lors de l'exécution des tâches
  }

  /**
   * Optimise les performances basées sur les métriques
   */
  private optimizePerformance(): void {
    // Ajuster la taille des batches
    if (this.metrics.averageExecutionTime > 1000 && this.config.batchSize > 10) {
      this.config.batchSize = Math.floor(this.config.batchSize * 0.8)
    } else if (this.metrics.averageExecutionTime < 100 && this.config.batchSize < 1000) {
      this.config.batchSize = Math.floor(this.config.batchSize * 1.2)
    }

    // Ajuster le niveau d'optimisation
    if (this.metrics.workerUtilization > 90) {
      this.config.optimizationLevel = 'aggressive'
    } else if (this.metrics.workerUtilization < 30) {
      this.config.optimizationLevel = 'basic'
    } else {
      this.config.optimizationLevel = 'standard'
    }
  }

  /**
   * Gère les messages des workers
   */
  private handleWorkerMessage(_workerId: string, message: unknown): void {
    const { taskId, success, result, executionTime, error } = message as { 
      taskId: string; 
      success: boolean; 
      result: unknown; 
      executionTime: number; 
      error?: Error 
    }
    const task = this.activeTasks.get(taskId)
    
    if (!task) return

    // Supprimer la tâche active
    this.activeTasks.delete(taskId)

    // Mettre en cache le résultat si configuré
    if (success && this.config.cacheResults) {
      const cacheKey = this.generateCacheKey(task.type, task.data)
      this.resultCache.set(cacheKey, result)
    }

    // Mettre à jour les métriques
    if (success) {
      this.metrics.completedTasks++
    } else {
      this.metrics.failedTasks++
    }

    // Recalculer le temps d'exécution moyen
    const totalCompleted = this.metrics.completedTasks + this.metrics.failedTasks
    this.metrics.averageExecutionTime = 
      (this.metrics.averageExecutionTime * (totalCompleted - 1) + executionTime) / totalCompleted

    // Dispatcher le résultat
    this.dispatchEvent(new CustomEvent('taskCompleted', {
      detail: {
        taskId,
        success,
        result: success ? result : error,
        executionTime,
        workerUsed: true,
        cacheHit: false
      }
    }))

    // Traiter la prochaine tâche dans la queue
    this.processNextTask()
  }

  /**
   * Gère les erreurs des workers
   */
  private handleWorkerError(workerId: string, _error: ErrorEvent): void {
    // Erreur worker - redémarrage automatique
    
    // Redémarrer le worker si nécessaire
    this.recreateWorker(workerId)
  }

  /**
   * Recrée un worker défaillant
   */
  private async recreateWorker(workerId: string): Promise<void> {
    const oldWorker = this.workers.get(workerId)
    if (oldWorker) {
      oldWorker.terminate()
    }

    // Créer un nouveau worker
    const workerCode = this.generateWorkerCode()
    const blob = new Blob([workerCode], { type: 'application/javascript' })
    const workerUrl = URL.createObjectURL(blob)
    
    const newWorker = new Worker(workerUrl)
    newWorker.onmessage = (e) => this.handleWorkerMessage(workerId, e.data)
    newWorker.onerror = (error) => this.handleWorkerError(workerId, error)
    
    this.workers.set(workerId, newWorker)
    // Worker recréé
  }

  /**
   * Génère une clé de cache
   */
  private generateCacheKey(type: AlgorithmType, data: unknown): string {
    return `${type}-${JSON.stringify(data).substring(0, 100)}`
  }

  /**
   * Configure les algorithmes optimisés
   */
  private setupOptimizedAlgorithms(): void {
    // Configuration basée sur le niveau d'optimisation
    switch (this.config.optimizationLevel) {
      case 'basic':
        this.config.batchSize = Math.min(50, this.config.batchSize)
        break
      case 'aggressive':
        this.config.batchSize = Math.max(200, this.config.batchSize)
        this.config.cacheResults = true
        break
      default: // standard
        // Garder les valeurs par défaut
        break
    }
  }

  /**
   * Exécute une tâche algorithmique
   */
  public async executeTask<T>(
    type: AlgorithmType, 
    data: unknown, 
    options: { priority?: number; useCache?: boolean } = {}
  ): Promise<AlgorithmResult<T>> {
    const taskId = Math.random().toString(36).substring(2)
    const startTime = performance.now()
    
    // Vérifier le cache d'abord
    if (options.useCache !== false && this.config.cacheResults) {
      const cacheKey = this.generateCacheKey(type, data)
      const cached = this.resultCache.get(cacheKey)
      
      if (cached !== undefined) {
        this.updateCacheHitRate(true)
        return {
          taskId,
          success: true,
          result: cached as T,
          executionTime: performance.now() - startTime,
          workerUsed: false,
          cacheHit: true
        }
      }
    }

    this.updateCacheHitRate(false)

    // Créer la tâche
    const task: WorkerTask = {
      id: taskId,
      type,
      data,
      priority: options.priority || 5,
      timestamp: Date.now(),
      estimatedDuration: this.estimateTaskDuration(type, data)
    }

    this.metrics.totalTasks++

    // Utiliser un worker si disponible et configuré
    if (this.config.enableWebWorkers && this.getAvailableWorker()) {
      return this.executeTaskWithWorker(task)
    } else {
      // Exécution synchrone comme fallback
      return this.executeTaskSync(task)
    }
  }

  /**
   * Exécute une tâche avec un worker
   */
  private executeTaskWithWorker<T>(task: WorkerTask): Promise<AlgorithmResult<T>> {
    return new Promise((resolve) => {
      const worker = this.getAvailableWorker()
      if (!worker) {
        // Fallback vers l'exécution synchrone
        resolve(this.executeTaskSync(task))
        return
      }

      // Ajouter la tâche aux tâches actives
      this.activeTasks.set(task.id, task)

      // Écouter le résultat
      const handler = (e: CustomEvent) => {
        const detail = e.detail as AlgorithmResult<T>
        if (detail.taskId === task.id) {
          this.removeEventListener('taskCompleted', handler as EventListener)
          resolve(detail)
        }
      }

      this.addEventListener('taskCompleted', handler as EventListener)

      // Envoyer la tâche au worker
      worker.postMessage({
        taskId: task.id,
        type: task.type,
        data: task.data,
        timestamp: task.timestamp
      })
    })
  }

  /**
   * Exécute une tâche de manière synchrone
   */
  private async executeTaskSync<T>(task: WorkerTask): Promise<AlgorithmResult<T>> {
    const startTime = performance.now()

    try {
      let result: T

      // Implémentation simplifiée pour fallback
      switch (task.type) {
        case 'spaced-repetition':
          result = this.calculateSpacedRepetitionSync(task.data as SpacedRepetitionData) as T
          break
        case 'sorting':
          result = this.optimizedSortSync(task.data) as T
          break
        case 'statistics':
          result = this.calculateStatisticsSync(task.data) as T
          break
        default:
          throw new Error(`Type de tâche non supporté: ${task.type}`)
      }

      const executionTime = performance.now() - startTime
      this.metrics.completedTasks++

      return {
        taskId: task.id,
        success: true,
        result,
        executionTime,
        workerUsed: false,
        cacheHit: false
      }

    } catch (error) {
      const executionTime = performance.now() - startTime
      this.metrics.failedTasks++

      return {
        taskId: task.id,
        success: false,
        result: (error as Error).message as T,
        executionTime,
        workerUsed: false,
        cacheHit: false
      }
    }
  }

  /**
   * Calcul SM-2 synchrone (fallback)
   */
  private calculateSpacedRepetitionSync(data: SpacedRepetitionData): Partial<SpacedRepetitionData> {
    const { sm2Update } = require('../domain/algorithms/sm2') as typeof import('../domain/algorithms/sm2')
    const updated = sm2Update({
      easinessFactor: data.easinessFactor,
      interval: data.interval,
      repetition: data.repetition,
      lastReview: Date.now(),
      nextReview: Date.now(),
      quality: data.quality
    })
    return updated
  }

  /**
   * Tri optimisé synchrone (fallback)
   */
  private optimizedSortSync(data: unknown): unknown[] {
    const { array, key, order = 'asc' } = data as { array: unknown[]; key?: string; order?: 'asc' | 'desc' }
    
    return [...array].sort((a, b) => {
      const aVal = key ? (a as Record<string, unknown>)[key] : a
      const bVal = key ? (b as Record<string, unknown>)[key] : b
      
      // Safe comparison for unknown types
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return order === 'asc' ? aVal - bVal : bVal - aVal
      }
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return order === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      // Fallback: convert to string for comparison
      const aStr = String(aVal)
      const bStr = String(bVal)
      if (order === 'asc') {
        return aStr < bStr ? -1 : aStr > bStr ? 1 : 0
      } else {
        return aStr > bStr ? -1 : aStr < bStr ? 1 : 0
      }
    })
  }

  /**
   * Calculs statistiques synchrones (fallback)
   */
  private calculateStatisticsSync(data: unknown): { count: number; sum: number; mean: number; min: number; max: number; median: number } | { error: string } {
    const { values } = data as { values?: number[] }
    
    if (!values || values.length === 0) {
      return { error: 'Pas de données' }
    }
    
    const sorted = [...values].sort((a, b) => a - b)
    const sum = values.reduce((acc: number, val: number) => acc + val, 0)
    const mean = sum / values.length
    
    return {
      count: values.length,
      sum,
      mean,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      median: sorted[Math.floor(sorted.length / 2)]
    }
  }

  /**
   * Trouve un worker disponible
   */
  private getAvailableWorker(): Worker | null {
    for (const [workerId, worker] of this.workers) {
      // Vérifier si le worker n'est pas occupé
      const busyTasks = Array.from(this.activeTasks.values())
        .filter(task => task.id.startsWith(workerId))
      
      if (busyTasks.length === 0) {
        return worker
      }
    }
    return null
  }

  /**
   * Traite la prochaine tâche en queue
   */
  private processNextTask(): void {
    if (this.taskQueue.length === 0) return

    const worker = this.getAvailableWorker()
    if (!worker) return

    // Trier par priorité
    this.taskQueue.sort((a, b) => b.priority - a.priority)
    const nextTask = this.taskQueue.shift()
    
    if (nextTask) {
      this.executeTaskWithWorker(nextTask)
    }
  }

  /**
   * Estime la durée d'une tâche
   */
  private estimateTaskDuration(type: AlgorithmType, data: unknown): number {
    // Estimations basées sur le type et la taille des données
    switch (type) {
      case 'spaced-repetition':
        return 10 // 10ms
      case 'sorting':
        const size = (data as { array?: unknown[] }).array?.length || 0
        return Math.max(10, size * 0.1) // ~0.1ms par élément
      case 'statistics':
        const count = (data as { values?: number[] }).values?.length || 0
        return Math.max(5, count * 0.05) // ~0.05ms par valeur
      default:
        return 50 // 50ms par défaut
    }
  }

  /**
   * Met à jour le taux de hit du cache
   */
  private updateCacheHitRate(isHit: boolean): void {
    // Simple comptage pour le calcul du taux
    const total = this.metrics.completedTasks + this.metrics.failedTasks + 1
    const currentHitRate = this.metrics.cacheHitRate
    
    if (isHit) {
      this.metrics.cacheHitRate = ((currentHitRate * (total - 1)) + 1) / total * 100
    } else {
      this.metrics.cacheHitRate = (currentHitRate * (total - 1)) / total * 100
    }
  }

  /**
   * Retourne les métriques de performance
   */
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  /**
   * Retourne la configuration
   */
  public getConfig(): AlgorithmConfig {
    return { ...this.config }
  }

  /**
   * Met à jour la configuration
   */
  public setConfig(config: Partial<AlgorithmConfig>): void {
    this.config = { ...this.config, ...config }
    this.setupOptimizedAlgorithms()
  }

  /**
   * Vide le cache des résultats
   */
  public clearCache(): void {
    this.resultCache.clear()
    // Cache des résultats vidé
  }

  /**
   * Nettoie les ressources
   */
  public cleanup(): void {
    // Arrêter le monitoring
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval)
      this.metricsInterval = null
    }

    // Terminer tous les workers
    this.workers.forEach(worker => worker.terminate())
    this.workers.clear()

    // Vider les queues et caches
    this.taskQueue = []
    this.activeTasks.clear()
    this.resultCache.clear()

    // Algorithmic Optimization Engine nettoyé
  }
}
