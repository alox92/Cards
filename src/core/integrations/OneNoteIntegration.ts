/**
 * Intégration Microsoft OneNote
 * API: https://learn.microsoft.com/en-us/graph/api/resources/onenote-api-overview
 * Utilise Microsoft Graph API
 */

import BaseIntegration, {
  IntegrationConfig,
  IntegrationNote,
  IntegrationNotebook,
  ImportResult,
  ExportResult,
  SyncStatus
} from './BaseIntegration'

export class OneNoteIntegration extends BaseIntegration {
  private readonly GRAPH_API = 'https://graph.microsoft.com/v1.0'
  private readonly AUTH_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize'
  private readonly TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token'

  constructor(config: IntegrationConfig) {
    super(config)
    const saved = this.loadConfig('onenote')
    if (saved) {
      this.config = saved
      this.isAuthenticated = !!saved.accessToken
    }
  }

  /**
   * Authentification Microsoft OAuth 2.0
   */
  async authenticate(): Promise<boolean> {
    if (!this.config.accessToken) {
      throw new Error('Access token requis. Utilisez getAuthUrl() pour OAuth.')
    }

    if (this.isTokenExpired() && this.config.refreshToken) {
      return this.refreshAuthentication()
    }

    try {
      // Tester le token
      const response = await this.apiRequest('/me')
      this.isAuthenticated = response.ok
      this.saveConfig('onenote')
      return this.isAuthenticated
    } catch (error) {
      this.isAuthenticated = false
      return false
    }
  }

  /**
   * URL d'authentification Microsoft
   */
  getAuthUrl(): string {
    const scopes = [
      'Notes.Read',
      'Notes.ReadWrite',
      'Notes.Create',
      'offline_access'
    ]

    const params = new URLSearchParams({
      client_id: this.config.clientId || '',
      response_type: 'code',
      redirect_uri: this.config.redirectUri || 'http://localhost:3000/onenote/callback',
      scope: scopes.join(' '),
      response_mode: 'query'
    })

    return `${this.AUTH_URL}?${params.toString()}`
  }

  /**
   * Échange le code OAuth contre un token
   */
  async exchangeCodeForToken(code: string): Promise<boolean> {
    try {
      const params = new URLSearchParams({
        client_id: this.config.clientId || '',
        client_secret: this.config.clientSecret || '',
        code,
        redirect_uri: this.config.redirectUri || '',
        grant_type: 'authorization_code'
      })

      const response = await fetch(this.TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
      })

      const data = await response.json()

      if (data.access_token) {
        this.config.accessToken = data.access_token
        this.config.refreshToken = data.refresh_token
        this.config.expiresAt = Date.now() + data.expires_in * 1000
        this.isAuthenticated = true
        this.saveConfig('onenote')
        return true
      }

      return false
    } catch (error) {
      // OneNote OAuth error
      return false
    }
  }

  /**
   * Rafraîchit le token
   */
  async refreshAuthentication(): Promise<boolean> {
    if (!this.config.refreshToken) {
      return false
    }

    try {
      const params = new URLSearchParams({
        client_id: this.config.clientId || '',
        client_secret: this.config.clientSecret || '',
        refresh_token: this.config.refreshToken,
        grant_type: 'refresh_token'
      })

      const response = await fetch(this.TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
      })

      const data = await response.json()

      if (data.access_token) {
        this.config.accessToken = data.access_token
        this.config.refreshToken = data.refresh_token || this.config.refreshToken
        this.config.expiresAt = Date.now() + data.expires_in * 1000
        this.saveConfig('onenote')
        return true
      }

      return false
    } catch (error) {
      // Token refresh error
      return false
    }
  }

  async disconnect(): Promise<void> {
    this.config = {}
    this.isAuthenticated = false
    localStorage.removeItem('integration-onenote')
  }

  /**
   * Récupère les notebooks
   */
  async getNotebooks(): Promise<IntegrationNotebook[]> {
    if (!this.isAuthenticated) {
      throw new Error('Non authentifié')
    }

    try {
      const response = await this.apiRequest('/me/onenote/notebooks')
      const data = await response.json()

      return (data.value || []).map((nb: any) => ({
        id: nb.id,
        name: nb.displayName,
        noteCount: undefined // Graph API ne fournit pas ce nombre directement
      }))
    } catch (error) {
      // Erreur récupération notebooks
      return []
    }
  }

  /**
   * Récupère les pages d'un notebook
   */
  async getNotes(notebookId?: string): Promise<IntegrationNote[]> {
    if (!this.isAuthenticated) {
      throw new Error('Non authentifié')
    }

    try {
      const endpoint = notebookId
        ? `/me/onenote/notebooks/${notebookId}/sections?$expand=pages`
        : '/me/onenote/pages'

      const response = await this.apiRequest(endpoint)
      const data = await response.json()

      if (notebookId) {
        // Extraire toutes les pages de toutes les sections
        const pages: any[] = []
        for (const section of data.value || []) {
          pages.push(...(section.pages || []))
        }
        return await Promise.all(pages.map(page => this.convertOneNotePage(page)))
      } else {
        return await Promise.all(
          (data.value || []).map((page: any) => this.convertOneNotePage(page))
        )
      }
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

    const response = await this.apiRequest(`/me/onenote/pages/${pageId}`)
    const page = await response.json()
    return this.convertOneNotePage(page)
  }

  /**
   * Importe des pages OneNote
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
   * Exporte des cartes vers OneNote
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
   * Synchronisation
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
   * Convertit une page OneNote
   */
  private async convertOneNotePage(page: any): Promise<IntegrationNote> {
    // Récupérer le contenu HTML de la page
    let content = ''
    try {
      const contentResponse = await this.apiRequest(`/me/onenote/pages/${page.id}/content`)
      const html = await contentResponse.text()
      content = this.extractTextFromHTML(html)
    } catch (error) {
      // Erreur récupération contenu page silencieuse
    }

    return {
      id: page.id,
      title: page.title || 'Sans titre',
      content,
      tags: [], // OneNote n'a pas de tags natifs
      created: new Date(page.createdDateTime).getTime(),
      updated: new Date(page.lastModifiedDateTime).getTime(),
      url: page.links?.oneNoteWebUrl?.href,
      notebookId: page.parentNotebook?.id,
      notebookName: page.parentNotebook?.displayName
    }
  }

  /**
   * Extrait le texte du HTML OneNote
   */
  private extractTextFromHTML(html: string): string {
    return html
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim()
  }

  /**
   * Crée une nouvelle page OneNote
   */
  private async createPage(title: string, content: string, tags: string[]): Promise<string> {
    // Créer HTML pour OneNote
    const html = `
<!DOCTYPE html>
<html>
  <head>
    <title>${this.escapeHtml(title)}</title>
  </head>
  <body>
    <h1>${this.escapeHtml(title)}</h1>
    <p>${this.escapeHtml(content)}</p>
    ${tags.length > 0 ? `<p><em>Tags: ${tags.map(t => this.escapeHtml(t)).join(', ')}</em></p>` : ''}
  </body>
</html>
    `

    const response = await this.apiRequest('/me/onenote/pages', 'POST', html, {
      'Content-Type': 'text/html'
    })

    const data = await response.json()
    return data.id
  }

  /**
   * Échappe le HTML
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  /**
   * Effectue une requête Graph API
   */
  private async apiRequest(
    endpoint: string,
    method: string = 'GET',
    body?: any,
    headers?: Record<string, string>
  ): Promise<Response> {
    const url = `${this.GRAPH_API}${endpoint}`

    const defaultHeaders: Record<string, string> = {
      'Authorization': `Bearer ${this.config.accessToken}`,
      ...(body && typeof body === 'object' ? { 'Content-Type': 'application/json' } : {})
    }

    const response = await fetch(url, {
      method,
      headers: { ...defaultHeaders, ...headers },
      body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined
    })

    if (!response.ok) {
      throw new Error(`OneNote API error: ${response.status} ${response.statusText}`)
    }

    return response
  }
}

export default OneNoteIntegration
