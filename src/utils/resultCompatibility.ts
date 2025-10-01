/**
 * 🔄 ADAPTATEUR DE COMPATIBILITÉ RESULT PATTERN
 * 
 * Adaptateur temporaire pour assurer la compatibilité entre l'ancien code UI
 * et le nouveau pattern Result dans les services, permettant une migration progressive.
 */

import type { Result } from './result'
import { logger } from './logger'

/**
 * Détecte si une valeur est un Result et extrait sa valeur automatiquement
 */
export function autoUnwrap<T>(value: T | Result<T, {code: string; message: string}>): T | null {
  // Si ce n'est pas un Result, retourner la valeur telle quelle
  if (!value || typeof value !== 'object' || !('ok' in value)) {
    return value as T
  }
  
  // Si c'est un Result
  const result = value as Result<T, {code: string; message: string}>
  if (result.ok) {
    return result.value
  } else {
    logger.warn('AutoUnwrap', 'Erreur dans Result auto-unwrappé', result.error)
    return null
  }
}

/**
 * Version Array-aware du auto unwrap
 */
export function autoUnwrapArray<T>(value: T[] | Result<T[], {code: string; message: string}>): T[] {
  const unwrapped = autoUnwrap(value)
  return Array.isArray(unwrapped) ? unwrapped : []
}

/**
 * Version Promise-aware du auto unwrap
 */
export async function autoUnwrapAsync<T>(
  promise: Promise<T | Result<T, {code: string; message: string}>>
): Promise<T | null> {
  const value = await promise
  return autoUnwrap(value)
}

/**
 * HOC pour wrapper automatiquement les appels de service dans les hooks
 */
export function withResultCompatibility<TService>(service: TService): TService {
  const proxy = new Proxy(service as any, {
    get(target: any, prop: string | symbol) {
      const original = target[prop]
      
      if (typeof original === 'function') {
        return function(this: any, ...args: any[]) {
          const result = original.apply(this, args)
          
          // Si c'est une Promise, wrapper le résultat
          if (result && typeof result.then === 'function') {
            return result.then((value: any) => {
              // Auto-unwrap Result si détecté
              return autoUnwrap(value) ?? value
            })
          }
          
          // Sinon, auto-unwrap directement
          return autoUnwrap(result) ?? result
        }
      }
      
      return original
    }
  })
  
  return proxy as TService
}

/**
 * Hook utilitaire pour les services avec auto-unwrap
 */
export function useServiceWithCompatibility<T>(serviceFactory: () => T): T {
  return withResultCompatibility(serviceFactory())
}
