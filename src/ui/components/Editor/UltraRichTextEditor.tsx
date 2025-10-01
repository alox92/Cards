/**
 * Ultra Rich Text Editor - Éditeur de texte avancé avec toutes les fonctionnalités
 * Performance optimisée, animations fluides, et support complet multimédia
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { sanitizeRich, stripBidiControls, escapeHtml } from '@/utils/sanitize'
import { logger } from '@/utils/logger'

interface RichTextEditorProps {
  value: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
  maxLength?: number
  theme?: 'light' | 'dark'
  onImageUpload?: (file: File) => Promise<string>
  onAudioUpload?: (file: File) => Promise<string>
  onPdfUpload?: (file: File) => Promise<string>
  height?: string
}

interface EditorState {
  content: string
  selection: {
    start: number
    end: number
  }
  history: string[]
  historyIndex: number
}

interface ButtonConfig {
  command: string
  icon: string
  label: string
  hotkey?: string
  value?: string
  special?: 'color' | 'highlight' | 'font' | 'size' | 'image' | 'audio' | 'pdf' | 'undo' | 'redo'
}

const FONTS = [
  'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana', 'Trebuchet MS',
  'Comic Sans MS', 'Impact', 'Lucida Console', 'Courier New', 'Palatino',
  'Garamond', 'Bookman', 'Avant Garde', 'Franklin Gothic', 'Optima'
]

const SIZES = ['8', '9', '10', '11', '12', '14', '16', '18', '20', '24', '28', '32', '36', '48', '64', '72']

const COLORS = [
  '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
  '#800000', '#008000', '#000080', '#808000', '#800080', '#008080', '#c0c0c0', '#808080',
  '#ff6b35', '#f7931e', '#ffd700', '#7cb342', '#29b6f6', '#ab47bc', '#ec407a', '#26a69a'
]

const HIGHLIGHT_COLORS = [
  '#ffff00', '#00ff00', '#00ffff', '#ff00ff', '#ffa500', '#ff69b4', '#98fb98', '#87ceeb',
  '#dda0dd', '#f0e68c', '#ffd700', '#ffb6c1', '#90ee90', '#add8e6', '#d3d3d3', '#f5deb3'
]

export const UltraRichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "🎯 Créez du contenu extraordinaire...",
  className = "",
    // props maxLength & theme retirés (non utilisés)
  // theme retiré
  onImageUpload,
  onAudioUpload,
  onPdfUpload,
  height = "300px"
}) => {
  const [state, setState] = useState<EditorState>({
    content: value,
    selection: { start: 0, end: 0 },
    history: [value],
    historyIndex: 0
  })

  const [activeTools] = useState<Set<string>>(new Set())
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showHighlightPicker, setShowHighlightPicker] = useState(false)
  const [showFontPicker, setShowFontPicker] = useState(false)
  const [showSizePicker, setShowSizePicker] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [selectedFont, setSelectedFont] = useState('Arial')
  const [selectedSize, setSelectedSize] = useState('14')
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)

  const editorRef = useRef<HTMLDivElement>(null)
  // Évite d'écraser la saisie en cours par une resynchronisation depuis la prop value
  const isTypingRef = useRef(false)
  const typingResetTimer = useRef<number | null>(null)
  const changeDebounceTimer = useRef<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const endTypingSafely = useCallback(() => {
    isTypingRef.current = false
    if (editorRef.current) {
      try { (editorRef.current.style as any).unicodeBidi = 'isolate' } catch {}
    }
  }, [])

  // Animations fluides pour les boutons
  const buttonVariants = {
    idle: { 
      scale: 1, 
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    },
    hover: { 
      scale: 1.05, 
      boxShadow: "0 8px 25px rgba(0,0,0,0.2)",
      background: "linear-gradient(135deg, #764ba2 0%, #667eea 100%)"
    },
    tap: { 
      scale: 0.95,
      boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
    },
    active: {
      background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      boxShadow: "0 0 20px rgba(240, 147, 251, 0.4)"
    }
  }

  const GROUP_TITLES: Record<string, string> = useMemo(() => ({
    text: 'Texte',
    style: 'Style',
    format: 'Format',
    align: 'Alignement',
    list: 'Listes',
    media: 'Médias',
    tools: 'Outils'
  }), [])

  // Mettre à jour les compteurs
  const updateCounts = useCallback((html: string) => {
    const text = html.replace(/<[^>]*>/g, '').trim()
    const words = text ? text.split(/\s+/).length : 0
    setWordCount(words)
    setCharCount(text.length)
  }, [])

  // Sauvegarder dans l'historique
  const saveToHistory = useCallback((content: string) => {
    setState(prev => {
      const newHistory = prev.history.slice(0, prev.historyIndex + 1)
      newHistory.push(content)
      return {
        ...prev,
        content,
        history: newHistory.slice(-50), // Garder 50 dernières actions
        historyIndex: Math.min(newHistory.length - 1, 49)
      }
    })
  }, [])

  // Exécuter une commande avec animation
  const executeCommand = useCallback((command: string, value?: string, showUI: boolean = false) => {
    if (!editorRef.current) return

    // Sauvegarder l'état actuel
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
  selection.getRangeAt(0) // range non utilisé
      editorRef.current.focus()
    }

    // Exécuter la commande
    document.execCommand(command, showUI, value)
    
    // Mettre à jour le contenu
    const newContent = editorRef.current.innerHTML
    saveToHistory(newContent)
    onChange(newContent)
    updateCounts(newContent)

    // Animer le bouton correspondant
    const button = document.querySelector(`[data-command="${command}"]`) as HTMLElement
    if (button) {
      button.style.transform = 'scale(0.9)'
      setTimeout(() => {
        button.style.transform = 'scale(1)'
      }, 100)
    }
  }, [onChange, saveToHistory, updateCounts])

  // Gestion du contenu
  const handleContentChange = useCallback(() => {
    if (!editorRef.current) return
    const newContent = editorRef.current.innerHTML
    // Ne pas toucher au state pendant la frappe pour préserver le caret
    updateCounts(newContent)
    if (changeDebounceTimer.current) {
      window.clearTimeout(changeDebounceTimer.current)
    }
    changeDebounceTimer.current = window.setTimeout(() => {
      onChange(newContent)
      endTypingSafely()
    }, 180)
  }, [onChange, updateCounts, endTypingSafely])

  const handleBlur = useCallback(() => {
    if (!editorRef.current) return
    const current = editorRef.current.innerHTML
    // Flush immédiat et sauvegarde historique sur blur
    if (changeDebounceTimer.current) {
      window.clearTimeout(changeDebounceTimer.current)
      changeDebounceTimer.current = null
    }
    const sanitized = sanitizeRich(current)
    if (sanitized !== current) {
      editorRef.current.innerHTML = sanitized
    }
    onChange(sanitized)
    saveToHistory(sanitized)
    setState(prev => ({ ...prev, content: sanitized }))
    updateCounts(sanitized)
  }, [onChange, saveToHistory, updateCounts])

  // Undo/Redo
  const undo = useCallback(() => {
    if (state.historyIndex > 0) {
      const newIndex = state.historyIndex - 1
      const content = state.history[newIndex]
      setState(prev => ({ ...prev, content, historyIndex: newIndex }))
      onChange(content)
      if (editorRef.current) {
        editorRef.current.innerHTML = content
      }
    }
  }, [state.history, state.historyIndex, onChange])

  const redo = useCallback(() => {
    if (state.historyIndex < state.history.length - 1) {
      const newIndex = state.historyIndex + 1
      const content = state.history[newIndex]
      setState(prev => ({ ...prev, content, historyIndex: newIndex }))
      onChange(content)
      if (editorRef.current) {
        editorRef.current.innerHTML = content
      }
    }
  }, [state.history, state.historyIndex, onChange])

  // Gestion des fichiers
  const handleFileUpload = useCallback(async (type: 'image' | 'audio' | 'pdf') => {
    const input = type === 'image' ? fileInputRef.current : 
                   type === 'audio' ? audioInputRef.current : pdfInputRef.current
    
    if (!input) return

    input.click()
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        let url = ''
        if (type === 'image' && onImageUpload) {
          url = await onImageUpload(file)
          const figure = `<figure style="text-align:center;">
            <img src="${url}" alt="" style="max-width:100%;height:auto;border-radius:8px;" />
            <figcaption contenteditable="true" style="color:#6b7280;font-size:12px;margin-top:6px;">Légende…</figcaption>
          </figure>`
          executeCommand('insertHTML', figure)
          // Appliquer un style par défaut et activer la toolbar flottante
          requestAnimationFrame(() => {
            if (!editorRef.current) return
            const imgs = editorRef.current.querySelectorAll('img[src="' + url.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '"]')
            imgs.forEach(img => { (img as HTMLImageElement).onclick = () => showImageToolbar(img as HTMLImageElement) })
          })
        } else if (type === 'audio' && onAudioUpload) {
          url = await onAudioUpload(file)
          const audioHtml = `<audio controls src="${url}" style="max-width: 100%; margin: 10px 0;"></audio>`
          executeCommand('insertHTML', audioHtml)
        } else if (type === 'pdf' && onPdfUpload) {
          url = await onPdfUpload(file)
          const pdfHtml = `<embed src="${url}" type="application/pdf" style="width: 100%; height: 400px; margin: 10px 0;" />`
          executeCommand('insertHTML', pdfHtml)
        }
      } catch (error) {
        logger.error('UltraRichTextEditor', `Erreur lors du téléchargement ${type}`, { error })
      }
    }
  }, [executeCommand, onImageUpload, onAudioUpload, onPdfUpload])

  // Toolbar flottante pour image (alignements et tailles rapides)
  const showImageToolbar = useCallback((img: HTMLImageElement) => {
    // Nettoyer ancienne toolbar
    document.querySelectorAll('.img-toolbar').forEach(n => n.remove())
    const toolbar = document.createElement('div')
    toolbar.className = 'img-toolbar'
    toolbar.innerHTML = `
      <button data-a="left" title="Aligner à gauche">⬅️</button>
      <button data-a="center" title="Centrer">↔️</button>
      <button data-a="right" title="Aligner à droite">➡️</button>
      <span class="sep"></span>
      <button data-s="sm" title="Petit">S</button>
      <button data-s="md" title="Moyen">M</button>
      <button data-s="lg" title="Grand">L</button>
      <button data-s="fit" title="Pleine largeur">100%</button>
    `
    const applyAlign = (a: string) => {
      img.style.display = 'block'
      img.style.marginLeft = a === 'left' ? '0' : 'auto'
      img.style.marginRight = a === 'right' ? '0' : 'auto'
      img.style.margin = a === 'center' ? '12px auto' : '12px 0'
    }
    const applySize = (s: string) => {
      const map: Record<string, string> = { sm: '35%', md: '60%', lg: '80%', fit: '100%' }
      img.style.width = map[s] || '60%'
      img.style.maxWidth = '100%'
      img.style.height = 'auto'
    }
    toolbar.addEventListener('click', (e) => {
      const t = e.target as HTMLElement
      if (t.dataset.a) applyAlign(t.dataset.a)
      if (t.dataset.s) applySize(t.dataset.s)
    })
    const rect = img.getBoundingClientRect()
    Object.assign(toolbar.style as unknown as Record<string, string>, {
      position: 'fixed',
      top: `${Math.max(8, rect.top - 44)}px`,
      left: `${Math.max(8, rect.left)}px`,
      background: 'rgba(0,0,0,0.75)',
      color: '#fff',
      padding: '6px 8px',
      borderRadius: '10px',
      display: 'flex',
      gap: '6px',
      alignItems: 'center',
      zIndex: '10000',
      boxShadow: '0 8px 18px rgba(0,0,0,0.3)'
    })
    document.body.appendChild(toolbar)
    const remove = () => toolbar.remove()
    setTimeout(() => {
      window.addEventListener('scroll', remove, { once: true })
      window.addEventListener('click', (ev) => { if (!toolbar.contains(ev.target as Node)) remove() }, { once: true })
    }, 0)
  }, [])

  // Raccourcis clavier
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Marque qu'on est en train de taper
    isTypingRef.current = true
    if (typingResetTimer.current) { window.clearTimeout(typingResetTimer.current) }
    if (editorRef.current) {
      try { (editorRef.current.style as any).unicodeBidi = 'bidi-override' } catch {}
    }
    // Empêche les toggles de direction involontaires (Ctrl+Shift)
    if (e.ctrlKey && e.key === 'Shift') {
      e.preventDefault()
      e.stopPropagation()
      return
    }
    // Interdire Alt+Shift qui bascule la direction sur certains OS
    if (e.altKey && e.key.toLowerCase() === 'shift') {
      e.preventDefault()
      e.stopPropagation()
      return
    }
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault()
          executeCommand('bold')
          break
        case 'i':
          e.preventDefault()
          executeCommand('italic')
          break
        case 'u':
          e.preventDefault()
          executeCommand('underline')
          break
        case 'z':
          e.preventDefault()
          if (e.shiftKey) {
            redo()
          } else {
            undo()
          }
          break
        case 's':
          e.preventDefault()
          // Sauvegarder
          break
      }
    }
  }, [executeCommand, undo, redo])

  const handleKeyUp = useCallback(() => {
    if (typingResetTimer.current) { window.clearTimeout(typingResetTimer.current) }
    typingResetTimer.current = window.setTimeout(() => {
      endTypingSafely()
    }, 120)
  }, [endTypingSafely])

  // Avant insertion de texte: supprime les caractères BiDi invisibles susceptibles d'inverser l'ordre
  // beforeinput retiré pour éviter tout conflit avec la position du caret

  // Coller: nettoyer HTML/Text du presse-papiers et insérer du HTML sûr LTR
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    isTypingRef.current = true
    if (typingResetTimer.current) { window.clearTimeout(typingResetTimer.current) }
    e.preventDefault()
    const dt = e.clipboardData
    let html = dt.getData('text/html')
    const text = dt.getData('text/plain')
    let toInsert = ''
    if (html) {
      toInsert = sanitizeRich(html)
    } else if (text) {
      toInsert = escapeHtml(stripBidiControls(text)).replace(/\n/g, '<br>')
    }
    if (toInsert) {
      try { document.execCommand('insertHTML', false, toInsert) } catch {}
    }
    typingResetTimer.current = window.setTimeout(() => { endTypingSafely() }, 120)
  }, [endTypingSafely])

  // Outils de formatage avec animations
  const formatButtons = useMemo(() => [
    {
      group: 'text',
      buttons: [
        { command: 'bold', icon: '𝐁', label: 'Gras', hotkey: 'Ctrl+B' } as ButtonConfig,
        { command: 'italic', icon: '𝐼', label: 'Italique', hotkey: 'Ctrl+I' } as ButtonConfig,
        { command: 'underline', icon: 'U̲', label: 'Souligné', hotkey: 'Ctrl+U' } as ButtonConfig,
        { command: 'strikeThrough', icon: 'S̶', label: 'Barré' } as ButtonConfig,
        { command: 'superscript', icon: 'X²', label: 'Exposant' } as ButtonConfig,
        { command: 'subscript', icon: 'X₂', label: 'Indice' } as ButtonConfig
      ]
    },
    {
      group: 'style',
      buttons: [
        { command: 'foreColor', icon: '🎨', label: 'Couleur du texte', special: 'color' } as ButtonConfig,
        { command: 'hiliteColor', icon: '🖍️', label: 'Surligner', special: 'highlight' } as ButtonConfig,
        { command: 'fontName', icon: '🔤', label: 'Police', special: 'font' } as ButtonConfig,
        { command: 'fontSize', icon: '📏', label: 'Taille', special: 'size' } as ButtonConfig
      ]
    },
    {
      group: 'format',
      buttons: [
        { command: 'formatBlock', icon: 'H1', label: 'Titre 1', value: 'h1' } as ButtonConfig,
        { command: 'formatBlock', icon: 'H2', label: 'Titre 2', value: 'h2' } as ButtonConfig,
        { command: 'formatBlock', icon: 'H3', label: 'Titre 3', value: 'h3' } as ButtonConfig,
        { command: 'formatBlock', icon: '¶', label: 'Paragraphe', value: 'p' } as ButtonConfig,
        { command: 'formatBlock', icon: '❝', label: 'Citation', value: 'blockquote' } as ButtonConfig
      ]
    },
    {
      group: 'align',
      buttons: [
        { command: 'justifyLeft', icon: '⬅️', label: 'Aligner à gauche' } as ButtonConfig,
        { command: 'justifyCenter', icon: '↔️', label: 'Centrer' } as ButtonConfig,
        { command: 'justifyRight', icon: '➡️', label: 'Aligner à droite' } as ButtonConfig,
        { command: 'justifyFull', icon: '⬌', label: 'Justifier' } as ButtonConfig
      ]
    },
    {
      group: 'list',
      buttons: [
        { command: 'insertUnorderedList', icon: '•', label: 'Liste à puces' } as ButtonConfig,
        { command: 'insertOrderedList', icon: '1.', label: 'Liste numérotée' } as ButtonConfig,
        { command: 'indent', icon: '⇥', label: 'Indenter' } as ButtonConfig,
        { command: 'outdent', icon: '⇤', label: 'Désindenter' } as ButtonConfig
      ]
    },
    {
      group: 'media',
      buttons: [
        { command: 'insertImage', icon: '🖼️', label: 'Insérer une image', special: 'image' } as ButtonConfig,
        { command: 'insertAudio', icon: '🎵', label: 'Insérer un audio', special: 'audio' } as ButtonConfig,
        { command: 'insertPdf', icon: '📄', label: 'Insérer un PDF', special: 'pdf' } as ButtonConfig,
        { command: 'createLink', icon: '🔗', label: 'Lien' } as ButtonConfig,
        { command: 'insertHorizontalRule', icon: '➖', label: 'Ligne horizontale' } as ButtonConfig,
        { command: 'removeFormat', icon: '🧹', label: 'Effacer le formatage' } as ButtonConfig,
        { command: 'selectAll', icon: '⌘A', label: 'Tout sélectionner' } as ButtonConfig
      ]
    },
    {
      group: 'tools',
      buttons: [
        { command: 'undo', icon: '↶', label: 'Annuler', hotkey: 'Ctrl+Z', special: 'undo' } as ButtonConfig,
        { command: 'redo', icon: '↷', label: 'Rétablir', hotkey: 'Ctrl+Shift+Z', special: 'redo' } as ButtonConfig
      ]
    }
  ], [])

  // Initialisation
  useEffect(() => {
    if (!editorRef.current) return
    if (isTypingRef.current) return // ne pas écraser pendant la saisie
    const domHtml = editorRef.current.innerHTML
    if (value !== domHtml) {
      editorRef.current.innerHTML = value
      setState(prev => ({ ...prev, content: value }))
      updateCounts(value)
    }
    // Forcer le mode LTR du document d'édition pour éviter toute auto-détection
    try {
      document.execCommand('dirLTR', false)
    } catch {}
  }, [value, updateCounts])

  // Restore focus mode from localStorage
  useEffect(() => {
    try {
      const v = localStorage.getItem('editorFocusMode')
      if (v === '1') setFocusMode(true)
    } catch {}
  }, [])

  useEffect(() => {
    return () => {
      if (typingResetTimer.current) window.clearTimeout(typingResetTimer.current)
      if (changeDebounceTimer.current) window.clearTimeout(changeDebounceTimer.current)
    }
  }, [])

  return (
    <motion.div 
      className={`ultra-rich-editor ${isFullscreen ? 'fullscreen' : ''} ${focusMode ? 'focus-mode' : ''} ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Toolbar avec animations */}
      <motion.div 
        className="toolbar"
        role="toolbar"
        aria-label="Outils de mise en forme"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {formatButtons.map((group, groupIndex) => (
          <motion.div 
            key={group.group}
            className="button-group"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: groupIndex * 0.05 }}
          >
            <div className="group-title" aria-hidden="true">{GROUP_TITLES[group.group as keyof typeof GROUP_TITLES] || group.group}</div>
            {group.buttons.map((button) => {
              const handleClick = () => {
                if (button.special === 'color') {
                  setShowColorPicker(!showColorPicker)
                } else if (button.special === 'highlight') {
                  setShowHighlightPicker(!showHighlightPicker)
                } else if (button.special === 'font') {
                  setShowFontPicker(!showFontPicker)
                } else if (button.special === 'size') {
                  setShowSizePicker(!showSizePicker)
                } else if (button.special === 'image') {
                  handleFileUpload('image')
                } else if (button.special === 'audio') {
                  handleFileUpload('audio')
                } else if (button.special === 'pdf') {
                  handleFileUpload('pdf')
                } else if (button.special === 'undo') {
                  undo()
                } else if (button.special === 'redo') {
                  redo()
                } else {
                  executeCommand(button.command, button.value)
                }
              }

              return (
                <motion.button
                  key={`${button.command}-${button.value || button.special || 'default'}`}
                  className="format-button"
                  data-command={button.command}
                  variants={buttonVariants}
                  initial="idle"
                  whileHover="hover"
                  whileTap="tap"
                  animate={activeTools.has(button.command) ? "active" : "idle"}
                  onClick={handleClick}
                  title={`${button.label}${button.hotkey ? ` (${button.hotkey})` : ''}`}
                  aria-label={button.label}
                >
                  <motion.span
                    className="btn-icon"
                    animate={{ rotate: activeTools.has(button.command) ? 360 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {button.icon}
                  </motion.span>
                  <span className="btn-label">{button.label}</span>
                </motion.button>
              )
            })}
          </motion.div>
        ))}

        {/* Bouton plein écran */}
        <motion.button
          className="fullscreen-button"
          variants={buttonVariants}
          initial="idle"
          whileHover="hover"
          whileTap="tap"
          onClick={() => setIsFullscreen(!isFullscreen)}
          aria-label={isFullscreen ? 'Quitter le plein écran' : 'Passer en plein écran'}
        >
          {isFullscreen ? '⛶' : '⛶'}
        </motion.button>
        <motion.button
          className="fullscreen-button"
          variants={buttonVariants}
          initial="idle"
          whileHover="hover"
          whileTap="tap"
          onClick={() => {
            setFocusMode(v => {
              const nv = !v
              try { localStorage.setItem('editorFocusMode','' + (nv ? 1 : 0)) } catch {}
              return nv
            })
          }}
          aria-label={focusMode ? 'Désactiver le mode focalisation' : 'Activer le mode focalisation'}
          title={focusMode ? 'Mode focalisation: désactiver' : 'Mode focalisation: activer'}
        >
          🎯
        </motion.button>
        <motion.button
          className="fullscreen-button"
          variants={buttonVariants}
          initial="idle"
          whileHover="hover"
          whileTap="tap"
          onClick={() => setShowHelp(s=>!s)}
          aria-label={showHelp ? 'Masquer l’aide' : 'Afficher l’aide'}
          title="Aide & Raccourcis"
        >
          ?
        </motion.button>
      </motion.div>

      {/* Sélecteurs de couleurs avec animations */}
      <AnimatePresence>
        {showHelp && (
          <motion.div 
            className="help-panel"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            <div className="help-content">
              <div className="help-title">Légende & Raccourcis</div>
              <ul>
                <li><b>Texte</b>: Gras (Ctrl+B), Italique (Ctrl+I), Souligné (Ctrl+U), Indice/Exposant</li>
                <li><b>Style</b>: Couleur, Surlignage, Police, Taille</li>
                <li><b>Format</b>: Titres (H1..H3), Paragraphe, Citation</li>
                <li><b>Alignement</b>: Gauche, Centre, Droite, Justifié</li>
                <li><b>Listes</b>: Puces, Numérotée, Indenter/Désindenter</li>
                <li><b>Médias</b>: Image, Audio, PDF, Lien</li>
                <li><b>Outils</b>: Annuler (Ctrl+Z), Rétablir (Ctrl+Shift+Z), Effacer format, Tout sélectionner</li>
              </ul>
            </div>
          </motion.div>
        )}
        {showColorPicker && (
          <motion.div 
            className="color-picker"
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="color-grid">
              {COLORS.map(color => (
                <motion.button
                  key={color}
                  className="color-button"
                  style={{ backgroundColor: color }}
                  whileHover={{ scale: 1.2, boxShadow: `0 0 15px ${color}` }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    executeCommand('foreColor', color)
                    setShowColorPicker(false)
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {showHighlightPicker && (
          <motion.div 
            className="highlight-picker"
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="color-grid">
              {HIGHLIGHT_COLORS.map(color => (
                <motion.button
                  key={color}
                  className="color-button"
                  style={{ backgroundColor: color }}
                  whileHover={{ scale: 1.2, boxShadow: `0 0 15px ${color}` }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    executeCommand('hiliteColor', color)
                    setShowHighlightPicker(false)
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {showFontPicker && (
          <motion.div 
            className="font-picker"
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="font-list">
              {FONTS.map(font => (
                <motion.button
                  key={font}
                  className="font-button"
                  style={{ fontFamily: font }}
                  whileHover={{ backgroundColor: '#f0f8ff', x: 5 }}
                  onClick={() => {
                    executeCommand('fontName', font)
                    setSelectedFont(font)
                    setShowFontPicker(false)
                  }}
                >
                  {font}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {showSizePicker && (
          <motion.div 
            className="size-picker"
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="size-grid">
              {SIZES.map(size => (
                <motion.button
                  key={size}
                  className="size-button"
                  style={{ fontSize: `${size}px` }}
                  whileHover={{ scale: 1.1, backgroundColor: '#f0f8ff' }}
                  onClick={() => {
                    executeCommand('fontSize', size)
                    setSelectedSize(size)
                    setShowSizePicker(false)
                  }}
                >
                  {size}px
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zone d'édition avec animations */}
      <motion.div
        className="editor-container"
        style={{ height, direction: 'ltr' as const }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <div
          ref={editorRef}
          className="editor-content"
          dir="ltr"
          contentEditable
          suppressContentEditableWarning
          onDragOver={(e)=>{ e.preventDefault(); setIsDraggingOver(true) }}
          onDragLeave={()=> setIsDraggingOver(false)}
          onDrop={async (e)=>{
            e.preventDefault(); setIsDraggingOver(false)
            if(!onImageUpload) return
            const files = [...(e.dataTransfer?.files || [])]
            const image = files.find(f=> /^image\//i.test(f.type))
            if(!image) return
            try {
              const url = await onImageUpload(image)
              const figure = `<figure style="text-align:center;">
                <img src="${url}" alt="" style="max-width:100%;height:auto;border-radius:8px;" />
                <figcaption contenteditable="true" style="color:#6b7280;font-size:12px;margin-top:6px;">Légende…</figcaption>
              </figure>`
              executeCommand('insertHTML', figure)
              requestAnimationFrame(()=>{
                if(!editorRef.current) return
                const imgs = editorRef.current.querySelectorAll('img[src="' + url.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '"]')
                imgs.forEach(img=>{ (img as HTMLImageElement).onclick = () => showImageToolbar(img as HTMLImageElement) })
              })
            } catch(err){ logger.error('UltraRichTextEditor', 'Drop image failed', { err }) }
          }}
          
          onPaste={handlePaste}
          onInput={handleContentChange}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          onBlur={handleBlur}
          data-placeholder={placeholder}
          style={{
            minHeight: height,
            padding: '20px',
            fontSize: `${selectedSize}px`,
            fontFamily: selectedFont,
            lineHeight: '1.6',
            outline: 'none',
            border: 'none',
            background: 'transparent',
            direction: 'ltr',
            unicodeBidi: 'isolate' as any,
            textAlign: 'left'
          }}
        />
        {isDraggingOver && (
          <div className="drop-overlay" aria-hidden>
            Déposez une image pour l’insérer
          </div>
        )}
      </motion.div>

      {/* Barre de statut avec animations */}
      <motion.div 
        className="status-bar"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <div className="status-left">
          <motion.span
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
          >
            📝 {wordCount} mots
          </motion.span>
          <span>📊 {charCount} caractères</span>
          <span>💾 {state.history.length} versions</span>
        </div>
        <div className="status-right">
          <span>✨ Police: {selectedFont}</span>
          <span>📏 Taille: {selectedSize}px</span>
        </div>
      </motion.div>

      {/* Inputs cachés pour les fichiers */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
      />
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*"
        style={{ display: 'none' }}
      />
      <input
        ref={pdfInputRef}
        type="file"
        accept="application/pdf"
        style={{ display: 'none' }}
      />

      {/* Styles CSS avec animations */}
      <style>{`
        .ultra-rich-editor {
          border: 3px solid transparent;
          border-radius: 16px;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          overflow: hidden;
          position: relative;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: transform, box-shadow;
        }

  /* Mode focalisation: toolbar compacte, labels masqués */
  .ultra-rich-editor.focus-mode .group-title { display: none; }
  .ultra-rich-editor.focus-mode .toolbar { gap: 8px; }
  .ultra-rich-editor.focus-mode .button-group { gap: 4px; padding: 8px; }
  .ultra-rich-editor.focus-mode .format-button { width: 48px; height: 48px; }
  .ultra-rich-editor.focus-mode .btn-label { display: none; }

        .ultra-rich-editor:hover {
          box-shadow: 0 25px 50px rgba(0,0,0,0.15);
          transform: translateY(-2px);
        }

        .ultra-rich-editor.fullscreen {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: 9999;
          border-radius: 0;
        }

        .toolbar {
          background: linear-gradient(135deg, #5f6ad4 0%, #764ba2 100%);
          padding: 12px 16px;
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          border-bottom: 1px solid rgba(255,255,255,0.2);
          backdrop-filter: blur(10px);
          position: relative;
          overflow: hidden;
        }

        .toolbar::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          animation: shimmer 3s infinite;
        }

        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }

        .button-group {
          display: flex;
          gap: 6px;
          background: rgba(255,255,255,0.18);
          border-radius: 12px;
          padding: 10px 10px 12px;
          backdrop-filter: blur(5px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: transform, background;
          border: 1px solid rgba(255,255,255,0.25);
          position: relative;
        }

        .button-group:hover {
          background: rgba(255,255,255,0.28);
          transform: translateY(-1px);
        }

        .group-title {
          position: absolute;
          top: -10px;
          left: 12px;
          background: rgba(255,255,255,0.9);
          color: #4a4a4a;
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 8px;
          border: 1px solid rgba(0,0,0,0.05);
          box-shadow: 0 2px 6px rgba(0,0,0,0.06);
        }

        .format-button, .fullscreen-button {
          width: 64px;
          height: 64px;
          border: none;
          border-radius: 10px;
          color: white;
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 4px;
          backdrop-filter: blur(10px);
          position: relative;
          overflow: hidden;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: transform, background, box-shadow;
        }

        .format-button:before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transition: left 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .format-button:hover:before {
          left: 100%;
        }

        .btn-icon {
          line-height: 1;
        }

        .btn-label {
          font-size: 10px;
          font-weight: 600;
          opacity: 0.95;
          text-shadow: 0 1px 2px rgba(0,0,0,0.2);
          user-select: none;
        }

        .color-picker, .highlight-picker, .font-picker, .size-picker {
          position: absolute;
          top: 100%;
          left: 0;
          background: rgba(255,255,255,0.95);
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
          z-index: 1000;
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.3);
          max-height: 300px;
          overflow-y: auto;
        }

        .color-grid, .size-grid {
          display: grid;
          grid-template-columns: repeat(8, 1fr);
          gap: 8px;
        }

        .color-button {
          width: 36px;
          height: 36px;
          border: 2px solid rgba(255,255,255,0.8);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: transform, box-shadow;
        }

        .color-button:hover {
          transform: scale(1.15);
          border-color: rgba(255,255,255,1);
        }

        .font-list {
          max-height: 300px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .font-button {
          padding: 12px 16px;
          border: none;
          background: transparent;
          cursor: pointer;
          text-align: left;
          border-radius: 8px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          font-size: 14px;
          will-change: transform, background;
        }

        .font-button:hover {
          background: rgba(102, 126, 234, 0.1);
          transform: translateX(4px);
        }

        .size-button {
          padding: 10px 14px;
          border: none;
          background: rgba(255,255,255,0.8);
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          min-width: 60px;
          text-align: center;
          font-weight: 500;
          will-change: transform, background;
        }

        .size-button:hover {
          background: rgba(102, 126, 234, 0.2);
          transform: translateY(-2px);
        }

        .editor-container {
          background: linear-gradient(135deg, #ffffff 0%, #f4f6ff 100%);
          position: relative;
          overflow-y: auto;
          border-radius: 0 0 16px 16px;
        }
        .drop-overlay {
          position: absolute;
          inset: 0;
          background: rgba(102,126,234,0.08);
          border: 2px dashed rgba(102,126,234,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #4a56c8;
          font-weight: 700;
          letter-spacing: .2px;
          pointer-events: none;
          border-radius: 0 0 16px 16px;
        }
        .help-panel {
          position: absolute;
          top: 100%;
          right: 0;
          z-index: 1200;
        }
        .help-content {
          background: rgba(255,255,255,0.98);
          border: 1px solid rgba(0,0,0,0.06);
          border-radius: 12px;
          padding: 14px 16px;
          box-shadow: 0 14px 30px rgba(0,0,0,0.15);
          min-width: 280px;
          color: #333;
        }
        .help-title { font-weight: 700; font-size: 13px; margin-bottom: 8px; color: #444; }
        .help-content ul { margin: 0; padding-left: 16px; display: grid; gap: 6px; font-size: 12px; }


        .editor-content {
          background: transparent;
          resize: none;
          font-family: inherit;
          color: #333;
          word-wrap: break-word;
          transition: all 0.3s ease;
          direction: ltr;
          unicode-bidi: isolate;
        }

        /* LTR appliqué au conteneur suffit; pas de forçage global pour éviter les effets inattendus */

        .editor-content:empty:before {
          content: attr(data-placeholder);
          color: #999;
          font-style: italic;
          pointer-events: none;
          opacity: 0.7;
        }

        .editor-content:focus {
          outline: none;
          box-shadow: inset 0 0 0 2px rgba(102, 126, 234, 0.3);
        }

        .editor-content img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 10px 0;
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .img-toolbar button {
          background: rgba(255,255,255,0.15);
          color: #fff;
          border: 1px solid rgba(255,255,255,0.25);
          border-radius: 6px;
          padding: 4px 6px;
          cursor: pointer;
          font-size: 12px;
        }
        .img-toolbar button:hover {
          background: rgba(255,255,255,0.28);
        }
        .img-toolbar .sep { width: 1px; height: 16px; background: rgba(255,255,255,0.35); display: inline-block; }

        .editor-content img:hover {
          transform: scale(1.02);
          box-shadow: 0 12px 35px rgba(0,0,0,0.2);
        }

        .editor-content audio {
          width: 100%;
          margin: 10px 0;
          border-radius: 8px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }

        .editor-content blockquote {
          border-left: 4px solid #667eea;
          padding-left: 16px;
          margin: 16px 0;
          font-style: italic;
          color: #666;
          background: rgba(102, 126, 234, 0.05);
          border-radius: 0 8px 8px 0;
        }

        .editor-content h1, .editor-content h2, .editor-content h3 {
          margin: 20px 0 10px 0;
          color: #333;
          font-weight: 700;
          transition: color 0.3s ease;
        }

        .editor-content h1:hover, .editor-content h2:hover, .editor-content h3:hover {
          color: #667eea;
        }

        .editor-content h1 { font-size: 2.2em; }
        .editor-content h2 { font-size: 1.8em; }
        .editor-content h3 { font-size: 1.5em; }

        .editor-content ul, .editor-content ol {
          padding-left: 30px;
          margin: 12px 0;
        }

        .editor-content li {
          margin: 6px 0;
          line-height: 1.6;
          transition: all 0.3s ease;
        }

        .editor-content li:hover {
          color: #667eea;
          transform: translateX(2px);
        }

        .status-bar {
          background: linear-gradient(135deg, #eef1f6 0%, #e6e9f8 100%);
          padding: 12px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          color: #666;
          border-top: 1px solid rgba(0,0,0,0.1);
          backdrop-filter: blur(10px);
        }

        .status-left, .status-right {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .status-left span, .status-right span {
          display: flex;
          align-items: center;
          gap: 4px;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .status-left span:hover, .status-right span:hover {
          color: #667eea;
          transform: scale(1.05);
        }

        /* Scrollbar personnalisé */
        .editor-content::-webkit-scrollbar,
        .font-list::-webkit-scrollbar,
        .color-picker::-webkit-scrollbar {
          width: 8px;
        }

        .editor-content::-webkit-scrollbar-track,
        .font-list::-webkit-scrollbar-track,
        .color-picker::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.05);
          border-radius: 4px;
        }

        .editor-content::-webkit-scrollbar-thumb,
        .font-list::-webkit-scrollbar-thumb,
        .color-picker::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 4px;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .toolbar {
            padding: 12px;
            gap: 8px;
          }
          
          .button-group {
            gap: 6px;
            padding: 10px;
          }
          
          .format-button {
            width: 52px;
            height: 52px;
            font-size: 16px;
          }
          .btn-label { display: none; }
          
          .status-bar {
            flex-direction: column;
            gap: 8px;
            text-align: center;
          }
          
          .color-grid, .size-grid {
            grid-template-columns: repeat(6, 1fr);
          }
        }

        /* Animations pour la performance */
        @media (prefers-reduced-motion: no-preference) {
          * {
            transition-duration: 0.2s;
            transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            transition: none !important;
            animation: none !important;
          }
        }

        /* Hardware acceleration */
        /* Ne pas forcer l'accélération GPU sur tout le contenu éditable pour éviter tout effet secondaire sur le rendu du texte/caret */
        .format-button * {
          transform: translateZ(0);
          will-change: transform;
        }
      `}</style>
    </motion.div>
  )
}

export default UltraRichTextEditor
