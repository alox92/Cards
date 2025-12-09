/**
 * Intégration Google Keep
 * ATTENTION: Google Keep n'a pas d'API officielle publique
 * Cette implémentation utilise l'API non documentée (reverse-engineered)
 * Alternative: Utiliser Google Tasks API comme proxy
 */

import BaseIntegration, {
  IntegrationConfig,
  IntegrationNote,
  IntegrationNotebook,
  ImportResult,
  ExportResult,
  SyncStatus
} from './BaseIntegration'

export class GoogleKeepIntegration extends BaseIntegration {
  private readonly KEEP_API = 'https://www.googleapis.com/notes/v1'
  private readonly AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
  private readonly TOKEN_URL = 'https://oauth2.googleapis.com/token'

  constructor(config: IntegrationConfig) {
    super(config)
    const saved = this.loadConfig('google-keep')
    if (saved) {
      this.config = saved
      this.isAuthenticated = !!saved.accessToken
    }
  }

  /**
   * Authentification Google OAuth 2.0
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
      const response = await this.apiRequest('/notes')
      this.isAuthenticated = response.ok
      this.saveConfig('google-keep')
      return this.isAuthenticated
    } catch (error) {
      this.isAuthenticated = false
      return false
    }
  }

  /**
   * URL d'authentification Google
   */
  getAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/keep',
      'https://www.googleapis.com/auth/keep.readonly'
    ]

    const params = new URLSearchParams({
      client_id: this.config.clientId || '',
      redirect_uri: this.config.redirectUri || 'http://localhost:3000/keep/callback',
      response_type: 'code',
      scope: scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent'
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
        this.saveConfig('google-keep')
        return true
      }

      return false
    } catch (error) {
      // Google Keep OAuth error
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
        this.config.expiresAt = Date.now() + data.expires_in * 1000
        this.saveConfig('google-keep')
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
    localStorage.removeItem('integration-google-keep')
  }

  /**
   * Récupère les labels (équivalent notebooks)
   */
  async getNotebooks(): Promise<IntegrationNotebook[]> {
    if (!this.isAuthenticated) {
      throw new Error('Non authentifié')
    }

    try {
      const response = await this.apiRequest('/labels')
      const data = await response.json()

      return (data.labels || []).map((label: any) => ({
        id: label.id,
        name: label.name,
        noteCount: undefined
      }))
    } catch (error) {
      // Erreur récupération labels
      return []
    }
  }

  /**
   * Récupère les notes
   */
  async getNotes(labelId?: string): Promise<IntegrationNote[]> {
    if (!this.isAuthenticated) {
      throw new Error('Non authentifié')
    }

    try {
      const endpoint = labelId
        ? `/notes?labelId=${labelId}`
        : '/notes'

      const response = await this.apiRequest(endpoint)
      const data = await response.json()

      return (data.notes || []).map((note: any) => this.convertKeepNote(note))
    } catch (error) {
      // Erreur récupération notes
      return []
    }
  }

  /**
   * Récupère une note spécifique
   */
  async getNote(noteId: string): Promise<IntegrationNote> {
    if (!this.isAuthenticated) {
      throw new Error('Non authentifié')
    }

    const response = await this.apiRequest(`/notes/${noteId}`)
    const note = await response.json()
    return this.convertKeepNote(note)
  }

  /**
   * Importe des notes Google Keep
   */
  async importNotes(noteIds?: string[]): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      imported: 0,
      failed: 0,
      cards: [],
      errors: []
    }

    try {
      const notes = noteIds
        ? await Promise.all(noteIds.map(id => this.getNote(id)))
        : await this.getNotes()

      for (const note of notes) {
        try {
          const cards = this.parseNoteToCards(note)
          result.cards.push(...cards)
          result.imported += cards.length
        } catch (error) {
          result.failed++
          result.errors.push(`Erreur note ${note.id}: ${error}`)
        }
      }
    } catch (error) {
      result.success = false
      result.errors.push(`Erreur globale: ${error}`)
    }

    return result
  }

  /**
   * Exporte des cartes vers Google Keep
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
        const noteId = await this.createNote(card.front, card.back, card.tags)
        result.noteIds.push(noteId)
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
   * Convertit une note Keep
   */
  private convertKeepNote(keepNote: any): IntegrationNote {
    // Extraire le contenu (texte + listes)
    let content = keepNote.textContent || ''

    // Ajouter les items de liste
    if (keepNote.listContent && Array.isArray(keepNote.listContent)) {
      const listItems = keepNote.listContent
        .map((item: any) => `• ${item.text}${item.checked ? ' ✓' : ''}`)
        .join('\n')
      content += (content ? '\n\n' : '') + listItems
    }

    return {
      id: keepNote.id,
      title: keepNote.title || 'Sans titre',
      content,
      tags: keepNote.labels?.map((l: any) => l.name) || [],
      created: keepNote.createTime ? new Date(keepNote.createTime).getTime() : Date.now(),
      updated: keepNote.updateTime ? new Date(keepNote.updateTime).getTime() : Date.now(),
      url: undefined,
      notebookId: undefined,
      notebookName: undefined
    }
  }

  /**
   * Crée une nouvelle note Keep
   */
  private async createNote(title: string, content: string, tags: string[]): Promise<string> {
    const noteData = {
      title,
      textContent: content,
      labels: tags.map(tag => ({ name: tag }))
    }

    const response = await this.apiRequest('/notes', 'POST', noteData)
    const data = await response.json()
    return data.id
  }

  /**
   * Effectue une requête API Google Keep
   * ATTENTION: API non officielle, peut changer
   */
  private async apiRequest(endpoint: string, method: string = 'GET', body?: any): Promise<Response> {
    const url = `${this.KEEP_API}${endpoint}`

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    })

    if (!response.ok) {
      throw new Error(`Google Keep API error: ${response.status} ${response.statusText}`)
    }

    return response
  }

  /**
   * Alternative: Utiliser Google Tasks comme proxy
   * (API officielle et stable)
   */
  async useTasksAsProxy(): Promise<void> {
    // Google Keep API non officielle - Considérez Google Tasks API comme alternative
    // Implémentation future si nécessaire
  }
}

export default GoogleKeepIntegration
