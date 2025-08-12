/**
 * 🚀 PERFORMANCE OPTIMIZER ULTRA-SMOOTH 120FPS
 * Optimisations globales pour animations fluides dans toute l'app
 */

// ⚡ Configuration timing ultra-optimisée
export const TIMING_CONFIGS = {
  // Cubic-bezier ultra-fluides testées pour 120fps
  SMOOTH: [0.25, 0.46, 0.45, 0.94] as const,
  SMOOTH_IN: [0.55, 0.085, 0.68, 0.53] as const,
  SMOOTH_OUT: [0.25, 0.46, 0.45, 0.94] as const,
  SMOOTH_IN_OUT: [0.445, 0.05, 0.55, 0.95] as const,
  BOUNCE: [0.68, -0.55, 0.265, 1.55] as const,
  ELASTIC: [0.175, 0.885, 0.32, 1.275] as const,
  
  // Durées optimisées pour 120fps
  INSTANT: 100,
  FAST: 150,
  NORMAL: 250,
  SLOW: 350,
  SLOWEST: 500,
} as const

// 🎯 Framer Motion variants optimisées
export const MOTION_VARIANTS = {
  // Variants pour boutons ultra-fluides
  button: {
    initial: { 
      scale: 1, 
      y: 0,
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      transition: { duration: 0.1, ease: TIMING_CONFIGS.SMOOTH }
    },
    hover: { 
      scale: 1.02, 
      y: -2,
      boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
      transition: { duration: 0.15, ease: TIMING_CONFIGS.SMOOTH_OUT }
    },
    tap: { 
      scale: 0.98, 
      y: 0,
      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
      transition: { duration: 0.1, ease: TIMING_CONFIGS.SMOOTH_IN }
    },
    focus: {
      scale: 1.01,
      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.3), 0 4px 12px rgba(0,0,0,0.1)',
      transition: { duration: 0.15, ease: TIMING_CONFIGS.SMOOTH }
    }
  },

  // Variants pour cartes avec effets 3D
  card: {
    initial: { 
      scale: 1, 
      y: 0, 
      rotateX: 0,
      rotateY: 0,
      z: 0,
      transition: { duration: 0.25, ease: TIMING_CONFIGS.SMOOTH }
    },
    hover: { 
      scale: 1.02, 
      y: -8, 
      rotateX: 5,
      rotateY: 5,
      z: 20,
      transition: { duration: 0.25, ease: TIMING_CONFIGS.SMOOTH_OUT }
    },
    tap: { 
      scale: 0.98,
      transition: { duration: 0.1, ease: TIMING_CONFIGS.SMOOTH_IN }
    }
  },

  // Variants pour apparition en page
  pageTransition: {
    initial: { 
      opacity: 0, 
      y: 20, 
      scale: 0.95,
      filter: 'blur(10px)'
    },
    animate: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      filter: 'blur(0px)',
      transition: { 
        duration: 0.5, 
        ease: TIMING_CONFIGS.SMOOTH_OUT,
        staggerChildren: 0.1
      }
    },
    exit: { 
      opacity: 0, 
      y: -20, 
      scale: 0.95,
      filter: 'blur(5px)',
      transition: { duration: 0.25, ease: TIMING_CONFIGS.SMOOTH_IN }
    }
  },

  // Variants pour listes avec stagger
  listContainer: {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: TIMING_CONFIGS.SMOOTH,
        staggerChildren: 0.08,
        delayChildren: 0.1
      }
    }
  },

  listItem: {
    initial: { 
      opacity: 0, 
      x: -20, 
      scale: 0.95
    },
    animate: { 
      opacity: 1, 
      x: 0, 
      scale: 1,
      transition: { 
        duration: 0.25, 
        ease: TIMING_CONFIGS.SMOOTH_OUT 
      }
    }
  },

  // Variants pour modals avec backdrop blur
  modal: {
    initial: { 
      opacity: 0, 
      scale: 0.9, 
      y: 20,
      filter: 'blur(10px)'
    },
    animate: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      filter: 'blur(0px)',
      transition: { 
        duration: 0.3, 
        ease: TIMING_CONFIGS.SMOOTH_OUT 
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9, 
      y: 20,
      filter: 'blur(5px)',
      transition: { 
        duration: 0.2, 
        ease: TIMING_CONFIGS.SMOOTH_IN 
      }
    }
  },

  // Variants pour backdrop des modals
  backdrop: {
    initial: { opacity: 0, backdropFilter: 'blur(0px)' },
    animate: { 
      opacity: 1, 
      backdropFilter: 'blur(20px)',
      transition: { duration: 0.3, ease: TIMING_CONFIGS.SMOOTH }
    },
    exit: { 
      opacity: 0, 
      backdropFilter: 'blur(0px)',
      transition: { duration: 0.2, ease: TIMING_CONFIGS.SMOOTH }
    }
  }
}

// 🎨 Styles CSS optimisés pour hardware acceleration
export const PERFORMANCE_STYLES = {
  // Style de base pour hardware acceleration
  base: {
    transform: 'translateZ(0)',
    backfaceVisibility: 'hidden' as const,
    willChange: 'transform, opacity, box-shadow' as const,
    WebkitBackfaceVisibility: 'hidden' as const,
    WebkitPerspective: 1000,
    perspective: 1000
  },

  // Style pour boutons ultra-optimisés
  button: {
    transform: 'translateZ(0) scale(1)',
    backfaceVisibility: 'hidden' as const,
    willChange: 'transform, box-shadow, opacity, background' as const,
    WebkitTapHighlightColor: 'transparent',
    WebkitTouchCallout: 'none' as const,
    WebkitUserSelect: 'none' as const,
    userSelect: 'none' as const,
    contain: 'layout style' as const,
    isolation: 'isolate' as const
  },

  // Style pour cartes 3D
  card3D: {
    transform: 'translateZ(0)',
    transformStyle: 'preserve-3d' as const,
    backfaceVisibility: 'hidden' as const,
    willChange: 'transform, box-shadow, opacity' as const,
    perspective: 2000,
    contain: 'layout style' as const
  },

  // Style pour scrolling optimisé
  scroll: {
    WebkitOverflowScrolling: 'touch' as const,
    scrollBehavior: 'smooth' as const,
    willChange: 'scroll-position' as const,
    overscrollBehavior: 'contain' as const
  }
}

// 🚀 Fonctions utilitaires pour performance
export class PerformanceOptimizer {
  private static rafId: number | null = null
  private static idleSupported = typeof (globalThis as any).requestIdleCallback !== 'undefined'
  
  /**
   * RequestAnimationFrame optimisé pour 120fps
   */
  static smoothRAF(callback: () => void): void {
    if (this.rafId) cancelAnimationFrame(this.rafId)
    this.rafId = requestAnimationFrame(() => {
      requestAnimationFrame(callback) // Double RAF pour 120fps
    })
  }

  /** Planifie une tâche non critique après le rendu initial */
  static scheduleIdle(task: () => void, timeout = 500){
    if(this.idleSupported){
      ;(globalThis as any).requestIdleCallback(task, { timeout })
    } else {
      setTimeout(task, Math.min(timeout, 200))
    }
  }

  /**
   * Debounce optimisé pour events haute fréquence
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number = 16 // ~60fps
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout
    return (...args: Parameters<T>) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func.apply(this, args), wait)
    }
  }

  /**
   * Throttle pour scroll events ultra-smooth
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number = 8 // ~120fps
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(this, args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  }

  /**
   * Intersection Observer optimisé pour lazy loading
   */
  static createOptimizedObserver(
    callback: IntersectionObserverCallback,
    options: IntersectionObserverInit = {}
  ): IntersectionObserver {
    const defaultOptions = {
      rootMargin: '50px',
      threshold: [0, 0.25, 0.5, 0.75, 1],
      ...options
    }
    
    return new IntersectionObserver(callback, defaultOptions)
  }

  /**
   * Préchargement des assets critiques
   */
  static preloadCriticalAssets(assets: string[]): Promise<void[]> {
    return Promise.all(
      assets.map(asset => {
        return new Promise<void>((resolve, reject) => {
          const link = document.createElement('link')
          link.rel = 'preload'
          link.href = asset
          link.onload = () => resolve()
          link.onerror = reject
          document.head.appendChild(link)
        })
      })
    )
  }

  /**
   * Optimisation memory leaks avec WeakMap
   */
  static createWeakCache<K extends object, V>(): {
    get: (key: K) => V | undefined
    set: (key: K, value: V) => void
    delete: (key: K) => boolean
  } {
    const cache = new WeakMap<K, V>()
    
    return {
      get: (key: K) => cache.get(key),
      set: (key: K, value: V) => cache.set(key, value),
      delete: (key: K) => cache.delete(key)
    }
  }

  /**
   * Nettoyage automatique des listeners
   */
  static autoCleanupListener(
    element: Element | Window | Document,
    event: string,
    listener: EventListener,
    options?: AddEventListenerOptions
  ): () => void {
    element.addEventListener(event, listener, options)
    
    const cleanup = () => {
      element.removeEventListener(event, listener, options)
    }
    
    // Auto-cleanup avec WeakRef si supporté
    if (typeof (globalThis as any).WeakRef !== 'undefined' && typeof (globalThis as any).FinalizationRegistry !== 'undefined') {
      const WeakRefConstructor = (globalThis as any).WeakRef;
      const FinalizationRegistryConstructor = (globalThis as any).FinalizationRegistry;
      
      const elementRef = new WeakRefConstructor(element);
      const registry = new FinalizationRegistryConstructor(() => {
        const el = elementRef.deref();
        if (el) cleanup();
      });
      registry.register(element, null);
    }
    
    return cleanup
  }

  /**
   * Force la compilation des shaders pour les animations CSS
   */
  static warmupGPU(): void {
    const warmupElement = document.createElement('div')
    warmupElement.style.cssText = `
      position: fixed;
      top: -1px;
      left: -1px;
      width: 1px;
      height: 1px;
      opacity: 0;
      pointer-events: none;
      transform: translateZ(0) scale3d(1, 1, 1);
      filter: blur(0);
      will-change: transform;
    `
    
    document.body.appendChild(warmupElement)
    
    // Force le reflow pour initialiser le GPU
    warmupElement.offsetHeight
    
    // Animation de warmup
    warmupElement.style.transform = 'translateZ(0) scale3d(1.01, 1.01, 1)'
    
    setTimeout(() => {
      document.body.removeChild(warmupElement)
    }, 100)
  }
}

// 🎯 Hook personnalisé pour animations optimisées
export const useOptimizedAnimation = () => {
  return {
    variants: MOTION_VARIANTS,
    timing: TIMING_CONFIGS,
    styles: PERFORMANCE_STYLES,
    utils: PerformanceOptimizer
  }
}

// 🚀 Export par défaut
export default {
  TIMING_CONFIGS,
  MOTION_VARIANTS,
  PERFORMANCE_STYLES,
  PerformanceOptimizer,
  useOptimizedAnimation
}
