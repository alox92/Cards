import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MCQCardEntity, MCQOption } from '@/domain/entities/MCQCard'
import Icons from '@/ui/components/common/Icons'

interface MCQEditorProps {
  initialCard?: MCQCardEntity
  deckId: string
  onSave: (card: MCQCardEntity) => void
  onCancel: () => void
  className?: string
}

/**
 * Éditeur de cartes QCM
 * Permet de créer et éditer des questions à choix multiples (2-20 options)
 */
export const MCQEditor: React.FC<MCQEditorProps> = ({
  initialCard,
  deckId,
  onSave,
  onCancel,
  className = ''
}) => {
  const [question, setQuestion] = useState(initialCard?.question || '')
  const [options, setOptions] = useState<MCQOption[]>(
    initialCard?.options || [
      { id: crypto.randomUUID(), text: '', isCorrect: false },
      { id: crypto.randomUUID(), text: '', isCorrect: false }
    ]
  )
  const [multipleAnswers, setMultipleAnswers] = useState(initialCard?.multipleAnswers || false)
  const [tags, setTags] = useState(initialCard?.tags?.join(', ') || '')
  const [difficulty, setDifficulty] = useState(initialCard?.difficulty || 5)

  const addOption = () => {
    if (options.length >= 20) return
    setOptions([...options, { id: crypto.randomUUID(), text: '', isCorrect: false }])
  }

  const removeOption = (id: string) => {
    if (options.length <= 2) return
    setOptions(options.filter(opt => opt.id !== id))
  }

  const updateOption = (id: string, updates: Partial<MCQOption>) => {
    setOptions(options.map(opt => opt.id === id ? { ...opt, ...updates } : opt))
  }

  const toggleCorrect = (id: string) => {
    const option = options.find(opt => opt.id === id)
    if (!option) return

    if (multipleAnswers) {
      // Mode multiple : toggle librement
      updateOption(id, { isCorrect: !option.isCorrect })
    } else {
      // Mode unique : désélectionner les autres
      setOptions(options.map(opt => ({
        ...opt,
        isCorrect: opt.id === id ? !opt.isCorrect : false
      })))
    }
  }

  const handleSave = () => {
    // Validation
    if (!question.trim()) {
      alert('Veuillez entrer une question')
      return
    }

    if (options.some(opt => !opt.text.trim())) {
      alert('Toutes les options doivent avoir un texte')
      return
    }

    const correctCount = options.filter(opt => opt.isCorrect).length
    if (correctCount === 0) {
      alert('Au moins une option doit être correcte')
      return
    }

    if (multipleAnswers && correctCount < 2) {
      alert('Le mode réponses multiples nécessite au moins 2 bonnes réponses')
      return
    }

    try {
      const card = new MCQCardEntity(
        initialCard?.id || crypto.randomUUID(),
        deckId,
        question.trim(),
        options.map(opt => ({ ...opt, text: opt.text.trim() })),
        multipleAnswers,
        tags.split(',').map(t => t.trim()).filter(Boolean),
        difficulty,
        initialCard?.created,
        initialCard?.lastReviewed,
        initialCard?.reviewCount,
        initialCard?.correctCount,
        initialCard?.distractorStats
      )

      onSave(card)
    } catch (error) {
      alert(`Erreur : ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
  }

  const correctCount = options.filter(opt => opt.isCorrect).length

  return (
    <div className={`mcq-editor ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {initialCard ? 'Éditer QCM' : 'Nouveau QCM'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <Icons.Settings size="md" />
          </button>
        </div>

        {/* Question */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Question *
          </label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Entrez votre question..."
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-y min-h-[100px]"
          />
        </div>

        {/* Mode réponse */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Réponses multiples</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Permettre plusieurs bonnes réponses
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={multipleAnswers}
                onChange={(e) => {
                  setMultipleAnswers(e.target.checked)
                  // Réinitialiser les réponses correctes si passage en mode unique
                  if (!e.target.checked && correctCount > 1) {
                    setOptions(options.map(opt => ({ ...opt, isCorrect: false })))
                  }
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        {/* Options */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Options ({options.length}/20) - {correctCount} correcte(s)
            </label>
            <button
              onClick={addOption}
              disabled={options.length >= 20}
              className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              + Ajouter option
            </button>
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {options.map((option, index) => (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  {/* Checkbox/Radio */}
                  <button
                    onClick={() => toggleCorrect(option.id)}
                    className="mt-2 flex-shrink-0"
                  >
                    {multipleAnswers ? (
                      <div className={`w-6 h-6 rounded border-2 transition flex items-center justify-center ${
                        option.isCorrect
                          ? 'bg-green-500 border-green-500'
                          : 'border-gray-400 hover:border-green-400'
                      }`}>
                        {option.isCorrect && <Icons.Check size="xs" className="text-white" />}
                      </div>
                    ) : (
                      <div className={`w-6 h-6 rounded-full border-2 transition ${
                        option.isCorrect
                          ? 'bg-green-500 border-green-500'
                          : 'border-gray-400 hover:border-green-400'
                      }`}></div>
                    )}
                  </button>

                  {/* Contenu option */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      <input
                        type="text"
                        value={option.text}
                        onChange={(e) => updateOption(option.id, { text: e.target.value })}
                        placeholder="Texte de l'option"
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                      />
                    </div>

                    <input
                      type="text"
                      value={option.explanation || ''}
                      onChange={(e) => updateOption(option.id, { explanation: e.target.value })}
                      placeholder="Explication (optionnel)"
                      className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs"
                    />
                  </div>

                  {/* Supprimer */}
                  <button
                    onClick={() => removeOption(option.id)}
                    disabled={options.length <= 2}
                    className="mt-2 p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    <Icons.Settings size="sm" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Tags */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tags (séparés par des virgules)
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="mathématiques, algèbre, niveau 1"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* Difficulté */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Difficulté : {difficulty}/10
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={difficulty}
            onChange={(e) => setDifficulty(parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition shadow-lg"
          >
            💾 Enregistrer
          </button>
          <button
            onClick={onCancel}
            className="px-6 py-3 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-400 dark:hover:bg-gray-500 transition"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  )
}

export default MCQEditor
