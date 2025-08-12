/**
 * GamificationSystem - Système de gamification avec micro-interactions
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { getFluidTransitionMastery, FluidTransitionMastery } from '../../../core/FluidTransitionMastery'

interface GamificationProps {
  onLevelUp?: (newLevel: number) => void
  onAchievementUnlocked?: (achievement: Achievement) => void
  onXPGained?: (xp: number) => void
  userId?: string
  compact?: boolean
  defaultCollapsed?: boolean
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  xpReward: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  category: string
  unlockedAt?: number
  progress: number
  maxProgress: number
  hidden?: boolean
}

interface LevelInfo {
  level: number
  currentXP: number
  xpToNextLevel: number
  totalXP: number
  prestige: number
}

interface Streak {
  current: number
  best: number
  multiplier: number
  lastActivity: number
}

interface Reward {
  id: string
  type: 'xp' | 'badge' | 'title' | 'theme' | 'avatar'
  value: any
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  animation: 'bounce' | 'glow' | 'fireworks' | 'confetti'
}

export const GamificationSystem: React.FC<GamificationProps> = ({
  onLevelUp,
  onAchievementUnlocked,
  onXPGained,
  userId = 'default',
  compact = false,
  defaultCollapsed = false
}) => {
  const [levelInfo, setLevelInfo] = useState<LevelInfo>({
    level: 1,
    currentXP: 0,
    xpToNextLevel: 100,
    totalXP: 0,
    prestige: 0
  })
  
  const [streak, setStreak] = useState<Streak>({
    current: 0,
    best: 0,
    multiplier: 1,
    lastActivity: 0
  })

  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [recentRewards, setRecentRewards] = useState<Reward[]>([])
  const [showLevelUpAnimation, setShowLevelUpAnimation] = useState(false)
  const [showAchievementPopup, setShowAchievementPopup] = useState<Achievement | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const transitionRef = useRef<FluidTransitionMastery | null>(null)

  // Initialiser le système
  useEffect(() => {
    const initSystem = async () => {
  transitionRef.current = getFluidTransitionMastery()
      await transitionRef.current.initialize()
      
      // Charger les données sauvegardées
      loadGamificationData()
      
      // Initialiser les achievements
      initializeAchievements()
    }

    initSystem()

    return () => {
      if (transitionRef.current) {
        transitionRef.current.shutdown()
      }
    }
  }, [])

  // Charger les données de gamification
  const loadGamificationData = () => {
    try {
      const savedData = localStorage.getItem(`ariba-gamification-${userId}`)
      if (savedData) {
        const data = JSON.parse(savedData)
        setLevelInfo(data.levelInfo || levelInfo)
        setStreak(data.streak || streak)
        setAchievements(data.achievements || [])
      }
    } catch (error) {
      console.warn('Erreur lors du chargement des données de gamification:', error)
    }
  }

  // Sauvegarder les données
  const saveGamificationData = useCallback(() => {
    try {
      const data = { levelInfo, streak, achievements }
      localStorage.setItem(`ariba-gamification-${userId}`, JSON.stringify(data))
    } catch (error) {
      console.warn('Erreur lors de la sauvegarde:', error)
    }
  }, [levelInfo, streak, achievements, userId])

  // Initialiser les achievements
  const initializeAchievements = () => {
    const defaultAchievements: Achievement[] = [
      {
        id: 'first-steps',
        title: 'Premiers Pas',
        description: 'Complétez votre première carte',
        icon: '👶',
        xpReward: 10,
        rarity: 'common',
        category: 'Débuts',
        progress: 0,
        maxProgress: 1
      },
      {
        id: 'quick-learner',
        title: 'Apprenant Rapide',
        description: 'Répondez correctement à 10 cartes en moins de 5 secondes chacune',
        icon: '⚡',
        xpReward: 50,
        rarity: 'rare',
        category: 'Vitesse',
        progress: 0,
        maxProgress: 10
      },
      {
        id: 'streak-master',
        title: 'Maître des Séries',
        description: 'Maintenez un streak de 30 jours',
        icon: '🔥',
        xpReward: 200,
        rarity: 'epic',
        category: 'Consistance',
        progress: 0,
        maxProgress: 30
      },
      {
        id: 'perfectionist',
        title: 'Perfectionniste',
        description: 'Atteignez 100% de précision sur 100 cartes consécutives',
        icon: '👑',
        xpReward: 500,
        rarity: 'legendary',
        category: 'Précision',
        progress: 0,
        maxProgress: 100,
        hidden: true
      },
      {
        id: 'night-owl',
        title: 'Oiseau de Nuit',
        description: 'Étudiez après minuit 5 fois',
        icon: '🦉',
        xpReward: 30,
        rarity: 'common',
        category: 'Timing',
        progress: 0,
        maxProgress: 5
      },
      {
        id: 'speed-demon',
        title: 'Démon de Vitesse',
        description: 'Complétez 50 cartes en moins de 2 minutes',
        icon: '💨',
        xpReward: 100,
        rarity: 'epic',
        category: 'Vitesse',
        progress: 0,
        maxProgress: 50
      }
    ]

    setAchievements(prev => {
      if (prev.length === 0) {
        return defaultAchievements
      }
      return prev
    })
  }

  // Calculer l'XP nécessaire pour le niveau suivant
  const calculateXPForLevel = (level: number): number => {
    return Math.floor(100 * Math.pow(1.5, level - 1))
  }

  // Ajouter de l'XP
  const addXP = useCallback(async (xpAmount: number, reason: string = '') => {
    const multipliedXP = Math.floor(xpAmount * streak.multiplier)
    
    setLevelInfo(prev => {
      const newCurrentXP = prev.currentXP + multipliedXP
      const newTotalXP = prev.totalXP + multipliedXP
      
      let newLevel = prev.level
      let xpToNextLevel = prev.xpToNextLevel
      
      // Vérifier si on monte de niveau
      while (newCurrentXP >= xpToNextLevel) {
        newLevel++
        const nextLevelXP = calculateXPForLevel(newLevel)
        xpToNextLevel = nextLevelXP
      }
      
      const finalCurrentXP = newCurrentXP >= xpToNextLevel ? 0 : newCurrentXP
      
      // Si level up
      if (newLevel > prev.level) {
        triggerLevelUpAnimation()
        onLevelUp?.(newLevel)
      }
      
      return {
        ...prev,
        level: newLevel,
        currentXP: finalCurrentXP,
        xpToNextLevel,
        totalXP: newTotalXP
      }
    })
    
    // Animation XP
    await triggerXPAnimation(multipliedXP, reason)
    
    onXPGained?.(multipliedXP)
    
    // Vérifier les achievements
    checkAchievements('xp-gained', { xp: multipliedXP })
    
  }, [streak.multiplier, onLevelUp, onXPGained])

  // Animation Level Up
  const triggerLevelUpAnimation = useCallback(async () => {
    setShowLevelUpAnimation(true)
    
    // Animation de confettis et effets
    if (transitionRef.current && containerRef.current) {
      const levelUpElement = containerRef.current.querySelector('.level-up-animation')
      if (levelUpElement) {
        await transitionRef.current.animateIn(levelUpElement as HTMLElement, {
          type: 'scale',
          duration: 1000,
          easing: 'bounce'
        })
      }
    }
    
    // Cacher après 3 secondes
    setTimeout(() => {
      setShowLevelUpAnimation(false)
    }, 3000)
  }, [])

  // Animation XP
  const triggerXPAnimation = useCallback(async (xp: number, reason: string) => {
    const reward: Reward = {
      id: Math.random().toString(36),
      type: 'xp',
      value: { amount: xp, reason },
      rarity: xp >= 100 ? 'epic' : xp >= 50 ? 'rare' : 'common',
      animation: xp >= 100 ? 'fireworks' : 'bounce'
    }
    
    setRecentRewards(prev => [...prev, reward])
    
    // Retirer après animation
    setTimeout(() => {
      setRecentRewards(prev => prev.filter(r => r.id !== reward.id))
    }, 2000)
  }, [])

  // Mettre à jour le streak
  const updateStreak = useCallback((maintained: boolean = true) => {
    const now = Date.now()
    const oneDayMs = 24 * 60 * 60 * 1000
    
    setStreak(prev => {
      let newCurrent = prev.current
      let newBest = prev.best
      let newMultiplier = prev.multiplier
      
      if (maintained && (now - prev.lastActivity) <= oneDayMs * 1.5) {
        newCurrent = prev.current + 1
        newMultiplier = Math.min(3, 1 + (newCurrent / 10) * 0.1) // Max 3x multiplier
      } else if (!maintained) {
        newCurrent = 0
        newMultiplier = 1
      }
      
      if (newCurrent > prev.best) {
        newBest = newCurrent
        // Achievement pour nouveau record
        checkAchievements('new-best-streak', { streak: newBest })
      }
      
      return {
        current: newCurrent,
        best: newBest,
        multiplier: newMultiplier,
        lastActivity: now
      }
    })
  }, [])

  // Vérifier les achievements
  const checkAchievements = useCallback(async (event: string, data: any) => {
    const updatedAchievements = [...achievements]
    let hasNewAchievement = false
    
    for (let i = 0; i < updatedAchievements.length; i++) {
      const achievement = updatedAchievements[i]
      
      if (achievement.unlockedAt) continue // Déjà débloqué
      
      let shouldProgress = false
      let progressAmount = 0
      
      // Logique selon l'achievement
      switch (achievement.id) {
        case 'first-steps':
          if (event === 'card-completed') {
            shouldProgress = true
            progressAmount = 1
          }
          break
          
        case 'quick-learner':
          if (event === 'card-completed' && data.responseTime < 5000 && data.correct) {
            shouldProgress = true
            progressAmount = 1
          }
          break
          
        case 'streak-master':
          if (event === 'streak-updated') {
            achievement.progress = Math.max(achievement.progress, data.streak)
            shouldProgress = achievement.progress >= achievement.maxProgress
          }
          break
          
        case 'perfectionist':
          if (event === 'card-completed') {
            if (data.correct && data.accuracy === 100) {
              achievement.progress++
            } else {
              achievement.progress = 0 // Reset si erreur
            }
            shouldProgress = achievement.progress >= achievement.maxProgress
          }
          break
          
        case 'night-owl':
          if (event === 'session-started') {
            const hour = new Date().getHours()
            if (hour >= 0 && hour < 6) {
              shouldProgress = true
              progressAmount = 1
            }
          }
          break
          
        case 'speed-demon':
          if (event === 'speed-session' && data.cardsCompleted >= 50 && data.totalTime < 120000) {
            shouldProgress = true
            progressAmount = data.cardsCompleted
          }
          break
      }
      
      if (shouldProgress) {
        achievement.progress = Math.min(
          achievement.maxProgress,
          achievement.progress + progressAmount
        )
        
        // Débloqué ?
        if (achievement.progress >= achievement.maxProgress && !achievement.unlockedAt) {
          achievement.unlockedAt = Date.now()
          hasNewAchievement = true
          
          // Animation et XP reward
          await triggerAchievementUnlock(achievement)
          await addXP(achievement.xpReward, `Achievement: ${achievement.title}`)
          
          onAchievementUnlocked?.(achievement)
        }
      }
    }
    
    if (hasNewAchievement) {
      setAchievements(updatedAchievements)
    }
  }, [achievements, addXP, onAchievementUnlocked])

  // Animation déblocage achievement
  const triggerAchievementUnlock = useCallback(async (achievement: Achievement) => {
    setShowAchievementPopup(achievement)
    
    // Animation popup
    if (transitionRef.current) {
      const popup = document.querySelector('.achievement-popup')
      if (popup) {
        await transitionRef.current.animateIn(popup as HTMLElement, {
          type: 'scale',
          duration: 500,
          easing: 'bounce'
        })
      }
    }
    
    // Masquer après 4 secondes
    setTimeout(() => {
      setShowAchievementPopup(null)
    }, 4000)
  }, [])

  // Sauvegarder quand les données changent
  useEffect(() => {
    saveGamificationData()
  }, [saveGamificationData])

  // API publique pour déclencher des événements
  const triggerEvent = useCallback((event: string, data: any = {}) => {
    switch (event) {
      case 'card-completed':
        addXP(data.xpReward || 10, 'Carte complétée')
        checkAchievements('card-completed', data)
        break
        
      case 'session-started':
        updateStreak(true)
        checkAchievements('session-started', data)
        break
        
      case 'session-completed':
        const sessionXP = Math.floor(data.cardsCompleted * 2 + data.accuracy)
        addXP(sessionXP, 'Session terminée')
        break
        
      case 'streak-broken':
        updateStreak(false)
        break
        
      default:
        checkAchievements(event, data)
    }
  }, [addXP, checkAchievements, updateStreak])

  // Exposer l'API
  useEffect(() => {
    // Exposer les méthodes publiquement si nécessaire
    if (window) {
      (window as any).aribaGamification = {
        triggerEvent,
        addXP,
        updateStreak,
        getLevelInfo: () => levelInfo,
        getStreak: () => streak,
        getAchievements: () => achievements
      }
    }
  }, [triggerEvent, addXP, updateStreak, levelInfo, streak, achievements])

  return (
    <div className={`gamification-system ${compact ? 'compact' : ''} ${collapsed ? 'collapsed' : ''}`} ref={containerRef}>
      <div className="gamification-header" style={{pointerEvents:'auto'}}>
        <span className="title">🎮 Gamification</span>
        <div className="actions">
          <button onClick={() => setCollapsed(c=>!c)} className="btn-min" title={collapsed ? 'Développer' : 'Réduire'}>{collapsed ? '▢' : '—'}</button>
        </div>
      </div>
      {!collapsed && (
        <div className="xp-bar-container">{/* Barre de progression XP */}
        <div className="level-display">
          <span className="level-badge">Niveau {levelInfo.level}</span>
          {levelInfo.prestige > 0 && (
            <span className="prestige-badge">⭐ {levelInfo.prestige}</span>
          )}
        </div>
        
        <div className="xp-progress">
          <div className="xp-bar">
            <div 
              className="xp-fill"
              style={{ 
                width: `${(levelInfo.currentXP / levelInfo.xpToNextLevel) * 100}%`,
                background: `linear-gradient(90deg, 
                  ${levelInfo.level < 10 ? '#4CAF50' : 
                    levelInfo.level < 25 ? '#2196F3' : 
                    levelInfo.level < 50 ? '#9C27B0' : '#FF9800'} 0%, 
                  ${levelInfo.level < 10 ? '#81C784' : 
                    levelInfo.level < 25 ? '#64B5F6' : 
                    levelInfo.level < 50 ? '#BA68C8' : '#FFB74D'} 100%)`
              }}
            />
          </div>
          <div className="xp-text">
            {levelInfo.currentXP} / {levelInfo.xpToNextLevel} XP
          </div>
        </div>
        </div>
      )}

      {/* Indicateur de streak */}
      <div className="streak-indicator">
        <div className="streak-fire">🔥</div>
        <div className="streak-info">
          <div className="streak-current">{streak.current} jours</div>
          <div className="streak-multiplier">×{streak.multiplier.toFixed(1)} XP</div>
        </div>
        <div className="streak-best">Record: {streak.best}</div>
      </div>

      {/* Animations de récompenses */}
      {recentRewards.map(reward => (
        <div key={reward.id} className={`reward-animation ${reward.rarity} ${reward.animation}`}>
          {reward.type === 'xp' && (
            <div className="xp-reward">
              +{reward.value.amount} XP
              {reward.value.reason && (
                <div className="xp-reason">{reward.value.reason}</div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Animation Level Up */}
      {showLevelUpAnimation && (
        <div className="level-up-animation">
          <div className="level-up-content">
            <div className="level-up-text">NIVEAU SUPÉRIEUR!</div>
            <div className="level-up-number">Niveau {levelInfo.level}</div>
            <div className="level-up-effects">
              <div className="confetti"></div>
              <div className="sparkles">✨✨✨</div>
            </div>
          </div>
        </div>
      )}

      {/* Popup Achievement */}
      {showAchievementPopup && (
        <div className="achievement-popup">
          <div className="achievement-content">
            <div className="achievement-header">
              <div className="achievement-icon">{showAchievementPopup.icon}</div>
              <div className="achievement-rarity">{showAchievementPopup.rarity}</div>
            </div>
            <div className="achievement-title">{showAchievementPopup.title}</div>
            <div className="achievement-description">{showAchievementPopup.description}</div>
            <div className="achievement-reward">+{showAchievementPopup.xpReward} XP</div>
          </div>
        </div>
      )}

      <style>{`
        .gamification-system {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1000;
          pointer-events: none;
        }
  .gamification-system.compact .streak-indicator { display:none; }
  .gamification-system.collapsed .xp-bar-container,
  .gamification-system.collapsed .streak-indicator,
  .gamification-system.collapsed .reward-animation,
  .gamification-system.collapsed .level-up-animation,
  .gamification-system.collapsed .achievement-popup { display:none !important; }
  .gamification-header { background:rgba(0,0,0,0.6); color:#fff; padding:4px 10px; border-radius:8px; display:flex; align-items:center; justify-content:space-between; font-size:12px; font-weight:500; backdrop-filter:blur(6px); pointer-events:auto; margin-bottom:6px; }
  .gamification-header .btn-min { background:rgba(255,255,255,0.15); border:1px solid rgba(255,255,255,0.3); border-radius:4px; padding:0 6px; cursor:pointer; color:#fff; }
  .gamification-header .btn-min:hover { background:rgba(255,255,255,0.3); }

        .xp-bar-container {
          background: rgba(0, 0, 0, 0.8);
          border-radius: 12px;
          padding: 12px 16px;
          margin-bottom: 12px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          pointer-events: auto;
        }

        .level-display {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .level-badge {
          background: linear-gradient(45deg, #667eea, #764ba2);
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        }

        .prestige-badge {
          background: linear-gradient(45deg, #f093fb, #f5576c);
          color: white;
          padding: 4px 8px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: bold;
          animation: prestige-glow 2s ease-in-out infinite alternate;
        }

        .xp-progress {
          min-width: 200px;
        }

        .xp-bar {
          width: 100%;
          height: 8px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          overflow: hidden;
          position: relative;
        }

        .xp-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .xp-fill::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
          animation: xp-shimmer 2s infinite;
        }

        .xp-text {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.8);
          text-align: center;
          margin-top: 4px;
        }

        .streak-indicator {
          background: rgba(255, 87, 34, 0.9);
          border-radius: 12px;
          padding: 8px 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 152, 0, 0.3);
          pointer-events: auto;
        }

        .streak-fire {
          font-size: 20px;
          animation: fire-flicker 1s ease-in-out infinite alternate;
        }

        .streak-info {
          flex: 1;
        }

        .streak-current {
          color: white;
          font-weight: bold;
          font-size: 14px;
        }

        .streak-multiplier {
          color: #FFE082;
          font-size: 10px;
          font-weight: bold;
        }

        .streak-best {
          color: rgba(255, 255, 255, 0.7);
          font-size: 10px;
        }

        .reward-animation {
          position: fixed;
          top: 50%;
          right: 50px;
          transform: translateY(-50%);
          pointer-events: none;
          z-index: 1001;
        }

        .reward-animation.bounce {
          animation: reward-bounce 2s ease-out forwards;
        }

        .reward-animation.fireworks {
          animation: reward-fireworks 3s ease-out forwards;
        }

        .xp-reward {
          background: linear-gradient(45deg, #4CAF50, #81C784);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: bold;
          text-align: center;
          box-shadow: 0 4px 20px rgba(76, 175, 80, 0.4);
          border: 2px solid rgba(255, 255, 255, 0.3);
        }

        .xp-reason {
          font-size: 10px;
          opacity: 0.9;
          margin-top: 2px;
        }

        .reward-animation.rare .xp-reward {
          background: linear-gradient(45deg, #2196F3, #64B5F6);
          box-shadow: 0 4px 20px rgba(33, 150, 243, 0.4);
        }

        .reward-animation.epic .xp-reward {
          background: linear-gradient(45deg, #9C27B0, #BA68C8);
          box-shadow: 0 4px 20px rgba(156, 39, 176, 0.4);
        }

        .level-up-animation {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 1002;
          pointer-events: none;
        }

        .level-up-content {
          background: linear-gradient(45deg, #FFD700, #FFA000);
          color: #333;
          padding: 30px 40px;
          border-radius: 20px;
          text-align: center;
          box-shadow: 0 20px 40px rgba(255, 215, 0, 0.3);
          border: 3px solid #FFF;
          position: relative;
          overflow: hidden;
        }

        .level-up-text {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }

        .level-up-number {
          font-size: 36px;
          font-weight: bold;
          background: linear-gradient(45deg, #FF6B35, #F7931E);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .level-up-effects {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
        }

        .confetti {
          position: absolute;
          width: 100%;
          height: 100%;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="%23ff0000"/><circle cx="80" cy="30" r="2" fill="%2300ff00"/><circle cx="40" cy="70" r="2" fill="%230000ff"/></svg>');
          animation: confetti-fall 2s ease-out infinite;
        }

        .sparkles {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 20px;
          animation: sparkle-rotate 2s linear infinite;
        }

        .achievement-popup {
          position: fixed;
          top: 100px;
          right: 20px;
          z-index: 1003;
          pointer-events: auto;
        }

        .achievement-content {
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          border-radius: 16px;
          padding: 20px;
          max-width: 300px;
          border: 2px solid;
          position: relative;
          overflow: hidden;
        }

        .achievement-content::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          animation: achievement-shine 3s ease-in-out infinite;
        }

        .achievement-content[data-rarity="common"] {
          border-color: #9E9E9E;
        }

        .achievement-content[data-rarity="rare"] {
          border-color: #2196F3;
          box-shadow: 0 0 20px rgba(33, 150, 243, 0.3);
        }

        .achievement-content[data-rarity="epic"] {
          border-color: #9C27B0;
          box-shadow: 0 0 20px rgba(156, 39, 176, 0.3);
        }

        .achievement-content[data-rarity="legendary"] {
          border-color: #FF9800;
          box-shadow: 0 0 20px rgba(255, 152, 0, 0.3);
          animation: legendary-pulse 2s ease-in-out infinite;
        }

        .achievement-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .achievement-icon {
          font-size: 32px;
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
        }

        .achievement-rarity {
          background: rgba(255, 255, 255, 0.2);
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 10px;
          text-transform: uppercase;
          font-weight: bold;
          color: white;
        }

        .achievement-title {
          color: white;
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 8px;
        }

        .achievement-description {
          color: rgba(255, 255, 255, 0.8);
          font-size: 12px;
          margin-bottom: 12px;
          line-height: 1.4;
        }

        .achievement-reward {
          background: linear-gradient(45deg, #4CAF50, #81C784);
          color: white;
          padding: 6px 12px;
          border-radius: 15px;
          font-size: 12px;
          font-weight: bold;
          text-align: center;
        }

        /* Animations */
        @keyframes prestige-glow {
          0% { box-shadow: 0 0 5px rgba(240, 147, 251, 0.5); }
          100% { box-shadow: 0 0 20px rgba(240, 147, 251, 0.8); }
        }

        @keyframes xp-shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }

        @keyframes fire-flicker {
          0% { transform: rotate(-2deg) scale(1); }
          100% { transform: rotate(2deg) scale(1.05); }
        }

        @keyframes reward-bounce {
          0% { 
            transform: translateY(-50%) translateX(0) scale(0);
            opacity: 0;
          }
          50% { 
            transform: translateY(-50%) translateX(-30px) scale(1.2);
            opacity: 1;
          }
          100% { 
            transform: translateY(-50%) translateX(-60px) scale(0.8);
            opacity: 0;
          }
        }

        @keyframes reward-fireworks {
          0% { 
            transform: translateY(-50%) scale(0);
            opacity: 0;
          }
          25% { 
            transform: translateY(-50%) scale(1.5);
            opacity: 1;
          }
          50% { 
            transform: translateY(-50%) scale(1);
            opacity: 1;
          }
          100% { 
            transform: translateY(-50%) scale(0);
            opacity: 0;
          }
        }

        @keyframes confetti-fall {
          0% { transform: translateY(-100%) rotate(0deg); }
          100% { transform: translateY(200%) rotate(360deg); }
        }

        @keyframes sparkle-rotate {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }

        @keyframes achievement-shine {
          0% { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(200%) skewX(-15deg); }
        }

        @keyframes legendary-pulse {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(255, 152, 0, 0.3);
            border-color: #FF9800;
          }
          50% { 
            box-shadow: 0 0 40px rgba(255, 152, 0, 0.6);
            border-color: #FFB74D;
          }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .gamification-system {
            top: 10px;
            right: 10px;
            left: 10px;
          }

          .xp-bar-container {
            padding: 8px 12px;
          }

          .xp-progress {
            min-width: auto;
          }

          .achievement-popup {
            right: 10px;
            left: 10px;
          }

          .achievement-content {
            max-width: none;
          }

          .level-up-content {
            margin: 0 20px;
            padding: 20px 30px;
          }

          .level-up-text {
            font-size: 20px;
          }

          .level-up-number {
            font-size: 28px;
          }
        }
      `}</style>
    </div>
  )
}

// Hook pour utiliser le système de gamification
export const useGamification = () => {
  const triggerEvent = useCallback((event: string, data: any = {}) => {
    if (window && (window as any).aribaGamification) {
      (window as any).aribaGamification.triggerEvent(event, data)
    }
  }, [])

  const addXP = useCallback((amount: number, reason?: string) => {
    if (window && (window as any).aribaGamification) {
      (window as any).aribaGamification.addXP(amount, reason)
    }
  }, [])

  return {
    triggerEvent,
    addXP
  }
}
