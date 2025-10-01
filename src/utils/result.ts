// Result pattern minimal (Ok / Err) pour réduire l'usage d'exceptions dans les services
export type Ok<T> = { ok: true; value: T }
export type Err<E extends { code: string; message: string }> = { ok: false; error: E }

export type Result<T, E extends { code: string; message: string }> = Ok<T> | Err<E>

export function ok<T>(value: T): Ok<T> { return { ok: true, value } }
export function err<E extends { code: string; message: string }>(error: E): Err<E> { return { ok: false, error } }

// Helpers de mapping
export async function wrapAsync<T, E extends { code: string; message: string }>(fn: () => Promise<T>, mapError: (e: unknown) => E): Promise<Result<T,E>> {
  try { return ok(await fn()) } catch(e){ return err(mapError(e)) }
}

// Unwrap utilitaires (transitionnel pour adapter progressivement le code existant)
export function unwrap<T, E extends { code: string; message: string }>(r: Result<T,E>): T {
  if(r.ok) return r.value
  throw new Error(`${r.error.code}: ${r.error.message}`)
}

export function getOrElse<T, E extends { code: string; message: string }>(r: Result<T,E>, fallback: T): T {
  return r.ok ? r.value : fallback
}

export function mapResult<T, U, E extends { code: string; message: string }>(r: Result<T,E>, fn: (v:T)=>U): Result<U,E> {
  return r.ok ? ok(fn(r.value)) : r
}
