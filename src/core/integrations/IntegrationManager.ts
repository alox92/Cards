/**
 * Gestionnaire centralisé des intégrations externes
 * Orchestre Notion, Evernote, OneNote, Google Keep
 */

import NotionIntegration from './NotionIntegration'
import EvernoteIntegration from './EvernoteIntegration'
import OneNoteIntegration from './OneNoteIntegration'
import GoogleKeepIntegration from './GoogleKeepIntegration'
import BaseIntegration, { IntegrationConfig, ImportResult, ExportResult, SyncStatus } from './BaseIntegration'

export type IntegrationType = 'notion' | 'evernote' | 'onenote' | 'google-keep'

export interface IntegrationStatus {
  type: IntegrationType
  name: string
  icon: string
  isConnected: boolean
  lastSync?: number
  noteCount?: number
}

export interface BulkImportResult {
  total: number
  successful: number
  failed: number
  results: Array<{
    integration: IntegrationType
    result: ImportResult
  }>
}

/**
 * Service principal d'intégrations
 */
export class IntegrationManager {
  private static instance: IntegrationManager
  private integrations: Map<IntegrationType, BaseIntegration> = new Map()

  private constructor() {}

  static getInstance(): IntegrationManager {
    if (!IntegrationManager.instance) {
      IntegrationManager.instance = new IntegrationManager()
    }
    return IntegrationManager.instance
  }

  /**
   * Initialise une intégration
   */
  initializeIntegration(type: IntegrationType, config: IntegrationConfig): void {
    let integration: BaseIntegration

    switch (type) {
      case 'notion':
        integration = new NotionIntegration(config)
        break
      case 'evernote':
        integration = new EvernoteIntegration(config)
        break
      case 'onenote':
        integration = new OneNoteIntegration(config)
        break
      case 'google-keep':
        integration = new GoogleKeepIntegration(config)
        break
      default:
        throw new Error(`Type d'intégration inconnu: ${type}`)
    }

    this.integrations.set(type, integration)
  }

  /**
   * Récupère une intégration
   */
  getIntegration(type: IntegrationType): BaseIntegration | undefined {
    return this.integrations.get(type)
  }

  /**
   * Connecte une intégration
   */
  async connect(type: IntegrationType): Promise<boolean> {
    const integration = this.integrations.get(type)
    if (!integration) {
      throw new Error(`Intégration ${type} non initialisée`)
    }

    return await integration.authenticate()
  }

  /**
   * Déconnecte une intégration
   */
  async disconnect(type: IntegrationType): Promise<void> {
    const integration = this.integrations.get(type)
    if (integration) {
      await integration.disconnect()
    }
  }

  /**
   * Récupère le statut de toutes les intégrations
   */
  async getAllStatuses(): Promise<IntegrationStatus[]> {
    const statuses: IntegrationStatus[] = []

    const integrationInfos: Array<{
      type: IntegrationType
      name: string
      icon: string
    }> = [
      { type: 'notion', name: 'Notion', icon: '📘' },
      { type: 'evernote', name: 'Evernote', icon: '🐘' },
      { type: 'onenote', name: 'OneNote', icon: '📓' },
      { type: 'google-keep', name: 'Google Keep', icon: '🎨' }
    ]

    for (const info of integrationInfos) {
      const integration = this.integrations.get(info.type)
      
      let status: IntegrationStatus = {
        type: info.type,
        name: info.name,
        icon: info.icon,
        isConnected: false
      }

      if (integration && integration.isConnected()) {
        const syncStatus = await integration.getSyncStatus()
        status = {
          ...status,
          isConnected: syncStatus.isConnected,
          lastSync: syncStatus.lastSync,
          noteCount: syncStatus.totalNotes
        }
      }

      statuses.push(status)
    }

    return statuses
  }

  /**
   * Importe depuis toutes les intégrations connectées
   */
  async bulkImport(): Promise<BulkImportResult> {
    const result: BulkImportResult = {
      total: 0,
      successful: 0,
      failed: 0,
      results: []
    }

    for (const [type, integration] of this.integrations) {
      if (integration.isConnected()) {
        try {
          const importResult = await integration.importNotes()
          result.results.push({ integration: type, result: importResult })
          result.total += importResult.imported + importResult.failed
          result.successful += importResult.imported
          result.failed += importResult.failed
        } catch (error) {
          // Erreur import silencieuse
          result.failed++
        }
      }
    }

    return result
  }

  /**
   * Exporte vers une ou plusieurs intégrations
   */
  async exportToIntegrations(
    cards: Array<{ front: string; back: string; tags: string[] }>,
    integrationTypes: IntegrationType[]
  ): Promise<Map<IntegrationType, ExportResult>> {
    const results = new Map<IntegrationType, ExportResult>()

    for (const type of integrationTypes) {
      const integration = this.integrations.get(type)
      
      if (integration && integration.isConnected()) {
        try {
          const exportResult = await integration.exportCards(cards)
          results.set(type, exportResult)
        } catch (error) {
          // Erreur export silencieuse
          results.set(type, {
            success: false,
            exported: 0,
            failed: cards.length,
            noteIds: [],
            errors: [`Erreur: ${error}`]
          })
        }
      }
    }

    return results
  }

  /**
   * Synchronise toutes les intégrations
   */
  async syncAll(): Promise<Map<IntegrationType, SyncStatus>> {
    const results = new Map<IntegrationType, SyncStatus>()

    for (const [type, integration] of this.integrations) {
      if (integration.isConnected()) {
        try {
          const syncStatus = await integration.sync()
          results.set(type, syncStatus)
        } catch (error) {
          // Erreur sync silencieuse
          results.set(type, {
            lastSync: Date.now(),
            totalNotes: 0,
            syncedNotes: 0,
            errors: [`Erreur: ${error}`],
            isConnected: false
          })
        }
      }
    }

    return results
  }

  /**
   * Récupère l'URL d'authentification pour une intégration
   */
  getAuthUrl(type: IntegrationType): string {
    const integration = this.integrations.get(type)
    if (!integration) {
      throw new Error(`Intégration ${type} non initialisée`)
    }
    return integration.getAuthUrl()
  }

  /**
   * Échange un code OAuth contre un token
   */
  async exchangeOAuthCode(type: IntegrationType, code: string): Promise<boolean> {
    const integration = this.integrations.get(type)
    if (!integration) {
      throw new Error(`Intégration ${type} non initialisée`)
    }

    // Vérifier si l'intégration supporte l'échange de code
    if ('exchangeCodeForToken' in integration) {
      return await (integration as any).exchangeCodeForToken(code)
    }

    return false
  }

  /**
   * Recherche dans toutes les intégrations
   */
  async searchAcrossIntegrations(query: string): Promise<Map<IntegrationType, any[]>> {
    const results = new Map<IntegrationType, any[]>()

    for (const [type, integration] of this.integrations) {
      if (integration.isConnected()) {
        try {
          const notes = await integration.getNotes()
          const filtered = notes.filter(note =>
            note.title.toLowerCase().includes(query.toLowerCase()) ||
            note.content.toLowerCase().includes(query.toLowerCase())
          )
          results.set(type, filtered)
        } catch (error) {
          // Erreur recherche silencieuse
        }
      }
    }

    return results
  }

  /**
   * Nettoie toutes les intégrations
   */
  async cleanup(): Promise<void> {
    for (const integration of this.integrations.values()) {
      await integration.disconnect()
    }
    this.integrations.clear()
  }

  /**
   * Sauvegarde l'état de toutes les intégrations
   */
  saveState(): void {
    const state: Record<string, any> = {}

    for (const [type, integration] of this.integrations) {
      state[type] = integration.getConfig()
    }

    localStorage.setItem('integrations-state', JSON.stringify(state))
  }

  /**
   * Restaure l'état des intégrations
   */
  restoreState(): void {
    const stored = localStorage.getItem('integrations-state')
    if (!stored) return

    try {
      const state = JSON.parse(stored)

      for (const [type, config] of Object.entries(state)) {
        if (config && typeof config === 'object') {
          this.initializeIntegration(type as IntegrationType, config as IntegrationConfig)
        }
      }
    } catch (error) {
      // Erreur restauration état silencieuse
    }
  }

  /**
   * Statistiques globales
   */
  async getGlobalStats(): Promise<{
    totalIntegrations: number
    connectedIntegrations: number
    totalNotes: number
    lastSyncTime?: number
  }> {
    const statuses = await this.getAllStatuses()

    return {
      totalIntegrations: statuses.length,
      connectedIntegrations: statuses.filter(s => s.isConnected).length,
      totalNotes: statuses.reduce((sum, s) => sum + (s.noteCount || 0), 0),
      lastSyncTime: Math.max(...statuses.map(s => s.lastSync || 0))
    }
  }
}

export default IntegrationManager.getInstance()
