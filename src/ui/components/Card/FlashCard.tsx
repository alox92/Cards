/**
 * Composant FlashCard - Affiche une carte flash interactive (optimisé)
 */

import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { CardEntity } from '../../../domain/entities/Card'
import { container } from '@/application/Container'
import { MEDIA_REPOSITORY_TOKEN, DexieMediaRepository } from '@/infrastructure/persistence/dexie/DexieMediaRepository'
import { logger } from '@/utils/logger'

const useMediaImage = (idOrData?: string) => {
  const repo = container.resolve<DexieMediaRepository>(MEDIA_REPOSITORY_TOKEN)
  const [src, setSrc] = useState<string|undefined>(undefined)
  useEffect(()=> {
    let revoke: string | null = null
    if(!idOrData){ setSrc(undefined); return }
    if(idOrData.startsWith('data:')){ setSrc(idOrData); return }
    (async ()=> { try { const row = await repo.get(idOrData); if(row){ const url = URL.createObjectURL(row.blob); revoke = url; setSrc(url) } } catch(e){ logger.warn('FlashCard', 'Load media failed', { error: e }); setSrc(undefined) } })()
    return ()=> { if(revoke) URL.revokeObjectURL(revoke) }
  }, [idOrData, repo])
  return src
}

// Memoized image components to prevent unnecessary re-renders
const FrontImage = memo<{card: CardEntity}>(({ card }) => {
  const src = useMediaImage(card.frontImage)
  if(!src) return null
  return (
    <div className="mb-4">
      <img src={src} alt="Face avant" className="max-w-full max-h-32 object-contain rounded" />
    </div>
  )
})

const BackImage = memo<{card: CardEntity}>(({ card }) => {
  const src = useMediaImage(card.backImage)
  if(!src) return null
  return (
    <div className="mb-4">
      <img src={src} alt="Face arrière" className="max-w-full max-h-32 object-contain rounded" />
    </div>
  )
})

interface FlashCardProps {
  card: CardEntity
  onAnswer: (quality: number, responseTime: number) => void
  onNext?: () => void
  onPrevious?: () => void
  showAnswer?: boolean
  autoFlip?: boolean
  className?: string
}

export const FlashCard = memo<FlashCardProps>(({
  card,
  onAnswer,
  onNext,
  onPrevious,
  showAnswer: controlledShowAnswer,
  autoFlip = false,
  className = ''
}) => {
  const [isFlipped, setIsFlipped] = useState(false)
  const [startTime, setStartTime] = useState(Date.now())
  const [showAnswer, setShowAnswer] = useState(controlledShowAnswer ?? false)

  useEffect(() => {
    setStartTime(Date.now())
    setIsFlipped(false)
    setShowAnswer(controlledShowAnswer ?? false)
  }, [card.id, controlledShowAnswer])

  useEffect(() => {
    if (autoFlip) {
      const timer = setTimeout(() => {
        setIsFlipped(true)
        setShowAnswer(true)
      }, 3000) // Auto-flip après 3 secondes

      return () => clearTimeout(timer)
    }
  }, [autoFlip, card.id])

  // Optimize handlers with useCallback to prevent child re-renders
  const handleFlip = useCallback(() => {
    if (!showAnswer) {
      setIsFlipped(true)
      setShowAnswer(true)
    }
  }, [showAnswer])

  const handleAnswer = useCallback((quality: number) => {
    const responseTime = Date.now() - startTime
    onAnswer(quality, responseTime)
    
    // Reset pour la prochaine carte
    setIsFlipped(false)
    setShowAnswer(false)
    setStartTime(Date.now())
  }, [startTime, onAnswer])

  // Memoize color and text mapping functions
  const difficultyConfig = useMemo(() => {
    const getDifficultyColor = (difficulty: number) => {
      switch (difficulty) {
        case 1:
        case 2:
          return 'bg-green-100 border-green-300 text-green-800'
        case 3:
          return 'bg-yellow-100 border-yellow-300 text-yellow-800'
        case 4:
        case 5:
          return 'bg-red-100 border-red-300 text-red-800'
        default:
          return 'bg-gray-100 border-gray-300 text-gray-800'
      }
    }

    const getDifficultyText = (difficulty: number) => {
      switch (difficulty) {
        case 1:
          return 'Très facile'
        case 2:
          return 'Facile'
        case 3:
          return 'Moyen'
        case 4:
          return 'Difficile'
        case 5:
          return 'Très difficile'
        default:
          return 'Non défini'
      }
    }

    return (

      <div className={`max-w-[900px] mx-auto ${className}`}>
    }
  }, [card.difficulty])

  return (
    <div className={`max-w-2xl mx-auto ${className}`}>
      {/* En-tête avec informations */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${difficultyConfig.color}`}>
            {difficultyConfig.text}
          </span>
          {card.tags.length > 0 && (
            <div className="flex space-x-1">
              {card.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                >
                  {tag}
                </span>
              ))}
              {card.tags.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                  +{card.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
        
        <div className="text-sm text-gray-500">
          {card.totalReviews > 0 && (
            <span>Réussite: {Math.round(card.getSuccessRate() * 100)}%</span>
          )}
        </div>
      </div>

      {/* Carte principale */}
      <div className="relative">
        <div
          className={`card-container ${isFlipped ? 'flipped' : ''}`}
          onClick={!showAnswer ? handleFlip : undefined}
        >
          {/* Face avant */}
          <div className="card-face card-front">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 min-h-[400px] flex flex-col items-center justify-center cursor-pointer hover:shadow-xl transition-shadow">
              {/* Image avant si présente */}
              {card.frontImage && (
                <FrontImage card={card} />
              )}
              
              {/* Texte avant */}
              <div className="text-center">
                <p className="text-xl font-medium text-gray-900 leading-relaxed">
                  {card.frontText}
                </p>
              </div>
              
              {/* Audio avant si présent */}
              {card.frontAudio && (
                <div className="mt-4">
                  <audio controls className="max-w-full">
                    <source src={card.frontAudio} type="audio/mpeg" />
                    Votre navigateur ne supporte pas l'audio.
                  </audio>
                </div>
              )}
              
              {!showAnswer && (
                <div className="mt-6 text-sm text-gray-500">
                  Cliquez pour révéler la réponse
                </div>
              )}
            </div>
          </div>

          {/* Face arrière */}
          <div className="card-face card-back">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg border border-blue-200 p-8 min-h-[400px] flex flex-col items-center justify-center">
              {/* Image arrière si présente */}
              {card.backImage && (
                <BackImage card={card} />
              )}
              
              {/* Texte arrière */}
              <div className="text-center">
                <p className="text-xl font-medium text-gray-900 leading-relaxed">
                  {card.backText}
                </p>
              </div>
              
              {/* Audio arrière si présent */}
              {card.backAudio && (
                <div className="mt-4">
                  <audio controls className="max-w-full">
                    <source src={card.backAudio} type="audio/mpeg" />
                    Votre navigateur ne supporte pas l'audio.
                  </audio>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Boutons de réponse */}
        {showAnswer && (
          <div className="mt-6 space-y-4">
            <div className="text-center text-sm text-gray-600 mb-4">
              Comment évaluez-vous votre réponse ?
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <button
                onClick={() => handleAnswer(0)}
                className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
              >
                Blackout
              </button>
              <button
                onClick={() => handleAnswer(1)}
                className="p-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
              >
                Incorrect
              </button>
              <button
                onClick={() => handleAnswer(3)}
                className="p-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
              >
                Correct
              </button>
              <button
                onClick={() => handleAnswer(5)}
                className="p-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
              >
                Parfait
              </button>
            </div>
            
            <div className="text-xs text-gray-500 text-center mt-2">
              Ces réponses affectent l'algorithme de répétition espacée
            </div>
          </div>
        )}

        {/* Navigation */}
        {(onPrevious || onNext) && (
          <div className="flex justify-between mt-6">
            <button
              onClick={onPrevious}
              disabled={!onPrevious}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Précédent
            </button>
            <button
              onClick={onNext}
              disabled={!onNext}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant →
            </button>
          </div>
        )}
      </div>
    </div>
  )
})
