/**
 * Interface du Service de Leaderboards (Classements)
 * Permet la compétition amicale entre utilisateurs
 */

export interface LeaderboardEntry {
  userId: string
  username: string
  avatar?: string
  score: number
  rank: number
  country?: string
  level: number
  streak: number
  badges: string[]
  lastActive: number
}

export interface LeaderboardConfig {
  type: 'global' | 'country' | 'friends' | 'deck'
  timeframe: 'daily' | 'weekly' | 'monthly' | 'all-time'
  metric: 'xp' | 'cards-studied' | 'accuracy' | 'streak' | 'level'
  limit: number
}

export interface UserStats {
  totalXP: number
  cardsStudied: number
  accuracy: number
  currentStreak: number
  longestStreak: number
  level: number
  decksCompleted: number
  badges: string[]
  rank: number
  percentile: number
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: 'study' | 'streak' | 'social' | 'mastery'
  requirement: number
  reward: number // XP
  unlocked: boolean
  unlockedAt?: number
  progress: number // 0-100
}

/**
 * Interface du Service de Leaderboards
 * Gère les classements, statistiques et achievements
 */
export interface ILeaderboardService {
  /**
   * Active/désactive le mode mock
   */
  setMockMode(enabled: boolean): void

  /**
   * Récupère un leaderboard selon la configuration
   */
  getLeaderboard(config: LeaderboardConfig): Promise<LeaderboardEntry[]>

  /**
   * Récupère les statistiques d'un utilisateur
   */
  getUserStats(userId: string): Promise<UserStats>

  /**
   * Met à jour le score d'un utilisateur
   */
  updateScore(
    userId: string,
    deltaXP: number,
    cardsStudied: number,
    accuracy: number
  ): Promise<boolean>

  /**
   * Récupère les achievements d'un utilisateur
   */
  getAchievements(userId: string): Promise<Achievement[]>

  /**
   * Débloque un achievement
   */
  unlockAchievement(userId: string, achievementId: string): Promise<boolean>

  /**
   * Recherche des utilisateurs
   */
  searchUsers(query: string, limit?: number): Promise<LeaderboardEntry[]>

  /**
   * Ajoute un ami
   */
  addFriend(userId: string, friendId: string): Promise<boolean>

  /**
   * Récupère la liste d'amis
   */
  getFriends(userId: string): Promise<LeaderboardEntry[]>

  /**
   * Vérifie si le service est prêt
   */
  isReady(): boolean

  /**
   * Libère les ressources
   */
  dispose(): void
}

export const LEADERBOARD_SERVICE_TOKEN = Symbol('ILeaderboardService')
