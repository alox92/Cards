import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import IntegrationManager, { IntegrationType, IntegrationStatus } from '@/core/integrations/IntegrationManager'
import Icons from '@/ui/components/common/Icons'

interface IntegrationsHubProps {
  onImportComplete: (cards: Array<{ front: string; back: string; tags: string[] }>) => void
  onClose: () => void
  className?: string
}

/**
 * Hub central des intégrations externes
 */
export const IntegrationsHub: React.FC<IntegrationsHubProps> = ({
  onImportComplete,
  onClose,
  className = ''
}) => {
  const [statuses, setStatuses] = useState<IntegrationStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncProgress, setSyncProgress] = useState('')

  const manager = IntegrationManager

  // Charger les statuts
  useEffect(() => {
    loadStatuses()
  }, [])

  const loadStatuses = async () => {
    setIsLoading(true)
    try {
      manager.restoreState()
      const allStatuses = await manager.getAllStatuses()
      setStatuses(allStatuses)
    } catch (error) {
      // Erreur silencieuse
    } finally {
      setIsLoading(false)
    }
  }

  // Connecter une intégration
  const handleConnect = async (type: IntegrationType) => {
    try {
      const authUrl = manager.getAuthUrl(type)
      
      // Ouvrir la fenêtre OAuth
      const popup = window.open(authUrl, '_blank', 'width=600,height=700')
      
      // Écouter le retour OAuth
      const handleMessage = async (event: MessageEvent) => {
        if (event.data.type === 'oauth-code' && event.data.integration === type) {
          const success = await manager.exchangeOAuthCode(type, event.data.code)
          
          if (success) {
            await manager.connect(type)
            await loadStatuses()
            popup?.close()
          }
          
          window.removeEventListener('message', handleMessage)
        }
      }
      
      window.addEventListener('message', handleMessage)
    } catch (error) {
      alert(`Erreur de connexion`) // Message utilisateur suffisant
    }
  }

  // Déconnecter
  const handleDisconnect = async (type: IntegrationType) => {
    try {
      await manager.disconnect(type)
      await loadStatuses()
    } catch (error) {
      // Erreur silencieuse
    }
  }

  // Import depuis une intégration
  const handleImport = async (type: IntegrationType) => {
    setIsSyncing(true)
    setSyncProgress(`Import depuis ${type}...`)
    
    try {
      const integration = manager.getIntegration(type)
      if (!integration) {
        throw new Error('Intégration non trouvée')
      }

      const result = await integration.importNotes()
      
      if (result.success && result.cards.length > 0) {
        onImportComplete(result.cards)
        setSyncProgress(`✓ ${result.imported} carte(s) importée(s) !`)
        setTimeout(() => onClose(), 2000)
      } else {
        setSyncProgress(`❌ Aucune carte importée`)
      }
    } catch (error) {
      setSyncProgress(`❌ Erreur: ${error}`)
    } finally {
      setTimeout(() => setIsSyncing(false), 3000)
    }
  }

  // Synchronisation globale
  const handleSyncAll = async () => {
    setIsSyncing(true)
    setSyncProgress('Synchronisation en cours...')
    
    try {
      const results = await manager.syncAll()
      const totalSynced = Array.from(results.values()).reduce(
        (sum, status) => sum + status.syncedNotes,
        0
      )
      
      setSyncProgress(`✓ ${totalSynced} note(s) synchronisée(s) !`)
      await loadStatuses()
    } catch (error) {
      setSyncProgress(`❌ Erreur sync: ${error}`)
    } finally {
      setTimeout(() => setIsSyncing(false), 3000)
    }
  }

  // Import massif
  const handleBulkImport = async () => {
    setIsSyncing(true)
    setSyncProgress('Import massif en cours...')
    
    try {
      const result = await manager.bulkImport()
      
      if (result.successful > 0) {
        const allCards = result.results.flatMap(r => r.result.cards)
        onImportComplete(allCards)
        setSyncProgress(`✓ ${result.successful} carte(s) importée(s) !`)
        setTimeout(() => onClose(), 2000)
      } else {
        setSyncProgress(`❌ Aucune carte importée`)
      }
    } catch (error) {
      setSyncProgress(`❌ Erreur: ${error}`)
    } finally {
      setTimeout(() => setIsSyncing(false), 3000)
    }
  }

  return (
    <div className={`integrations-hub ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              🔗 Intégrations Externes
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Connectez vos services pour importer vos notes
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
          >
            <Icons.Settings size="md" />
          </button>
        </div>

        {/* Actions globales */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => void handleSyncAll()}
            disabled={isSyncing || !statuses.some(s => s.isConnected)}
            className="py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            🔄 Synchroniser tout
          </button>
          <button
            onClick={() => void handleBulkImport()}
            disabled={isSyncing || !statuses.some(s => s.isConnected)}
            className="py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            📥 Import massif
          </button>
        </div>

        {/* Barre de progression */}
        <AnimatePresence>
          {isSyncing && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="animate-spin">⚙️</div>
                <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
                  {syncProgress}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Liste des intégrations */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin text-4xl mb-4">⚙️</div>
            <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {statuses.map((status) => (
              <motion.div
                key={status.type}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`bg-gradient-to-br ${
                  status.isConnected
                    ? 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-700'
                    : 'from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 border-2 border-gray-300 dark:border-gray-600'
                } rounded-lg p-5`}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{status.icon}</span>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">
                        {status.name}
                      </h3>
                      {status.isConnected && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {status.noteCount || 0} note(s)
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    {status.isConnected ? (
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    ) : (
                      <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    )}
                  </div>
                </div>

                {/* Status */}
                {status.isConnected && status.lastSync && (
                  <div className="mb-3 text-xs text-gray-600 dark:text-gray-400">
                    Dernière sync: {new Date(status.lastSync).toLocaleString('fr-FR')}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  {status.isConnected ? (
                    <>
                      <button
                        onClick={() => handleImport(status.type)}
                        disabled={isSyncing}
                        className="flex-1 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50 transition"
                      >
                        📥 Importer
                      </button>
                      <button
                        onClick={() => handleDisconnect(status.type)}
                        disabled={isSyncing}
                        className="px-4 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600 disabled:opacity-50 transition"
                      >
                        🔌
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleConnect(status.type)}
                      disabled={isSyncing}
                      className="flex-1 py-2 bg-gray-700 dark:bg-gray-600 text-white text-sm rounded hover:bg-gray-800 dark:hover:bg-gray-500 disabled:opacity-50 transition"
                    >
                      🔗 Connecter
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
            📖 Comment ça marche ?
          </h4>
          <ol className="text-sm text-gray-700 dark:text-gray-300 space-y-1 list-decimal list-inside">
            <li>Cliquez sur <strong>Connecter</strong> pour autoriser l'accès</li>
            <li>Une fois connecté, cliquez sur <strong>Importer</strong></li>
            <li>Vos notes seront automatiquement converties en cartes flash</li>
            <li>Utilisez <strong>Import massif</strong> pour tout importer d'un coup</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

export default IntegrationsHub
