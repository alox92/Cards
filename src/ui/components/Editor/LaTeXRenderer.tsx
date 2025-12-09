import React, { useEffect, useRef } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

interface LaTeXRendererProps {
  latex: string
  displayMode?: boolean
  className?: string
}

/**
 * Composant de rendu LaTeX avec KaTeX
 * Supporte les modes inline ($...$) et display ($$...$$)
 */
export const LaTeXRenderer: React.FC<LaTeXRendererProps> = ({ 
  latex, 
  displayMode = false,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || !latex) return

    try {
      katex.render(latex, containerRef.current, {
        displayMode,
        throwOnError: false,
        errorColor: '#cc0000',
        strict: 'warn',
        trust: false,
        macros: {
          "\\R": "\\mathbb{R}",
          "\\N": "\\mathbb{N}",
          "\\Z": "\\mathbb{Z}",
          "\\Q": "\\mathbb{Q}",
          "\\C": "\\mathbb{C}"
        }
      })
    } catch (error) {
      // Erreur rendu LaTeX - affichage message d'erreur
      if (containerRef.current) {
        containerRef.current.textContent = `[LaTeX Error: ${latex}]`
        containerRef.current.style.color = '#cc0000'
      }
    }
  }, [latex, displayMode])

  return (
    <div 
      ref={containerRef} 
      className={`latex-renderer ${displayMode ? 'display-mode' : 'inline-mode'} ${className}`}
      style={{
        display: displayMode ? 'block' : 'inline-block',
        margin: displayMode ? '1em 0' : '0',
        textAlign: displayMode ? 'center' : 'left'
      }}
    />
  )
}

interface LaTeXTextProps {
  text: string
  className?: string
}

/**
 * Composant pour rendre du texte mixte avec LaTeX
 * Détecte automatiquement $...$ (inline) et $$...$$ (display)
 */
export const LaTeXText: React.FC<LaTeXTextProps> = ({ text, className = '' }) => {
  const parseLatex = (input: string) => {
    const parts: Array<{ type: 'text' | 'latex'; content: string; display: boolean }> = []
    let current = ''
    let i = 0

    while (i < input.length) {
      // Check for $$...$$ (display mode)
      if (input.slice(i, i + 2) === '$$') {
        if (current) {
          parts.push({ type: 'text', content: current, display: false })
          current = ''
        }
        
        const endIndex = input.indexOf('$$', i + 2)
        if (endIndex !== -1) {
          const latexContent = input.slice(i + 2, endIndex)
          parts.push({ type: 'latex', content: latexContent, display: true })
          i = endIndex + 2
          continue
        }
      }
      
      // Check for $...$ (inline mode)
      if (input[i] === '$') {
        if (current) {
          parts.push({ type: 'text', content: current, display: false })
          current = ''
        }
        
        const endIndex = input.indexOf('$', i + 1)
        if (endIndex !== -1) {
          const latexContent = input.slice(i + 1, endIndex)
          parts.push({ type: 'latex', content: latexContent, display: false })
          i = endIndex + 1
          continue
        }
      }
      
      current += input[i]
      i++
    }

    if (current) {
      parts.push({ type: 'text', content: current, display: false })
    }

    return parts
  }

  const parts = parseLatex(text)

  return (
    <div className={`latex-text ${className}`}>
      {parts.map((part, index) => {
        if (part.type === 'latex') {
          return (
            <LaTeXRenderer
              key={index}
              latex={part.content}
              displayMode={part.display}
            />
          )
        }
        return <span key={index}>{part.content}</span>
      })}
    </div>
  )
}

export default LaTeXRenderer
