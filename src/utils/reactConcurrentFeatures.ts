/**
 * React Concurrent Features Utilities
 * Enhanced concurrent patterns for better performance
 */

import {
  startTransition,
  useDeferredValue,
  useTransition,
  useId,
  useCallback,
} from "react";

// Performance-aware state batching
export class ConcurrentStateManager {
  private static pendingUpdates: (() => void)[] = [];
  private static isProcessing = false;

  /**
   * Batch non-urgent state updates using React transition
   */
  static batchUpdates(updates: (() => void)[]) {
    this.pendingUpdates.push(...updates);

    if (!this.isProcessing) {
      this.isProcessing = true;
      startTransition(() => {
        const batch = [...this.pendingUpdates];
        this.pendingUpdates.length = 0;
        this.isProcessing = false;

        batch.forEach((update) => {
          try {
            update();
          } catch (error) {
            // Batch update failed silencieux
          }
        });
      });
    }
  }

  /**
   * Schedule heavy computation with concurrent features
   */
  static scheduleHeavyUpdate(
    update: () => void,
    options?: { isPriority?: boolean }
  ) {
    if (options?.isPriority) {
      // Immediate update for critical UI
      update();
    } else {
      // Defer non-critical updates
      startTransition(update);
    }
  }
}

/**
 * Hook for managing concurrent transitions
 */
export function useConcurrentTransition() {
  const [isPending, startTransition] = useTransition();
  const transitionId = useId();

  const executeTransition = useCallback((callback: () => void) => {
    startTransition(() => {
      performance.mark(`transition-start-${transitionId}`);
      try {
        callback();
      } finally {
        performance.mark(`transition-end-${transitionId}`);
        performance.measure(
          `transition-${transitionId}`,
          `transition-start-${transitionId}`,
          `transition-end-${transitionId}`
        );
      }
    });
  }, []);

  return {
    isPending,
    executeTransition,
    transitionId,
  };
}

/**
 * Hook for deferred heavy data processing
 */
export function useDeferredSearch<T>(
  data: T[],
  searchTerm: string,
  threshold: number = 200
) {
  const deferredSearchTerm = useDeferredValue(searchTerm);

  // Only defer for large datasets to avoid unnecessary complexity
  const shouldDefer = data.length > threshold;
  const effectiveSearchTerm = shouldDefer ? deferredSearchTerm : searchTerm;

  return {
    searchTerm: effectiveSearchTerm,
    isSearchDeferred: shouldDefer && deferredSearchTerm !== searchTerm,
  };
}

/**
 * Concurrent-aware performance monitoring
 */
export class ConcurrentPerformanceMonitor {
  private static observers = new Map<string, PerformanceObserver>();

  static observeLongTasks(callback: (entry: PerformanceEntry) => void) {
    if (!("PerformanceObserver" in window)) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          // Tasks longer than 50ms
          callback(entry);
        }
      }
    });

    try {
      observer.observe({ entryTypes: ["longtask"] });
      this.observers.set("longtask", observer);
    } catch (_e) {
      // Longtask not supported
    }
  }

  static observeTransitions(callback: (entry: PerformanceEntry) => void) {
    if (!("PerformanceObserver" in window)) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name.includes("transition-")) {
          callback(entry);
        }
      }
    });

    try {
      observer.observe({ entryTypes: ["measure"] });
      this.observers.set("transitions", observer);
    } catch (_e) {
      // Measure not supported
    }
  }

  static cleanup() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();
  }
}

/**
 * Rendering pause mechanism for massive operations
 */
export class RenderingPauseManager {
  private static isPaused = false;
  private static pauseResolvers: (() => void)[] = [];

  static pauseRendering(): Promise<void> {
    this.isPaused = true;
    return new Promise((resolve) => {
      this.pauseResolvers.push(resolve);
    });
  }

  static resumeRendering() {
    this.isPaused = false;
    this.pauseResolvers.forEach((resolve) => resolve());
    this.pauseResolvers.length = 0;
  }

  static get isRenderingPaused() {
    return this.isPaused;
  }

  /**
   * Execute heavy operation with rendering pause
   */
  static async executeWithPause<T>(operation: () => Promise<T>): Promise<T> {
    this.pauseRendering();
    try {
      return await operation();
    } finally {
      // Resume on next frame to allow React to process
      requestAnimationFrame(() => this.resumeRendering());
    }
  }
}
