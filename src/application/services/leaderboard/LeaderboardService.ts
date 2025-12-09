import { BaseService } from '../base/BaseService'
import type {
  ILeaderboardService,
  LeaderboardEntry,
  LeaderboardConfig,
  UserStats,
  Achievement
} from './ILeaderboardService'

export class LeaderboardService extends BaseService implements ILeaderboardService {
  private mockEnabled: boolean = true
  private apiBase: string = 'https://api.cards-app.com/v1'
  private ready: boolean = true

  constructor() {
    super({ name: 'LeaderboardService', retryAttempts: 2, retryDelay: 1000, timeout: 10000 })
    this.log('LeaderboardService initialisé')
  }

  setMockMode(enabled: boolean): void { this.mockEnabled = enabled }
  
  async getLeaderboard(config: LeaderboardConfig): Promise<LeaderboardEntry[]> {
    return this.executeWithRetry(async () => {
      if (this.mockEnabled) return this.getMockLeaderboard(config)
      const params = new URLSearchParams({ type: config.type, timeframe: config.timeframe, metric: config.metric, limit: config.limit.toString() })
      const response = await fetch(`${this.apiBase}/leaderboard?${params}`, { headers: this.getAuthHeaders() })
      if (!response.ok) throw new Error(`Erreur API: ${response.status}`)
      const data = await response.json()
      return data.entries || []
    }, 'getLeaderboard')
  }

  async getUserStats(userId: string): Promise<UserStats> {
    return this.executeWithRetry(async () => {
      if (this.mockEnabled) return this.getMockUserStats(userId)
      const response = await fetch(`${this.apiBase}/users/${userId}/stats`, { headers: this.getAuthHeaders() })
      if (!response.ok) throw new Error(`Erreur API: ${response.status}`)
      return await response.json()
    }, 'getUserStats')
  }

  async updateScore(userId: string, deltaXP: number, cardsStudied: number, accuracy: number): Promise<boolean> {
    return this.executeWithRetry(async () => {
      if (this.mockEnabled) { this.log('Mock: Score mis à jour', { userId, deltaXP }); return true }
      const response = await fetch(`${this.apiBase}/users/${userId}/score`, {
        method: 'POST',
        headers: { ...this.getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ deltaXP, cardsStudied, accuracy })
      })
      return response.ok
    }, 'updateScore')
  }

  async getAchievements(userId: string): Promise<Achievement[]> {
    return this.executeWithRetry(async () => {
      if (this.mockEnabled) return this.getMockAchievements()
      const response = await fetch(`${this.apiBase}/users/${userId}/achievements`, { headers: this.getAuthHeaders() })
      if (!response.ok) throw new Error(`Erreur API: ${response.status}`)
      const data = await response.json()
      return data.achievements || []
    }, 'getAchievements')
  }

  async unlockAchievement(userId: string, achievementId: string): Promise<boolean> {
    return this.executeWithRetry(async () => {
      if (this.mockEnabled) { this.log('Mock: Achievement débloqué'); return true }
      const response = await fetch(`${this.apiBase}/users/${userId}/achievements/${achievementId}/unlock`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      })
      return response.ok
    }, 'unlockAchievement')
  }

  async searchUsers(query: string, limit: number = 20): Promise<LeaderboardEntry[]> {
    return this.executeWithRetry(async () => {
      if (this.mockEnabled) return this.getMockLeaderboard({ type: 'global', timeframe: 'all-time', metric: 'xp', limit }).filter(e => e.username.toLowerCase().includes(query.toLowerCase()))
      const response = await fetch(`${this.apiBase}/users/search?q=${encodeURIComponent(query)}&limit=${limit}`, { headers: this.getAuthHeaders() })
      if (!response.ok) throw new Error(`Erreur API: ${response.status}`)
      const data = await response.json()
      return data.users || []
    }, 'searchUsers')
  }

  async addFriend(userId: string, friendId: string): Promise<boolean> {
    return this.executeWithRetry(async () => {
      if (this.mockEnabled) { this.log('Mock: Ami ajouté'); return true }
      const response = await fetch(`${this.apiBase}/users/${userId}/friends`, {
        method: 'POST',
        headers: { ...this.getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId })
      })
      return response.ok
    }, 'addFriend')
  }

  async getFriends(userId: string): Promise<LeaderboardEntry[]> {
    return this.executeWithRetry(async () => {
      if (this.mockEnabled) return this.getMockLeaderboard({ type: 'friends', timeframe: 'all-time', metric: 'xp', limit: 50 })
      const response = await fetch(`${this.apiBase}/users/${userId}/friends`, { headers: this.getAuthHeaders() })
      if (!response.ok) throw new Error(`Erreur API: ${response.status}`)
      const data = await response.json()
      return data.friends || []
    }, 'getFriends')
  }

  isReady(): boolean { return this.ready }
  dispose(): void { this.ready = false; this.log('Disposed') }

  private getMockLeaderboard(_c: LeaderboardConfig): LeaderboardEntry[] {
    const users = [
      { username: 'AlexMaster', country: 'FR', level: 42, streak: 127, score: 125000 },
      { username: 'SophieGenius', country: 'BE', level: 38, streak: 89, score: 98500 },
      { username: 'ThomasProdigy', country: 'FR', level: 35, streak: 56, score: 87200 },
      { username: 'EmmaLearn', country: 'CH', level: 31, streak: 45, score: 76800 },
      { username: 'LucasSpeed', country: 'FR', level: 28, streak: 34, score: 65400 }
    ]
    return users.map((u, i) => ({
      userId: `user-${i+1}`,
      username: u.username,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`,
      score: u.score,
      rank: i+1,
      country: u.country,
      level: u.level,
      streak: u.streak,
      badges: ['🔥'],
      lastActive: Date.now()
    }))
  }

  private getMockUserStats(_: string): UserStats {
    return { totalXP: 45300, cardsStudied: 1847, accuracy: 87.5, currentStreak: 23, longestStreak: 45, level: 17, decksCompleted: 12, badges: ['first-card'], rank: 342, percentile: 12.5 }
  }

  private getMockAchievements(): Achievement[] {
    return [
      { id: 'first-card', name: 'Première Carte', description: 'Créez votre première carte', icon: '📝', category: 'study', requirement: 1, reward: 50, unlocked: true, unlockedAt: Date.now() - 30*86400000, progress: 100 },
      { id: 'streak-7', name: 'Semaine Parfaite', description: 'Maintenez un streak de 7 jours', icon: '🔥', category: 'streak', requirement: 7, reward: 300, unlocked: true, unlockedAt: Date.now() - 7*86400000, progress: 100 }
    ]
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('auth-token')
    return token ? { 'Authorization': `Bearer ${token}` } : {}
  }
}
