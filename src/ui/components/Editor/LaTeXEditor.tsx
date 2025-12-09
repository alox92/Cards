import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LaTeXRenderer } from './LaTeXRenderer'

interface LaTeXEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

const LATEX_TEMPLATES = [
  { name: 'Fraction', latex: '\\frac{numerator}{denominator}' },
  { name: 'Racine', latex: '\\sqrt{x}' },
  { name: 'Puissance', latex: 'x^{n}' },
  { name: 'Indice', latex: 'x_{n}' },
  { name: 'Somme', latex: '\\sum_{i=1}^{n} x_i' },
  { name: 'Intégrale', latex: '\\int_{a}^{b} f(x) dx' },
  { name: 'Limite', latex: '\\lim_{x \\to \\infty} f(x)' },
  { name: 'Dérivée', latex: '\\frac{d}{dx} f(x)' },
  { name: 'Matrice', latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
  { name: 'Vecteur', latex: '\\vec{v} = \\begin{pmatrix} x \\\\ y \\\\ z \\end{pmatrix}' },
  { name: 'Système', latex: '\\begin{cases} x + y = 5 \\\\ 2x - y = 1 \\end{cases}' },
  { name: 'Infini', latex: '\\infty' },
  { name: 'Pi', latex: '\\pi' },
  { name: 'Alpha', latex: '\\alpha' },
  { name: 'Beta', latex: '\\beta' },
  { name: 'Theta', latex: '\\theta' },
  { name: 'Lambda', latex: '\\lambda' },
  { name: 'Sigma', latex: '\\sigma' },
]

/**
 * Éditeur LaTeX avec preview temps réel et templates
 */
export const LaTeXEditor: React.FC<LaTeXEditorProps> = ({
  value,
  onChange,
  placeholder = 'Entrez votre équation LaTeX...',
  className = ''
}) => {
  const [showPreview, setShowPreview] = useState(true)
  const [showTemplates, setShowTemplates] = useState(false)

  const insertTemplate = useCallback((template: string) => {
    const newValue = value + (value ? ' ' : '') + template
    onChange(newValue)
    setShowTemplates(false)
  }, [value, onChange])

  return (
    <div className={`latex-editor ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="px-3 py-1 text-xs rounded bg-blue-500 text-white hover:bg-blue-600 transition"
        >
          {showPreview ? '👁️ Preview ON' : '👁️ Preview OFF'}
        </button>
        
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          className="px-3 py-1 text-xs rounded bg-purple-500 text-white hover:bg-purple-600 transition"
        >
          📐 Templates
        </button>

        <div className="flex-1 text-xs text-gray-500 dark:text-gray-400 text-right">
          Inline: $...$ | Display: $$...$$
        </div>
      </div>

      {/* Templates Panel */}
      <AnimatePresence>
        {showTemplates && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {LATEX_TEMPLATES.map((template) => (
                <button
                  key={template.name}
                  onClick={() => insertTemplate(template.latex)}
                  className="p-2 text-xs rounded bg-white dark:bg-gray-800 hover:bg-purple-100 dark:hover:bg-purple-900/40 border border-purple-200 dark:border-purple-700 transition flex flex-col items-center gap-1"
                >
                  <LaTeXRenderer latex={template.latex} className="text-sm" />
                  <span className="text-[10px] text-gray-600 dark:text-gray-400">{template.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm resize-y min-h-[100px]"
        spellCheck={false}
      />

      {/* Preview */}
      <AnimatePresence>
        {showPreview && value && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Preview:</div>
            <LaTeXRenderer latex={value} displayMode={true} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help */}
      <details className="mt-2 text-xs text-gray-600 dark:text-gray-400">
        <summary className="cursor-pointer hover:text-gray-900 dark:hover:text-gray-200">
          💡 Aide LaTeX rapide
        </summary>
        <div className="mt-2 space-y-1 pl-4">
          <div><code>$x^2$</code> → inline math</div>
          <div><code>$$\frac{'{a}{b}$$'}</code> → display math</div>
          <div><code>\alpha, \beta, \pi</code> → symboles grecs</div>
          <div><code>\sum, \int, \lim</code> → opérateurs</div>
          <div><code>\mathbb{'{R}'}</code> → ensembles (ℝ, ℕ, ℤ, ℚ, ℂ)</div>
        </div>
      </details>
    </div>
  )
}

export default LaTeXEditor
