/**
 * Service de base abstrait pour tous les services applicatifs
 * Fournit logging, error handling et métriques communes
 */

import { logger } from '@/utils/logger'

export interface ServiceConfig {
  name: string
  retryAttempts?: number
  retryDelay?: number
  timeout?: number
}

export interface ServiceMetrics {
  totalCalls: number
  successfulCalls: number
  failedCalls: number
  averageResponseTime: number
  lastError: Error | null
}

/**
 * Classe de base pour tous les services
 * Implémente logging automatique, retry logic et métriques
 */
export abstract class BaseService {
  protected readonly config: Required<ServiceConfig>
  private metrics: ServiceMetrics = {
    totalCalls: 0,
    successfulCalls: 0,
    failedCalls: 0,
    averageResponseTime: 0,
    lastError: null
  }

  constructor(config: ServiceConfig) {
    this.config = {
      name: config.name,
      retryAttempts: config.retryAttempts ?? 3,
      retryDelay: config.retryDelay ?? 1000,
      timeout: config.timeout ?? 30000
    }
    logger.info(this.config.name, 'Service initialisé', this.config)
  }

  /**
   * Exécute une opération avec retry logic et métriques
   */
  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    options?: {
      retryAttempts?: number
      retryDelay?: number
      shouldRetry?: (error: Error) => boolean
    }
  ): Promise<T> {
    const startTime = performance.now()
    const attempts = options?.retryAttempts ?? this.config.retryAttempts
    const delay = options?.retryDelay ?? this.config.retryDelay
    const shouldRetry = options?.shouldRetry ?? (() => true)

    this.metrics.totalCalls++

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        logger.debug(this.config.name, `${operationName} - Tentative ${attempt}/${attempts}`)
        
        const result = await this.withTimeout(operation(), this.config.timeout)
        
        const duration = performance.now() - startTime
        this.updateMetrics(true, duration)
        
        logger.debug(this.config.name, `${operationName} - Succès en ${duration.toFixed(2)}ms`)
        
        return result
      } catch (error) {
        const isLastAttempt = attempt === attempts
        const err = error instanceof Error ? error : new Error(String(error))

        logger.warn(
          this.config.name,
          `${operationName} - Échec tentative ${attempt}/${attempts}`,
          { error: err.message }
        )

        if (isLastAttempt || !shouldRetry(err)) {
          const duration = performance.now() - startTime
          this.updateMetrics(false, duration, err)
          
          logger.error(
            this.config.name,
            `${operationName} - Échec définitif après ${attempt} tentative(s)`,
            err
          )
          
          throw this.wrapError(err, operationName)
        }

        // Attendre avant retry avec backoff exponentiel
        await this.sleep(delay * attempt)
      }
    }

    throw new Error(`Impossible d'exécuter ${operationName} après ${attempts} tentatives`)
  }

  /**
   * Exécute une opération avec timeout
   */
  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout après ${timeoutMs}ms`)), timeoutMs)
      )
    ])
  }

  /**
   * Wrapper d'erreur avec contexte service
   */
  protected wrapError(error: Error, operation: string): ServiceError {
    return new ServiceError(
      `[${this.config.name}] ${operation}: ${error.message}`,
      error,
      this.config.name,
      operation
    )
  }

  /**
   * Met à jour les métriques du service
   */
  private updateMetrics(success: boolean, duration: number, error?: Error): void {
    if (success) {
      this.metrics.successfulCalls++
    } else {
      this.metrics.failedCalls++
      this.metrics.lastError = error || null
    }

    // Calcul moyenne mobile de responseTime
    const totalSuccess = this.metrics.successfulCalls
    this.metrics.averageResponseTime =
      (this.metrics.averageResponseTime * (totalSuccess - 1) + duration) / totalSuccess
  }

  /**
   * Utilitaire sleep
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Log une info
   */
  protected log(message: string, data?: any): void {
    logger.info(this.config.name, message, data)
  }

  /**
   * Log un warning
   */
  protected warn(message: string, data?: any): void {
    logger.warn(this.config.name, message, data)
  }

  /**
   * Log une erreur
   */
  protected error(message: string, error?: Error): void {
    logger.error(this.config.name, message, error)
  }

  /**
   * Retourne les métriques du service
   */
  getMetrics(): Readonly<ServiceMetrics> {
    return { ...this.metrics }
  }

  /**
   * Réinitialise les métriques
   */
  resetMetrics(): void {
    this.metrics = {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      averageResponseTime: 0,
      lastError: null
    }
    logger.info(this.config.name, 'Métriques réinitialisées')
  }

  /**
   * Méthode abstraite pour cleanup des ressources
   */
  abstract dispose(): Promise<void> | void
}

/**
 * Erreur custom pour les services
 */
export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly originalError: Error,
    public readonly serviceName: string,
    public readonly operation: string
  ) {
    super(message)
    this.name = 'ServiceError'
    Object.setPrototypeOf(this, ServiceError.prototype)
  }
}
