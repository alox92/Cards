/**
 * RichTextEditor Ultra-Avancé - Éditeur de texte complet avec toutes les fonctionnalités
 */

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { getFluidTransitionMastery, FluidTransitionMastery } from '../../../core/FluidTransitionMastery'

interface RichTextEditorProps {
  value: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
  maxLength?: number
  features?: EditorFeature[]
  theme?: 'light' | 'dark'
  onImageUpload?: (file: File) => Promise<string>
  onAudioUpload?: (file: File) => Promise<string>
  onPdfUpload?: (file: File) => Promise<string>
}

type EditorFeature = 
  | 'bold' | 'italic' | 'underline' | 'strikethrough' | 'superscript' | 'subscript'
  | 'heading' | 'paragraph' | 'quote' | 'code' | 'codeblock'
  | 'link' | 'image' | 'audio' | 'video' | 'pdf' | 'file'
  | 'color' | 'background' | 'highlight' | 'font' | 'size'
  | 'align' | 'indent' | 'outdent' | 'list' | 'orderedlist' | 'checklist'
  | 'table' | 'hr' | 'emoji' | 'mentions' | 'search' | 'fullscreen'
  | 'undo' | 'redo' | 'clear' | 'wordcount' | 'spellcheck'

interface FormatButton {
  feature: EditorFeature
  icon: string
  label: string
  action: () => void
  isActive?: boolean
  hotkey?: string
  color?: string
  group?: string
}

interface UndoRedoState {
  content: string
  timestamp: number
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Commencez à créer votre contenu...",
  className = "",
  maxLength = 50000,
  features = [
    'bold', 'italic', 'underline', 'color', 'background', 'font', 'size',
    'heading', 'paragraph', 'align', 'list', 'orderedlist', 'checklist',
    'link', 'image', 'audio', 'pdf', 'emoji', 'table', 'fullscreen'
  ],
  theme = 'light',
  onImageUpload,
  onAudioUpload,
  onPdfUpload
}) => {
  const [content, setContent] = useState(value)
  const [showToolbar, setShowToolbar] = useState(true)
  const [activeTab, setActiveTab] = useState<'format' | 'insert' | 'tools'>('format')
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false)
  const [showFontPicker, setShowFontPicker] = useState(false)
  const [showSizePicker, setShowSizePicker] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showTableDialog, setShowTableDialog] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const [selectedFont, setSelectedFont] = useState('Arial')
  const [selectedSize, setSelectedSize] = useState('14')
  const [undoStack, setUndoStack] = useState<UndoRedoState[]>([])
  const [redoStack, setRedoStack] = useState<UndoRedoState[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  const editorRef = useRef<HTMLDivElement>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const transitionRef = useRef<FluidTransitionMastery | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)

  // Initialiser FluidTransitionMastery
  useEffect(() => {
    const initTransitions = async () => {
  transitionRef.current = getFluidTransitionMastery()
      await transitionRef.current.initialize()
    }
    initTransitions()

    return () => {
      if (transitionRef.current) {
        transitionRef.current.shutdown()
      }
    }
  }, [])

  // Mettre à jour le contenu et les statistiques
  useEffect(() => {
    setContent(value)
    updateCounts(value)
  }, [value])

  // Sauvegarder l'état pour undo/redo
  const saveState = useCallback(() => {
    const newState: UndoRedoState = {
      content,
      timestamp: Date.now()
    }
    setUndoStack(prev => [...prev.slice(-19), newState]) // Garder 20 dernières actions
    setRedoStack([]) // Vider redo stack
  }, [content])

  // Mettre à jour les compteurs
  const updateCounts = useCallback((text: string) => {
    const plainText = text.replace(/<[^>]*>/g, '')
    const words = plainText.trim().split(/\s+/).filter(word => word.length > 0)
    setWordCount(words.length)
    setCharCount(plainText.length)
  }, [])

  // Formater le texte avec historique
  const formatText = useCallback((command: string, value?: string) => {
    saveState()
    document.execCommand(command, false, value)
    
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML
      setContent(newContent)
      onChange(newContent)
      updateCounts(newContent)
    }

    // Animation de feedback
    if (transitionRef.current && toolbarRef.current) {
      const button = toolbarRef.current.querySelector(`[data-command="${command}"]`)
      if (button) {
        transitionRef.current.animateIn(button as HTMLElement, {
          type: 'scale',
          duration: 150,
          easing: 'bounce'
        })
      }
    }
  }, [onChange, saveState])

  // Fonctions avancées de formatage
  const insertHTML = useCallback((html: string) => {
    saveState()
    if (editorRef.current) {
      editorRef.current.focus()
      document.execCommand('insertHTML', false, html)
      const newContent = editorRef.current.innerHTML
      setContent(newContent)
      onChange(newContent)
      updateCounts(newContent)
    }
  }, [onChange, saveState])

  // Gestion des images
  const handleImageUpload = useCallback(async (file: File) => {
    if (onImageUpload) {
      try {
        const url = await onImageUpload(file)
        insertHTML(`<img src="${url}" alt="Image" style="max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0;" />`)
      } catch (error) {
        console.error('Erreur upload image:', error)
      }
    } else {
      // Utiliser URL local
      const url = URL.createObjectURL(file)
      insertHTML(`<img src="${url}" alt="Image" style="max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0;" />`)
    }
  }, [onImageUpload, insertHTML])

  // Gestion de l'audio
  const handleAudioUpload = useCallback(async (file: File) => {
    if (onAudioUpload) {
      try {
        const url = await onAudioUpload(file)
        insertHTML(`<audio controls style="width: 100%; margin: 10px 0;"><source src="${url}" type="${file.type}">Votre navigateur ne supporte pas l'audio.</audio>`)
      } catch (error) {
        console.error('Erreur upload audio:', error)
      }
    } else {
      const url = URL.createObjectURL(file)
      insertHTML(`<audio controls style="width: 100%; margin: 10px 0;"><source src="${url}" type="${file.type}">Votre navigateur ne supporte pas l'audio.</audio>`)
    }
  }, [onAudioUpload, insertHTML])

  // Gestion des PDFs
  const handlePdfUpload = useCallback(async (file: File) => {
    if (onPdfUpload) {
      try {
        const url = await onPdfUpload(file)
        insertHTML(`<div style="border: 2px dashed #ccc; padding: 20px; margin: 10px 0; text-align: center; border-radius: 8px;">
          <h3>📄 ${file.name}</h3>
          <a href="${url}" target="_blank" style="color: #3b82f6; text-decoration: underline;">Ouvrir le PDF</a>
        </div>`)
      } catch (error) {
        console.error('Erreur upload PDF:', error)
      }
    } else {
      const url = URL.createObjectURL(file)
      insertHTML(`<div style="border: 2px dashed #ccc; padding: 20px; margin: 10px 0; text-align: center; border-radius: 8px;">
        <h3>📄 ${file.name}</h3>
        <a href="${url}" target="_blank" style="color: #3b82f6; text-decoration: underline;">Ouvrir le PDF</a>
      </div>`)
    }
  }, [onPdfUpload, insertHTML])

  // Insérer un emoji
  const insertEmoji = useCallback((emoji: string) => {
    insertHTML(emoji)
    setShowEmojiPicker(false)
  }, [insertHTML])

  // Insérer un lien
  const insertLink = useCallback(() => {
    const url = prompt('Entrez l\'URL du lien:')
    const text = prompt('Texte du lien (optionnel):') || url
    if (url) {
      insertHTML(`<a href="${url}" target="_blank" style="color: #3b82f6; text-decoration: underline;">${text}</a>`)
    }
  }, [insertHTML])

  // Changer la couleur
  const changeColor = useCallback((color: string) => {
    formatText('foreColor', color)
    setShowColorPicker(false)
  }, [formatText])

  // Changer la couleur de fond
  const changeBackgroundColor = useCallback((color: string) => {
    formatText('hiliteColor', color)
    setShowBackgroundPicker(false)
  }, [formatText])

  // Changer la police
  const changeFont = useCallback((font: string) => {
    formatText('fontName', font)
    setSelectedFont(font)
    setShowFontPicker(false)
  }, [formatText])

  // Changer la taille
  const changeFontSize = useCallback((size: string) => {
    formatText('fontSize', size)
    setSelectedSize(size)
    setShowSizePicker(false)
  }, [formatText])

  // Insérer une table
  const insertTable = useCallback((rows: number, cols: number) => {
    let tableHTML = '<table style="border-collapse: collapse; width: 100%; margin: 10px 0;">'
    for (let i = 0; i < rows; i++) {
      tableHTML += '<tr>'
      for (let j = 0; j < cols; j++) {
        tableHTML += '<td style="border: 1px solid #ccc; padding: 8px; min-width: 50px;">Cellule</td>'
      }
      tableHTML += '</tr>'
    }
    tableHTML += '</table>'
    insertHTML(tableHTML)
    setShowTableDialog(false)
  }, [insertHTML])

  // Undo/Redo
  const undo = useCallback(() => {
    if (undoStack.length > 0) {
      const currentState = { content, timestamp: Date.now() }
      const previousState = undoStack[undoStack.length - 1]
      
      setRedoStack(prev => [...prev, currentState])
      setUndoStack(prev => prev.slice(0, -1))
      
      setContent(previousState.content)
      onChange(previousState.content)
      if (editorRef.current) {
        editorRef.current.innerHTML = previousState.content
      }
    }
  }, [undoStack, content, onChange])

  const redo = useCallback(() => {
    if (redoStack.length > 0) {
      const currentState = { content, timestamp: Date.now() }
      const nextState = redoStack[redoStack.length - 1]
      
      setUndoStack(prev => [...prev, currentState])
      setRedoStack(prev => prev.slice(0, -1))
      
      setContent(nextState.content)
      onChange(nextState.content)
      if (editorRef.current) {
        editorRef.current.innerHTML = nextState.content
      }
    }
  }, [redoStack, content, onChange])

  // Mode plein écran
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen)
  }, [isFullscreen])

  // Recherche et remplacement
  const highlightSearch = useCallback((query: string) => {
    if (!query.trim()) return
    
    const content = editorRef.current?.innerHTML || ''
    const regex = new RegExp(`(${query})`, 'gi')
    const highlighted = content.replace(regex, '<mark style="background: yellow; padding: 2px;">$1</mark>')
    
    if (editorRef.current) {
      editorRef.current.innerHTML = highlighted
    }
  }, [])

  // Gestion des fichiers
  const handleFileSelect = useCallback((type: 'image' | 'audio' | 'pdf') => {
    const input = type === 'image' ? fileInputRef.current :
                  type === 'audio' ? audioInputRef.current :
                  pdfInputRef.current
    
    if (input) {
      input.click()
    }
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'audio' | 'pdf') => {
    const file = e.target.files?.[0]
    if (file) {
      if (type === 'image') {
        handleImageUpload(file)
      } else if (type === 'audio') {
        handleAudioUpload(file)
      } else if (type === 'pdf') {
        handlePdfUpload(file)
      }
    }
  }, [handleImageUpload, handleAudioUpload, handlePdfUpload])

  // Gestion du contenu
  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    const newContent = e.currentTarget.innerHTML
    const textContent = e.currentTarget.textContent || ''
    
    if (textContent.length <= maxLength) {
      setContent(newContent)
      onChange(newContent)
      updateCounts(newContent)
    } else {
      // Tronquer si trop long
      e.currentTarget.innerHTML = content
    }
  }, [content, maxLength, onChange, updateCounts])

  // Raccourcis clavier
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault()
          formatText('bold')
          break
        case 'i':
          e.preventDefault()
          formatText('italic')
          break
        case 'u':
          e.preventDefault()
          formatText('underline')
          break
        case 'z':
          e.preventDefault()
          if (e.shiftKey) {
            redo()
          } else {
            undo()
          }
          break
        case 'f':
          e.preventDefault()
          setShowSearch(!showSearch)
          break
      }
    }
  }, [formatText, undo, redo, showSearch])

  // Données pour les boutons de formatage
  const formatButtons: FormatButton[] = [
    // Formatage de base
    { feature: 'bold', icon: '𝐁', label: 'Gras', action: () => formatText('bold'), color: 'from-orange-400 to-red-500', group: 'format' },
    { feature: 'italic', icon: '𝐼', label: 'Italique', action: () => formatText('italic'), color: 'from-purple-400 to-pink-500', group: 'format' },
    { feature: 'underline', icon: '𝐔', label: 'Souligné', action: () => formatText('underline'), color: 'from-blue-400 to-cyan-500', group: 'format' },
    { feature: 'strikethrough', icon: 'S̶', label: 'Barré', action: () => formatText('strikethrough'), color: 'from-gray-400 to-gray-600', group: 'format' },
    
    // Couleurs et style
    { feature: 'color', icon: '🎨', label: 'Couleur de texte', action: () => setShowColorPicker(!showColorPicker), color: 'from-pink-400 to-rose-500', group: 'style' },
    { feature: 'background', icon: '🖍️', label: 'Surligner', action: () => setShowBackgroundPicker(!showBackgroundPicker), color: 'from-yellow-400 to-orange-400', group: 'style' },
    { feature: 'font', icon: '𝒯', label: 'Police', action: () => setShowFontPicker(!showFontPicker), color: 'from-indigo-400 to-purple-500', group: 'style' },
    { feature: 'size', icon: '📏', label: 'Taille', action: () => setShowSizePicker(!showSizePicker), color: 'from-green-400 to-teal-500', group: 'style' },
    
    // Structure
    { feature: 'heading', icon: '𝐇₁', label: 'Titre', action: () => formatText('formatBlock', 'h2'), color: 'from-slate-400 to-slate-600', group: 'structure' },
    { feature: 'paragraph', icon: '¶', label: 'Paragraphe', action: () => formatText('formatBlock', 'p'), color: 'from-slate-400 to-slate-600', group: 'structure' },
    { feature: 'quote', icon: '"', label: 'Citation', action: () => formatText('formatBlock', 'blockquote'), color: 'from-slate-400 to-slate-600', group: 'structure' },
    
    // Alignement
    { feature: 'align', icon: '⬅', label: 'Alignement', action: () => formatText('justifyLeft'), color: 'from-cyan-400 to-blue-500', group: 'align' },
    
    // Listes
    { feature: 'list', icon: '•', label: 'Liste à puces', action: () => formatText('insertUnorderedList'), color: 'from-green-400 to-emerald-500', group: 'list' },
    { feature: 'orderedlist', icon: '1.', label: 'Liste numérotée', action: () => formatText('insertOrderedList'), color: 'from-green-400 to-emerald-500', group: 'list' },
    
    // Médias
    { feature: 'image', icon: '🖼️', label: 'Image', action: () => handleFileSelect('image'), color: 'from-blue-400 to-indigo-500', group: 'media' },
    { feature: 'audio', icon: '🎵', label: 'Audio', action: () => handleFileSelect('audio'), color: 'from-purple-400 to-violet-500', group: 'media' },
    { feature: 'pdf', icon: '📄', label: 'PDF', action: () => handleFileSelect('pdf'), color: 'from-red-400 to-rose-500', group: 'media' },
    { feature: 'link', icon: '🔗', label: 'Lien', action: insertLink, color: 'from-blue-400 to-cyan-500', group: 'media' },
    
    // Outils
    { feature: 'emoji', icon: '😊', label: 'Emoji', action: () => setShowEmojiPicker(!showEmojiPicker), color: 'from-yellow-400 to-orange-400', group: 'tools' },
    { feature: 'table', icon: '⚏', label: 'Tableau', action: () => setShowTableDialog(true), color: 'from-gray-400 to-slate-500', group: 'tools' },
    { feature: 'hr', icon: '—', label: 'Ligne horizontale', action: () => insertHTML('<hr style="margin: 20px 0; border: none; height: 2px; background: linear-gradient(to right, #3b82f6, #8b5cf6);">'), color: 'from-gray-400 to-slate-500', group: 'tools' },
    
    // Actions
    { feature: 'undo', icon: '↶', label: 'Annuler', action: undo, color: 'from-gray-400 to-gray-600', group: 'action' },
    { feature: 'redo', icon: '↷', label: 'Refaire', action: redo, color: 'from-gray-400 to-gray-600', group: 'action' },
    { feature: 'search', icon: '🔍', label: 'Rechercher', action: () => setShowSearch(!showSearch), color: 'from-indigo-400 to-blue-500', group: 'action' },
    { feature: 'fullscreen', icon: '⛶', label: 'Plein écran', action: toggleFullscreen, color: 'from-violet-400 to-purple-500', group: 'action' },
  ]

  const colors = [
    '#000000', '#333333', '#666666', '#999999', '#ffffff',
    '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3',
    '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43', '#FF6B6B', '#C44569'
  ]

  const backgroundColors = [
    'transparent', '#FFFF00', '#00FF00', '#00FFFF', '#FF00FF',
    '#FFE5B4', '#FFCCCB', '#D3FFD3', '#E0E6FF', '#FFE4E1',
    '#F0F8FF', '#E6E6FA', '#FFF8DC', '#F5F5DC', '#FFFACD'
  ]

  const fonts = [
    'Arial', 'Times New Roman', 'Helvetica', 'Georgia', 'Verdana',
    'Courier New', 'Comic Sans MS', 'Impact', 'Lucida Console',
    'Palatino', 'Trebuchet MS', 'Tahoma', 'Century Gothic'
  ]

  const sizes = ['8', '10', '12', '14', '16', '18', '20', '24', '28', '32', '36', '48', '72']

  const emojis = [
    '😊', '😍', '🤔', '😅', '😎', '🚀', '✨', '💡', '🎯', '📚', '✅', '❤️', '👍', '🔥', '💪', '🎉',
    '📝', '🌟', '🎨', '🎵', '📷', '🍎', '🌈', '⚡', '🦄', '🎪', '🎭', '🎨', '🎯', '🎲', '🎸', '🎹'
  ]

  const tabs = [
    { id: 'format', label: 'Format', icon: '📝' },
    { id: 'insert', label: 'Insérer', icon: '➕' },
    { id: 'tools', label: 'Outils', icon: '🔧' }
  ]

  return (
    <div className={`ultra-rich-editor ${theme} ${className} ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* Inputs cachés pour les fichiers */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => handleFileChange(e, 'image')}
      />
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*"
        style={{ display: 'none' }}
        onChange={(e) => handleFileChange(e, 'audio')}
      />
      <input
        ref={pdfInputRef}
        type="file"
        accept="application/pdf"
        style={{ display: 'none' }}
        onChange={(e) => handleFileChange(e, 'pdf')}
      />

      {/* Barre de recherche */}
      {showSearch && (
        <div className="search-bar">
          <div className="search-container">
            <input
              type="text"
              placeholder="Rechercher dans le texte..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button
              onClick={() => highlightSearch(searchQuery)}
              className="search-btn"
            >
              🔍
            </button>
            <button
              onClick={() => setShowSearch(false)}
              className="search-close"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Toolbar ultra-avancée */}
      {showToolbar && (
        <div ref={toolbarRef} className="ultra-toolbar">
          {/* Onglets de navigation */}
          <div className="toolbar-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id as any)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Contenu des onglets */}
          <div className="toolbar-content">
            {activeTab === 'format' && (
              <div className="toolbar-section-grid">
                <div className="section-group">
                  <h4>Formatage</h4>
                  <div className="button-group">
                    {formatButtons
                      .filter(btn => features.includes(btn.feature) && (btn.group === 'format' || btn.group === 'style'))
                      .map((button) => (
                        <button
                          key={button.feature}
                          className={`ultra-btn bg-gradient-to-r ${button.color}`}
                          onClick={button.action}
                          title={button.label}
                        >
                          {button.icon}
                        </button>
                      ))}
                  </div>
                </div>

                <div className="section-group">
                  <h4>Structure</h4>
                  <div className="button-group">
                    {formatButtons
                      .filter(btn => features.includes(btn.feature) && (btn.group === 'structure' || btn.group === 'align' || btn.group === 'list'))
                      .map((button) => (
                        <button
                          key={button.feature}
                          className={`ultra-btn bg-gradient-to-r ${button.color}`}
                          onClick={button.action}
                          title={button.label}
                        >
                          {button.icon}
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'insert' && (
              <div className="toolbar-section-grid">
                <div className="section-group">
                  <h4>Médias</h4>
                  <div className="button-group">
                    {formatButtons
                      .filter(btn => features.includes(btn.feature) && btn.group === 'media')
                      .map((button) => (
                        <button
                          key={button.feature}
                          className={`ultra-btn bg-gradient-to-r ${button.color}`}
                          onClick={button.action}
                          title={button.label}
                        >
                          {button.icon}
                        </button>
                      ))}
                  </div>
                </div>

                <div className="section-group">
                  <h4>Éléments</h4>
                  <div className="button-group">
                    {formatButtons
                      .filter(btn => features.includes(btn.feature) && btn.group === 'tools')
                      .map((button) => (
                        <button
                          key={button.feature}
                          className={`ultra-btn bg-gradient-to-r ${button.color}`}
                          onClick={button.action}
                          title={button.label}
                        >
                          {button.icon}
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tools' && (
              <div className="toolbar-section-grid">
                <div className="section-group">
                  <h4>Actions</h4>
                  <div className="button-group">
                    {formatButtons
                      .filter(btn => features.includes(btn.feature) && btn.group === 'action')
                      .map((button) => (
                        <button
                          key={button.feature}
                          className={`ultra-btn bg-gradient-to-r ${button.color}`}
                          onClick={button.action}
                          title={button.label}
                        >
                          {button.icon}
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Panneaux flottants */}
          {showColorPicker && (
            <div className="floating-panel color-panel">
              <h4>Couleur de texte</h4>
              <div className="color-grid">
                {colors.map((color) => (
                  <button
                    key={color}
                    className="color-option"
                    style={{ backgroundColor: color }}
                    onClick={() => changeColor(color)}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}

          {showBackgroundPicker && (
            <div className="floating-panel background-panel">
              <h4>Couleur de fond</h4>
              <div className="color-grid">
                {backgroundColors.map((color) => (
                  <button
                    key={color}
                    className="color-option"
                    style={{ backgroundColor: color, border: color === 'transparent' ? '2px dashed #ccc' : 'none' }}
                    onClick={() => changeBackgroundColor(color)}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}

          {showFontPicker && (
            <div className="floating-panel font-panel">
              <h4>Police</h4>
              <div className="font-list">
                {fonts.map((font) => (
                  <button
                    key={font}
                    className={`font-option ${selectedFont === font ? 'selected' : ''}`}
                    style={{ fontFamily: font }}
                    onClick={() => changeFont(font)}
                  >
                    {font}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showSizePicker && (
            <div className="floating-panel size-panel">
              <h4>Taille</h4>
              <div className="size-grid">
                {sizes.map((size) => (
                  <button
                    key={size}
                    className={`size-option ${selectedSize === size ? 'selected' : ''}`}
                    onClick={() => changeFontSize(size)}
                  >
                    {size}px
                  </button>
                ))}
              </div>
            </div>
          )}

          {showEmojiPicker && (
            <div className="floating-panel emoji-panel">
              <h4>Emojis</h4>
              <div className="emoji-grid">
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    className="emoji-option"
                    onClick={() => insertEmoji(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showTableDialog && (
            <div className="floating-panel table-panel">
              <h4>Insérer un tableau</h4>
              <div className="table-controls">
                <label>
                  Lignes: 
                  <input type="number" min="1" max="10" defaultValue="3" id="table-rows" />
                </label>
                <label>
                  Colonnes: 
                  <input type="number" min="1" max="10" defaultValue="3" id="table-cols" />
                </label>
                <div className="table-actions">
                  <button
                    className="insert-btn"
                    onClick={() => {
                      const rows = (document.getElementById('table-rows') as HTMLInputElement)?.value || '3'
                      const cols = (document.getElementById('table-cols') as HTMLInputElement)?.value || '3'
                      insertTable(parseInt(rows), parseInt(cols))
                    }}
                  >
                    Insérer
                  </button>
                  <button
                    className="cancel-btn"
                    onClick={() => setShowTableDialog(false)}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Éditeur principal */}
      <div
        ref={editorRef}
        className="ultra-editor-content"
        contentEditable
        dangerouslySetInnerHTML={{ __html: content }}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />

      {/* Barre de statut ultra-avancée */}
      <div className="ultra-status-bar">
        <div className="status-left">
          <div className="word-stats">
            <span className="stat-item">
              📝 {wordCount} mots
            </span>
            <span className="stat-item">
              🔤 {charCount} caractères
            </span>
            <span className={`stat-item ${charCount > maxLength * 0.9 ? 'warning' : ''}`}>
              📊 {Math.round((charCount / maxLength) * 100)}%
            </span>
          </div>
        </div>
        
        <div className="status-center">
          <div className="feature-indicators">
            {content.includes('<img') && <span className="indicator media">🖼️</span>}
            {content.includes('<audio') && <span className="indicator media">🎵</span>}
            {content.includes('href=') && <span className="indicator link">🔗</span>}
            {content.includes('<table') && <span className="indicator table">⚏</span>}
            {/[\u{1F300}-\u{1F9FF}]/u.test(content) && <span className="indicator emoji">😊</span>}
          </div>
        </div>

        <div className="status-right">
          <div className="editor-info">
            <span className="current-font">
              🔤 {selectedFont}
            </span>
            <span className="current-size">
              📏 {selectedSize}px
            </span>
            <button
              className="toolbar-toggle"
              onClick={() => setShowToolbar(!showToolbar)}
              title="Afficher/Masquer la barre d'outils"
            >
              {showToolbar ? '🔼' : '🔽'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .ultra-rich-editor {
          position: relative;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border-radius: 20px;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
          overflow: hidden;
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          border: 2px solid transparent;
          background-clip: padding-box;
        }

        .ultra-rich-editor.dark {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          color: white;
        }

        .ultra-rich-editor.fullscreen {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 10000;
          border-radius: 0;
          box-shadow: none;
        }

        .ultra-rich-editor:hover {
          transform: translateY(-2px);
          box-shadow: 0 35px 70px rgba(0, 0, 0, 0.2);
          border-color: rgba(59, 130, 246, 0.3);
        }

        /* Barre de recherche */
        .search-bar {
          background: linear-gradient(90deg, #3b82f6, #8b5cf6);
          padding: 12px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }

        .search-container {
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          padding: 8px 12px;
          backdrop-filter: blur(10px);
        }

        .search-input {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          color: white;
          font-size: 14px;
          placeholder-color: rgba(255, 255, 255, 0.7);
        }

        .search-btn, .search-close {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          border-radius: 8px;
          padding: 6px 10px;
          color: white;
          cursor: pointer;
          margin-left: 8px;
          transition: all 0.2s ease;
        }

        .search-btn:hover, .search-close:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.05);
        }

        /* Toolbar ultra-avancée */
        .ultra-toolbar {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          position: relative;
          z-index: 100;
        }

        .toolbar-tabs {
          display: flex;
          background: rgba(255, 255, 255, 0.1);
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }

        .tab-btn {
          flex: 1;
          padding: 12px 20px;
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.8);
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-weight: 500;
        }

        .tab-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .tab-btn.active {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          box-shadow: inset 0 -3px 0 #ffffff;
        }

        .tab-icon {
          font-size: 16px;
        }

        .tab-label {
          font-size: 14px;
        }

        .toolbar-content {
          padding: 20px;
          max-height: 200px;
          overflow-y: auto;
        }

        .toolbar-section-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }

        .section-group {
          background: rgba(255, 255, 255, 0.1);
          padding: 15px;
          border-radius: 12px;
          backdrop-filter: blur(10px);
        }

        .section-group h4 {
          margin: 0 0 10px 0;
          color: white;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          opacity: 0.9;
        }

        .button-group {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .ultra-btn {
          width: 40px;
          height: 40px;
          border: none;
          border-radius: 10px;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: bold;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
          position: relative;
          overflow: hidden;
        }

        .ultra-btn:hover {
          transform: translateY(-3px) scale(1.1);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
        }

        .ultra-btn:active {
          transform: translateY(-1px) scale(1.05);
        }

        .ultra-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          transition: left 0.5s ease;
        }

        .ultra-btn:hover::before {
          left: 100%;
        }

        /* Panneaux flottants */
        .floating-panel {
          position: absolute;
          top: 100%;
          right: 20px;
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          min-width: 280px;
          animation: slideInDown 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          border: 1px solid rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(20px);
        }

        .floating-panel h4 {
          margin: 0 0 15px 0;
          color: #374151;
          font-size: 14px;
          font-weight: 600;
          text-align: center;
        }

        .color-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 8px;
        }

        .color-option {
          width: 32px;
          height: 32px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }

        .color-option:hover {
          transform: scale(1.1);
          border-color: #3b82f6;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .font-list {
          max-height: 200px;
          overflow-y: auto;
        }

        .font-option {
          width: 100%;
          padding: 10px 15px;
          background: none;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          margin-bottom: 5px;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s ease;
          font-size: 14px;
        }

        .font-option:hover {
          background: #f3f4f6;
          border-color: #3b82f6;
          transform: translateX(5px);
        }

        .font-option.selected {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .size-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }

        .size-option {
          padding: 8px 12px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 12px;
          font-weight: 500;
        }

        .size-option:hover {
          background: #f3f4f6;
          border-color: #3b82f6;
          transform: scale(1.05);
        }

        .size-option.selected {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .emoji-grid {
          display: grid;
          grid-template-columns: repeat(8, 1fr);
          gap: 6px;
          max-height: 150px;
          overflow-y: auto;
        }

        .emoji-option {
          width: 32px;
          height: 32px;
          background: none;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .emoji-option:hover {
          background: #f3f4f6;
          transform: scale(1.2);
          border-color: #3b82f6;
        }

        .table-controls {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .table-controls label {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          color: #374151;
        }

        .table-controls input {
          padding: 6px 10px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          font-size: 14px;
        }

        .table-actions {
          display: flex;
          gap: 10px;
        }

        .insert-btn, .cancel-btn {
          flex: 1;
          padding: 10px 15px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .insert-btn {
          background: #3b82f6;
          color: white;
        }

        .insert-btn:hover {
          background: #2563eb;
          transform: translateY(-2px);
        }

        .cancel-btn {
          background: #e5e7eb;
          color: #374151;
        }

        .cancel-btn:hover {
          background: #d1d5db;
        }

        /* Éditeur principal */
        .ultra-editor-content {
          min-height: 300px;
          padding: 30px;
          outline: none;
          line-height: 1.8;
          font-size: 16px;
          color: #374151;
          background: linear-gradient(135deg, 
            rgba(255, 255, 255, 0.9) 0%, 
            rgba(248, 250, 252, 0.9) 100%);
          position: relative;
          overflow-y: auto;
        }

        .ultra-rich-editor.dark .ultra-editor-content {
          color: #e5e7eb;
          background: linear-gradient(135deg, 
            rgba(15, 23, 42, 0.9) 0%, 
            rgba(30, 41, 59, 0.9) 100%);
        }

        .ultra-editor-content:empty::before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
          font-style: italic;
        }

        .ultra-editor-content:focus {
          background: linear-gradient(135deg, 
            rgba(255, 255, 255, 0.95) 0%, 
            rgba(240, 249, 255, 0.95) 100%);
        }

        /* Tables dans l'éditeur */
        .ultra-editor-content table {
          border-collapse: collapse;
          width: 100%;
          margin: 20px 0;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }

        .ultra-editor-content table td, 
        .ultra-editor-content table th {
          border: 1px solid #e5e7eb;
          padding: 12px 16px;
          position: relative;
        }

        .ultra-editor-content table th {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: white;
          font-weight: 600;
        }

        .ultra-editor-content table tr:nth-child(even) {
          background: rgba(59, 130, 246, 0.05);
        }

        .ultra-editor-content table tr:hover {
          background: rgba(59, 130, 246, 0.1);
        }

        /* Images dans l'éditeur */
        .ultra-editor-content img {
          max-width: 100%;
          height: auto;
          border-radius: 12px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
          margin: 15px 0;
          transition: all 0.3s ease;
        }

        .ultra-editor-content img:hover {
          transform: scale(1.02);
          box-shadow: 0 12px 35px rgba(0, 0, 0, 0.2);
        }

        /* Audio dans l'éditeur */
        .ultra-editor-content audio {
          width: 100%;
          margin: 15px 0;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        /* Barre de statut ultra-avancée */
        .ultra-status-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 15px 25px;
          background: linear-gradient(135deg, 
            rgba(248, 250, 252, 0.95) 0%, 
            rgba(241, 245, 249, 0.95) 100%);
          border-top: 1px solid rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(10px);
        }

        .ultra-rich-editor.dark .ultra-status-bar {
          background: linear-gradient(135deg, 
            rgba(30, 41, 59, 0.95) 0%, 
            rgba(51, 65, 85, 0.95) 100%);
          border-color: rgba(255, 255, 255, 0.1);
        }

        .status-left, .status-center, .status-right {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .word-stats {
          display: flex;
          gap: 15px;
        }

        .stat-item {
          padding: 6px 12px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: white;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
          transition: all 0.3s ease;
        }

        .stat-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
        }

        .stat-item.warning {
          background: linear-gradient(135deg, #ef4444, #f97316);
          animation: pulse 2s infinite;
        }

        .feature-indicators {
          display: flex;
          gap: 8px;
        }

        .indicator {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          animation: float 3s ease-in-out infinite;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .indicator.media {
          background: linear-gradient(135deg, #8b5cf6, #d946ef);
        }

        .indicator.link {
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
        }

        .indicator.table {
          background: linear-gradient(135deg, #10b981, #34d399);
        }

        .indicator.emoji {
          background: linear-gradient(135deg, #f59e0b, #f97316);
        }

        .editor-info {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          color: #6b7280;
        }

        .current-font, .current-size {
          padding: 4px 8px;
          background: rgba(0, 0, 0, 0.05);
          border-radius: 6px;
          font-weight: 500;
        }

        .toolbar-toggle {
          background: linear-gradient(135deg, #6b7280, #9ca3af);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 6px 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 12px;
        }

        .toolbar-toggle:hover {
          background: linear-gradient(135deg, #4b5563, #6b7280);
          transform: scale(1.05);
        }

        /* Animations */
        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes float {
          0%, 100% { 
            transform: translateY(0px); 
          }
          50% { 
            transform: translateY(-5px); 
          }
        }

        @keyframes pulse {
          0%, 100% { 
            transform: scale(1); 
            opacity: 1; 
          }
          50% { 
            transform: scale(1.05); 
            opacity: 0.9; 
          }
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .toolbar-section-grid {
            grid-template-columns: 1fr;
          }
          
          .ultra-status-bar {
            flex-direction: column;
            gap: 10px;
          }
          
          .status-left, .status-center, .status-right {
            width: 100%;
            justify-content: center;
          }
        }

        @media (max-width: 768px) {
          .ultra-rich-editor.fullscreen {
            border-radius: 0;
          }

          .ultra-editor-content {
            padding: 20px;
            font-size: 14px;
          }

          .button-group {
            justify-content: center;
          }

          .ultra-btn {
            width: 36px;
            height: 36px;
            font-size: 14px;
          }

          .floating-panel {
            left: 10px;
            right: 10px;
            min-width: auto;
          }
        }

        /* Mode sombre amélioré */
        .ultra-rich-editor.dark .floating-panel {
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          border-color: rgba(255, 255, 255, 0.1);
        }

        .ultra-rich-editor.dark .floating-panel h4 {
          color: #e5e7eb;
        }

        .ultra-rich-editor.dark .font-option {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.1);
          color: #e5e7eb;
        }

        .ultra-rich-editor.dark .font-option:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .ultra-rich-editor.dark .size-option {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.1);
          color: #e5e7eb;
        }

        .ultra-rich-editor.dark .emoji-option {
          border-color: rgba(255, 255, 255, 0.1);
        }

        .ultra-rich-editor.dark .color-option {
          border-color: rgba(255, 255, 255, 0.2);
        }

        /* Scrollbars personnalisées */
        .toolbar-content::-webkit-scrollbar,
        .font-list::-webkit-scrollbar,
        .emoji-grid::-webkit-scrollbar,
        .ultra-editor-content::-webkit-scrollbar {
          width: 8px;
        }

        .toolbar-content::-webkit-scrollbar-track,
        .font-list::-webkit-scrollbar-track,
        .emoji-grid::-webkit-scrollbar-track,
        .ultra-editor-content::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 4px;
        }

        .toolbar-content::-webkit-scrollbar-thumb,
        .font-list::-webkit-scrollbar-thumb,
        .emoji-grid::-webkit-scrollbar-thumb,
        .ultra-editor-content::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .toolbar-content::-webkit-scrollbar-thumb:hover,
        .font-list::-webkit-scrollbar-thumb:hover,
        .emoji-grid::-webkit-scrollbar-thumb:hover,
        .ultra-editor-content::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #2563eb, #7c3aed);
        }
      `}</style>
    </div>
  )
}
