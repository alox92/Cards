/**
 * Configuration de performance pour Ariba Flashcards
 * Optimisations pour améliorer la vitesse et réduire les saccades
 */

// Configuration des animations optimisées
export const ANIMATION_CONFIG = {
  // Durées d'animation réduites pour les performances
  fast: 0.15,
  normal: 0.25,
  slow: 0.35,
  
  // Préférences d'animation selon le device
  reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  
  // Easing optimisé pour les performances
  easing: [0.25, 0.46, 0.45, 0.94],
  
  // Configuration par défaut des variants
  variants: {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
  }
}

// Configuration du lazy loading
export const LAZY_CONFIG = {
  // Images lazy loading
  intersectionMargin: '50px',
  
  // Chunk loading
  chunkSize: 10,
  
  // Debounce pour les recherches
  searchDebounce: 300
}

// Configuration de la mémoire
export const MEMORY_CONFIG = {
  // Cache des cartes
  maxCachedCards: 100,
  
  // Limite des éléments DOM
  maxVisibleElements: 50,
  
  // Nettoyage automatique
  cleanupInterval: 5 * 60 * 1000 // 5 minutes
}

// Configuration des transitions de page
export const PAGE_TRANSITIONS = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 1.02 },
  transition: { duration: ANIMATION_CONFIG.normal, ease: ANIMATION_CONFIG.easing }
}

// Optimisations CSS
export const CSS_OPTIMIZATIONS = {
  // Classes communes optimisées
  cardHover: 'transform hover:scale-105 transition-transform duration-200',
  buttonHover: 'transform hover:scale-105 transition-transform duration-150',
  fadeIn: 'opacity-0 animate-fade-in',
  
  // Will-change pour les animations lourdes
  willChange: {
    transform: 'will-change-transform',
    scroll: 'will-change-scroll-position',
    opacity: 'will-change-opacity'
  }
}

// Configuration du throttling
export const THROTTLE_CONFIG = {
  scroll: 16, // 60fps
  resize: 100,
  search: 300
}

// Performance monitoring
export const PERFORMANCE_CONFIG = {
  // Métriques à surveiller
  metrics: ['FCP', 'LCP', 'FID', 'CLS'],
  
  // Seuils d'alerte
  thresholds: {
    fps: 55, // Minimum FPS acceptable
    memory: 100 * 1024 * 1024, // 100MB max
    loadTime: 3000 // 3s max pour le chargement initial
  }
}

// Fonction d'optimisation automatique
export const optimizePerformance = () => {
  // Réduire les animations si performance faible
  if (navigator.hardwareConcurrency <= 2) {
    ANIMATION_CONFIG.fast = 0.1
    ANIMATION_CONFIG.normal = 0.15
    ANIMATION_CONFIG.slow = 0.2
  }
  
  // Ajuster selon la mémoire disponible
  if ('memory' in performance) {
    const memInfo = (performance as any).memory
    if (memInfo.usedJSHeapSize > 50 * 1024 * 1024) {
      MEMORY_CONFIG.maxCachedCards = 50
      MEMORY_CONFIG.maxVisibleElements = 25
    }
  }
  
  // Adapter selon la connexion
  if ('connection' in navigator) {
    const connection = (navigator as any).connection
    if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
      LAZY_CONFIG.chunkSize = 5
      ANIMATION_CONFIG.reduced = true
    }
  }
}

// Fonction de nettoyage de mémoire
export const cleanupMemory = () => {
  // Forcer le garbage collector si disponible
  if ('gc' in window) {
    (window as any).gc()
  }
  
  // Nettoyer les caches
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        if (name.includes('old') || name.includes('cache')) {
          caches.delete(name)
        }
      })
    })
  }
}

// Export de configuration globale
export const PERFORMANCE_SETTINGS = {
  animation: ANIMATION_CONFIG,
  lazy: LAZY_CONFIG,
  memory: MEMORY_CONFIG,
  pageTransitions: PAGE_TRANSITIONS,
  css: CSS_OPTIMIZATIONS,
  throttle: THROTTLE_CONFIG,
  monitoring: PERFORMANCE_CONFIG
}
