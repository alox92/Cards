/**
 * Fluid Transition Mastery - Système de transitions fluides et animations
 * 
 * Ce système gère les transitions entre les pages, animations et microinteractions
 * pour créer une expérience utilisateur premium et fluide.
 */

export type TransitionType = 
  | 'slide-left'
  | 'slide-right'
  | 'slide-up'
  | 'slide-down'
  | 'fade'
  | 'scale'
  | 'flip'
  | 'cube'
  | 'morph'
  | 'elastic'

export type EasingFunction = 
  | 'linear'
  | 'ease'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'spring'
  | 'bounce'

export interface TransitionConfig {
  type: TransitionType
  duration: number
  easing: EasingFunction
  delay: number
  stagger?: number
  reverse?: boolean
}

export interface AnimationState {
  id: string
  element: HTMLElement
  startTime: number
  duration: number
  progress: number
  isRunning: boolean
  isPaused: boolean
  onComplete?: () => void
  onUpdate?: (progress: number) => void
}

export interface FluidMotionSettings {
  globalScale: number
  respectReducedMotion: boolean
  adaptiveDuration: boolean
  enableHapticFeedback: boolean
  performanceMode: 'smooth' | 'performance' | 'battery-saver'
}

export class FluidTransitionMastery {
  private settings: FluidMotionSettings
  private activeAnimations = new Map<string, AnimationState>()
  private animationFrameId: number | null = null
  private lastFrameTime = 0
  private isInitialized = false
  private globallyPaused = false

  constructor() {
    this.settings = {
      globalScale: 1.0,
      respectReducedMotion: true,
      adaptiveDuration: true,
      enableHapticFeedback: false,
      performanceMode: 'smooth'
    }
  }

  /**
   * Initialise le système de transitions fluides
   */
  async initialize(): Promise<void> {
    try {
      if(this.isInitialized){
        // Idempotence: ne pas ré-initialiser (utile avec React StrictMode/dev remount)
        return
      }
  import('@/utils/logger').then(m=> m.logger.info('FluidTransition','🌊 Initialisation')).catch(()=>{})
      
      // Détecter les préférences utilisateur
      this.detectMotionPreferences()
      
      // Démarrer la boucle d'animation
      this.startAnimationLoop()
      
      // Optimiser les performances selon l'appareil
      this.optimizeForDevice()
      
      this.isInitialized = true
  import('@/utils/logger').then(m=> m.logger.info('FluidTransition','✅ Initialisé')).catch(()=>{})
      
    } catch (error) {
      import('@/utils/logger').then(m=> m.logger.error('FluidTransition','❌ Erreur initialisation', { error: (error as any)?.message })).catch(()=>{})
      throw error
    }
  }

  /**
   * Crée une transition fluide entre deux éléments
   */
  async createTransition(
    _fromElement: HTMLElement | null,
    toElement: HTMLElement,
    config: TransitionConfig
  ): Promise<void> {
    const transitionId = `transition-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
  import('@/utils/logger').then(m=> m.logger.debug('FluidTransition',`Création transition ${config.type}`)).catch(()=>{})
    
    return new Promise((resolve) => {
      const startTime = performance.now()
      const adjustedDuration = this.getAdaptiveDuration(config.duration)
      
      const animationState: AnimationState = {
        id: transitionId,
        element: toElement,
        startTime,
        duration: adjustedDuration,
        progress: 0,
        isRunning: true,
        isPaused: false,
        onComplete: () => {
          this.activeAnimations.delete(transitionId)
          resolve()
        }
      }
      
      this.activeAnimations.set(transitionId, animationState)
      
      // Préparer l'élément pour la transition
      this.prepareElement(toElement, config)
      
      // Démarrer l'animation
      this.executeTransition(animationState, config)
    })
  }

  /**
   * Animation d'entrée pour un élément
   */
  async animateIn(element: HTMLElement, config?: Partial<TransitionConfig>): Promise<void> {
    const fullConfig: TransitionConfig = {
      type: 'fade',
      duration: 200,
      easing: 'ease-out',
      delay: 0,
      ...config
    }
    
    return this.createTransition(null, element, fullConfig)
  }

  /**
   * Animation de sortie pour un élément
   */
  async animateOut(element: HTMLElement, config?: Partial<TransitionConfig>): Promise<void> {
    const fullConfig: TransitionConfig = {
      type: 'fade',
      duration: 200,
      easing: 'ease-in',
      delay: 0,
      ...config
    }
    
    return this.createTransition(element, element, fullConfig)
  }

  /**
   * Détecte les préférences de mouvement de l'utilisateur
   */
  private detectMotionPreferences(): void {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    
    if (prefersReducedMotion && this.settings.respectReducedMotion) {
      this.settings.globalScale = 0.2
  import('@/utils/logger').then(m=> m.logger.info('FluidTransition','Mode réduit (accessibilité)')).catch(()=>{})
    }
  }

  /**
   * Démarre la boucle d'animation principale
   */
  private startAnimationLoop(): void {
    const tick = (currentTime: number) => {
      const deltaTime = currentTime - this.lastFrameTime
      this.lastFrameTime = currentTime
      
      // Mettre à jour toutes les animations actives
      this.updateAnimations(deltaTime)
      
      this.animationFrameId = requestAnimationFrame(tick)
    }
    
    this.animationFrameId = requestAnimationFrame(tick)
  }

  /**
   * Met à jour toutes les animations en cours
   */
  private updateAnimations(_deltaTime: number): void {
    for (const [, animation] of this.activeAnimations) {
      if (!animation.isRunning || animation.isPaused) continue
      
      const elapsed = performance.now() - animation.startTime
      animation.progress = Math.min(elapsed / animation.duration, 1)
      
      // Callback de mise à jour
      if (animation.onUpdate) {
        animation.onUpdate(animation.progress)
      }
      
      // Vérifier si l'animation est terminée
      if (animation.progress >= 1) {
        animation.isRunning = false
        if (animation.onComplete) {
          animation.onComplete()
        }
      }
    }
  }

  /**
   * Prépare l'élément pour la transition
   */
  private prepareElement(element: HTMLElement, config: TransitionConfig): void {
    element.style.transition = 'none'
    element.style.transform = ''
    element.style.opacity = ''
    
    // Configurer les propriétés initiales selon le type de transition
    switch (config.type) {
      case 'fade':
        element.style.opacity = '0'
        break
      case 'slide-left':
        element.style.transform = 'translateX(100%)'
        break
      case 'slide-right':
        element.style.transform = 'translateX(-100%)'
        break
      case 'slide-up':
        element.style.transform = 'translateY(100%)'
        break
      case 'slide-down':
        element.style.transform = 'translateY(-100%)'
        break
      case 'scale':
        element.style.transform = 'scale(0.8)'
        element.style.opacity = '0'
        break
    }
  }

  /**
   * Exécute la transition
   */
  private executeTransition(animation: AnimationState, config: TransitionConfig): void {
    const element = animation.element
    const easingFunction = this.getEasingFunction(config.easing)
    
    // Fonction d'animation
    animation.onUpdate = (progress: number) => {
      const easedProgress = easingFunction(progress)
      
      switch (config.type) {
        case 'fade':
          element.style.opacity = easedProgress.toString()
          break
        case 'slide-left':
          element.style.transform = `translateX(${(1 - easedProgress) * 100}%)`
          break
        case 'slide-right':
          element.style.transform = `translateX(${(easedProgress - 1) * 100}%)`
          break
        case 'slide-up':
          element.style.transform = `translateY(${(1 - easedProgress) * 100}%)`
          break
        case 'slide-down':
          element.style.transform = `translateY(${(easedProgress - 1) * 100}%)`
          break
        case 'scale':
          const scale = 0.8 + (easedProgress * 0.2)
          element.style.transform = `scale(${scale})`
          element.style.opacity = easedProgress.toString()
          break
      }
    }
  }

  /**
   * Optimise pour l'appareil actuel
   */
  private optimizeForDevice(): void {
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    
    if (isMobile) {
      this.settings.globalScale *= 0.8
  import('@/utils/logger').then(m=> m.logger.debug('FluidTransition','Optimisations mobile')).catch(()=>{})
    }
  }

  /**
   * Obtient la durée adaptive selon les performances
   */
  private getAdaptiveDuration(baseDuration: number): number {
    if (!this.settings.adaptiveDuration) return baseDuration
    
    return baseDuration * this.settings.globalScale
  }

  /**
   * Obtient la fonction d'easing
   */
  private getEasingFunction(easing: EasingFunction): (t: number) => number {
    switch (easing) {
      case 'linear':
        return (t: number) => t
      case 'ease':
        return (t: number) => t * t * (3 - 2 * t)
      case 'ease-in':
        return (t: number) => t * t
      case 'ease-out':
        return (t: number) => t * (2 - t)
      case 'ease-in-out':
        return (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
      case 'spring':
        return (t: number) => 1 - Math.cos(t * Math.PI * 0.5)
      case 'bounce':
        return (t: number) => {
          if (t < 1 / 2.75) return 7.5625 * t * t
          if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75
          if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375
          return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375
        }
      default:
        return (t: number) => t
    }
  }

  /**
   * Obtient les paramètres actuels
   */
  getSettings(): FluidMotionSettings {
    return { ...this.settings }
  }

  /**
   * Met à jour les paramètres
   */
  updateSettings(newSettings: Partial<FluidMotionSettings>): void {
    this.settings = { ...this.settings, ...newSettings }
  import('@/utils/logger').then(m=> m.logger.info('FluidTransition','Paramètres mis à jour', { settings: this.settings })).catch(()=>{})
  }

  /**
   * Retourne l'état d'initialisation
   */
  isReady(): boolean {
    return this.isInitialized
  }

  /**
   * Nettoie et arrête le système
   */
  shutdown(): void {
  if(!this.isInitialized) return
  if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId)
  this.animationFrameId = null
  this.activeAnimations.clear()
  this.isInitialized = false
  import('@/utils/logger').then(m=> m.logger.info('FluidTransition','🛑 Arrêt')).catch(()=>{})
  }

  pauseAll(){
    if(this.globallyPaused) return
    this.globallyPaused = true
    import('@/utils/logger').then(m=> m.logger.debug('FluidTransition','⏸️ Pause globale animations')).catch(()=>{})
  }
  resumeAll(){
    if(!this.globallyPaused) return
    this.globallyPaused = false
    import('@/utils/logger').then(m=> m.logger.debug('FluidTransition','▶️ Reprise globale animations')).catch(()=>{})
  }
}

// Singleton global pour éviter multi-initialisations / arrêts répétés
let __ftmSingleton: FluidTransitionMastery | null = null
export function getFluidTransitionMastery(): FluidTransitionMastery {
  if(!__ftmSingleton) __ftmSingleton = new FluidTransitionMastery()
  return __ftmSingleton
}
