/**
 * AdvancedStats - Système de statistiques avancées avec visualisations
 */

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { getFluidTransitionMastery, FluidTransitionMastery } from '../../../core/FluidTransitionMastery'
import { PerformanceOptimizer } from '../../../core/PerformanceOptimizer'
import Icons from '../../components/common/Icons'

interface StatsData {
  totalCards: number
  totalDecks: number
  studyTime: number
  accuracy: number
  streak: number
  level: number
  xp: number
  nextLevelXP: number
  achievements: Achievement[]
  weeklyProgress: DailyProgress[]
  categoryStats: CategoryStats[]
  learningVelocity: number
  retentionRate: number
  difficultyDistribution: DifficultyStats[]
  timeDistribution: TimeStats[]
  heatmapData: HeatmapData[]
  predictions: PredictionData[]
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  unlockedAt?: number
  progress: number
  maxProgress: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  category: string
}

interface DailyProgress {
  date: string
  cardsStudied: number
  timeSpent: number
  accuracy: number
  streakMaintained: boolean
}

interface CategoryStats {
  name: string
  cardsCount: number
  accuracy: number
  averageTime: number
  difficulty: number
  mastery: number
  trend: 'up' | 'down' | 'stable'
}

interface DifficultyStats {
  level: number
  count: number
  accuracy: number
  averageTime: number
}

interface TimeStats {
  hour: number
  sessions: number
  performance: number
  focus: number
}

interface HeatmapData {
  date: string
  value: number
  level: 0 | 1 | 2 | 3 | 4
}

interface PredictionData {
  metric: string
  current: number
  predicted: number
  confidence: number
  timeframe: string
}

export const AdvancedStats: React.FC = () => {
  const [statsData, setStatsData] = useState<StatsData | null>(null)
  const [activeView, setActiveView] = useState<'overview' | 'detailed' | 'achievements' | 'predictions'>('overview')
  const [isLoading, setIsLoading] = useState(true)

  const containerRef = useRef<HTMLDivElement>(null)
  const transitionRef = useRef<FluidTransitionMastery | null>(null)
  const performanceRef = useRef<PerformanceOptimizer | null>(null)

  // Initialiser les systèmes
  useEffect(() => {
    const initSystems = async () => {
  transitionRef.current = getFluidTransitionMastery()
      performanceRef.current = new PerformanceOptimizer()
      
      await transitionRef.current.initialize()

      // Charger les données de stats
      await loadStatsData()
    }

    initSystems()

  return () => { /* singleton conservé */ }
  }, [])

  // Charger les données de statistiques
  const loadStatsData = async () => {
    setIsLoading(true)
    
    // Simuler le chargement des données
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const mockData: StatsData = generateMockStatsData()
    setStatsData(mockData)
    setIsLoading(false)

    // Animation d'entrée
    if (transitionRef.current && containerRef.current) {
      await transitionRef.current.animateIn(containerRef.current, {
        type: 'slide-up',
        duration: 600,
        easing: 'spring'
      })
    }
  }

  // Générer des données de test
  const generateMockStatsData = (): StatsData => {
    const achievements: Achievement[] = [
      {
        id: 'first-card',
        title: 'Premier Pas',
        description: 'Étudiez votre première carte',
        icon: <Icons.Target size="md" />,
        unlockedAt: Date.now() - 86400000,
        progress: 1,
        maxProgress: 1,
        rarity: 'common',
        category: 'Débuts'
      },
      {
        id: 'streak-7',
        title: 'Une Semaine!',
        description: 'Maintenez un streak de 7 jours',
        icon: <Icons.Zap size="md" />,
        unlockedAt: Date.now() - 3600000,
        progress: 7,
        maxProgress: 7,
        rarity: 'rare',
        category: 'Consistance'
      },
      {
        id: 'speed-demon',
        title: 'Démon de Vitesse',
        description: 'Répondez à 50 cartes en moins de 30 secondes',
        icon: <Icons.Zap size="md" />,
        progress: 42,
        maxProgress: 50,
        rarity: 'epic',
        category: 'Performance'
      },
      {
        id: 'perfectionist',
        title: 'Perfectionniste',
        description: 'Atteignez 100% de précision sur 100 cartes consécutives',
        icon: '👑',
        progress: 73,
        maxProgress: 100,
        rarity: 'legendary',
        category: 'Précision'
      }
    ]

    const weeklyProgress: DailyProgress[] = Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 86400000).toISOString().split('T')[0],
      cardsStudied: Math.floor(Math.random() * 100) + 20,
      timeSpent: Math.floor(Math.random() * 3600) + 1800,
      accuracy: Math.random() * 20 + 80,
      streakMaintained: Math.random() > 0.2
    }))

    const categoryStats: CategoryStats[] = [
      {
        name: 'Vocabulaire',
        cardsCount: 245,
        accuracy: 87.5,
        averageTime: 4200,
        difficulty: 6.2,
        mastery: 78,
        trend: 'up'
      },
      {
        name: 'Grammaire',
        cardsCount: 156,
        accuracy: 82.1,
        averageTime: 6800,
        difficulty: 7.8,
        mastery: 65,
        trend: 'stable'
      },
      {
        name: 'Conjugaison',
        cardsCount: 189,
        accuracy: 79.3,
        averageTime: 5500,
        difficulty: 8.1,
        mastery: 58,
        trend: 'down'
      }
    ]

    return {
      totalCards: 1247,
      totalDecks: 23,
      studyTime: 156780, // en secondes
      accuracy: 84.7,
      streak: 12,
      level: 17,
      xp: 14750,
      nextLevelXP: 16000,
      achievements,
      weeklyProgress,
      categoryStats,
      learningVelocity: 2.3, // cartes/minute
      retentionRate: 78.5,
      difficultyDistribution: [
        { level: 1, count: 120, accuracy: 95.2, averageTime: 2100 },
        { level: 2, count: 180, accuracy: 91.8, averageTime: 2800 },
        { level: 3, count: 220, accuracy: 87.3, averageTime: 3500 },
        { level: 4, count: 190, accuracy: 82.1, averageTime: 4200 },
        { level: 5, count: 150, accuracy: 76.8, averageTime: 5100 }
      ],
      timeDistribution: Array.from({ length: 24 }, (_, hour) => ({
        hour,
        sessions: Math.floor(Math.random() * 20),
        performance: Math.random() * 40 + 60,
        focus: Math.random() * 30 + 70
      })),
      heatmapData: Array.from({ length: 365 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (364 - i))
        return {
          date: date.toISOString().split('T')[0],
          value: Math.floor(Math.random() * 50),
          level: Math.floor(Math.random() * 5) as 0 | 1 | 2 | 3 | 4
        }
      }),
      predictions: [
        {
          metric: 'Niveau',
          current: 17,
          predicted: 20,
          confidence: 87,
          timeframe: '2 semaines'
        },
        {
          metric: 'Précision',
          current: 84.7,
          predicted: 88.2,
          confidence: 74,
          timeframe: '1 mois'
        }
      ]
    }
  }

  // Calculs mémorisés pour les métriques
  const metrics = useMemo(() => {
    if (!statsData) return null

    return {
      studyTimeFormatted: formatTime(statsData.studyTime),
      averageSessionTime: formatTime(statsData.studyTime / statsData.weeklyProgress.length),
      xpProgress: (statsData.xp / statsData.nextLevelXP) * 100,
      weeklyAverage: Math.round(
        statsData.weeklyProgress.reduce((sum, day) => sum + day.cardsStudied, 0) / 7
      ),
      bestCategory: statsData.categoryStats.reduce((best, cat) => 
        cat.accuracy > best.accuracy ? cat : best
      ),
      improvementRate: calculateImprovementRate(statsData.weeklyProgress)
    }
  }, [statsData])

  // Formatage du temps
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  // Calcul du taux d'amélioration
  const calculateImprovementRate = (progress: DailyProgress[]): number => {
    if (progress.length < 2) return 0
    
    const firstHalf = progress.slice(0, Math.floor(progress.length / 2))
    const secondHalf = progress.slice(Math.floor(progress.length / 2))
    
    const firstAvg = firstHalf.reduce((sum, day) => sum + day.accuracy, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, day) => sum + day.accuracy, 0) / secondHalf.length
    
    return ((secondAvg - firstAvg) / firstAvg) * 100
  }

  // Changer de vue avec animation
  const changeView = async (newView: typeof activeView) => {
    if (newView === activeView) return

    if (transitionRef.current && containerRef.current) {
      await transitionRef.current.animateOut(containerRef.current, {
        type: 'slide-down',
        duration: 200
      })
    }

    setActiveView(newView)

    if (transitionRef.current && containerRef.current) {
      await transitionRef.current.animateIn(containerRef.current, {
        type: 'slide-up',
        duration: 300
      })
    }
  }

  if (isLoading) {
    return (
      <div className="stats-loading">
        <div className="loading-spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
        <p>Chargement des statistiques...</p>
      </div>
    )
  }

  if (!statsData || !metrics) {
    return <div className="stats-error">Erreur lors du chargement des statistiques</div>
  }

  return (
    <div className="advanced-stats" ref={containerRef}>
      {/* Navigation des vues */}
      <div className="stats-nav">
        <button
          className={`nav-btn ${activeView === 'overview' ? 'active' : ''}`}
          onClick={() => changeView('overview')}
        >
          <span className="nav-icon"><Icons.Stats size="sm" /></span>
          Vue d'ensemble
        </button>
        <button
          className={`nav-btn ${activeView === 'detailed' ? 'active' : ''}`}
          onClick={() => changeView('detailed')}
        >
          <span className="nav-icon"><Icons.TrendUp size="sm" /></span>
          Détaillé
        </button>
        <button
          className={`nav-btn ${activeView === 'achievements' ? 'active' : ''}`}
          onClick={() => changeView('achievements')}
        >
          <span className="nav-icon">🏆</span>
          Succès
        </button>
        <button
          className={`nav-btn ${activeView === 'predictions' ? 'active' : ''}`}
          onClick={() => changeView('predictions')}
        >
          <span className="nav-icon">🔮</span>
          Prédictions
        </button>
      </div>

      {/* Contenu principal */}
      <div className="stats-content">
        {activeView === 'overview' && (
          <OverviewView statsData={statsData} metrics={metrics} />
        )}
        {activeView === 'detailed' && (
          <DetailedView statsData={statsData} />
        )}
        {activeView === 'achievements' && (
          <AchievementsView achievements={statsData.achievements} />
        )}
        {activeView === 'predictions' && (
          <PredictionsView predictions={statsData.predictions} />
        )}
      </div>

      <style>{`
        .advanced-stats {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 20px;
          color: white;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }

        .stats-nav {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          padding: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          backdrop-filter: blur(10px);
        }

        .nav-btn {
          flex: 1;
          padding: 12px 16px;
          border: none;
          background: transparent;
          color: rgba(255, 255, 255, 0.8);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-weight: 500;
        }

        .nav-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          transform: translateY(-2px);
        }

        .nav-btn.active {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .nav-icon {
          font-size: 18px;
        }

        .stats-content {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 24px;
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .stats-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          color: #666;
        }

        .loading-spinner {
          position: relative;
          width: 60px;
          height: 60px;
          margin-bottom: 20px;
        }

        .spinner-ring {
          position: absolute;
          border: 3px solid transparent;
          border-top: 3px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .spinner-ring:nth-child(1) {
          width: 60px;
          height: 60px;
          animation-delay: 0s;
        }

        .spinner-ring:nth-child(2) {
          width: 45px;
          height: 45px;
          top: 7.5px;
          left: 7.5px;
          animation-delay: -0.3s;
          border-top-color: #764ba2;
        }

        .spinner-ring:nth-child(3) {
          width: 30px;
          height: 30px;
          top: 15px;
          left: 15px;
          animation-delay: -0.6s;
          border-top-color: #667eea;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .stats-error {
          text-align: center;
          padding: 40px;
          color: #ff6b6b;
          background: rgba(255, 107, 107, 0.1);
          border-radius: 12px;
          border: 1px solid rgba(255, 107, 107, 0.3);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .advanced-stats {
            margin: 10px;
            padding: 16px;
            border-radius: 16px;
          }

          .stats-nav {
            flex-wrap: wrap;
            gap: 4px;
          }

          .nav-btn {
            flex: none;
            min-width: calc(50% - 2px);
            padding: 10px 12px;
            font-size: 14px;
          }

          .nav-icon {
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  )
}

// Composant Vue d'ensemble
const OverviewView: React.FC<{
  statsData: StatsData
  metrics: any
}> = ({ statsData, metrics }) => (
  <div className="overview-grid">
    <div className="stat-card level-card">
      <div className="card-header">
        <span className="card-icon"><Icons.Zap size="md" className="text-yellow-500" /></span>
        <h3>Niveau {statsData.level}</h3>
      </div>
      <div className="xp-progress">
        <div className="xp-bar">
          <div 
            className="xp-fill" 
            style={{ width: `${metrics.xpProgress}%` }}
          />
        </div>
        <span className="xp-text">
          {statsData.xp} / {statsData.nextLevelXP} XP
        </span>
      </div>
    </div>

    <div className="stat-card">
      <div className="card-header">
        <span className="card-icon"><Icons.Zap size="md" /></span>
        <h3>Streak</h3>
      </div>
      <div className="stat-value">{statsData.streak} jours</div>
    </div>

    <div className="stat-card">
      <div className="card-header">
        <span className="card-icon"><Icons.Target size="md" /></span>
        <h3>Précision</h3>
      </div>
      <div className="stat-value">{statsData.accuracy.toFixed(1)}%</div>
    </div>

    <div className="stat-card">
      <div className="card-header">
        <span className="card-icon"><Icons.Clock size="md" /></span>
        <h3>Temps d'étude</h3>
      </div>
      <div className="stat-value">{metrics.studyTimeFormatted}</div>
    </div>

    <style>{`
      .overview-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 16px;
      }

      .stat-card {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 20px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        transition: all 0.3s ease;
      }

      .stat-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        background: rgba(255, 255, 255, 0.15);
      }

      .card-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
      }

      .card-icon {
        font-size: 24px;
        width: 40px;
        height: 40px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .card-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
      }

      .stat-value {
        font-size: 32px;
        font-weight: bold;
        background: linear-gradient(45deg, #fff, #f0f0f0);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .level-card {
        grid-column: span 2;
      }

      .xp-progress {
        margin-top: 12px;
      }

      .xp-bar {
        width: 100%;
        height: 8px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 8px;
      }

      .xp-fill {
        height: 100%;
        background: linear-gradient(90deg, #4facfe, #00f2fe);
        border-radius: 4px;
        transition: width 0.5s ease;
      }

      .xp-text {
        font-size: 14px;
        opacity: 0.9;
      }

      @media (max-width: 768px) {
        .level-card {
          grid-column: span 1;
        }
      }
    `}</style>
  </div>
)

// Autres composants de vue (DetailedView, AchievementsView, PredictionsView)
const DetailedView: React.FC<{ statsData: StatsData }> = () => (
  <div>Detailed View - Coming Soon</div>
)

const AchievementsView: React.FC<{ achievements: Achievement[] }> = () => (
  <div>Achievements View - Coming Soon</div>
)

const PredictionsView: React.FC<{ predictions: PredictionData[] }> = () => (
  <div>Predictions View - Coming Soon</div>
)
