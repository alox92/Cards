/**
 * Enhanced Performance Monitoring with React Concurrent Features
 */

import { ConcurrentPerformanceMonitor } from './reactConcurrentFeatures'

interface PerformanceMetrics {
  renderTime: number
  memoryUsage: number
  fps: number
  longTasks: number
  componentRenders: Map<string, number>
  transitionMetrics: Array<{
    name: string
    duration: number
    timestamp: number
  }>
}

interface ComponentMetrics {
  name: string
  renderCount: number
  averageRenderTime: number
  lastRenderTime: number
  isHotComponent: boolean
}

export class EnhancedPerformanceMonitor {
  private static instance: EnhancedPerformanceMonitor
  private metrics: PerformanceMetrics
  private isMonitoring = false
  private observers: PerformanceObserver[] = []
  private componentTimings = new Map<string, number[]>()
  private longTaskThreshold = 50 // ms
  private hotComponentThreshold = 3 // ms average render time

  private constructor() {
    this.metrics = {
      renderTime: 0,
      memoryUsage: 0,
      fps: 0,
      longTasks: 0,
      componentRenders: new Map(),
      transitionMetrics: []
    }
  }

  static getInstance(): EnhancedPerformanceMonitor {
    if (!EnhancedPerformanceMonitor.instance) {
      EnhancedPerformanceMonitor.instance = new EnhancedPerformanceMonitor()
    }
    return EnhancedPerformanceMonitor.instance
  }

  /**
   * Start monitoring performance with React concurrent features
   */
  startMonitoring(): void {
    if (this.isMonitoring) return

    this.isMonitoring = true
    this.setupConcurrentObservers()
    this.startFPSMonitoring()
    this.startMemoryMonitoring()
  }

  /**
   * Stop monitoring and cleanup
   */
  stopMonitoring(): void {
    this.isMonitoring = false
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
    ConcurrentPerformanceMonitor.cleanup()
  }

  /**
   * Mark component render start
   */
  markComponentRenderStart(componentName: string): string {
    const markName = `component-${componentName}-start-${Date.now()}`
    performance.mark(markName)
    return markName
  }

  /**
   * Mark component render end and calculate metrics
   */
  markComponentRenderEnd(componentName: string, startMark: string): void {
    const endMark = `component-${componentName}-end-${Date.now()}`
    performance.mark(endMark)
    
    try {
      const measureName = `component-${componentName}-render`
      performance.measure(measureName, startMark, endMark)
      
      const entries = performance.getEntriesByName(measureName)
      if (entries.length > 0) {
        const latestEntry = entries[entries.length - 1]
        this.recordComponentRender(componentName, latestEntry.duration)
      }
    } catch (error) {
      // Performance API might not support all features
      console.warn('Performance measurement failed:', error)
    }
  }

  /**
   * Record component render timing
   */
  private recordComponentRender(componentName: string, duration: number): void {
    // Update component render count
    const currentCount = this.metrics.componentRenders.get(componentName) || 0
    this.metrics.componentRenders.set(componentName, currentCount + 1)

    // Track timing history
    if (!this.componentTimings.has(componentName)) {
      this.componentTimings.set(componentName, [])
    }
    
    const timings = this.componentTimings.get(componentName)!
    timings.push(duration)
    
    // Keep only last 50 measurements
    if (timings.length > 50) {
      timings.shift()
    }

    // Log hot components (>3ms average render time)
    const averageTime = timings.reduce((sum, time) => sum + time, 0) / timings.length
    if (averageTime > this.hotComponentThreshold) {
      console.warn(`🔥 Hot component detected: ${componentName} (${averageTime.toFixed(2)}ms average)`)
    }
  }

  /**
   * Get component performance metrics
   */
  getComponentMetrics(): ComponentMetrics[] {
    const metrics: ComponentMetrics[] = []

    this.componentTimings.forEach((timings, componentName) => {
      const renderCount = this.metrics.componentRenders.get(componentName) || 0
      const averageRenderTime = timings.reduce((sum, time) => sum + time, 0) / timings.length
      const lastRenderTime = timings[timings.length - 1] || 0
      const isHotComponent = averageRenderTime > this.hotComponentThreshold

      metrics.push({
        name: componentName,
        renderCount,
        averageRenderTime: Math.round(averageRenderTime * 100) / 100,
        lastRenderTime: Math.round(lastRenderTime * 100) / 100,
        isHotComponent
      })
    })

    return metrics.sort((a, b) => b.averageRenderTime - a.averageRenderTime)
  }

  /**
   * Setup concurrent performance observers
   */
  private setupConcurrentObservers(): void {
    // Monitor long tasks
    ConcurrentPerformanceMonitor.observeLongTasks((entry) => {
      this.metrics.longTasks++
      console.warn(`🐌 Long task detected: ${entry.duration.toFixed(2)}ms`)
    })

    // Monitor React transitions
    ConcurrentPerformanceMonitor.observeTransitions((entry) => {
      this.metrics.transitionMetrics.push({
        name: entry.name,
        duration: entry.duration,
        timestamp: entry.startTime
      })

      // Keep only last 100 transition metrics
      if (this.metrics.transitionMetrics.length > 100) {
        this.metrics.transitionMetrics.shift()
      }
    })

    // Monitor navigation timing
    if ('PerformanceObserver' in window) {
      try {
        const navigationObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              console.log('📊 Navigation timing:', {
                domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
                loadComplete: entry.loadEventEnd - entry.loadEventStart
              })
            }
          }
        })

        navigationObserver.observe({ entryTypes: ['navigation'] })
        this.observers.push(navigationObserver)
      } catch (e) {
        // Navigation timing not supported
      }
    }
  }

  /**
   * Start FPS monitoring
   */
  private startFPSMonitoring(): void {
    let frames = 0
    let lastTime = performance.now()

    const updateFPS = () => {
      if (!this.isMonitoring) return

      frames++
      const currentTime = performance.now()
      
      if (currentTime - lastTime >= 1000) { // Update every second
        this.metrics.fps = Math.round((frames * 1000) / (currentTime - lastTime))
        frames = 0
        lastTime = currentTime

        // Warn if FPS is low
        if (this.metrics.fps < 30) {
          console.warn(`⚠️ Low FPS detected: ${this.metrics.fps}`)
        }
      }

      requestAnimationFrame(updateFPS)
    }

    requestAnimationFrame(updateFPS)
  }

  /**
   * Start memory monitoring
   */
  private startMemoryMonitoring(): void {
    const updateMemory = () => {
      if (!this.isMonitoring) return

      if ('memory' in performance) {
        const memInfo = (performance as any).memory
        this.metrics.memoryUsage = Math.round(memInfo.usedJSHeapSize / 1024 / 1024) // MB

        // Warn if memory usage is high
        if (this.metrics.memoryUsage > 100) {
          console.warn(`🧠 High memory usage: ${this.metrics.memoryUsage}MB`)
        }
      }

      setTimeout(updateMemory, 5000) // Update every 5 seconds
    }

    updateMemory()
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  /**
   * Get performance summary for debugging
   */
  getPerformanceSummary(): {
    hotComponents: ComponentMetrics[]
    recentTransitions: Array<{ name: string; duration: number }>
    systemMetrics: {
      fps: number
      memoryMB: number
      longTasks: number
    }
  } {
    const componentMetrics = this.getComponentMetrics()
    const hotComponents = componentMetrics.filter(c => c.isHotComponent)
    
    const recentTransitions = this.metrics.transitionMetrics
      .slice(-10) // Last 10 transitions
      .map(t => ({ name: t.name, duration: Math.round(t.duration * 100) / 100 }))

    return {
      hotComponents,
      recentTransitions,
      systemMetrics: {
        fps: this.metrics.fps,
        memoryMB: this.metrics.memoryUsage,
        longTasks: this.metrics.longTasks
      }
    }
  }

  /**
   * Log performance report to console
   */
  logPerformanceReport(): void {
    const summary = this.getPerformanceSummary()
    
    console.group('🎯 Performance Report')
    
    console.log('📊 System Metrics:', summary.systemMetrics)
    
    if (summary.hotComponents.length > 0) {
      console.group('🔥 Hot Components (>3ms render time)')
      summary.hotComponents.forEach(component => {
        console.log(`${component.name}: ${component.averageRenderTime}ms avg (${component.renderCount} renders)`)
      })
      console.groupEnd()
    }
    
    if (summary.recentTransitions.length > 0) {
      console.group('⚡ Recent Transitions')
      summary.recentTransitions.forEach(transition => {
        console.log(`${transition.name}: ${transition.duration}ms`)
      })
      console.groupEnd()
    }
    
    console.groupEnd()
  }
}

/**
 * Performance monitoring hook for React components
 */
export function usePerformanceMonitor(componentName: string) {
  const monitor = EnhancedPerformanceMonitor.getInstance()

  const markRenderStart = () => monitor.markComponentRenderStart(componentName)
  const markRenderEnd = (startMark: string) => monitor.markComponentRenderEnd(componentName, startMark)

  return { markRenderStart, markRenderEnd }
}

// Export singleton instance
export const performanceMonitor = EnhancedPerformanceMonitor.getInstance()