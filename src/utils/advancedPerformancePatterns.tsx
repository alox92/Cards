/**
 * Advanced Performance Patterns - Final Phase Implementation
 */

import React, { createContext, useContext, useMemo, useCallback, useRef, useState, useEffect } from 'react'
import { RenderingPauseManager } from './reactConcurrentFeatures'

// Context optimization patterns
interface OptimizedContextValue<T> {
  data: T
  subscribe: (selector: (data: T) => any) => () => void
  update: (updater: (data: T) => T) => void
}

/**
 * Create optimized context with selective subscriptions
 */
export function createOptimizedContext<T>(initialData: T) {
  const Context = createContext<OptimizedContextValue<T> | null>(null)
  
  function OptimizedProvider({ children, value }: { children: React.ReactNode; value?: T }) {
    const [data, setData] = useState<T>(value || initialData)
    const subscribersRef = useRef<Map<symbol, (data: T) => any>>(new Map())
    const selectorsRef = useRef<Map<symbol, any>>(new Map())

    const subscribe = useCallback((selector: (data: T) => any) => {
      const key = Symbol()
      subscribersRef.current.set(key, selector)
      selectorsRef.current.set(key, selector(data))

      return () => {
        subscribersRef.current.delete(key)
        selectorsRef.current.delete(key)
      }
    }, [data])

    const update = useCallback((updater: (data: T) => T) => {
      setData(prevData => {
        const newData = updater(prevData)
        
        // Only notify subscribers if their selected data actually changed
        subscribersRef.current.forEach((selector, key) => {
          const oldValue = selectorsRef.current.get(key)
          const newValue = selector(newData)
          
          if (oldValue !== newValue) {
            selectorsRef.current.set(key, newValue)
          }
        })

        return newData
      })
    }, [])

    const contextValue = useMemo(() => ({
      data,
      subscribe,
      update
    }), [data, subscribe, update])

    return (
      <Context.Provider value={contextValue}>
        {children}
      </Context.Provider>
    )
  }

  function useOptimizedContext<K>(selector: (data: T) => K): [K, (updater: (data: T) => T) => void] {
    const context = useContext(Context)
    if (!context) {
      throw new Error('useOptimizedContext must be used within OptimizedProvider')
    }

    const [selectedData, setSelectedData] = useState(() => selector(context.data))

    useEffect(() => {
      const unsubscribe = context.subscribe((data) => {
        const newValue = selector(data)
        setSelectedData(prevValue => {
          return prevValue === newValue ? prevValue : newValue
        })
      })

      return unsubscribe
    }, [context, selector])

    return [selectedData, context.update]
  }

  return {
    Provider: OptimizedProvider,
    useContext: useOptimizedContext
  }
}

/**
 * Intelligent preloading manager
 */
export class IntelligentPreloader {
  private static instance: IntelligentPreloader
  private preloadQueue: Array<{
    id: string
    load: () => Promise<any>
    priority: number
    bandwidth?: 'low' | 'high'
  }> = []
  private isProcessing = false
  private networkInfo: any = null

  private constructor() {
    this.initNetworkMonitoring()
  }

  static getInstance(): IntelligentPreloader {
    if (!IntelligentPreloader.instance) {
      IntelligentPreloader.instance = new IntelligentPreloader()
    }
    return IntelligentPreloader.instance
  }

  private initNetworkMonitoring(): void {
    if ('connection' in navigator) {
      this.networkInfo = (navigator as any).connection
    }
  }

  private shouldPreload(): boolean {
    if (!this.networkInfo) return true

    // Don't preload on slow connections
    if (this.networkInfo.effectiveType === 'slow-2g' || this.networkInfo.effectiveType === '2g') {
      return false
    }

    // Don't preload if save-data is enabled
    if (this.networkInfo.saveData) {
      return false
    }

    return true
  }

  /**
   * Add preload task with intelligent prioritization
   */
  addPreloadTask(id: string, load: () => Promise<any>, priority: number = 0): void {
    if (!this.shouldPreload()) {
      console.log(`⚡ Skipping preload for ${id} due to network conditions`)
      return
    }

    // Determine bandwidth requirement
    const bandwidth = priority > 5 ? 'high' : 'low'

    this.preloadQueue.push({ id, load, priority, bandwidth })
    this.preloadQueue.sort((a, b) => b.priority - a.priority)

    if (!this.isProcessing) {
      this.processQueue()
    }
  }

  private async processQueue(): Promise<void> {
    if (this.preloadQueue.length === 0 || this.isProcessing) return

    this.isProcessing = true

    while (this.preloadQueue.length > 0) {
      const task = this.preloadQueue.shift()!
      
      try {
        // Use requestIdleCallback for low priority tasks
        if (task.priority < 3 && 'requestIdleCallback' in window) {
          await new Promise<void>((resolve) => {
            (window as any).requestIdleCallback(() => {
              task.load().then(() => resolve()).catch(() => resolve())
            }, { timeout: 2000 })
          })
        } else {
          await task.load()
        }

        console.log(`✅ Preloaded: ${task.id}`)
      } catch (error) {
        console.warn(`❌ Preload failed for ${task.id}:`, error)
      }

      // Yield to main thread
      await new Promise(resolve => setTimeout(resolve, 0))
    }

    this.isProcessing = false
  }

  /**
   * Preload critical components
   */
  preloadCriticalComponents(): void {
    this.addPreloadTask('study-page', () => import('@/ui/pages/StudyPage'), 10)
    this.addPreloadTask('deck-manager', () => import('@/ui/pages/DeckCardsManagerPage'), 8)
    this.addPreloadTask('advanced-stats', () => import('@/ui/pages/AdvancedStatsPage'), 6)
    this.addPreloadTask('rich-editor', () => import('@/ui/components/Editor/UltraRichTextEditor'), 4)
  }
}

/**
 * Performance instrumentation with performance.mark
 */
export class PerformanceInstrumentation {
  private static instance: PerformanceInstrumentation
  private measurements: Map<string, number[]> = new Map()

  static getInstance(): PerformanceInstrumentation {
    if (!PerformanceInstrumentation.instance) {
      PerformanceInstrumentation.instance = new PerformanceInstrumentation()
    }
    return PerformanceInstrumentation.instance
  }

  /**
   * Start performance measurement
   */
  startMeasurement(name: string): string {
    const markName = `${name}-start-${Date.now()}`
    performance.mark(markName)
    return markName
  }

  /**
   * End performance measurement
   */
  endMeasurement(name: string, startMark: string): number {
    const endMark = `${name}-end-${Date.now()}`
    performance.mark(endMark)

    try {
      const measureName = `${name}-measure`
      performance.measure(measureName, startMark, endMark)

      const entries = performance.getEntriesByName(measureName)
      if (entries.length > 0) {
        const duration = entries[entries.length - 1].duration
        this.recordMeasurement(name, duration)
        return duration
      }
    } catch (error) {
      console.warn('Performance measurement failed:', error)
    }

    return 0
  }

  private recordMeasurement(name: string, duration: number): void {
    if (!this.measurements.has(name)) {
      this.measurements.set(name, [])
    }

    const measurements = this.measurements.get(name)!
    measurements.push(duration)

    // Keep only last 100 measurements
    if (measurements.length > 100) {
      measurements.shift()
    }
  }

  /**
   * Get performance statistics
   */
  getStatistics(name: string): { average: number; min: number; max: number; count: number } | null {
    const measurements = this.measurements.get(name)
    if (!measurements || measurements.length === 0) return null

    const average = measurements.reduce((sum, val) => sum + val, 0) / measurements.length
    const min = Math.min(...measurements)
    const max = Math.max(...measurements)

    return {
      average: Math.round(average * 100) / 100,
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      count: measurements.length
    }
  }

  /**
   * Get all performance statistics
   */
  getAllStatistics(): Record<string, { average: number; min: number; max: number; count: number }> {
    const stats: Record<string, any> = {}

    this.measurements.forEach((_, name) => {
      const stat = this.getStatistics(name)
      if (stat) {
        stats[name] = stat
      }
    })

    return stats
  }
}

/**
 * Advanced performance hooks
 */
export function useRenderingPause() {
  const [isPaused, setIsPaused] = useState(false)

  const pauseRendering = useCallback(async () => {
    setIsPaused(true)
    return RenderingPauseManager.pauseRendering()
  }, [])

  const resumeRendering = useCallback(() => {
    setIsPaused(false)
    RenderingPauseManager.resumeRendering()
  }, [])

  const executeWithPause = useCallback(async (operation: () => Promise<any>): Promise<any> => {
    return RenderingPauseManager.executeWithPause(operation)
  }, [])

  return {
    isPaused,
    pauseRendering,
    resumeRendering,
    executeWithPause
  }
}

export function usePerformanceInstrumentation(operationName: string) {
  const instrumentation = PerformanceInstrumentation.getInstance()

  const startMeasurement = useCallback(() => {
    return instrumentation.startMeasurement(operationName)
  }, [instrumentation, operationName])

  const endMeasurement = useCallback((startMark: string) => {
    return instrumentation.endMeasurement(operationName, startMark)
  }, [instrumentation, operationName])

  const getStatistics = useCallback(() => {
    return instrumentation.getStatistics(operationName)
  }, [instrumentation, operationName])

  return {
    startMeasurement,
    endMeasurement,
    getStatistics
  }
}

/**
 * Batch DOM operations for better performance
 */
export class DOMBatcher {
  private static instance: DOMBatcher
  private operations: Array<() => void> = []
  private isScheduled = false

  static getInstance(): DOMBatcher {
    if (!DOMBatcher.instance) {
      DOMBatcher.instance = new DOMBatcher()
    }
    return DOMBatcher.instance
  }

  /**
   * Add DOM operation to batch
   */
  batch(operation: () => void): void {
    this.operations.push(operation)

    if (!this.isScheduled) {
      this.isScheduled = true
      requestAnimationFrame(() => {
        this.flush()
      })
    }
  }

  /**
   * Flush all batched operations
   */
  private flush(): void {
    const operations = [...this.operations]
    this.operations.length = 0
    this.isScheduled = false

    // Execute all operations in a single frame
    operations.forEach(operation => {
      try {
        operation()
      } catch (error) {
        console.warn('Batched DOM operation failed:', error)
      }
    })
  }
}

// Export singleton instances
export const intelligentPreloader = IntelligentPreloader.getInstance()
export const performanceInstrumentation = PerformanceInstrumentation.getInstance()
export const domBatcher = DOMBatcher.getInstance()