// Externalisation des règles d'optimisation (Phase 2)
import type { PerformanceMetrics, OptimizationRule } from '@/core/PerformanceOptimizer'
import { globalEventBus } from '@/core/eventBus'

interface RulesContext {
  budget: { minFps: number }
  run: (detail: any) => void
  helpers: {
    performMemoryCleanup: () => Promise<void>
    enableLazyLoading: () => void
    offloadTasksToWorkers: () => void
    performIntelligentPreload: () => Promise<void>
  }
}

export function defaultOptimizationRules(ctx: RulesContext): OptimizationRule[] {
  return [
    {
      id: 'reduce-quality-low-fps',
      name: 'Réduction qualité (FPS faible)',
      condition: (m: PerformanceMetrics) => m.fps < ctx.budget.minFps,
      action: () => { ctx.run({ type: 'rendering', action: 'reduceQuality', reason: 'low-fps' }); globalEventBus.emit('optimization', { rule: 'reduce-quality-low-fps', timestamp: Date.now() }) },
      priority: 1,
      cooldown: 5000,
      lastExecuted: 0
    },
    {
      id: 'cleanup-memory-high-usage',
      name: 'Nettoyage mémoire',
      condition: (m: PerformanceMetrics) => m.memoryUsagePercent > 80,
      action: async () => { await ctx.helpers.performMemoryCleanup(); globalEventBus.emit('optimization', { rule: 'cleanup-memory-high-usage', timestamp: Date.now() }) },
      priority: 2,
      cooldown: 10000,
      lastExecuted: 0
    },
    {
      id: 'enable-lazy-loading',
      name: 'Activation lazy loading',
      condition: (m: PerformanceMetrics) => m.activeElements > 100,
      action: () => { ctx.helpers.enableLazyLoading(); globalEventBus.emit('optimization', { rule: 'enable-lazy-loading', timestamp: Date.now() }) },
      priority: 3,
      cooldown: 15000,
      lastExecuted: 0
    },
    {
      id: 'offload-to-workers',
      name: 'Délégation aux Web Workers',
      condition: (m: PerformanceMetrics) => m.scriptTime > 50,
      action: () => { ctx.helpers.offloadTasksToWorkers(); globalEventBus.emit('optimization', { rule: 'offload-to-workers', timestamp: Date.now() }) },
      priority: 4,
      cooldown: 20000,
      lastExecuted: 0
    },
    {
      id: 'intelligent-preload',
      name: 'Preload intelligent',
      condition: (m: PerformanceMetrics) => m.cacheHitRate < 90 && m.pendingRequests < 3,
      action: async () => { await ctx.helpers.performIntelligentPreload(); globalEventBus.emit('optimization', { rule: 'intelligent-preload', timestamp: Date.now() }) },
      priority: 5,
      cooldown: 30000,
      lastExecuted: 0
    }
  ]
}
