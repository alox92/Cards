/**
 * 🔍 SYSTÈME DE LOGGING AVANCÉ POUR CARDS
 * 
 * Système de logging structuré avec niveaux, couleurs et tracking de performance
 * pour un débogage efficace et une traçabilité complète.
 */

export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  CRITICAL = 5
}

export interface LogEntry {
  timestamp: Date
  level: LogLevel
  category: string
  message: string
  data?: any
  stack?: string
  performance?: {
    duration?: number
    memory?: number
    fps?: number
  }
  context?: {
    component?: string
    action?: string
    userId?: string
    sessionId?: string
  }
}

export interface LoggerConfig {
  minLevel: LogLevel
  enableConsole: boolean
  enableStorage: boolean
  enablePerformanceTracking: boolean
  maxStoredLogs: number
  colors: boolean
  timestamp: boolean
  captureStack: boolean
  /** Délai minimum avant réémission d'un même (level+category+message) en ms */
  rateLimitMs: number
  /** Activer la déduplication/rate‑limit */
  enableRateLimit: boolean
}

class CardsLogger {
  private config: LoggerConfig
  private logs: LogEntry[] = []
  private performanceMarks = new Map<string, number>()
  private sessionId: string
  private listeners = new Set<(entry: LogEntry)=>void>()
  // Rate limiting (clé = level|category|message)
  private lastLogMap = new Map<string, { last: number; suppressed: number }>()
  // Batching pour catégories spécifiques (ex: transitions)
  private batchBuffers = new Map<string, LogEntry[]>()
  private batchConfig = { categories: new Set<string>(['Transition','FluidTransition']), flushIntervalMs: 6000, maxBatchSize: 60 }
  private lastBatchFlush = 0
  private batchingEnabled = (typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV) // actif seulement en dev par défaut

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableStorage: true,
      enablePerformanceTracking: true,
      maxStoredLogs: 1000,
      colors: true,
  timestamp: true,
  captureStack: true,
      rateLimitMs: 5000,
      enableRateLimit: true,
      ...config
    }
    
    this.sessionId = this.generateSessionId()
    this.initializeLogger()
  }

  private generateSessionId(): string {
    return `cards_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private initializeLogger(): void {
    this.info('Logger', '🚀 Cards Logger initialisé', {
      sessionId: this.sessionId,
      config: this.config,
      timestamp: new Date().toISOString()
    })
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.minLevel
  }

  private formatMessage(entry: LogEntry): string {
    const levelNames = ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL']
    const levelColors = [
      '\x1b[37m', // TRACE - white
      '\x1b[36m', // DEBUG - cyan
      '\x1b[32m', // INFO - green
      '\x1b[33m', // WARN - yellow
      '\x1b[31m', // ERROR - red
      '\x1b[35m'  // CRITICAL - magenta
    ]
    
    const reset = '\x1b[0m'
    const timestamp = this.config.timestamp ? 
      `[${entry.timestamp.toISOString()}] ` : ''
    
    const color = this.config.colors ? levelColors[entry.level] : ''
    const levelName = levelNames[entry.level].padEnd(8)
    const category = entry.category.padEnd(15)
    
    return `${timestamp}${color}${levelName}${reset} [${category}] ${entry.message}`
  }

  private createLogEntry(
    level: LogLevel,
    category: string,
    message: string,
    data?: any,
    context?: LogEntry['context']
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      category,
      message,
      data,
      context: {
        sessionId: this.sessionId,
        ...context
      }
    }

    // Ajout des informations de performance si activé
    if (this.config.enablePerformanceTracking) {
      entry.performance = {
        memory: (performance as any).memory?.usedJSHeapSize || 0
      }
    }

    // Ajout de la stack trace pour les erreurs
    if (level >= LogLevel.ERROR && this.config.captureStack) {
      entry.stack = new Error().stack
    }

    return entry
  }

  private logToConsole(entry: LogEntry): void {
    if (!this.config.enableConsole) return

    const message = this.formatMessage(entry)
    
    switch (entry.level) {
      case LogLevel.TRACE:
      case LogLevel.DEBUG:
        console.debug(message, entry.data)
        break
      case LogLevel.INFO:
        console.info(message, entry.data)
        break
      case LogLevel.WARN:
        console.warn(message, entry.data)
        break
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(message, entry.data, entry.stack)
        break
    }
  }

  private storeLog(entry: LogEntry): void {
    if (!this.config.enableStorage) return

    this.logs.push(entry)
    
    // Limiter le nombre de logs stockés
    if (this.logs.length > this.config.maxStoredLogs) {
      this.logs.splice(0, this.logs.length - this.config.maxStoredLogs)
    }

    // Sauvegarder en localStorage pour persistance
    try {
      const recentLogs = this.logs.slice(-100) // Seulement les 100 derniers
      localStorage.setItem('cards_logs', JSON.stringify(recentLogs))
    } catch (error) {
      // Ignorer les erreurs de stockage
    }

    // Notifier les abonnés (LogViewer temps réel)
    this.listeners.forEach(l => {
      try { l(entry) } catch {/* ignore listener errors */}
    })
  }

  private log(
    level: LogLevel,
    category: string,
    message: string,
    data?: any,
    context?: LogEntry['context']
  ): void {
    if (!this.shouldLog(level)) return

    // Rate limiting (surtout pour DEBUG/WARN/ERROR répétitifs)
    if(this.config.enableRateLimit){
      const key = `${level}|${category}|${message}`
      const now = Date.now()
      const rec = this.lastLogMap.get(key)
      if(rec){
        if(now - rec.last < this.config.rateLimitMs){
          rec.suppressed += 1
          return // on supprime ce log
        } else {
          // On réémet et mentionne combien ont été supprimés
          if(rec.suppressed > 0){
            data = { ...(data||{}), _suppressed: rec.suppressed }
          }
          rec.last = now
          rec.suppressed = 0
        }
      } else {
        this.lastLogMap.set(key, { last: now, suppressed: 0 })
      }
    }

    const entry = this.createLogEntry(level, category, message, data, context)

    // Batching: uniquement INFO/DEBUG des catégories ciblées (pas d'erreurs critiques)
  if(this.batchingEnabled && this.batchConfig.categories.has(category) && level <= LogLevel.INFO){
      const buf = this.batchBuffers.get(category) || []
      buf.push(entry)
      this.batchBuffers.set(category, buf)
      const now = Date.now()
      if(buf.length >= this.batchConfig.maxBatchSize || (now - this.lastBatchFlush) >= this.batchConfig.flushIntervalMs){
        this.flushBatch(category)
      }
      return
    }

    this.logToConsole(entry)
    this.storeLog(entry)
  }

  // Méthodes publiques de logging
  trace(category: string, message: string, data?: any, context?: LogEntry['context']): void {
    this.log(LogLevel.TRACE, category, message, data, context)
  }

  debug(category: string, message: string, data?: any, context?: LogEntry['context']): void {
    this.log(LogLevel.DEBUG, category, message, data, context)
  }

  info(category: string, message: string, data?: any, context?: LogEntry['context']): void {
    this.log(LogLevel.INFO, category, message, data, context)
  }

  warn(category: string, message: string, data?: any, context?: LogEntry['context']): void {
    this.log(LogLevel.WARN, category, message, data, context)
  }

  error(category: string, message: string, data?: any, context?: LogEntry['context']): void {
    this.log(LogLevel.ERROR, category, message, data, context)
  }

  critical(category: string, message: string, data?: any, context?: LogEntry['context']): void {
    this.log(LogLevel.CRITICAL, category, message, data, context)
  }

  // Méthodes de performance tracking
  startTimer(label: string): void {
    this.performanceMarks.set(label, performance.now())
    this.debug('Performance', `⏱️  Timer démarré: ${label}`)
  }

  endTimer(label: string): number {
    const startTime = this.performanceMarks.get(label)
    if (!startTime) {
  // Silencieux si timer déjà consommé (évite bruit en StrictMode / appels répétés)
  return 0
    }

    const duration = performance.now() - startTime
    this.performanceMarks.delete(label)
    
    this.info('Performance', `⏱️  Timer terminé: ${label}`, {
      duration: `${duration.toFixed(2)}ms`,
      durationMs: duration
    })

    return duration
  }

  // Méthodes d'analyse des logs
  getLogs(level?: LogLevel, category?: string): LogEntry[] {
    let filteredLogs = this.logs

    if (level !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.level >= level)
    }

    if (category) {
      filteredLogs = filteredLogs.filter(log => 
        log.category.toLowerCase().includes(category.toLowerCase())
      )
    }

    return filteredLogs
  }

  getErrorLogs(): LogEntry[] {
    return this.getLogs(LogLevel.ERROR)
  }

  getPerformanceSummary(): any {
    const errors = this.getErrorLogs()
    const warnings = this.getLogs(LogLevel.WARN)
    
    return {
      sessionId: this.sessionId,
      totalLogs: this.logs.length,
      errors: errors.length,
      warnings: warnings.length,
      categories: [...new Set(this.logs.map(log => log.category))],
      timespan: this.logs.length > 0 ? {
        start: this.logs[0].timestamp,
        end: this.logs[this.logs.length - 1].timestamp
      } : null
    }
  }

  exportLogs(): string {
    return JSON.stringify({
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      summary: this.getPerformanceSummary(),
      logs: this.logs
    }, null, 2)
  }

  clearLogs(): void {
    this.logs = []
    localStorage.removeItem('cards_logs')
    this.info('Logger', '🗑️  Logs effacés')
  }

  // Configuration dynamique
  setLogLevel(level: LogLevel): void {
    this.config.minLevel = level
    this.info('Logger', `🔧 Niveau de log changé: ${LogLevel[level]}`)
  }

  setRateLimit(enabled: boolean, rateLimitMs?: number){
    this.config.enableRateLimit = enabled
    if(rateLimitMs) this.config.rateLimitMs = rateLimitMs
    this.info('Logger', `🔧 RateLimit: ${enabled ? 'activé' : 'désactivé'} (${this.config.rateLimitMs}ms)`) 
  }

  enablePerformanceTracking(enabled: boolean): void {
    this.config.enablePerformanceTracking = enabled
    this.info('Logger', `🔧 Performance tracking: ${enabled ? 'activé' : 'désactivé'}`)
  }

  // Extraction structurée (pour tests / diagnostics UI)
  exportSnapshot(level: LogLevel = LogLevel.DEBUG){
    return this.getLogs(level).map(l => ({
      t: l.timestamp.getTime(),
      lvl: LogLevel[l.level],
      cat: l.category,
      msg: l.message,
      dur: l.performance?.duration,
      data: l.data && JSON.stringify(l.data).slice(0,500)
    }))
  }

  // Flush vers console en groupe (debug bulk)
  flushToConsole(){
    console.groupCollapsed(`📦 Log flush (${this.logs.length})`)
    for(const l of this.logs){ this.logToConsole(l) }
    console.groupEnd()
  }
  // Flush batch spécifique
  flushBatch(category?: string){
    const now = Date.now()
    if(category){
      const buf = this.batchBuffers.get(category)
      if(buf && buf.length){
        console.groupCollapsed(`🌀 Batch ${category} (${buf.length})`)
        buf.forEach(e=>{ this.logToConsole(e); this.storeLog(e) })
        console.groupEnd()
        this.batchBuffers.set(category, [])
      }
    } else {
      for(const [cat, buf] of this.batchBuffers.entries()){
        if(buf.length){
          console.groupCollapsed(`🌀 Batch ${cat} (${buf.length})`)
          buf.forEach(e=>{ this.logToConsole(e); this.storeLog(e) })
          console.groupEnd()
          this.batchBuffers.set(cat, [])
        }
      }
    }
    this.lastBatchFlush = now
  }
  // Permet d'injecter un lot d'entrées (ex: import)
  importLogs(raw: LogEntry[]){
    this.logs.push(...raw)
  }

  // --- API d'abonnement temps réel ---
  subscribe(listener: (entry: LogEntry)=>void){
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
  getAllLogs(){ return [...this.logs] }

  // --- Diagnostics suppression ---
  getSuppressionSummary(){
    const out: { key: string; suppressed: number }[] = []
    for(const [k,v] of this.lastLogMap.entries()) if(v.suppressed) out.push({ key: k, suppressed: v.suppressed })
    return out.sort((a,b)=> b.suppressed - a.suppressed)
  }
  resetSuppressionCounters(){
    for(const val of this.lastLogMap.values()) val.suppressed = 0
  }

  // --- Batching configuration ---
  setBatchingEnabled(enabled: boolean){
    this.batchingEnabled = enabled
    this.info('Logger', `Batching ${enabled ? 'activé' : 'désactivé'}`)
  }
  configureBatch(options: { categories?: string[]; flushIntervalMs?: number; maxBatchSize?: number }){
    if(options.categories){ this.batchConfig.categories = new Set(options.categories) }
    if(options.flushIntervalMs){ this.batchConfig.flushIntervalMs = options.flushIntervalMs }
    if(options.maxBatchSize){ this.batchConfig.maxBatchSize = options.maxBatchSize }
    this.info('Logger','Batch config mise à jour', { cfg: { categories: [...this.batchConfig.categories], flushIntervalMs: this.batchConfig.flushIntervalMs, maxBatchSize: this.batchConfig.maxBatchSize } })
  }

  // ---- Hooks internes test ----
  /** Retourne la map interne (read-only) pour tests ciblés */
  __getInternalSuppressionMap(){ return this.lastLogMap }
}

// Instance globale du logger
import { FLAGS } from '@/utils/featureFlags'
export const logger = new CardsLogger({
  // Web-only: pas de détection Tauri, DEBUG en dev sinon INFO
  minLevel: (process.env.NODE_ENV === 'development') ? LogLevel.DEBUG : LogLevel.INFO,
  enablePerformanceTracking: true,
  colors: true,
  timestamp: true
  ,captureStack: true
})

// Application du flag batching (override du comportement DEV par défaut)
if(!FLAGS.logBatchingEnabled) {
  logger.setBatchingEnabled(false)
}

// Helper pour les erreurs avec types
export function logError(category: string, error: Error | unknown, context?: any): void {
  if (error instanceof Error) {
    logger.error(category, error.message, {
      name: error.name,
      stack: error.stack,
      context
    })
  } else {
    logger.error(category, 'Erreur inconnue', { error, context })
  }
}

// Helper pour les promesses avec logging automatique
export function loggedPromise<T>(
  promise: Promise<T>,
  category: string,
  description: string
): Promise<T> {
  logger.debug(category, `⏳ Début: ${description}`)
  // Démarrer le timer uniquement s'il n'existe pas déjà
  if(!(logger as any).performanceMarks?.has?.(description)) {
    logger.startTimer(description)
  }

  return promise
    .then(result => {
  logger.endTimer(description)
      logger.info(category, `✅ Succès: ${description}`)
      return result
    })
    .catch(error => {
  logger.endTimer(description)
      logError(category, error, { description })
      throw error
    })
}

export default logger
