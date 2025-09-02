// Utilitaire centralisé pour catcher silencieusement en dev tout en loggant sous flag diagnostics.
import { logger } from './logger'
import FLAGS from './featureFlags'

export function silentCatch(scope: string, err: unknown, extra?: any){
  if(FLAGS?.diagnosticsEnabled){
    try { logger.debug('SilentCatch', scope, { error: String(err), extra }) } catch {/* ignore */}
  }
}
