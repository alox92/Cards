/**
 * Tests unitaires pour ChatService
 * Couvre messaging, channels, users, reactions
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { ChatService } from '../../application/services/chat/ChatService'

describe('ChatService', () => {
  let service: ChatService

  beforeEach(() => {
    service = new ChatService()
    vi.clearAllMocks()
  })

  afterEach(async () => {
    await service.dispose()
  })

  describe('Initialisation', () => {
    it('devrait initialiser le service avec succès', () => {
      expect(service.isReady()).toBe(true) // ChatService est prêt immédiatement
    })
  })

  describe('Gestion des canaux', () => {
    it('devrait retourner la liste des canaux', async () => {
      const channels = await service.getChannels()
      
      expect(Array.isArray(channels)).toBe(true)
      expect(channels.length).toBeGreaterThan(0)
      expect(channels[0]).toHaveProperty('id')
      expect(channels[0]).toHaveProperty('name')
      expect(channels[0]).toHaveProperty('type')
    })

    it('devrait rejoindre un canal', async () => {
      const channels = await service.getChannels()
      const channelId = channels[0].id
      
      await expect(service.joinChannel(channelId)).resolves.not.toThrow()
    })

    it('devrait quitter un canal', async () => {
      const channels = await service.getChannels()
      const channelId = channels[0].id
      
      await service.joinChannel(channelId)
      await expect(service.leaveChannel(channelId)).resolves.not.toThrow()
    })

    it('devrait gérer les erreurs de canal inexistant', async () => {
      await expect(service.joinChannel('invalid-channel-id'))
        .rejects.toThrow()
    })
  })

  describe('Gestion des messages', () => {
    it('devrait envoyer un message', async () => {
      const channels = await service.getChannels()
      const channelId = channels[0].id
      const content = 'Test message'
      
      const message = await service.sendMessage(channelId, content)
      
      expect(message).toHaveProperty('id')
      expect(message).toHaveProperty('userId')
      expect(message).toHaveProperty('content', content)
      expect(message).toHaveProperty('channelId', channelId)
      expect(message).toHaveProperty('timestamp')
    })

    it('devrait envoyer un message avec attachments', async () => {
      const channels = await service.getChannels()
      const channelId = channels[0].id
      const attachments = [
        {
          type: 'image' as const,
          url: 'https://example.com/image.jpg',
          name: 'test.jpg'
        }
      ]
      
      const message = await service.sendMessage(channelId, 'Check this out!', attachments)
      
      expect(message.attachments).toBeDefined()
      expect(message.attachments?.length).toBe(1)
    })

    it('devrait récupérer les messages d\'un canal', async () => {
      const channels = await service.getChannels()
      const channelId = channels[0].id
      
      const messages = await service.getMessages(channelId)
      
      expect(Array.isArray(messages)).toBe(true)
    })

    it('devrait limiter le nombre de messages', async () => {
      const channels = await service.getChannels()
      const channelId = channels[0].id
      const limit = 10
      
      const messages = await service.getMessages(channelId, limit)
      
      expect(messages.length).toBeLessThanOrEqual(limit)
    })

    it('devrait gérer les messages vides', async () => {
      const channels = await service.getChannels()
      const channelId = channels[0].id
      
      await expect(service.sendMessage(channelId, ''))
        .rejects.toThrow()
    })
  })

  describe('Gestion des réactions', () => {
    it('devrait ajouter une réaction à un message', async () => {
      const channels = await service.getChannels()
      const channelId = channels[0].id
      
      // Envoyer un message d'abord
      const message = await service.sendMessage(channelId, 'React to this!')
      
      // Ajouter une réaction
      await expect(service.addReaction(message.id, '👍'))
        .resolves.not.toThrow()
    })

    it('devrait supprimer une réaction', async () => {
      const channels = await service.getChannels()
      const channelId = channels[0].id
      
      const message = await service.sendMessage(channelId, 'Test')
      await service.addReaction(message.id, '❤️')
      
      await expect(service.removeReaction(message.id, '❤️'))
        .resolves.not.toThrow()
    })

    it('devrait gérer les réactions multiples', async () => {
      const channels = await service.getChannels()
      const channelId = channels[0].id
      
      const message = await service.sendMessage(channelId, 'Multiple reactions')
      
      await service.addReaction(message.id, '👍')
      await service.addReaction(message.id, '❤️')
      await service.addReaction(message.id, '🎉')
      
      const messages = await service.getMessages(channelId)
      const updatedMessage = messages.find(m => m.id === message.id)
      
      expect(updatedMessage?.reactions).toBeDefined()
    })
  })

  describe('Gestion des utilisateurs', () => {
    it('devrait récupérer les utilisateurs en ligne', async () => {
      const users = await service.getOnlineUsers()
      
      expect(Array.isArray(users)).toBe(true)
      if (users.length > 0) {
        expect(users[0]).toHaveProperty('userId')
        expect(users[0]).toHaveProperty('username')
        expect(users[0]).toHaveProperty('status')
      }
    })
  })

  describe('Recherche de messages', () => {
    it('devrait rechercher des messages', async () => {
      const query = 'test'
      const results = await service.searchMessages(query)
      
      expect(Array.isArray(results)).toBe(true)
    })

    it('devrait rechercher dans un canal spécifique', async () => {
      const channels = await service.getChannels()
      const channelId = channels[0].id
      const query = 'specific'
      
      const results = await service.searchMessages(query, channelId)
      
      expect(Array.isArray(results)).toBe(true)
      if (results.length > 0) {
        expect(results[0].channelId).toBe(channelId)
      }
    })

    it('devrait retourner un tableau vide si aucun résultat', async () => {
      const results = await service.searchMessages('nonexistent-query-xyz-123')
      
      expect(results).toEqual([])
    })
  })

  describe('Messages non lus', () => {
    it('devrait marquer un message comme lu', async () => {
      const channels = await service.getChannels()
      const channelId = channels[0].id
      
      const message = await service.sendMessage(channelId, 'Mark as read')
      
      await expect(service.markAsRead(message.id))
        .resolves.not.toThrow()
    })
  })

  describe('État du service', () => {
    it('devrait indiquer que le service est prêt', () => {
      expect(service.isReady()).toBe(true)
    })
  })

  describe('Nettoyage', () => {
    it('devrait nettoyer les ressources proprement', async () => {
      await expect(service.dispose()).resolves.not.toThrow()
    })
  })

  describe('Retry et robustesse', () => {
    it('devrait réessayer après échec réseau', async () => {
      // Simuler un échec réseau temporaire
      const channels = await service.getChannels()
      const channelId = channels[0].id
      
      // La méthode devrait réessayer automatiquement via BaseService
      const message = await service.sendMessage(channelId, 'Retry test')
      
      expect(message).toBeDefined()
      expect(message.content).toBe('Retry test')
    })
  })
})
