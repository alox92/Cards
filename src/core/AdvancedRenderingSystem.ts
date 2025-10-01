/**
 * Advanced Rendering System - Système de rendu optimisé pour performance maximale
 * 
 * Ce système gère le rendu haute performance avec WebGL, optimisations Canvas,
 * et adaptation dynamique de la qualité selon les capacités de l'appareil.
 */

import { logger } from '@/utils/logger'

export type RenderQuality = 'low' | 'medium' | 'high' | 'ultra'
export type AnimationProfile = 'reduced' | 'standard' | 'enhanced' | 'premium'

export interface RenderCapabilities {
  webglSupport: boolean
  webgl2Support: boolean
  maxTextureSize: number
  maxViewportDims: [number, number]
  supportedExtensions: string[]
  devicePixelRatio: number
  hardwareConcurrency: number
}

export interface RenderMetrics {
  fps: number
  frameTime: number
  gpuMemoryUsage: number
  drawCalls: number
  texturesLoaded: number
  shadersCompiled: number
  lastRenderTime: number
}

export interface AnimationSettings {
  scale: number
  duration: number
  easing: string
  reducedMotion: boolean
  gpuAcceleration: boolean
}

export class AdvancedRenderingSystem {
  private canvas: HTMLCanvasElement | null = null
  private gl: WebGLRenderingContext | WebGL2RenderingContext | null = null
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  
  private renderQuality: RenderQuality = 'high'
  private animationProfile: AnimationProfile = 'standard'
  private capabilities: RenderCapabilities | null = null
  private metrics: RenderMetrics = {
    fps: 60,
    frameTime: 16.67,
    gpuMemoryUsage: 0,
    drawCalls: 0,
    texturesLoaded: 0,
    shadersCompiled: 0,
    lastRenderTime: 0
  }
  
  private animationSettings: AnimationSettings = {
    scale: 1.0,
    duration: 1.0,
    easing: 'ease-out',
    reducedMotion: false,
    gpuAcceleration: true
  }
  
  private frameCallbacks: Set<(deltaTime: number) => void> = new Set()
  private animationId: number | null = null
  private lastFrameTime = 0
  private fpsHistory: number[] = []
  
  private shaderCache: Map<string, WebGLShader> = new Map()
  private textureCache: Map<string, WebGLTexture> = new Map()
  private bufferCache: Map<string, WebGLBuffer> = new Map()

  constructor() {
    this.detectCapabilities()
    this.setupResponsiveSettings()
    this.startRenderLoop()
  }

  /**
   * Détecte les capacités de rendu de l'appareil
   */
  private detectCapabilities(): void {
    // Créer un canvas temporaire pour les tests
    const testCanvas = document.createElement('canvas')
    testCanvas.width = 1
    testCanvas.height = 1
    
    // Test WebGL support
    const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl')
    const webglSupport = !!gl
    const webgl2Support = !!(testCanvas.getContext('webgl2'))
    
    this.capabilities = {
      webglSupport,
      webgl2Support,
      maxTextureSize: webglSupport ? gl!.getParameter(gl!.MAX_TEXTURE_SIZE) : 2048,
      maxViewportDims: webglSupport ? gl!.getParameter(gl!.MAX_VIEWPORT_DIMS) : [1920, 1080],
      supportedExtensions: webglSupport ? gl!.getSupportedExtensions() || [] : [],
      devicePixelRatio: window.devicePixelRatio || 1,
      hardwareConcurrency: navigator.hardwareConcurrency || 4
    }

    logger.info('AdvancedRenderingSystem', '🎨 Capacités de rendu détectées', { capabilities: this.capabilities })
    
    // Auto-ajuster la qualité selon les capacités
    this.autoAdjustQuality()
  }

  /**
   * Ajuste automatiquement la qualité selon les capacités
   */
  private autoAdjustQuality(): void {
    if (!this.capabilities) return

    const { webgl2Support, hardwareConcurrency, devicePixelRatio } = this.capabilities
    
    // Algorithme de détection automatique de qualité
    if (webgl2Support && hardwareConcurrency >= 8 && devicePixelRatio <= 2) {
      this.setRenderQuality('ultra')
    } else if (this.capabilities.webglSupport && hardwareConcurrency >= 4) {
      this.setRenderQuality('high')
    } else if (this.capabilities.webglSupport) {
      this.setRenderQuality('medium')
    } else {
      this.setRenderQuality('low')
    }
  }

  /**
   * Configure les paramètres responsive
   */
  private setupResponsiveSettings(): void {
    // Détecter reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    this.animationSettings.reducedMotion = prefersReducedMotion.matches
    
    // Écouter les changements
    prefersReducedMotion.addEventListener('change', (e) => {
      this.animationSettings.reducedMotion = e.matches
      this.updateAnimationProfile()
    })

    // Adapter aux performances GPU
    this.updateAnimationProfile()
  }

  /**
   * Met à jour le profil d'animation
   */
  private updateAnimationProfile(): void {
    if (this.animationSettings.reducedMotion) {
      this.setAnimationProfile('reduced')
    } else {
      switch (this.renderQuality) {
        case 'ultra':
          this.setAnimationProfile('premium')
          break
        case 'high':
          this.setAnimationProfile('enhanced')
          break
        case 'medium':
          this.setAnimationProfile('standard')
          break
        case 'low':
          this.setAnimationProfile('reduced')
          break
      }
    }
  }

  /**
   * Démarre la boucle de rendu
   */
  private startRenderLoop(): void {
    const renderFrame = (currentTime: number) => {
      const deltaTime = currentTime - this.lastFrameTime
      this.lastFrameTime = currentTime

      // Calculer les FPS
      this.updateFpsMetrics(deltaTime)
      
      // Exécuter les callbacks de frame
      this.frameCallbacks.forEach(callback => {
        try {
          callback(deltaTime)
        } catch (error) {
          logger.error('AdvancedRenderingSystem', 'Erreur dans callback de rendu', { error })
        }
      })

      // Optimisation adaptative
      this.adaptiveOptimization()

      this.animationId = requestAnimationFrame(renderFrame)
    }

    this.animationId = requestAnimationFrame(renderFrame)
  }

  /**
   * Met à jour les métriques FPS
   */
  private updateFpsMetrics(deltaTime: number): void {
    const fps = deltaTime > 0 ? 1000 / deltaTime : 60
    this.fpsHistory.push(fps)
    
    // Garder seulement les 60 dernières mesures (1 seconde à 60fps)
    if (this.fpsHistory.length > 60) {
      this.fpsHistory.shift()
    }

    // Calculer la moyenne
    this.metrics.fps = this.fpsHistory.reduce((sum, f) => sum + f, 0) / this.fpsHistory.length
    this.metrics.frameTime = deltaTime
    this.metrics.lastRenderTime = performance.now()
  }

  /**
   * Optimisation adaptative basée sur les performances
   */
  private adaptiveOptimization(): void {
    const { fps } = this.metrics
    
    // Si les FPS chutent, réduire la qualité
    if (fps < 30 && this.renderQuality !== 'low') {
      logger.warn('AdvancedRenderingSystem', '⚠️ FPS faible détecté, réduction qualité de rendu', { fps })
      this.downgradeQuality()
    }
    
    // Si les FPS sont stables et élevés, améliorer la qualité
    if (fps > 55 && this.fpsHistory.length >= 60) {
      const stableFps = this.fpsHistory.every(f => f > 50)
      if (stableFps && this.renderQuality !== 'ultra') {
        this.upgradeQuality()
      }
    }
  }

  /**
   * Réduit la qualité de rendu
   */
  private downgradeQuality(): void {
    const qualityLevels: RenderQuality[] = ['ultra', 'high', 'medium', 'low']
    const currentIndex = qualityLevels.indexOf(this.renderQuality)
    
    if (currentIndex < qualityLevels.length - 1) {
      this.setRenderQuality(qualityLevels[currentIndex + 1])
    }
  }

  /**
   * Améliore la qualité de rendu
   */
  private upgradeQuality(): void {
    const qualityLevels: RenderQuality[] = ['low', 'medium', 'high', 'ultra']
    const currentIndex = qualityLevels.indexOf(this.renderQuality)
    
    if (currentIndex < qualityLevels.length - 1) {
      this.setRenderQuality(qualityLevels[currentIndex + 1])
    }
  }

  /**
   * Initialise un canvas WebGL
   */
  public initializeWebGL(canvas: HTMLCanvasElement): boolean {
    this.canvas = canvas
    
    // Tenter WebGL2 en premier
    this.gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: this.renderQuality !== 'low',
      depth: true,
      failIfMajorPerformanceCaveat: false,
      powerPreference: 'high-performance',
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      stencil: true
    })

    // Fallback vers WebGL1
    if (!this.gl) {
      this.gl = canvas.getContext('webgl', {
        alpha: false,
        antialias: this.renderQuality !== 'low',
        depth: true,
        failIfMajorPerformanceCaveat: false,
        powerPreference: 'high-performance',
        premultipliedAlpha: false,
        preserveDrawingBuffer: false,
        stencil: true
      })
    }

    if (!this.gl) {
      logger.warn('AdvancedRenderingSystem', '⚠️ WebGL non supporté, fallback vers Canvas 2D')
      return false
    }

    this.setupWebGLOptimizations()
    logger.info('AdvancedRenderingSystem', '✅ WebGL initialisé avec succès')
    return true
  }

  /**
   * Configure les optimisations WebGL
   */
  private setupWebGLOptimizations(): void {
    if (!this.gl) return

    // Optimisations de base
    this.gl.enable(this.gl.DEPTH_TEST)
    this.gl.enable(this.gl.CULL_FACE)
    this.gl.cullFace(this.gl.BACK)
    this.gl.frontFace(this.gl.CCW)

    // Blending optimisé
    this.gl.enable(this.gl.BLEND)
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA)
  }

  /**
   * Crée et compile un shader
   */
  public createShader(source: string, type: 'vertex' | 'fragment'): WebGLShader | null {
    if (!this.gl) return null

    const cacheKey = `${type}_${source}`
    if (this.shaderCache.has(cacheKey)) {
      return this.shaderCache.get(cacheKey)!
    }

    const shaderType = type === 'vertex' ? this.gl.VERTEX_SHADER : this.gl.FRAGMENT_SHADER
    const shader = this.gl.createShader(shaderType)
    
    if (!shader) return null

    this.gl.shaderSource(shader, source)
    this.gl.compileShader(shader)

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      logger.error('AdvancedRenderingSystem', 'Erreur compilation shader', { log: this.gl.getShaderInfoLog(shader) })
      this.gl.deleteShader(shader)
      return null
    }

    this.shaderCache.set(cacheKey, shader)
    this.metrics.shadersCompiled++
    return shader
  }

  /**
   * Charge une texture de manière optimisée
   */
  public async loadTexture(url: string, options: {
    flipY?: boolean
    generateMipmap?: boolean
    wrapS?: number
    wrapT?: number
    minFilter?: number
    magFilter?: number
  } = {}): Promise<WebGLTexture | null> {
    if (!this.gl) return null

    if (this.textureCache.has(url)) {
      return this.textureCache.get(url)!
    }

    return new Promise((resolve, reject) => {
      const image = new Image()
      image.crossOrigin = 'anonymous'
      
      image.onload = () => {
        if (!this.gl) {
          reject(new Error('WebGL context lost'))
          return
        }

        const texture = this.gl.createTexture()
        if (!texture) {
          reject(new Error('Failed to create texture'))
          return
        }

        this.gl.bindTexture(this.gl.TEXTURE_2D, texture)
        
        // Configuration des paramètres
        const {
          flipY = true,
          generateMipmap = true,
          wrapS = this.gl.CLAMP_TO_EDGE,
          wrapT = this.gl.CLAMP_TO_EDGE,
          minFilter = generateMipmap ? this.gl.LINEAR_MIPMAP_LINEAR : this.gl.LINEAR,
          magFilter = this.gl.LINEAR
        } = options

        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, flipY)
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image)
        
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, wrapS)
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, wrapT)
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, minFilter)
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, magFilter)

        if (generateMipmap && this.isPowerOf2(image.width) && this.isPowerOf2(image.height)) {
          this.gl.generateMipmap(this.gl.TEXTURE_2D)
        }

        this.textureCache.set(url, texture)
        this.metrics.texturesLoaded++
        resolve(texture)
      }

      image.onerror = () => {
        reject(new Error(`Failed to load texture: ${url}`))
      }

      image.src = url
    })
  }

  /**
   * Vérifie si un nombre est une puissance de 2
   */
  private isPowerOf2(value: number): boolean {
    return (value & (value - 1)) === 0
  }

  /**
   * Ajoute un callback de frame
   */
  public addFrameCallback(callback: (deltaTime: number) => void): void {
    this.frameCallbacks.add(callback)
  }

  /**
   * Supprime un callback de frame
   */
  public removeFrameCallback(callback: (deltaTime: number) => void): void {
    this.frameCallbacks.delete(callback)
  }

  /**
   * Définit la qualité de rendu
   */
  public setRenderQuality(quality: RenderQuality): void {
    this.renderQuality = quality
    this.updateRenderSettings()
    logger.info('AdvancedRenderingSystem', `🎨 Qualité de rendu: ${quality}`)
  }

  /**
   * Définit le profil d'animation
   */
  public setAnimationProfile(profile: AnimationProfile): void {
    this.animationProfile = profile
    this.updateAnimationSettings()
    logger.info('AdvancedRenderingSystem', `🎭 Profil d'animation: ${profile}`)
  }

  /**
   * Met à jour les paramètres de rendu
   */
  private updateRenderSettings(): void {
    const settings = {
      low: { scale: 0.5, antialias: false, shadows: false },
      medium: { scale: 0.75, antialias: false, shadows: true },
      high: { scale: 1.0, antialias: true, shadows: true },
      ultra: { scale: 1.0, antialias: true, shadows: true, postprocessing: true }
    }

    const current = settings[this.renderQuality]
    
    // Appliquer le DPR selon la qualité
    if (this.canvas && this.capabilities) {
      const dpr = this.capabilities.devicePixelRatio
      const scale = current.scale
      
      this.canvas.width = this.canvas.clientWidth * dpr * scale
      this.canvas.height = this.canvas.clientHeight * dpr * scale
    }
  }

  /**
   * Met à jour les paramètres d'animation
   */
  private updateAnimationSettings(): void {
    const profiles = {
      reduced: { scale: 0.2, duration: 0.5, gpuAcceleration: false },
      standard: { scale: 1.0, duration: 1.0, gpuAcceleration: true },
      enhanced: { scale: 1.2, duration: 1.0, gpuAcceleration: true },
      premium: { scale: 1.5, duration: 1.2, gpuAcceleration: true }
    }

    const profile = profiles[this.animationProfile]
    this.animationSettings = { ...this.animationSettings, ...profile }

    // Mettre à jour les CSS custom properties
    document.documentElement.style.setProperty('--animation-scale', profile.scale.toString())
    document.documentElement.style.setProperty('--animation-duration', `${profile.duration}s`)
  }

  /**
   * Nettoie les ressources WebGL
   */
  public cleanup(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }

    // Nettoyer les caches
    this.shaderCache.forEach(shader => {
      if (this.gl) this.gl.deleteShader(shader)
    })
    this.shaderCache.clear()

    this.textureCache.forEach(texture => {
      if (this.gl) this.gl.deleteTexture(texture)
    })
    this.textureCache.clear()

    this.bufferCache.forEach(buffer => {
      if (this.gl) this.gl.deleteBuffer(buffer)
    })
    this.bufferCache.clear()

    this.frameCallbacks.clear()
    
    logger.info('AdvancedRenderingSystem', '🧹 Advanced Rendering System nettoyé')
  }

  /**
   * Retourne les capacités de rendu
   */
  public getCapabilities(): RenderCapabilities | null {
    return this.capabilities
  }

  /**
   * Retourne les métriques de rendu
   */
  public getMetrics(): RenderMetrics {
    return { ...this.metrics }
  }

  /**
   * Retourne les paramètres d'animation
   */
  public getAnimationSettings(): AnimationSettings {
    return { ...this.animationSettings }
  }

  /**
   * Retourne la qualité de rendu actuelle
   */
  public getRenderQuality(): RenderQuality {
    return this.renderQuality
  }

  /**
   * Retourne le profil d'animation actuel
   */
  public getAnimationProfile(): AnimationProfile {
    return this.animationProfile
  }
}
