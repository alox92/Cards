import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLeaderboardService } from '@/ui/hooks/useLeaderboardService'
import type { LeaderboardEntry, LeaderboardConfig, UserStats, Achievement } from '@/application/services/leaderboard'

interface LeaderboardsPanelProps {
  userId: string
  onClose: () => void
  className?: string
}

/**
 * Panneau des classements et achievements
 */
export const LeaderboardsPanel: React.FC<LeaderboardsPanelProps> = ({
  userId,
  onClose,
  className = ''
}) => {
  const { service: leaderboardService, isReady } = useLeaderboardService()
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'achievements' | 'profile'>('leaderboard')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<LeaderboardEntry[]>([])

  const [config, setConfig] = useState<LeaderboardConfig>({
    type: 'global',
    timeframe: 'all-time',
    metric: 'xp',
    limit: 50
  })

  // Charger les données initiales
  useEffect(() => {
    if (isReady) {
      loadData()
    }
  }, [config, isReady])

  const loadData = async () => {
    if (!isReady) return
    
    setIsLoading(true)
    try {
      const [leaderboardData, statsData, achievementsData] = await Promise.all([
        leaderboardService.getLeaderboard(config),
        leaderboardService.getUserStats(userId),
        leaderboardService.getAchievements(userId)
      ])

      setLeaderboard(leaderboardData)
      setUserStats(statsData)
      setAchievements(achievementsData)
    } catch (error) {
      // Erreur silencieuse - UI affichera état vide
    } finally {
      setIsLoading(false)
    }
  }

  // Recherche d'utilisateurs
  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (query.trim().length < 2) {
      setSearchResults([])
      return
    }

    const results = await leaderboardService.searchUsers(query, 10)
    setSearchResults(results)
  }

  // Ajouter un ami
  const handleAddFriend = async (friendId: string) => {
    const success = await leaderboardService.addFriend(userId, friendId)
    if (success) {
      alert('Ami ajouté avec succès !')
      await loadData() // Recharger pour voir les amis
    }
  }

  const getRankColor = (rank: number): string => {
    if (rank === 1) return 'text-yellow-500'
    if (rank === 2) return 'text-gray-400'
    if (rank === 3) return 'text-orange-600'
    return 'text-gray-600 dark:text-gray-400'
  }

  const getRankMedal = (rank: number): string => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  return (
    <div className={`leaderboards-panel ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-t-lg">
          <div className="flex items-center justify-between text-white">
            <div>
              <h2 className="text-3xl font-bold">🏆 Classements</h2>
              <p className="text-sm opacity-90 mt-1">
                Comparez vos performances avec la communauté
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-3 font-medium transition ${
              activeTab === 'leaderboard'
                ? 'border-b-2 border-purple-500 text-purple-600 dark:text-purple-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            📊 Classement
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`px-4 py-3 font-medium transition ${
              activeTab === 'achievements'
                ? 'border-b-2 border-purple-500 text-purple-600 dark:text-purple-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            🏅 Achievements
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-3 font-medium transition ${
              activeTab === 'profile'
                ? 'border-b-2 border-purple-500 text-purple-600 dark:text-purple-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            👤 Mon Profil
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin text-4xl mb-4">⚙️</div>
              <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === 'leaderboard' && (
                <motion.div
                  key="leaderboard"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  {/* Filtres */}
                  <div className="mb-6 space-y-4">
                    <div className="flex gap-3 flex-wrap">
                      <select
                        value={config.type}
                        onChange={(e) => setConfig({ ...config, type: e.target.value as any })}
                        className="px-3 py-2 rounded border dark:bg-gray-700 dark:border-gray-600"
                      >
                        <option value="global">🌍 Mondial</option>
                        <option value="country">🇫🇷 Pays</option>
                        <option value="friends">👥 Amis</option>
                      </select>

                      <select
                        value={config.timeframe}
                        onChange={(e) => setConfig({ ...config, timeframe: e.target.value as any })}
                        className="px-3 py-2 rounded border dark:bg-gray-700 dark:border-gray-600"
                      >
                        <option value="daily">📅 Aujourd'hui</option>
                        <option value="weekly">📆 Cette semaine</option>
                        <option value="monthly">📋 Ce mois</option>
                        <option value="all-time">⏰ Tout le temps</option>
                      </select>

                      <select
                        value={config.metric}
                        onChange={(e) => setConfig({ ...config, metric: e.target.value as any })}
                        className="px-3 py-2 rounded border dark:bg-gray-700 dark:border-gray-600"
                      >
                        <option value="xp">⭐ XP</option>
                        <option value="cards-studied">📚 Cartes étudiées</option>
                        <option value="accuracy">🎯 Précision</option>
                        <option value="streak">🔥 Streak</option>
                      </select>
                    </div>

                    {/* Recherche d'utilisateurs */}
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="🔍 Rechercher un utilisateur..."
                        className="w-full px-4 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600"
                      />
                      {searchResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 max-h-60 overflow-y-auto">
                          {searchResults.map((user) => (
                            <div
                              key={user.userId}
                              className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-3">
                                <img
                                  src={user.avatar}
                                  alt={user.username}
                                  className="w-10 h-10 rounded-full"
                                />
                                <div>
                                  <div className="font-medium">{user.username}</div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">
                                    Level {user.level} • {user.score} XP
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => handleAddFriend(user.userId)}
                                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                              >
                                + Ajouter
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Leaderboard Table */}
                  <div className="space-y-2">
                    {leaderboard.map((entry, index) => (
                      <motion.div
                        key={entry.userId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex items-center gap-4 p-4 rounded-lg transition ${
                          entry.userId === userId
                            ? 'bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-500'
                            : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {/* Rank */}
                        <div className={`text-2xl font-bold ${getRankColor(entry.rank)} min-w-[60px] text-center`}>
                          {getRankMedal(entry.rank)}
                        </div>

                        {/* Avatar */}
                        <img
                          src={entry.avatar}
                          alt={entry.username}
                          className="w-12 h-12 rounded-full border-2 border-white dark:border-gray-600"
                        />

                        {/* Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 dark:text-white">
                              {entry.username}
                            </span>
                            {entry.country && (
                              <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded">
                                {entry.country}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mt-1">
                            <span>Level {entry.level}</span>
                            <span>•</span>
                            <span>🔥 {entry.streak} jours</span>
                            <span>•</span>
                            <span className="flex gap-1">{entry.badges.join(' ')}</span>
                          </div>
                        </div>

                        {/* Score */}
                        <div className="text-right">
                          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {entry.score.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">XP</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'achievements' && (
                <motion.div
                  key="achievements"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {achievements.map((achievement) => (
                      <motion.div
                        key={achievement.id}
                        whileHover={{ scale: 1.02 }}
                        className={`p-4 rounded-lg border-2 ${
                          achievement.unlocked
                            ? 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-400 dark:border-yellow-600'
                            : 'bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 opacity-60'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-4xl">{achievement.icon}</div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-gray-900 dark:text-white">
                                {achievement.name}
                              </h4>
                              {achievement.unlocked && (
                                <span className="text-xs px-2 py-1 bg-green-500 text-white rounded">
                                  ✓ Débloqué
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {achievement.description}
                            </p>
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-gray-600 dark:text-gray-400">
                                  Progression
                                </span>
                                <span className="font-medium">{achievement.progress}%</span>
                              </div>
                              <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                                  style={{ width: `${achievement.progress}%` }}
                                />
                              </div>
                            </div>
                            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                              Récompense: +{achievement.reward} XP
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'profile' && userStats && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <div className="space-y-6">
                    {/* Stats principales */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg text-center">
                        <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                          {userStats.totalXP.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total XP</div>
                      </div>

                      <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg text-center">
                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                          {userStats.cardsStudied.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Cartes étudiées</div>
                      </div>

                      <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg text-center">
                        <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                          {userStats.accuracy}%
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Précision</div>
                      </div>

                      <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg text-center">
                        <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                          🔥 {userStats.currentStreak}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Streak actuel</div>
                      </div>
                    </div>

                    {/* Classement */}
                    <div className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg">
                      <div className="text-center">
                        <div className="text-6xl font-bold text-yellow-600 dark:text-yellow-400">
                          #{userStats.rank}
                        </div>
                        <div className="text-lg font-medium text-gray-700 dark:text-gray-300 mt-2">
                          Classement Mondial
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Top {userStats.percentile}% des joueurs
                        </div>
                      </div>
                    </div>

                    {/* Badges */}
                    <div>
                      <h3 className="text-xl font-bold mb-3">🏅 Mes Badges</h3>
                      <div className="flex gap-3 flex-wrap">
                        {userStats.badges.map((badge) => (
                          <div
                            key={badge}
                            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-medium"
                          >
                            {badge}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Stats détaillées */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="text-sm text-gray-600 dark:text-gray-400">Niveau</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                          {userStats.level}
                        </div>
                      </div>

                      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="text-sm text-gray-600 dark:text-gray-400">Decks terminés</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                          {userStats.decksCompleted}
                        </div>
                      </div>

                      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="text-sm text-gray-600 dark:text-gray-400">Meilleur streak</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                          🔥 {userStats.longestStreak}
                        </div>
                      </div>

                      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="text-sm text-gray-600 dark:text-gray-400">Achievements</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                          {achievements.filter(a => a.unlocked).length}/{achievements.length}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-b-lg text-center text-sm text-gray-600 dark:text-gray-400">
          💡 Les classements se mettent à jour en temps réel. Continuez à étudier pour grimper !
        </div>
      </div>
    </div>
  )
}

export default LeaderboardsPanel
