import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { logger, logError, loggedPromise } from '../../utils/logger'

export const DebugTestPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([])
  const [performanceMetrics, setPerformanceMetrics] = useState<any>({})

  // Simuler différents types de logs pour tester
  const runLogTests = async () => {
    logger.info('DebugTest', '🧪 Début des tests de logging avancé')
    
    // Test de tous les niveaux de log
    logger.trace('Test', 'Message de trace - détail technique', { data: 'trace' })
    logger.debug('Test', 'Message de debug - information développeur', { debug: true })
    logger.info('Test', 'Message informatif - événement important', { event: 'test' })
    logger.warn('Test', 'Message d\'avertissement', { warning: 'attention' })
    logger.error('Test', 'Message d\'erreur simulée', { error: 'test' })
    
    // Test de performance
    logger.startTimer('test-operation')
    await new Promise(resolve => setTimeout(resolve, 500))
    const duration = logger.endTimer('test-operation')
    logger.info('Performance', `⏱️ Opération test terminée en ${duration}ms`)
    
    // Test d'erreur avec stack trace
    try {
      throw new Error('Erreur de test pour vérifier la capture des stack traces')
    } catch (error) {
      logError('DebugTest', error, { phase: 'test', intentional: true })
    }
    
    // Test des types avancés
    const testUUID = crypto.randomUUID()
    logger.debug('TypeSystem', 'Test de génération UUID', { 
      uuid: testUUID, 
      type: 'random' 
    })
    
    // Test d'une promesse avec logging
    await loggedPromise(
      fetch('/api/test').catch(() => ({ ok: false })),
      'Network',
      'Test API call'
    )
    
    // Obtenir les métriques
    const metrics = logger.getPerformanceSummary()
    setPerformanceMetrics(metrics)
    
    logger.info('DebugTest', '✅ Tests de logging terminés avec succès')
    
    // Rafraîchir l'affichage des logs
    refreshLogs()
  }
  
  const refreshLogs = () => {
    // Récupérer les logs depuis localStorage
    try {
      const storedLogs = localStorage.getItem('cards-logs')
      if (storedLogs) {
        const parsedLogs = JSON.parse(storedLogs)
        setLogs(parsedLogs.slice(-20)) // Afficher les 20 derniers logs
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des logs:', error)
    }
  }
  
  const clearLogs = () => {
    logger.clearLogs()
    setLogs([])
    setPerformanceMetrics({})
    logger.info('DebugTest', '🗑️ Logs effacés par l\'utilisateur')
  }
  
  const exportLogs = () => {
    logger.exportLogs()
    logger.info('DebugTest', '📥 Export des logs demandé par l\'utilisateur')
  }
  
  useEffect(() => {
    refreshLogs()
    // Rafraîchir automatiquement toutes les 2 secondes
    const interval = setInterval(refreshLogs, 2000)
    return () => clearInterval(interval)
  }, [])

  const getLevelColor = (level: string) => {
    switch (level?.toUpperCase()) {
      case 'TRACE': return 'text-gray-500 bg-gray-50'
      case 'DEBUG': return 'text-blue-600 bg-blue-50'
      case 'INFO': return 'text-green-600 bg-green-50'
      case 'WARN': return 'text-yellow-600 bg-yellow-50'
      case 'ERROR': return 'text-red-600 bg-red-50'
      case 'CRITICAL': return 'text-red-800 bg-red-100'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          🧪 Centre de Tests Debug & Logging
        </h1>
        
        {/* Contrôles */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={runLogTests}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            🚀 Lancer Tests de Logging
          </button>
          
          <button
            onClick={refreshLogs}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            🔄 Rafraîchir Logs
          </button>
          
          <button
            onClick={exportLogs}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            📥 Exporter Logs
          </button>
          
          <button
            onClick={clearLogs}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            🗑️ Effacer Logs
          </button>
        </div>
        
        {/* Métriques de Performance */}
        {Object.keys(performanceMetrics).length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
              📊 Métriques de Performance
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-blue-600 dark:text-blue-400">Timers actifs:</span>
                <span className="ml-2 font-mono">{performanceMetrics.activeTimers || 0}</span>
              </div>
              <div>
                <span className="text-blue-600 dark:text-blue-400">Opérations:</span>
                <span className="ml-2 font-mono">{performanceMetrics.completedOperations || 0}</span>
              </div>
              <div>
                <span className="text-blue-600 dark:text-blue-400">Durée moyenne:</span>
                <span className="ml-2 font-mono">{performanceMetrics.averageDuration || 0}ms</span>
              </div>
              <div>
                <span className="text-blue-600 dark:text-blue-400">Mémoire JS:</span>
                <span className="ml-2 font-mono">
                  {((performance as any).memory?.usedJSHeapSize / 1024 / 1024)?.toFixed(1) || 'N/A'}MB
                </span>
              </div>
            </div>
          </div>
        )}
      </motion.div>
      
      {/* Affichage des Logs en Temps Réel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg"
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            📝 Logs en Temps Réel ({logs.length})
          </h2>
        </div>
        
        <div className="p-4 max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              Aucun log disponible. Lancez les tests pour voir les logs s'afficher.
            </p>
          ) : (
            <div className="space-y-2">
              {logs.map((log, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-3 rounded-lg font-mono text-sm ${getLevelColor(log.level)}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xs opacity-70 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="font-bold min-w-[60px]">
                      {log.level}
                    </span>
                    <span className="text-gray-600 min-w-[80px]">
                      [{log.category}]
                    </span>
                    <span className="flex-1">
                      {log.message}
                    </span>
                  </div>
                  {log.context && Object.keys(log.context).length > 0 && (
                    <div className="mt-2 pl-24 text-xs opacity-80">
                      <pre>{JSON.stringify(log.context, null, 2)}</pre>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
      
      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-6"
      >
        <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-3">
          📖 Instructions d'utilisation
        </h3>
        <ul className="space-y-2 text-amber-800 dark:text-amber-200">
          <li>• <strong>Lancer Tests:</strong> Exécute une série de tests pour tous les niveaux de logging</li>
          <li>• <strong>Rafraîchir:</strong> Met à jour l'affichage des logs depuis le stockage local</li>
          <li>• <strong>Exporter:</strong> Télécharge tous les logs dans un fichier JSON</li>
          <li>• <strong>Effacer:</strong> Supprime tous les logs stockés (irréversible)</li>
          <li>• <strong>Console:</strong> Ouvrez F12 pour voir les logs colorés dans la console</li>
          <li>• <strong>Performance:</strong> Les métriques incluent les timers et l'usage mémoire</li>
        </ul>
      </motion.div>
    </div>
  )
}

export default DebugTestPage
