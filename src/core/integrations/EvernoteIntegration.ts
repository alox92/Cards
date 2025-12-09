/**
 * Intégration Evernote
 * API: https://dev.evernote.com/doc/
 * Permet d'importer des notes Evernote en cartes flash
 */

import BaseIntegration, {
  IntegrationConfig,
  IntegrationNote,
  IntegrationNotebook,
  ImportResult,
  ExportResult,
  SyncStatus
} from './BaseIntegration'

export class EvernoteIntegration extends BaseIntegration {
  private readonly API_BASE = 'https://www.evernote.com/api/v1'
  private readonly SANDBOX_BASE = 'https://sandbox.evernote.com/api/v1'
  private useSandbox: boolean = false

  constructor(config: IntegrationConfig, sandbox: boolean = false) {
    super(config)
    this.useSandbox = sandbox
    const saved = this.loadConfig('evernote')
    if (saved) {
      this.config = saved
      this.isAuthenticated = !!saved.accessToken
    }
  }

  private getBaseUrl(): string {
    return this.useSandbox ? this.SANDBOX_BASE : this.API_BASE
  }

  /**
   * Authentification OAuth 1.0a
   */
  async authenticate(): Promise<boolean> {
    if (!this.config.accessToken) {
      throw new Error('Access token requis. Utilisez getAuthUrl() pour OAuth.')
    }

    try {
      // Tester le token avec getUserInfo
      const response = await this.apiRequest('/users/me')
      this.isAuthenticated = response.ok
      this.saveConfig('evernote')
      return this.isAuthenticated
    } catch (error) {
      this.isAuthenticated = false
      return false
    }
  }

  getAuthUrl(): string {
    const params = new URLSearchParams({
      oauth_consumer_key: this.config.clientId || '',
      oauth_callback: this.config.redirectUri || 'http://localhost:3000/evernote/callback'
    })
    return `${this.getBaseUrl()}/oauth/authorize?${params.toString()}`
  }

  async refreshAuthentication(): Promise<boolean> {
    return this.authenticate()
  }

  async disconnect(): Promise<void> {
    this.config = {}
    this.isAuthenticated = false
    localStorage.removeItem('integration-evernote')
  }

  /**
   * Récupère les notebooks
   */
  async getNotebooks(): Promise<IntegrationNotebook[]> {
    if (!this.isAuthenticated) {
      throw new Error('Non authentifié')
    }

    try {
      const response = await this.apiRequest('/notebooks')
      const data = await response.json()

      return (data.notebooks || []).map((nb: any) => ({
        id: nb.guid,
        name: nb.name,
        noteCount: nb.noteCount
      }))
    } catch (error) {
      // Erreur récupération notebooks
      return []
    }
  }

  /**
   * Récupère les notes d'un notebook
   */
  async getNotes(notebookId?: string): Promise<IntegrationNote[]> {
    if (!this.isAuthenticated) {
      throw new Error('Non authentifié')
    }

    try {
      const endpoint = notebookId 
        ? `/notebooks/${notebookId}/notes`
        : '/notes'
      
      const response = await this.apiRequest(endpoint)
      const data = await response.json()

      return await Promise.all(
        (data.notes || []).map((note: any) => this.convertEvernoteNote(note))
      )
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

    const response = await this.apiRequest(`/notes/${noteId}?includeContent=true`)
    const note = await response.json()
    return this.convertEvernoteNote(note)
  }

  /**
   * Importe des notes Evernote
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
   * Exporte des cartes vers Evernote
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
   * Convertit une note Evernote en format standard
   */
  private convertEvernoteNote(evernoteNote: any): IntegrationNote {
    // Extraire le contenu ENML (Evernote Markup Language)
    const content = this.extractContentFromENML(evernoteNote.content || '')
    
    return {
      id: evernoteNote.guid,
      title: evernoteNote.title || 'Sans titre',
      content,
      tags: evernoteNote.tagNames || [],
      created: evernoteNote.created || Date.now(),
      updated: evernoteNote.updated || Date.now(),
      url: evernoteNote.noteResourceUrl,
      notebookId: evernoteNote.notebookGuid,
      notebookName: undefined
    }
  }

  /**
   * Extrait le texte du format ENML
   */
  private extractContentFromENML(enml: string): string {
    // ENML est un format XML basé sur XHTML
    // Supprimer les balises XML/HTML
    let text = enml
      .replace(/<\?xml[^>]*\?>/g, '')
      .replace(/<!DOCTYPE[^>]*>/g, '')
      .replace(/<en-note[^>]*>/g, '')
      .replace(/<\/en-note>/g, '')
      .replace(/<en-media[^>]*\/>/g, '[MEDIA]')
      .replace(/<en-todo[^>]*\/>/g, '☐')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<div[^>]*>/g, '\n')
      .replace(/<\/div>/g, '')
      .replace(/<p[^>]*>/g, '\n')
      .replace(/<\/p>/g, '')
      .replace(/<[^>]*>/g, '') // Remove remaining HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim()

    return text
  }

  /**
   * Crée une nouvelle note Evernote
   */
  private async createNote(title: string, content: string, tags: string[]): Promise<string> {
    // Convertir en ENML
    const enml = this.convertToENML(content)

    const noteData = {
      title,
      content: enml,
      tagNames: tags
    }

    const response = await this.apiRequest('/notes', 'POST', noteData)
    const data = await response.json()
    return data.guid
  }

  /**
   * Convertit du texte en ENML
   */
  private convertToENML(text: string): string {
    const escapedText = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br/>')

    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE en-note SYSTEM "http://xml.evernote.com/pub/enml2.dtd">
<en-note>${escapedText}</en-note>`
  }

  /**
   * Effectue une requête API Evernote
   */
  private async apiRequest(endpoint: string, method: string = 'GET', body?: any): Promise<Response> {
    const url = `${this.getBaseUrl()}${endpoint}`
    
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    })

    if (!response.ok) {
      throw new Error(`Evernote API error: ${response.status} ${response.statusText}`)
    }

    return response
  }
}

export default EvernoteIntegration
