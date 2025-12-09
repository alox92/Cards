import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChatService } from '@/ui/hooks/useChatService'
import type { ChatMessage, ChatChannel, ChatUser } from '@/application/services/chat'

interface ChatPanelProps {
  userId: string
  username: string
  onClose: () => void
  className?: string
}

/**
 * Panneau de chat communautaire
 */
export const ChatPanel: React.FC<ChatPanelProps> = ({
  userId,
  username,
  onClose,
  className = ''
}) => {
  const { service: chatService, isReady } = useChatService()
  const [channels, setChannels] = useState<ChatChannel[]>([])
  const [activeChannel, setActiveChannel] = useState<ChatChannel | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [onlineUsers, setOnlineUsers] = useState<ChatUser[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [isConnecting, setIsConnecting] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fonction loadChannel avec useCallback
  const loadChannel = React.useCallback(async (channel: ChatChannel) => {
    if (!isReady) return
    
    setActiveChannel(channel)
    try {
      const channelMessages = await chatService.getMessages(channel.id)
      const users = await chatService.getOnlineUsers()
      setMessages(channelMessages)
      setOnlineUsers(users)
    } catch (error) {
      // Erreur silencieuse - UI affichera état vide
    }
  }, [isReady, chatService])

  // Connexion initiale
  useEffect(() => {
    if (!isReady) return
    
    const init = async () => {
      setIsConnecting(true)
      try {
        const channelsList = await chatService.getChannels()
        setChannels(channelsList)
        
        if (channelsList.length > 0) {
          void loadChannel(channelsList[0])
        }
      } catch (error) {
        // Erreur silencieuse
      } finally {
        setIsConnecting(false)
      }
    }

    void init()

    return () => {
      // Cleanup si nécessaire
    }
  }, [userId, loadChannel, isReady, chatService])

  // Auto-scroll vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !activeChannel) return

    try {
      const message = await chatService.sendMessage(activeChannel.id, messageInput)
      setMessages(prev => [...prev, message])
      setMessageInput('')
    } catch (error) {
      // Erreur silencieuse - message non envoyé
    }
  }

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      await chatService.addReaction(messageId, emoji)
      // Mettre à jour localement
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId) {
          const reactions = { ...msg.reactions }
          if (!reactions[emoji]) reactions[emoji] = []
          if (!reactions[emoji].includes(userId)) {
            reactions[emoji].push(userId)
          }
          return { ...msg, reactions }
        }
        return msg
      }))
    } catch (error) {
      // Erreur silencieuse
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    try {
      const results = await chatService.searchMessages(searchQuery, activeChannel?.id)
      setMessages(results)
    } catch (error) {
      // Erreur silencieuse
    }
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'away': return 'bg-yellow-500'
      default: return 'bg-gray-400'
    }
  }

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    if (diff < 60000) return 'À l\'instant'
    if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)}min`
    if (diff < 86400000) return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  return (
    <div className={`chat-panel ${className}`}>
      <div className="flex h-[80vh] bg-white dark:bg-gray-800 rounded-lg shadow-2xl overflow-hidden max-w-7xl mx-auto">
        {/* Sidebar - Liste des channels */}
        <div className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-500">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              💬 Chat
            </h2>
          </div>

          {/* Channels List */}
          <div className="flex-1 overflow-y-auto p-2">
            {channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => void loadChannel(channel)}
                className={`w-full text-left p-3 rounded-lg mb-2 transition ${
                  activeChannel?.id === channel.id
                    ? 'bg-blue-100 dark:bg-blue-900/50 border-2 border-blue-500'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{channel.icon}</span>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {channel.name}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {channel.memberCount} membres
                      </div>
                    </div>
                  </div>
                  {channel.unreadCount > 0 && (
                    <div className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {channel.unreadCount}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* User Status */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                  {username[0].toUpperCase()}
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white text-sm">
                  {username}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  En ligne
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {isConnecting ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin text-4xl mb-4">⚙️</div>
                <p className="text-gray-600 dark:text-gray-400">Connexion...</p>
              </div>
            </div>
          ) : activeChannel ? (
            <>
              {/* Channel Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{activeChannel.icon}</span>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {activeChannel.name}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {activeChannel.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Search */}
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && void handleSearch()}
                        placeholder="🔍 Rechercher..."
                        className="px-3 py-1 text-sm rounded border dark:bg-gray-700 dark:border-gray-600"
                      />
                      <button
                        onClick={() => void handleSearch()}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                      >
                        🔍
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <AnimatePresence>
                  {messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex gap-3 ${
                        message.userId === userId ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        {message.avatar ? (
                          <img
                            src={message.avatar}
                            alt={message.username}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                            {message.username[0].toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Message Content */}
                      <div className={`flex-1 max-w-xl ${message.userId === userId ? 'text-right' : ''}`}>
                        <div className="flex items-center gap-2 mb-1">
                          {message.userId !== userId && (
                            <span className="font-medium text-gray-900 dark:text-white">
                              {message.username}
                            </span>
                          )}
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTime(message.timestamp)}
                          </span>
                        </div>

                        <div
                          className={`inline-block px-4 py-2 rounded-lg ${
                            message.userId === userId
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                          }`}
                        >
                          {message.replyTo && (
                            <div className="text-xs opacity-70 mb-1 italic">
                              ↩️ Réponse à un message
                            </div>
                          )}
                          <p className="whitespace-pre-wrap">{message.content}</p>

                          {/* Attachments */}
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {message.attachments.map((attachment, i) => (
                                <div
                                  key={i}
                                  className="p-2 bg-white/20 dark:bg-black/20 rounded flex items-center gap-2"
                                >
                                  <span>{attachment.type === 'card' ? '📇' : '📎'}</span>
                                  <span className="text-sm">{attachment.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Reactions */}
                        {Object.keys(message.reactions).length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {Object.entries(message.reactions).map(([emoji, userIds]) => (
                              <button
                                key={emoji}
                                onClick={() => void handleReaction(message.id, emoji)}
                                className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 ${
                                  userIds.includes(userId)
                                    ? 'bg-blue-100 dark:bg-blue-900/50 border border-blue-500'
                                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                              >
                                <span>{emoji}</span>
                                <span>{userIds.length}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Quick reactions */}
                        <div className="mt-1 opacity-0 hover:opacity-100 transition">
                          <div className="flex gap-1">
                            {['👍', '❤️', '😂', '🔥', '💯'].map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => void handleReaction(message.id, emoji)}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && void handleSendMessage()}
                    placeholder="Écrire un message..."
                    className="flex-1 px-4 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600"
                  />
                  <button
                    onClick={() => void handleSendMessage()}
                    disabled={!messageInput.trim()}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Envoyer
                  </button>
                </div>
                <div className="flex gap-2 mt-2 text-xs text-gray-600 dark:text-gray-400">
                  <button className="hover:text-gray-900 dark:hover:text-white">
                    📎 Joindre
                  </button>
                  <button className="hover:text-gray-900 dark:hover:text-white">
                    😊 Emoji
                  </button>
                  <button className="hover:text-gray-900 dark:hover:text-white">
                    📇 Partager une carte
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-600 dark:text-gray-400">
                Sélectionnez un channel pour commencer
              </p>
            </div>
          )}
        </div>

        {/* Right Sidebar - Utilisateurs en ligne */}
        <div className="w-64 bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-bold text-gray-900 dark:text-white">
              En ligne ({onlineUsers.length})
            </h3>
          </div>
          <div className="p-2 space-y-2">
            {onlineUsers.map((user) => (
              <div
                key={user.userId}
                className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <div className="relative">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {user.username[0].toUpperCase()}
                    </div>
                  )}
                  <div className={`absolute bottom-0 right-0 w-3 h-3 ${getStatusColor(user.status)} border-2 border-white dark:border-gray-900 rounded-full`}></div>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.username}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {user.status === 'online' ? 'En ligne' : user.status === 'away' ? 'Absent' : 'Hors ligne'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatPanel
