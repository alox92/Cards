import { useState, useRef, useCallback } from 'react'
import { escapeHtml } from '@/utils/sanitize'

interface SimpleRichTextEditorProps {
  value: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
  maxLength?: number
}

export const SimpleRichTextEditor = ({ 
  value, 
  onChange, 
  placeholder = "Tapez votre texte ici...", 
  className = "",
  maxLength = 1000 
}: SimpleRichTextEditorProps) => {
  const [isFocused, setIsFocused] = useState(false)
  const [isPreview, setIsPreview] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleFormat = useCallback((command: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    let newText = value

    switch (command) {
      case 'bold':
        newText = value.substring(0, start) + `**${selectedText}**` + value.substring(end)
        break
      case 'italic':
        newText = value.substring(0, start) + `*${selectedText}*` + value.substring(end)
        break
      case 'underline':
        newText = value.substring(0, start) + `__${selectedText}__` + value.substring(end)
        break
      case 'code':
        newText = value.substring(0, start) + `\`${selectedText}\`` + value.substring(end)
        break
    }

    onChange(newText)
    
    // Restaurer la sélection
    setTimeout(() => {
      textarea.focus()
      const offset = command === 'bold' ? 2 : 1
      textarea.setSelectionRange(start + offset, end + offset * 2)
    }, 0)
  }, [value, onChange])

  const formatButtons = [
    { command: 'bold', icon: '𝐁', label: 'Gras', color: 'from-orange-400 to-red-500' },
    { command: 'italic', icon: '𝐼', label: 'Italique', color: 'from-purple-400 to-pink-500' },
    { command: 'underline', icon: '𝐔', label: 'Souligné', color: 'from-blue-400 to-cyan-500' },
    { command: 'code', icon: '</>', label: 'Code', color: 'from-green-400 to-emerald-500' }
  ]

  const renderPreview = (text: string) => {
    const esc = escapeHtml(text)
    return esc
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-orange-600 dark:text-orange-400 font-bold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-purple-600 dark:text-purple-400 italic">$1</em>')
      .replace(/__(.*?)__/g, '<u class="text-blue-600 dark:text-blue-400 underline">$1</u>')
      .replace(/`(.*?)`/g, '<code class="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 text-green-800 dark:text-green-200 px-2 py-1 rounded font-mono text-sm">$1</code>')
      .replace(/\n/g, '<br>')
  }

  return (
    <div className={`relative border-2 rounded-xl overflow-hidden shadow-xl transition-all duration-500 transform hover:scale-[1.02] ${
      isFocused 
        ? 'ring-4 ring-blue-400/50 border-blue-400 shadow-blue-400/25 shadow-2xl' 
        : 'border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500'
    } ${className}`}>
      {/* Barre d'outils avec effets */}
      <div className="bg-gradient-to-r from-gray-50 via-white to-gray-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 border-b border-gray-200 dark:border-gray-600 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {formatButtons.map((button) => (
              <button
                key={button.command}
                type="button"
                onClick={() => handleFormat(button.command)}
                className={`relative px-3 py-2 text-sm font-bold text-white rounded-lg bg-gradient-to-r ${button.color} 
                  transform transition-all duration-300 hover:scale-110 hover:rotate-3 hover:shadow-lg 
                  active:scale-95 active:rotate-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400
                  before:absolute before:inset-0 before:bg-white before:opacity-0 before:rounded-lg 
                  before:transition-opacity before:duration-300 hover:before:opacity-20`}
                title={button.label}
              >
                <span className="relative z-10">{button.icon}</span>
              </button>
            ))}
            
            <div className="mx-3 w-px h-6 bg-gradient-to-b from-transparent via-gray-400 to-transparent"></div>
            
            <button
              onClick={() => setIsPreview(!isPreview)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 ${
                isPreview 
                  ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-purple-500/25 rotate-2' 
                  : 'bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 text-gray-700 dark:text-gray-300 hover:from-blue-200 hover:to-blue-300'
              }`}
            >
              {isPreview ? '✏️ Éditer' : '👁️ Aperçu'}
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
              value.length > maxLength * 0.8 
                ? 'bg-gradient-to-r from-red-100 to-orange-100 text-red-700 animate-pulse' 
                : 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700'
            }`}>
              {value.length}/{maxLength}
            </div>
          </div>
        </div>
      </div>

      {/* Zone de texte avec effets */}
      <div className="relative min-h-[200px] bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900">
        {isPreview ? (
          <div 
            className="p-6 prose prose-lg dark:prose-invert max-w-none text-gray-900 dark:text-gray-100 
              bg-gradient-to-br from-white to-blue-50/50 dark:from-gray-800 dark:to-gray-900
              animate-fade-in"
            dangerouslySetInnerHTML={{ __html: renderPreview(value) }}
          />
        ) : (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            maxLength={maxLength}
            rows={8}
            className="w-full h-full p-6 resize-none focus:outline-none bg-transparent 
              text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400
              transition-all duration-300 text-lg leading-relaxed
              focus:placeholder-gray-400 dark:focus:placeholder-gray-500"
            style={{
              background: isFocused 
                ? 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(240,248,255,0.9) 100%)' 
                : 'transparent'
            }}
          />
        )}
        
        {/* Effets de particules */}
        {isFocused && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-4 left-4 w-2 h-2 bg-blue-400 rounded-full animate-bounce opacity-60"></div>
            <div className="absolute top-8 right-8 w-1 h-1 bg-purple-400 rounded-full animate-ping opacity-40"></div>
            <div className="absolute bottom-6 left-1/3 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse opacity-50"></div>
          </div>
        )}
      </div>
      
      {/* Aide au formatage avec style */}
      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-indigo-900/20 dark:to-purple-900/20 
        px-4 py-3 border-t border-gray-200 dark:border-gray-600">
        <div className="flex items-center space-x-2 text-sm">
          <span className="animate-pulse">💡</span>
          <span className="text-gray-600 dark:text-gray-400">
            Sélectionnez du texte et utilisez les boutons pour formater
          </span>
          <div className="flex space-x-2 ml-auto">
            <code className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded text-xs">**gras**</code>
            <code className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs">*italique*</code>
            <code className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">`code`</code>
          </div>
        </div>
      </div>
    </div>
  )
}
