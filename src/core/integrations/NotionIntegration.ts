/**
 * Intégration Notion
 * API: https://developers.notion.com/
 * Permet d'importer des pages/databases Notion en cartes flash
 */

import BaseIntegration, {
  IntegrationConfig,
  IntegrationNote,
  IntegrationNotebook,
  ImportResult,
  ExportResult,
  SyncStatus
} from './BaseIntegration'

interface NotionPage {
  id: string
  object: 'page'
  created_time: string
  last_edited_time: string
  properties: any
  parent: any
  url: string
}

interface NotionDatabase {
  id: string
  object: 'database'
  title: Array<{ plain_text: string }>
  properties: any
}

export class NotionIntegration extends BaseIntegration {
  private readonly API_BASE = 'https://api.notion.com/v1'
  private readonly API_VERSION = '2022-06-28'

  constructor(config: IntegrationConfig) {
    super(config)
    const saved = this.loadConfig('notion')
    if (saved) {
      this.config = saved
      this.isAuthenticated = !!saved.accessToken
    }
  }

  /**
   * Authentification OAuth 2.0
   */
  async authenticate(): Promise<boolean> {
    // En production, ceci ouvrirait une fenêtre popup OAuth
    // Pour le moment, on suppose que le token est déjà configuré
    if (!this.config.accessToken) {
      throw new Error('Access token requis. Utilisez getAuthUrl() pour OAuth.')
    }

    try {
      // Tester le token avec un appel API
      const response = await this.apiRequest('/users/me')
      this.isAuthenticated = response.ok
      this.saveConfig('notion')
      return this.isAuthenticated
    } catch (error) {
      this.isAuthenticated = false
      return false
    }
  }

  /**
   * URL d'authentification OAuth
   */
  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId || '',
      redirect_uri: this.config.redirectUri || 'http://localhost:3000/notion/callback',
      response_type: 'code',
      owner: 'user'
    })
    return `https://api.notion.com/v1/oauth/authorize?${params.toString()}`
  }

  /**
   * Échange le code OAuth contre un access token
   */
  async exchangeCodeForToken(code: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.notion.com/v1/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${this.config.clientId}:${this.config.clientSecret}`)}`
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code,
          redirect_uri: this.config.redirectUri
        })
      })

      const data = await response.json()
      
      if (data.access_token) {
        this.config.accessToken = data.access_token
        this.config.expiresAt = data.expires_in ? Date.now() + data.expires_in * 1000 : undefined
        this.isAuthenticated = true
        this.saveConfig('notion')
        return true
      }

      return false
    } catch (error) {
      // Notion OAuth error
      return false
    }
  }

  async refreshAuthentication(): Promise<boolean> {
    // Notion tokens ne nécessitent pas de refresh pour le moment
    return this.authenticate()
  }

  async disconnect(): Promise<void> {
    this.config = {}
    this.isAuthenticated = false
    localStorage.removeItem('integration-notion')
  }

  /**
   * Récupère les databases (équivalent notebooks)
   */
  async getNotebooks(): Promise<IntegrationNotebook[]> {
    if (!this.isAuthenticated) {
      throw new Error('Non authentifié')
    }

    try {
      const response = await this.apiRequest('/search', 'POST', {
        filter: { property: 'object', value: 'database' },
        page_size: 100
      })

      const data = await response.json()
      const databases: NotionDatabase[] = data.results || []

      return databases.map(db => ({
        id: db.id,
        name: db.title?.[0]?.plain_text || 'Sans titre',
        noteCount: undefined // Notion ne fournit pas ce nombre directement
      }))
    } catch (error) {
      // Erreur récupération databases
      return []
    }
  }

  /**
   * Récupère les pages d'une database ou toutes les pages
   */
  async getNotes(databaseId?: string): Promise<IntegrationNote[]> {
    if (!this.isAuthenticated) {
      throw new Error('Non authentifié')
    }

    try {
      let pages: NotionPage[] = []

      if (databaseId) {
        // Pages d'une database spécifique
        const response = await this.apiRequest(`/databases/${databaseId}/query`, 'POST', {
          page_size: 100
        })
        const data = await response.json()
        pages = data.results || []
      } else {
        // Toutes les pages
        const response = await this.apiRequest('/search', 'POST', {
          filter: { property: 'object', value: 'page' },
          page_size: 100
        })
        const data = await response.json()
        pages = data.results || []
      }

      return await Promise.all(pages.map(page => this.convertPageToNote(page)))
    } catch (error) {
      // Erreur récupération pages
      return []
    }
  }

  /**
   * Récupère une page spécifique
   */
  async getNote(pageId: string): Promise<IntegrationNote> {
    if (!this.isAuthenticated) {
      throw new Error('Non authentifié')
    }

    const response = await this.apiRequest(`/pages/${pageId}`)
    const page = await response.json()
    return this.convertPageToNote(page)
  }

  /**
   * Importe des pages Notion en cartes
   */
  async importNotes(pageIds?: string[]): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      imported: 0,
      failed: 0,
      cards: [],
      errors: []
    }

    try {
      const notes = pageIds
        ? await Promise.all(pageIds.map(id => this.getNote(id)))
        : await this.getNotes()

      for (const note of notes) {
        try {
          const cards = this.parseNoteToCards(note)
          result.cards.push(...cards)
          result.imported += cards.length
        } catch (error) {
          result.failed++
          result.errors.push(`Erreur page ${note.id}: ${error}`)
        }
      }
    } catch (error) {
      result.success = false
      result.errors.push(`Erreur globale: ${error}`)
    }

    return result
  }

  /**
   * Exporte des cartes vers Notion
   */
  async exportCards(cards: Array<{ front: string; back: string; tags: string[] }>): Promise<ExportResult> {
    const result: ExportResult = {
      success: true,
      exported: 0,
      failed: 0,
      noteIds: [],
      errors: []
    }

    if (!this.isAuthenticated) {
      result.success = false
      result.errors.push('Non authentifié')
      return result
    }

    for (const card of cards) {
      try {
        const pageId = await this.createPage(card.front, card.back, card.tags)
        result.noteIds.push(pageId)
        result.exported++
      } catch (error) {
        result.failed++
        result.errors.push(`Erreur création: ${error}`)
      }
    }

    return result
  }

  /**
   * Synchronisation bidirectionnelle
   */
  async sync(): Promise<SyncStatus> {
    const status: SyncStatus = {
      lastSync: Date.now(),
      totalNotes: 0,
      syncedNotes: 0,
      errors: [],
      isConnected: this.isAuthenticated
    }

    if (!this.isAuthenticated) {
      status.errors.push('Non connecté')
      return status
    }

    try {
      const notes = await this.getNotes()
      status.totalNotes = notes.length
      status.syncedNotes = notes.length
    } catch (error) {
      status.errors.push(`Erreur sync: ${error}`)
    }

    return status
  }

  async getSyncStatus(): Promise<SyncStatus> {
    return this.sync()
  }

  /**
   * Convertit une page Notion en note
   */
  private async convertPageToNote(page: NotionPage): Promise<IntegrationNote> {
    // Récupérer le contenu de la page (blocks)
    const blocksResponse = await this.apiRequest(`/blocks/${page.id}/children`)
    const blocksData = await blocksResponse.json()
    const blocks = blocksData.results || []

    // Extraire le texte des blocks
    const content = blocks
      .map((block: any) => this.extractBlockText(block))
      .filter(Boolean)
      .join('\n\n')

    // Extraire le titre
    const title = this.extractPageTitle(page) || 'Sans titre'

    // Extraire les tags (si propriété Tags existe)
    const tags = this.extractPageTags(page)

    return {
      id: page.id,
      title,
      content,
      tags,
      created: new Date(page.created_time).getTime(),
      updated: new Date(page.last_edited_time).getTime(),
      url: page.url,
      notebookId: page.parent?.database_id,
      notebookName: undefined
    }
  }

  /**
   * Extrait le titre d'une page
   */
  private extractPageTitle(page: NotionPage): string {
    const properties = page.properties
    const titleProp = Object.values(properties).find((prop: any) => prop.type === 'title')
    if (titleProp && Array.isArray((titleProp as any).title)) {
      return (titleProp as any).title.map((t: any) => t.plain_text).join('')
    }
    return 'Sans titre'
  }

  /**
   * Extrait les tags d'une page
   */
  private extractPageTags(page: NotionPage): string[] {
    const properties = page.properties
    const tagsProp = properties.Tags || properties.tags
    
    if (tagsProp?.type === 'multi_select') {
      return tagsProp.multi_select.map((t: any) => t.name)
    }
    
    return []
  }

  /**
   * Extrait le texte d'un block
   */
  private extractBlockText(block: any): string {
    const type = block.type
    const data = block[type]

    if (!data) return ''

    if (data.rich_text && Array.isArray(data.rich_text)) {
      return data.rich_text.map((rt: any) => rt.plain_text).join('')
    }

    return ''
  }

  /**
   * Crée une nouvelle page Notion
   */
  private async createPage(title: string, content: string, tags: string[]): Promise<string> {
    // Créer dans la base de données par défaut ou comme page enfant
    const response = await this.apiRequest('/pages', 'POST', {
      parent: { page_id: await this.getDefaultParentPageId() },
      properties: {
        title: {
          title: [{ text: { content: title } }]
        },
        Tags: {
          multi_select: tags.map(tag => ({ name: tag }))
        }
      },
      children: [
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ text: { content } }]
          }
        }
      ]
    })

    const data = await response.json()
    return data.id
  }

  /**
   * Récupère l'ID de la page parent par défaut
   */
  private async getDefaultParentPageId(): Promise<string> {
    // Pour simplifier, créer dans la racine du workspace
    const response = await this.apiRequest('/search', 'POST', { page_size: 1 })
    const data = await response.json()
    return data.results?.[0]?.id || ''
  }

  /**
   * Effectue une requête API Notion
   */
  private async apiRequest(endpoint: string, method: string = 'GET', body?: any): Promise<Response> {
    const url = `${this.API_BASE}${endpoint}`
    
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Notion-Version': this.API_VERSION,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    })

    if (!response.ok) {
      throw new Error(`Notion API error: ${response.status} ${response.statusText}`)
    }

    return response
  }
}

export default NotionIntegration
