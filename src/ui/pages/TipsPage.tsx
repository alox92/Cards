/**
 * TipsPage - Page de conseils interactive avec IA
 */

import React, { useState, useEffect, useRef } from 'react'
import { EnhancedUI } from '../components/Enhanced/EnhancedUILib'
import { getFluidTransitionMastery, FluidTransitionMastery } from '../../core/FluidTransitionMastery'
import { getIntelligentLearningSystem, IntelligentLearningSystem } from '../../core/IntelligentLearningSystem'

interface Tip {
  id: string
  title: string
  description: string
  category: 'study' | 'memory' | 'time' | 'motivation' | 'technique'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedImpact: number // 1-10
  timeToImplement: number // minutes
  icon: string
  isPersonalized: boolean
  sources?: string[]
  examples?: string[]
}

interface TipCategory {
  id: string
  name: string
  description: string
  icon: string
  color: string
  tips: Tip[]
}

export const TipsPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [difficulty, setDifficulty] = useState<string>('all')
  const [personalizedTips, setPersonalizedTips] = useState<Tip[]>([])
  const [allTips] = useState<TipCategory[]>(generateTipsData())
  const [searchQuery, setSearchQuery] = useState('')
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [expandedTip, setExpandedTip] = useState<string | null>(null)

  const pageRef = useRef<HTMLDivElement>(null)
  const transitionRef = useRef<FluidTransitionMastery | null>(null)
  const learningRef = useRef<IntelligentLearningSystem | null>(null)

  // Initialiser les systèmes
  useEffect(() => {
    const initSystems = async () => {
  transitionRef.current = getFluidTransitionMastery()
  learningRef.current = getIntelligentLearningSystem()
      
      await transitionRef.current.initialize()
      
      // Générer des conseils personnalisés
      await generatePersonalizedTips()
    }

    initSystems()

    return () => {
  // Pas d'arrêt du singleton global
      if (learningRef.current) learningRef.current.cleanup()
    }
  }, [])

  // Générer des conseils personnalisés basés sur l'IA
  const generatePersonalizedTips = async () => {
    if (!learningRef.current) return

    const profile = learningRef.current.getLearningProfile()
    const recommendations = await learningRef.current.generateRecommendations()

    const personalizedTips: Tip[] = [
      {
        id: 'personalized-1',
        title: 'Optimisez votre horaire d\'étude',
        description: `Basé sur vos données, vous apprenez mieux ${profile?.preferences.studyTime || 'le matin'}. Planifiez vos sessions les plus importantes à ce moment.`,
        category: 'time',
        difficulty: 'beginner',
        estimatedImpact: 8,
        timeToImplement: 5,
        icon: '⏰',
        isPersonalized: true,
        examples: [
          'Réservez 30-45 minutes chaque matin pour les nouvelles cartes',
          'Utilisez les soirées pour réviser les cartes anciennes',
          'Prenez des pauses de 10 minutes toutes les heures'
        ]
      },
      {
        id: 'personalized-2',
        title: 'Technique de mémorisation adaptée',
        description: `Votre style d'apprentissage ${profile?.learningStyle || 'visuel'} bénéficierait de techniques spécifiques.`,
        category: 'memory',
        difficulty: 'intermediate',
        estimatedImpact: 9,
        timeToImplement: 15,
        icon: '🧠',
        isPersonalized: true,
        examples: [
          'Créez des images mentales vivaces',
          'Utilisez des couleurs pour catégoriser',
          'Dessinez des schémas et des mind maps'
        ]
      }
    ]

    // Ajouter des conseils basés sur les recommandations IA
    recommendations.forEach((rec: any, index: number) => {
      if (index < 3) { // Limiter à 3 conseils supplémentaires
        personalizedTips.push({
          id: `ai-rec-${index}`,
          title: rec.title,
          description: rec.description,
          category: rec.type as any,
          difficulty: 'intermediate',
          estimatedImpact: Math.floor(rec.estimatedBenefit * 10),
          timeToImplement: 10,
          icon: getIconForRecommendationType(rec.type),
          isPersonalized: true
        })
      }
    })

    setPersonalizedTips(personalizedTips)
  }

  // Obtenir l'icône pour le type de recommandation
  const getIconForRecommendationType = (type: string): string => {
    switch (type) {
      case 'study': return '📚'
      case 'review': return '🔄'
      case 'break': return '☕'
      case 'difficulty': return '🎯'
      case 'content': return '📝'
      default: return '💡'
    }
  }

  // Filtrer les conseils
  const filteredTips = React.useMemo(() => {
    let tips: Tip[] = []

    if (selectedCategory === 'personalized') {
      tips = personalizedTips
    } else if (selectedCategory === 'all') {
      tips = allTips.flatMap(cat => cat.tips).concat(personalizedTips)
    } else {
      const category = allTips.find(cat => cat.id === selectedCategory)
      tips = category ? category.tips : []
    }

    // Filtrer par difficulté
    if (difficulty !== 'all') {
      tips = tips.filter(tip => tip.difficulty === difficulty)
    }

    // Filtrer par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      tips = tips.filter(tip => 
        tip.title.toLowerCase().includes(query) ||
        tip.description.toLowerCase().includes(query)
      )
    }

    return tips.sort((a, b) => {
      // Prioriser les conseils personnalisés et par impact
      if (a.isPersonalized && !b.isPersonalized) return -1
      if (!a.isPersonalized && b.isPersonalized) return 1
      return b.estimatedImpact - a.estimatedImpact
    })
  }, [selectedCategory, difficulty, searchQuery, allTips, personalizedTips])

  // Basculer les favoris
  const toggleFavorite = (tipId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(tipId)) {
        newFavorites.delete(tipId)
      } else {
        newFavorites.add(tipId)
      }
      return newFavorites
    })
  }

  // Changer de catégorie avec animation
  const changeCategory = async (categoryId: string) => {
    if (categoryId === selectedCategory) return

    if (transitionRef.current && pageRef.current) {
      const tipsContainer = pageRef.current.querySelector('.tips-grid')
      if (tipsContainer) {
        await transitionRef.current.animateOut(tipsContainer as HTMLElement, {
          type: 'fade',
          duration: 200
        })
      }
    }

    setSelectedCategory(categoryId)

    if (transitionRef.current && pageRef.current) {
      const tipsContainer = pageRef.current.querySelector('.tips-grid')
      if (tipsContainer) {
        await transitionRef.current.animateIn(tipsContainer as HTMLElement, {
          type: 'slide-up',
          duration: 300
        })
      }
    }
  }

  return (
    <div className="tips-page" ref={pageRef}>
      {/* En-tête */}
      <div className="tips-header">
        <EnhancedUI.FloatingElement delay={0} distance={15}>
          <h1 className="page-title">
            💡 Conseils d'Apprentissage Intelligents
          </h1>
        </EnhancedUI.FloatingElement>
        
        <EnhancedUI.FloatingElement delay={0.2} distance={10}>
          <p className="page-subtitle">
            Conseils personnalisés par IA pour optimiser votre apprentissage
          </p>
        </EnhancedUI.FloatingElement>
      </div>

      {/* Barre de recherche */}
      <div className="search-section">
        <EnhancedUI.MicroInteraction type="focus" intensity="medium">
          <div className="search-container">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Rechercher des conseils..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </EnhancedUI.MicroInteraction>
      </div>

      {/* Filtres */}
      <div className="filters-section">
        <div className="filter-group">
          <h3>Catégorie</h3>
          <div className="filter-buttons">
            <EnhancedUI.GlowButton
              variant={selectedCategory === 'personalized' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => changeCategory('personalized')}
              glow={selectedCategory === 'personalized'}
            >
              🎯 Personnalisés ({personalizedTips.length})
            </EnhancedUI.GlowButton>
            
            <EnhancedUI.GlowButton
              variant={selectedCategory === 'all' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => changeCategory('all')}
              glow={selectedCategory === 'all'}
            >
              📚 Tous
            </EnhancedUI.GlowButton>

            {allTips.map(category => (
              <EnhancedUI.GlowButton
                key={category.id}
                variant={selectedCategory === category.id ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => changeCategory(category.id)}
                glow={selectedCategory === category.id}
              >
                {category.icon} {category.name}
              </EnhancedUI.GlowButton>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <h3>Difficulté</h3>
          <div className="filter-buttons">
            {['all', 'beginner', 'intermediate', 'advanced'].map(level => (
              <EnhancedUI.GlowButton
                key={level}
                variant={difficulty === level ? 'success' : 'secondary'}
                size="sm"
                onClick={() => setDifficulty(level)}
                glow={difficulty === level}
              >
                {level === 'all' ? 'Toutes' : 
                 level === 'beginner' ? 'Débutant' :
                 level === 'intermediate' ? 'Intermédiaire' : 'Avancé'}
              </EnhancedUI.GlowButton>
            ))}
          </div>
        </div>
      </div>

      {/* Grille de conseils */}
      <div className="tips-grid">
        {filteredTips.map((tip, index) => (
          <EnhancedUI.FloatingElement key={tip.id} delay={index * 0.1} distance={5}>
            <TipCard
              tip={tip}
              isFavorite={favorites.has(tip.id)}
              isExpanded={expandedTip === tip.id}
              onToggleFavorite={() => toggleFavorite(tip.id)}
              onToggleExpand={() => setExpandedTip(
                expandedTip === tip.id ? null : tip.id
              )}
            />
          </EnhancedUI.FloatingElement>
        ))}
      </div>

      {filteredTips.length === 0 && (
        <div className="no-tips">
          <div className="no-tips-icon">🔍</div>
          <h3>Aucun conseil trouvé</h3>
          <p>Essayez de modifier vos filtres ou votre recherche</p>
        </div>
      )}

      <style>{`
        .tips-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          color: white;
        }

        .tips-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .page-title {
          font-size: 48px;
          font-weight: bold;
          margin: 0 0 16px 0;
          background: linear-gradient(45deg, #fff, #f0f0f0);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }

        .page-subtitle {
          font-size: 18px;
          opacity: 0.9;
          margin: 0;
          max-width: 600px;
          margin: 0 auto;
        }

        .search-section {
          margin-bottom: 30px;
          display: flex;
          justify-content: center;
        }

        .search-container {
          position: relative;
          max-width: 500px;
          width: 100%;
        }

        .search-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 18px;
          opacity: 0.7;
        }

        .search-input {
          width: 100%;
          padding: 16px 16px 16px 50px;
          border: none;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          font-size: 16px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
        }

        .search-input:focus {
          outline: none;
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.4);
          box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
        }

        .search-input::placeholder {
          color: rgba(255, 255, 255, 0.6);
        }

        .filters-section {
          margin-bottom: 40px;
          display: flex;
          flex-wrap: wrap;
          gap: 30px;
        }

        .filter-group {
          flex: 1;
          min-width: 250px;
        }

        .filter-group h3 {
          margin: 0 0 12px 0;
          font-size: 16px;
          opacity: 0.9;
        }

        .filter-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .tips-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }

        .no-tips {
          text-align: center;
          padding: 60px 20px;
          opacity: 0.8;
        }

        .no-tips-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }

        .no-tips h3 {
          margin: 0 0 10px 0;
          font-size: 24px;
        }

        .no-tips p {
          margin: 0;
          opacity: 0.8;
        }

        @media (max-width: 768px) {
          .tips-page {
            padding: 16px;
          }

          .page-title {
            font-size: 32px;
          }

          .filters-section {
            flex-direction: column;
            gap: 20px;
          }

          .filter-group {
            min-width: auto;
          }

          .tips-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
        }
      `}</style>
    </div>
  )
}

// Composant carte de conseil
const TipCard: React.FC<{
  tip: Tip
  isFavorite: boolean
  isExpanded: boolean
  onToggleFavorite: () => void
  onToggleExpand: () => void
}> = ({ tip, isFavorite, isExpanded, onToggleFavorite, onToggleExpand }) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#4CAF50'
      case 'intermediate': return '#FF9800'
      case 'advanced': return '#F44336'
      default: return '#9E9E9E'
    }
  }

  const getImpactStars = (impact: number) => {
    return '⭐'.repeat(Math.min(5, Math.max(1, Math.floor(impact / 2))))
  }

  return (
    <EnhancedUI.MicroInteraction type="hover" intensity="medium">
      <div className={`tip-card ${tip.isPersonalized ? 'personalized' : ''}`}>
        <div className="tip-header">
          <div className="tip-icon">{tip.icon}</div>
          <div className="tip-meta">
            {tip.isPersonalized && (
              <span className="personalized-badge">🎯 Personnalisé</span>
            )}
            <span 
              className="difficulty-badge"
              style={{ backgroundColor: getDifficultyColor(tip.difficulty) }}
            >
              {tip.difficulty === 'beginner' ? 'Débutant' :
               tip.difficulty === 'intermediate' ? 'Intermédiaire' : 'Avancé'}
            </span>
          </div>
          <button
            className={`favorite-btn ${isFavorite ? 'active' : ''}`}
            onClick={onToggleFavorite}
          >
            {isFavorite ? '❤️' : '🤍'}
          </button>
        </div>

        <h3 className="tip-title">{tip.title}</h3>
        <p className="tip-description">{tip.description}</p>

        <div className="tip-stats">
          <div className="stat">
            <span className="stat-label">Impact:</span>
            <span className="stat-value">{getImpactStars(tip.estimatedImpact)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Temps:</span>
            <span className="stat-value">{tip.timeToImplement} min</span>
          </div>
        </div>

        {tip.examples && tip.examples.length > 0 && (
          <div className="tip-actions">
            <EnhancedUI.GlowButton
              variant="secondary"
              size="sm"
              onClick={onToggleExpand}
            >
              {isExpanded ? 'Masquer' : 'Voir exemples'} 
              {isExpanded ? ' ⬆️' : ' ⬇️'}
            </EnhancedUI.GlowButton>
          </div>
        )}

        {isExpanded && tip.examples && (
          <div className="tip-examples">
            <h4>Exemples pratiques :</h4>
            <ul>
              {tip.examples.map((example, index) => (
                <li key={index}>{example}</li>
              ))}
            </ul>
          </div>
        )}

        <style>{`
          .tip-card {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 24px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            transition: all 0.3s ease;
            height: fit-content;
          }

          .tip-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
            background: rgba(255, 255, 255, 0.15);
          }

          .tip-card.personalized {
            border: 2px solid rgba(255, 215, 0, 0.5);
            background: linear-gradient(135deg, 
              rgba(255, 215, 0, 0.1) 0%, 
              rgba(255, 255, 255, 0.1) 100%);
          }

          .tip-header {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            margin-bottom: 16px;
          }

          .tip-icon {
            font-size: 32px;
            min-width: 40px;
          }

          .tip-meta {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .personalized-badge {
            background: linear-gradient(45deg, #FFD700, #FFA000);
            color: #333;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: bold;
            width: fit-content;
          }

          .difficulty-badge {
            color: white;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: bold;
            width: fit-content;
          }

          .favorite-btn {
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            padding: 4px;
            border-radius: 50%;
            transition: all 0.2s ease;
          }

          .favorite-btn:hover {
            transform: scale(1.2);
          }

          .favorite-btn.active {
            animation: heartbeat 1s ease-in-out;
          }

          .tip-title {
            margin: 0 0 12px 0;
            font-size: 18px;
            font-weight: bold;
            color: white;
          }

          .tip-description {
            margin: 0 0 16px 0;
            line-height: 1.5;
            opacity: 0.9;
          }

          .tip-stats {
            display: flex;
            gap: 20px;
            margin-bottom: 16px;
          }

          .stat {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .stat-label {
            font-size: 12px;
            opacity: 0.8;
          }

          .stat-value {
            font-size: 14px;
            font-weight: bold;
          }

          .tip-actions {
            margin-bottom: 16px;
          }

          .tip-examples {
            background: rgba(0, 0, 0, 0.2);
            border-radius: 8px;
            padding: 16px;
            margin-top: 16px;
          }

          .tip-examples h4 {
            margin: 0 0 12px 0;
            font-size: 14px;
            opacity: 0.9;
          }

          .tip-examples ul {
            margin: 0;
            padding-left: 20px;
          }

          .tip-examples li {
            margin-bottom: 8px;
            line-height: 1.4;
            opacity: 0.8;
          }

          @keyframes heartbeat {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.3); }
          }
        `}</style>
      </div>
    </EnhancedUI.MicroInteraction>
  )
}

// Générer les données de conseils
function generateTipsData(): TipCategory[] {
  return [
    {
      id: 'study',
      name: 'Étude',
      description: 'Techniques d\'étude efficaces',
      icon: '📚',
      color: '#4CAF50',
      tips: [
        {
          id: 'study-1',
          title: 'La technique Pomodoro',
          description: 'Divisez vos sessions d\'étude en blocs de 25 minutes avec des pauses de 5 minutes.',
          category: 'study',
          difficulty: 'beginner',
          estimatedImpact: 8,
          timeToImplement: 5,
          icon: '🍅',
          isPersonalized: false,
          examples: [
            '25 min d\'étude + 5 min de pause',
            'Après 4 cycles, prenez une pause de 30 minutes',
            'Éliminez toutes les distractions pendant les 25 minutes'
          ]
        },
        {
          id: 'study-2',
          title: 'Révision espacée optimale',
          description: 'Révisez les cartes selon des intervalles croissants pour maximiser la rétention.',
          category: 'study',
          difficulty: 'intermediate',
          estimatedImpact: 9,
          timeToImplement: 10,
          icon: '📅',
          isPersonalized: false,
          examples: [
            'Jour 1: Première révision',
            'Jour 3: Deuxième révision',
            'Jour 7: Troisième révision',
            'Jour 21: Quatrième révision'
          ]
        }
      ]
    },
    {
      id: 'memory',
      name: 'Mémoire',
      description: 'Techniques de mémorisation',
      icon: '🧠',
      color: '#2196F3',
      tips: [
        {
          id: 'memory-1',
          title: 'Palais de mémoire',
          description: 'Associez les informations à des lieux familiers pour améliorer la mémorisation.',
          category: 'memory',
          difficulty: 'advanced',
          estimatedImpact: 9,
          timeToImplement: 30,
          icon: '🏰',
          isPersonalized: false,
          examples: [
            'Choisissez un lieu familier (votre maison)',
            'Assignez chaque information à une pièce',
            'Créez un parcours mental logique',
            'Visualisez les objets de manière exagérée'
          ]
        }
      ]
    },
    {
      id: 'motivation',
      name: 'Motivation',
      description: 'Maintenir la motivation',
      icon: '🔥',
      color: '#FF9800',
      tips: [
        {
          id: 'motivation-1',
          title: 'Système de récompenses',
          description: 'Créez un système de récompenses personnelles pour maintenir votre motivation.',
          category: 'motivation',
          difficulty: 'beginner',
          estimatedImpact: 7,
          timeToImplement: 15,
          icon: '🎁',
          isPersonalized: false,
          examples: [
            'Récompense après 50 cartes: pause café',
            'Récompense après une semaine: sortie cinéma',
            'Récompense après un mois: achat plaisir'
          ]
        }
      ]
    }
  ]
}
