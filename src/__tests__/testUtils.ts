import { performance } from 'perf_hooks'
import { logger } from '@/utils/logger'

export async function runWithPerf<T>(label: string, fn: () => Promise<T> | T): Promise<{ result: T; durationMs: number }>{
  const start = performance.now()
  try {
    const result = await fn()
    const durationMs = performance.now() - start
    logger.debug('Test', `✅ ${label} (${durationMs.toFixed(2)}ms)`)
    return { result, durationMs }
  } catch(e){
    const durationMs = performance.now() - start
    logger.error('Test', `❌ ${label} failed (${durationMs.toFixed(2)}ms)`, { error: (e as any)?.message })
    throw e
  }
}

export function collectLogsSnapshot(){
  return logger.exportSnapshot()
}
