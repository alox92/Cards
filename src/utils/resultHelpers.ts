/**
 * 🔧 HELPERS POUR PATTERN RESULT
 * 
 * Utilitaires pour simplifier la gestion du pattern Result dans l'UI
 */

import type { Result } from './result'
import { logger } from './logger'

/**
 * Unwrap un Result et retourne la valeur ou null en cas d'erreur
 */
export function unwrap<T>(result: Result<T, {code: string; message: string}>): T | null {
  if (result.ok) {
    return result.value
  } else {
    logger.warn('ResultHelper', 'unwrap: Erreur dans Result', result.error)
    return null
  }
}

/**
 * Unwrap un Result et retourne la valeur ou une valeur par défaut
 */
export function unwrapOr<T>(result: Result<T, {code: string; message: string}>, defaultValue: T): T {
  return result.ok ? result.value : defaultValue
}

/**
 * Unwrap un Result ou throw l'erreur si échec
 */
export function unwrapOrThrow<T>(result: Result<T, {code: string; message: string}>): T {
  if (result.ok) {
    return result.value
  } else {
    throw new Error(`${result.error.code}: ${result.error.message}`)
  }
}

/**
 * Map une fonction sur la valeur d'un Result si ok
 */
export function mapResult<T, U>(
  result: Result<T, {code: string; message: string}>,
  mapper: (value: T) => U
): Result<U, {code: string; message: string}> {
  if (result.ok) {
    return { ok: true, value: mapper(result.value) }
  } else {
    return result
  }
}

/**
 * Hook-like helper pour gérer les Result dans useState
 */
export function useResultState<T>(
  result: Result<T, {code: string; message: string}> | null,
  fallback: T
): [T, string | null] {
  if (!result) return [fallback, null]
  if (result.ok) return [result.value, null]
  return [fallback, result.error.message]
}

/**
 * Extrait toutes les valeurs d'un tableau de Results
 */
export function unwrapMany<T>(results: Result<T, {code: string; message: string}>[]): T[] {
  return results.filter(r => r.ok).map(r => (r as any).value)
}

/**
 * Vérifie si tous les Results sont ok
 */
export function allOk<T>(results: Result<T, {code: string; message: string}>[]): boolean {
  return results.every(r => r.ok)
}

/**
 * Retourne la première erreur trouvée ou null
 */
export function firstError<T>(results: Result<T, {code: string; message: string}>[]): {code: string; message: string} | null {
  const failed = results.find(r => !r.ok)
  return failed ? (failed as any).error : null
}
