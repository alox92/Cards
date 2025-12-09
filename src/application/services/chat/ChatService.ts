/**
 * Service de Chat Communautaire avec BaseService
 * ATTENTION: Version mock pour démo - Nécessite backend Socket.io/Firebase en production
 */

import { BaseService } from "../base/BaseService";
import type {
  IChatService,
  ChatMessage,
  ChatChannel,
  ChatUser,
  ChatAttachment,
} from "./IChatService";

/**
 * Implémentation du service Chat (Mock pour démo locale)
 */
export class ChatService extends BaseService implements IChatService {
  private mockMessages: Map<string, ChatMessage[]> = new Map();
  private mockChannels: ChatChannel[] = [];
  private mockUsers: ChatUser[] = [];
  private currentUserId: string =
    "user-" + Math.random().toString(36).substr(2, 9);

  /**
   * Permet de vérifier rapidement qu'un canal existe dans la configuration mock
   */
  private getChannelOrThrow(channelId: string): ChatChannel {
    const channel = this.mockChannels.find((c) => c.id === channelId);
    if (!channel) {
      throw new Error(`Canal introuvable: ${channelId}`);
    }
    return channel;
  }

  constructor() {
    super({
      name: "ChatService",
      retryAttempts: 2,
      retryDelay: 1000,
      timeout: 5000,
    });

    this.initializeMockData();
    this.log("Service initialisé en mode mock");
  }

  /**
   * Initialiser les données mock
   */
  private initializeMockData(): void {
    // Créer canaux par défaut
    this.mockChannels = [
      {
        id: "general",
        name: "Général",
        description: "Discussions générales sur l'apprentissage",
        icon: "💬",
        type: "public",
        memberCount: 150,
        unreadCount: 3,
      },
      {
        id: "help",
        name: "Aide & Support",
        description: "Questions et entraide",
        icon: "🆘",
        type: "public",
        memberCount: 89,
        unreadCount: 0,
      },
      {
        id: "motivation",
        name: "Motivation",
        description: "Partage de progrès et encouragements",
        icon: "🔥",
        type: "public",
        memberCount: 234,
        unreadCount: 12,
      },
    ];

    // Messages par défaut
    this.mockMessages.set("general", [
      {
        id: "msg1",
        userId: "user1",
        username: "Sophie",
        avatar: "👩",
        content: "Bonjour ! Comment utilisez-vous les cartes flash ?",
        timestamp: Date.now() - 3600000,
        channelId: "general",
        reactions: { "👍": ["user2", "user3"], "❤️": ["user4"] },
      },
      {
        id: "msg2",
        userId: "user2",
        username: "Marc",
        avatar: "👨",
        content: "Je les révise tous les matins pendant 20 minutes !",
        timestamp: Date.now() - 1800000,
        channelId: "general",
        reactions: { "🔥": ["user1"] },
      },
    ]);

    // Utilisateurs mock
    this.mockUsers = [
      {
        userId: "user1",
        username: "Sophie",
        avatar: "👩",
        status: "online",
        lastSeen: Date.now(),
      },
      {
        userId: "user2",
        username: "Marc",
        avatar: "👨",
        status: "online",
        lastSeen: Date.now(),
      },
      {
        userId: "user3",
        username: "Julie",
        avatar: "👧",
        status: "away",
        lastSeen: Date.now() - 600000,
      },
    ];
  }

  async sendMessage(
    channelId: string,
    content: string,
    attachments?: ChatAttachment[]
  ): Promise<ChatMessage> {
    const channel = this.getChannelOrThrow(channelId);
    const trimmedContent = content?.trim() ?? "";
    const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

    if (!trimmedContent && !hasAttachments) {
      throw new Error("Le contenu du message ne peut pas être vide");
    }

    return this.executeWithRetry(async () => {
      const message: ChatMessage = {
        id: "msg-" + Date.now(),
        userId: this.currentUserId,
        username: "Vous",
        content: trimmedContent,
        timestamp: Date.now(),
        channelId: channel.id,
        reactions: {},
        attachments: hasAttachments ? [...attachments] : undefined,
      };

      // Ajouter au cache mock
      const messages = this.mockMessages.get(channelId) || [];
      messages.push(message);
      this.mockMessages.set(channelId, messages);

      this.log("Message envoyé", { channelId, messageId: message.id });
      return message;
    }, "sendMessage");
  }

  async getMessages(
    channelId: string,
    limit: number = 50
  ): Promise<ChatMessage[]> {
    this.getChannelOrThrow(channelId);
    return this.executeWithRetry(async () => {
      const messages = this.mockMessages.get(channelId) || [];
      const result = messages.slice(-limit);

      this.log("Messages récupérés", { channelId, count: result.length });
      return result;
    }, "getMessages");
  }

  async getChannels(): Promise<ChatChannel[]> {
    return this.executeWithRetry(async () => {
      this.log("Canaux récupérés", { count: this.mockChannels.length });
      return [...this.mockChannels];
    }, "getChannels");
  }

  async joinChannel(channelId: string): Promise<void> {
    this.getChannelOrThrow(channelId);
    return this.executeWithRetry(async () => {
      this.log("Canal rejoint", { channelId });
    }, "joinChannel");
  }

  async leaveChannel(channelId: string): Promise<void> {
    this.getChannelOrThrow(channelId);
    return this.executeWithRetry(async () => {
      this.log("Canal quitté", { channelId });
    }, "leaveChannel");
  }

  async addReaction(messageId: string, emoji: string): Promise<void> {
    return this.executeWithRetry(async () => {
      // Trouver le message dans tous les canaux
      for (const [, messages] of this.mockMessages.entries()) {
        const message = messages.find((m) => m.id === messageId);
        if (message) {
          if (!message.reactions[emoji]) {
            message.reactions[emoji] = [];
          }
          if (!message.reactions[emoji].includes(this.currentUserId)) {
            message.reactions[emoji].push(this.currentUserId);
          }
          this.log("Réaction ajoutée", { messageId, emoji });
          return;
        }
      }
    }, "addReaction");
  }

  async removeReaction(messageId: string, emoji: string): Promise<void> {
    return this.executeWithRetry(async () => {
      for (const [, messages] of this.mockMessages.entries()) {
        const message = messages.find((m) => m.id === messageId);
        if (message && message.reactions[emoji]) {
          message.reactions[emoji] = message.reactions[emoji].filter(
            (id) => id !== this.currentUserId
          );
          if (message.reactions[emoji].length === 0) {
            delete message.reactions[emoji];
          }
          this.log("Réaction supprimée", { messageId, emoji });
          return;
        }
      }
    }, "removeReaction");
  }

  async searchMessages(
    query: string,
    channelId?: string
  ): Promise<ChatMessage[]> {
    return this.executeWithRetry(async () => {
      const allMessages: ChatMessage[] = [];

      if (channelId) {
        allMessages.push(...(this.mockMessages.get(channelId) || []));
      } else {
        for (const messages of this.mockMessages.values()) {
          allMessages.push(...messages);
        }
      }

      const results = allMessages.filter((msg) =>
        msg.content.toLowerCase().includes(query.toLowerCase())
      );

      this.log("Messages recherchés", { query, results: results.length });
      return results;
    }, "searchMessages");
  }

  async getOnlineUsers(): Promise<ChatUser[]> {
    return this.executeWithRetry(async () => {
      const online = this.mockUsers.filter((u) => u.status === "online");
      this.log("Utilisateurs en ligne", { count: online.length });
      return online;
    }, "getOnlineUsers");
  }

  async markAsRead(channelId: string): Promise<void> {
    return this.executeWithRetry(async () => {
      const channel = this.mockChannels.find((c) => c.id === channelId);
      if (channel) {
        channel.unreadCount = 0;
        this.log("Canal marqué comme lu", { channelId });
      }
    }, "markAsRead");
  }

  setMockMode(_enabled: boolean): void {
    // Mock mode toujours actif pour cette version
    this.log("Configuration mode mock ignorée");
  }

  isReady(): boolean {
    return true; // Toujours prêt en mode mock
  }

  async dispose(): Promise<void> {
    this.log("Nettoyage du service Chat");
    this.mockMessages.clear();
    this.mockChannels = [];
    this.mockUsers = [];
  }
}
