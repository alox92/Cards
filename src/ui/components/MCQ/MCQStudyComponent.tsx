import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MCQCardEntity, MCQOption, MCQResult } from '@/domain/entities/MCQCard'
import Icons from '@/ui/components/common/Icons'

interface MCQStudyComponentProps {
  card: MCQCardEntity
  onAnswer: (result: MCQResult) => void
  showExplanations?: boolean
  className?: string
}

/**
 * Composant d'étude pour les cartes QCM
 * Supporte réponse unique et réponses multiples avec feedback
 */
export const MCQStudyComponent: React.FC<MCQStudyComponentProps> = ({
  card,
  onAnswer,
  showExplanations = true,
  className = ''
}) => {
  const [shuffledOptions, setShuffledOptions] = useState<MCQOption[]>([])
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set())
  const [hasAnswered, setHasAnswered] = useState(false)
  const [result, setResult] = useState<{ isCorrect: boolean; correctIds: string[]; partialCredit: number } | null>(null)
  const [startTime] = useState(Date.now())

  // Mélanger les options au montage
  useEffect(() => {
    setShuffledOptions(card.shuffleOptions())
    setSelectedOptions(new Set())
    setHasAnswered(false)
    setResult(null)
  }, [card])

  const handleOptionClick = (optionId: string) => {
    if (hasAnswered) return

    const newSelected = new Set(selectedOptions)
    
    if (card.multipleAnswers) {
      // Mode réponses multiples : toggle
      if (newSelected.has(optionId)) {
        newSelected.delete(optionId)
      } else {
        newSelected.add(optionId)
      }
    } else {
      // Mode réponse unique : remplacer
      newSelected.clear()
      newSelected.add(optionId)
    }

    setSelectedOptions(newSelected)
  }

  const handleSubmit = () => {
    if (selectedOptions.size === 0 || hasAnswered) return

    const checkResult = card.checkAnswers(Array.from(selectedOptions))
    setResult(checkResult)
    setHasAnswered(true)

    // Créer le résultat
    const mcqResult: MCQResult = {
      cardId: card.id,
      selectedOptions: Array.from(selectedOptions),
      correctOptions: checkResult.correctIds,
      isCorrect: checkResult.isCorrect,
      partialCredit: checkResult.partialCredit,
      timeSpent: Date.now() - startTime,
      timestamp: Date.now()
    }

    // Enregistrer le résultat sur la carte
    card.recordResult(mcqResult)

    // Notifier le parent
    onAnswer(mcqResult)
  }

  const getOptionStyle = (option: MCQOption) => {
    const isSelected = selectedOptions.has(option.id)
    const isCorrect = option.isCorrect
    
    if (!hasAnswered) {
      // Avant réponse
      if (isSelected) {
        return 'bg-blue-100 dark:bg-blue-900/30 border-blue-500 ring-2 ring-blue-300 dark:ring-blue-700'
      }
      return 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10'
    } else {
      // Après réponse
      if (isCorrect) {
        return 'bg-green-100 dark:bg-green-900/30 border-green-500 ring-2 ring-green-300 dark:ring-green-700'
      } else if (isSelected) {
        return 'bg-red-100 dark:bg-red-900/30 border-red-500 ring-2 ring-red-300 dark:ring-red-700'
      }
      return 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 opacity-60'
    }
  }

  const getOptionIcon = (option: MCQOption) => {
    const isSelected = selectedOptions.has(option.id)
    const isCorrect = option.isCorrect

    if (!hasAnswered) {
      if (card.multipleAnswers) {
        return isSelected ? (
          <div className="w-6 h-6 rounded border-2 border-blue-500 bg-blue-500 flex items-center justify-center">
            <Icons.Check size="xs" className="text-white" />
          </div>
        ) : (
          <div className="w-6 h-6 rounded border-2 border-gray-400"></div>
        )
      } else {
        return isSelected ? (
          <div className="w-6 h-6 rounded-full border-2 border-blue-500 bg-blue-500"></div>
        ) : (
          <div className="w-6 h-6 rounded-full border-2 border-gray-400"></div>
        )
      }
    } else {
      if (isCorrect) {
        return (
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
            <Icons.Check size="xs" className="text-white" />
          </div>
        )
      } else if (isSelected) {
        return (
          <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
            <Icons.Settings size="xs" className="text-white" />
          </div>
        )
      }
      return null
    }
  }

  return (
    <div className={`mcq-study-component ${className}`}>
      {/* Question */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            ?
          </div>
          <div className="flex-1">
            <div className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {card.question}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {card.multipleAnswers ? '📋 Plusieurs réponses possibles' : '📝 Une seule réponse correcte'}
            </div>
          </div>
        </div>

        {/* Tags */}
        {card.tags && card.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {card.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Options */}
      <div className="space-y-3 mb-6">
        {shuffledOptions.map((option, index) => (
          <motion.button
            key={option.id}
            onClick={() => handleOptionClick(option.id)}
            disabled={hasAnswered}
            whileHover={!hasAnswered ? { scale: 1.02 } : {}}
            whileTap={!hasAnswered ? { scale: 0.98 } : {}}
            className={`
              w-full p-4 rounded-lg border-2 transition-all text-left
              ${getOptionStyle(option)}
              ${hasAnswered ? 'cursor-default' : 'cursor-pointer'}
            `}
          >
            <div className="flex items-start gap-3">
              {getOptionIcon(option)}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <span className="text-gray-900 dark:text-white">{option.text}</span>
                </div>
                
                {/* Explication (après réponse) */}
                {hasAnswered && showExplanations && option.explanation && (selectedOptions.has(option.id) || option.isCorrect) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-2 text-sm text-gray-600 dark:text-gray-400 italic"
                  >
                    💡 {option.explanation}
                  </motion.div>
                )}
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Bouton Valider / Résultat */}
      <AnimatePresence mode="wait">
        {!hasAnswered ? (
          <motion.button
            key="submit"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onClick={handleSubmit}
            disabled={selectedOptions.size === 0}
            className={`
              w-full py-4 rounded-lg font-medium text-lg transition
              ${selectedOptions.size > 0
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }
            `}
          >
            Valider ma réponse
          </motion.button>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`
              p-6 rounded-lg text-center
              ${result?.isCorrect
                ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500'
                : 'bg-red-100 dark:bg-red-900/30 border-2 border-red-500'
              }
            `}
          >
            <div className="text-4xl mb-2">
              {result?.isCorrect ? '🎉' : '❌'}
            </div>
            <div className="text-xl font-bold mb-2">
              {result?.isCorrect ? 'Bravo !' : 'Incorrect'}
            </div>
            {card.multipleAnswers && result && result.partialCredit > 0 && result.partialCredit < 1 && (
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Score partiel : {Math.round(result.partialCredit * 100)}%
              </div>
            )}
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Temps : {Math.round((Date.now() - startTime) / 1000)}s
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats card */}
      {hasAnswered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-600 dark:text-gray-400"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-medium">Taux de réussite:</span> {Math.round(card.getSuccessRate() * 100)}%
            </div>
            <div>
              <span className="font-medium">Tentatives:</span> {card.reviewCount}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default MCQStudyComponent
