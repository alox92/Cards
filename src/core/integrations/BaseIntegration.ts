/**
 * Classe de base pour toutes les intégrations externes
 * Définit l'interface commune pour Notion, Evernote, OneNote, Google Keep
 */

export interface IntegrationConfig {
  apiKey?: string
  accessToken?: string
  refreshToken?: string
  clientId?: string
  clientSecret?: string
  redirectUri?: string
  expiresAt?: number
}

export interface IntegrationNote {
  id: string
  title: string
  content: string
  tags: string[]
  created: number
  updated: number
  url?: string
  notebookId?: string
  notebookName?: string
}

export interface IntegrationNotebook {
  id: string
  name: string
  noteCount?: number
}

export interface ImportResult {
  success: boolean
  imported: number
  failed: number
  cards: Array<{ front: string; back: string; tags: string[] }>
  errors: string[]
}

export interface ExportResult {
  success: boolean
  exported: number
  failed: number
  noteIds: string[]
  errors: string[]
}

export interface SyncStatus {
  lastSync: number
  totalNotes: number
  syncedNotes: number
  errors: string[]
  isConnected: boolean
}

/**
 * Interface commune pour toutes les intégrations
 */
export abstract class BaseIntegration {
  protected config: IntegrationConfig
  protected isAuthenticated: boolean = false

  constructor(config: IntegrationConfig) {
    this.config = config
  }

  // Méthodes d'authentification
  abstract authenticate(): Promise<boolean>
  abstract refreshAuthentication(): Promise<boolean>
  abstract disconnect(): Promise<void>
  abstract getAuthUrl(): string

  // Méthodes de récupération
  abstract getNotebooks(): Promise<IntegrationNotebook[]>
  abstract getNotes(notebookId?: string): Promise<IntegrationNote[]>
  abstract getNote(noteId: string): Promise<IntegrationNote>

  // Méthodes d'import/export
  abstract importNotes(noteIds?: string[]): Promise<ImportResult>
  abstract exportCards(cards: Array<{ front: string; back: string; tags: string[] }>): Promise<ExportResult>

  // Synchronisation
  abstract sync(): Promise<SyncStatus>
  abstract getSyncStatus(): Promise<SyncStatus>

  // Utilitaires
  isConnected(): boolean {
    return this.isAuthenticated
  }

  getConfig(): IntegrationConfig {
    return { ...this.config }
  }

  updateConfig(config: Partial<IntegrationConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Convertit une note en cartes flash
   * Détecte les patterns Q/A, bullet points, etc.
   */
  protected parseNoteToCards(note: IntegrationNote): Array<{ front: string; back: string; tags: string[] }> {
    const cards: Array<{ front: string; back: string; tags: string[] }> = []
    const content = note.content

    // Méthode 1 : Détection Q: ... A: ...
    const qaPattern = /Q[:\.]?\s*(.+?)\s*A[:\.]?\s*(.+?)(?=Q[:\.]|$)/gis
    const qaMatches = content.matchAll(qaPattern)
    for (const match of qaMatches) {
      const front = this.cleanText(match[1])
      const back = this.cleanText(match[2])
      if (front && back) {
        cards.push({ front, back, tags: note.tags })
      }
    }

    // Méthode 2 : Bullet points avec sous-points
    if (cards.length === 0) {
      const bulletPattern = /^[-*•]\s*(.+?)(?:\n\s+[-*•]\s*(.+?))?$/gm
      const bulletMatches = content.matchAll(bulletPattern)
      for (const match of bulletMatches) {
        const front = this.cleanText(match[1])
        const back = this.cleanText(match[2] || '')
        if (front && back) {
          cards.push({ front, back, tags: note.tags })
        }
      }
    }

    // Méthode 3 : Paragraphes séparés par ligne vide
    if (cards.length === 0) {
      const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim())
      for (let i = 0; i < paragraphs.length - 1; i += 2) {
        const front = this.cleanText(paragraphs[i])
        const back = this.cleanText(paragraphs[i + 1] || '')
        if (front && back) {
          cards.push({ front, back, tags: note.tags })
        }
      }
    }

    // Fallback : une seule carte avec le titre comme question
    if (cards.length === 0 && note.title && content) {
      cards.push({
        front: this.cleanText(note.title),
        back: this.cleanText(content),
        tags: note.tags
      })
    }

    return cards
  }

  /**
   * Nettoie le texte HTML/Markdown
   */
  protected cleanText(text: string): string {
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.+?)\*/g, '$1') // Remove italic markdown
      .replace(/`(.+?)`/g, '$1') // Remove code markdown
      .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Remove markdown links
      .replace(/\n+/g, ' ') // Replace newlines with space
      .trim()
  }

  /**
   * Vérifie si le token est expiré
   */
  protected isTokenExpired(): boolean {
    if (!this.config.expiresAt) return false
    return Date.now() >= this.config.expiresAt
  }

  /**
   * Sauvegarde la config dans localStorage
   */
  protected saveConfig(serviceName: string): void {
    localStorage.setItem(`integration-${serviceName}`, JSON.stringify(this.config))
  }

  /**
   * Charge la config depuis localStorage
   */
  protected loadConfig(serviceName: string): IntegrationConfig | null {
    const stored = localStorage.getItem(`integration-${serviceName}`)
    return stored ? JSON.parse(stored) : null
  }
}

export default BaseIntegration
