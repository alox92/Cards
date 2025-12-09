/**
 * Interface pour le service de Chat Communautaire
 * Permet la communication entre utilisateurs dans l'application
 */

export interface ChatMessage {
  id: string
  userId: string
  username: string
  avatar?: string
  content: string
  timestamp: number
  channelId: string
  replyTo?: string
  reactions: Record<string, string[]> // emoji -> userIds[]
  attachments?: ChatAttachment[]
}

export interface ChatAttachment {
  type: 'image' | 'card' | 'deck' | 'file'
  url: string
  name: string
  metadata?: Record<string, unknown>
}

export interface ChatChannel {
  id: string
  name: string
  description: string
  icon: string
  type: 'public' | 'private' | 'dm'
  memberCount: number
  unreadCount: number
  lastMessage?: ChatMessage
}

export interface ChatUser {
  userId: string
  username: string
  avatar?: string
  status: 'online' | 'offline' | 'away'
  lastSeen: number
}

/**
 * Interface du service Chat
 */
export interface IChatService {
  /**
   * Envoyer un message
   */
  sendMessage(channelId: string, content: string, attachments?: ChatAttachment[]): Promise<ChatMessage>

  /**
   * Obtenir les messages d'un canal
   */
  getMessages(channelId: string, limit?: number): Promise<ChatMessage[]>

  /**
   * Obtenir les canaux disponibles
   */
  getChannels(): Promise<ChatChannel[]>

  /**
   * Rejoindre un canal
   */
  joinChannel(channelId: string): Promise<void>

  /**
   * Quitter un canal
   */
  leaveChannel(channelId: string): Promise<void>

  /**
   * Ajouter une réaction à un message
   */
  addReaction(messageId: string, emoji: string): Promise<void>

  /**
   * Supprimer une réaction
   */
  removeReaction(messageId: string, emoji: string): Promise<void>

  /**
   * Rechercher des messages
   */
  searchMessages(query: string, channelId?: string): Promise<ChatMessage[]>

  /**
   * Obtenir les utilisateurs en ligne
   */
  getOnlineUsers(): Promise<ChatUser[]>

  /**
   * Marquer un canal comme lu
   */
  markAsRead(channelId: string): Promise<void>

  /**
   * Activer/désactiver le mode mock
   */
  setMockMode(enabled: boolean): void

  /**
   * Vérifier si le service est prêt
   */
  isReady(): boolean

  /**
   * Nettoyer les ressources
   */
  dispose(): Promise<void>
}

export const CHAT_SERVICE_TOKEN = 'ChatService'
