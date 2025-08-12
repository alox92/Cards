import React, { useState, useEffect, useCallback } from 'react'
import { container } from '@/application/Container'
import { CARD_SERVICE_TOKEN, CardService } from '@/application/services/CardService'
import { DECK_SERVICE_TOKEN, DeckService } from '@/application/services/DeckService'
import { SEARCH_SERVICE_TOKEN, SearchService } from '@/application/services/SearchService'
import type { CardEntity } from '@/domain/entities/Card'
import type { DeckEntity } from '@/domain/entities/Deck'

interface GlobalSearchBarProps {
  onSelectCard?: (card: CardEntity) => void
  onSelectDeck?: (deck: DeckEntity) => void
  className?: string
}

interface SearchResult {
  type: 'card' | 'deck'
  id: string
  title: string
  subtitle?: string
  tags: string[]
  contentPreview?: string
  deckId?: string
}


export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({ onSelectCard, onSelectDeck, className = '' }) => {
  const cardService = container.resolve<CardService>(CARD_SERVICE_TOKEN)
  const deckService = container.resolve<DeckService>(DECK_SERVICE_TOKEN)
  const searchService = container.resolve<SearchService>(SEARCH_SERVICE_TOKEN)

  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [allData, setAllData] = useState<{ cards: CardEntity[]; decks: DeckEntity[] }>({ cards: [], decks: [] })
  const [showPanel, setShowPanel] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [filterType, setFilterType] = useState<'all'|'card'|'deck'>('all')
  const [filterTag, setFilterTag] = useState<string>('')
  const [filterDeck, setFilterDeck] = useState<string>('')
  const [filterDueOnly, setFilterDueOnly] = useState(false)
  const [filterLeechOnly, setFilterLeechOnly] = useState(false)

  // Charger toutes les données de base une fois (pour rapidité locale)
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [cards, decks] = await Promise.all([
          cardService.listAll(),
          deckService.listDecks()
        ])
        setAllData({ cards, decks })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [cardService, deckService])

  // Indexation simple (sans lib) + recherche fuzzy basique
  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    const lower = q.toLowerCase()
    // Utiliser SearchService pour les cartes
    let cards = await searchService.search({
      text: lower,
      deckId: filterDeck || undefined,
      tag: filterTag || undefined,
      isDue: filterDueOnly || undefined
    })
    if(filterLeechOnly) cards = cards.filter((c: CardEntity) => c.tags.includes('leech'))
    cards = cards.slice(0,400)
    const cardMatches: SearchResult[] = cards.map((c: CardEntity) => ({
      type: 'card', id: c.id, deckId: c.deckId, title: c.frontText.slice(0,80), subtitle: c.backText.slice(0,80), tags: c.tags, contentPreview: (c.frontText + ' ' + c.backText).slice(0,160)
    }))
    const deckMatches: SearchResult[] = allData.decks
      .filter(d => d.name.toLowerCase().includes(lower) || (d.description || '').toLowerCase().includes(lower))
      .map(d => ({
        type:'deck', id:d.id, title:d.name, subtitle:`${allData.cards.filter(c=>c.deckId===d.id).length} cartes`, tags:(d as any).tags||[], contentPreview:(d as any).description?.slice(0,120)
      }))
    let merged = [...deckMatches, ...cardMatches]
    if(filterType !== 'all') merged = merged.filter(r => r.type === filterType)
    if(filterTag) merged = merged.filter(r => r.tags.includes(filterTag)) // deck tag filtering basic
    if(filterDeck) merged = merged.filter(r => r.deckId === filterDeck || (r.type==='deck' && r.id===filterDeck))

    // scoring simple (titre > tags > contenu)
    const term = lower
    merged = merged.map(r => {
      const titleScore = r.title.toLowerCase().includes(term) ? 3 : 0
      const tagScore = r.tags.some(t=>t.toLowerCase().includes(term)) ? 2 : 0
      const contentScore = (r.contentPreview||'').toLowerCase().includes(term) ? 1 : 0
      return { ...r, _score: titleScore + tagScore + contentScore }
    }).sort((a,b)=> (b as any)._score - (a as any)._score)

    setResults(merged)
    setActiveIndex(0)
  }, [allData, filterType, filterTag, filterDeck, filterDueOnly, filterLeechOnly, searchService])

  // Debounce
  useEffect(() => {
  const t = setTimeout(() => { void search(query) }, 200)
    return () => clearTimeout(t)
  }, [query, search])

  // Gestion clavier
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'k') {
        e.preventDefault(); setShowPanel(true)
        const input = document.getElementById('global-search-input'); input?.focus()
      }
      if (!showPanel) return
      if (e.key === 'Escape') { setShowPanel(false) }
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(results.length - 1, i + 1)) }
      if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => Math.max(0, i - 1)) }
      if (e.key === 'Enter') {
        const item = results[activeIndex]
        if (!item) return
        if (item.type === 'deck') onSelectDeck?.(allData.decks.find(d => d.id === item.id)!)
        else onSelectCard?.(allData.cards.find(c => c.id === item.id)!)
        setShowPanel(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [results, activeIndex, showPanel, onSelectCard, onSelectDeck, allData])

  return (
    <div className={`relative ${className}`}>
      <div className="flex gap-2 mb-2">
        <input
        id="global-search-input"
        value={query}
        onChange={e => { setQuery(e.target.value); setShowPanel(true) }}
        placeholder={loading ? 'Indexation...' : 'Rechercher cartes, paquets, tags... (Ctrl+K)'}
        className="flex-1 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900 dark:text-gray-100"
      />
        <select value={filterType} onChange={e=>setFilterType(e.target.value as any)} className="px-2 py-2 rounded bg-white dark:bg-gray-800 text-xs border border-gray-300 dark:border-gray-700">
          <option value="all">Tous</option>
          <option value="deck">Decks</option>
          <option value="card">Cartes</option>
        </select>
        <select value={filterDeck} onChange={e=>setFilterDeck(e.target.value)} className="px-2 py-2 rounded bg-white dark:bg-gray-800 text-xs border border-gray-300 dark:border-gray-700">
          <option value="">Deck</option>
          {allData.decks.map(d=> <option key={d.id} value={d.id}>{d.name.slice(0,16)}</option>)}
        </select>
        <select value={filterTag} onChange={e=>setFilterTag(e.target.value)} className="px-2 py-2 rounded bg-white dark:bg-gray-800 text-xs border border-gray-300 dark:border-gray-700">
          <option value="">Tag</option>
          {Array.from(new Set(allData.cards.flatMap(c=>c.tags))).slice(0,50).map(tag=> <option key={tag} value={tag}>{tag.slice(0,16)}</option>)}
        </select>
  <button onClick={()=>setFilterDueOnly(d=>!d)} className={`px-3 py-2 rounded text-xs border ${filterDueOnly?'bg-indigo-600 text-white border-indigo-600':'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200'}`}>Due</button>
  <button onClick={()=>setFilterLeechOnly(d=>!d)} className={`px-3 py-2 rounded text-xs border ${filterLeechOnly?'bg-red-600 text-white border-red-600':'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200'}`}>Leeches</button>
      </div>
      {showPanel && results.length > 0 && (
        <div className="absolute z-50 mt-2 w-full max-h-[420px] overflow-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 backdrop-blur shadow-xl p-2 space-y-1">
          {results.map((r, i) => (
            <button
              key={r.id}
              onClick={() => {
                if (r.type === 'deck') onSelectDeck?.(allData.decks.find(d => d.id === r.id)!)
                else onSelectCard?.(allData.cards.find(c => c.id === r.id)!)
                setShowPanel(false)
              }}
              className={`w-full text-left px-3 py-2 rounded-lg transition-all ${i === activeIndex ? 'bg-indigo-600 text-white shadow' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-2">
                  <div className="font-medium flex items-center gap-2">
                    {r.type === 'deck' ? '🗂️' : '🃏'} <span dangerouslySetInnerHTML={{ __html: r.title.replace(new RegExp(query,'ig'), m=>`<mark>${m}</mark>`) }} />
                    {r.type === 'deck' && <span className="text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 px-2 py-0.5 rounded-full">Deck</span>}
                    {r.type === 'card' && <span className="text-xs bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300 px-2 py-0.5 rounded-full">Card</span>}
                  </div>
                  {r.subtitle && <div className="text-xs opacity-80 line-clamp-1" dangerouslySetInnerHTML={{ __html: r.subtitle.replace(new RegExp(query,'ig'), m=>`<mark>${m}</mark>`) }} />}
                  {r.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {r.tags.slice(0,6).map(t => (
                        <span key={t} className="text-[10px] px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded-full" dangerouslySetInnerHTML={{ __html: t.replace(new RegExp(query,'ig'), m=>`<mark>${m}</mark>`) }} />
                      ))}
                    </div>
                  )}
                </div>
                {r.contentPreview && <div className="hidden md:block w-40 text-[10px] italic opacity-70 line-clamp-4" dangerouslySetInnerHTML={{ __html: r.contentPreview.replace(new RegExp(query,'ig'), m=>`<mark>${m}</mark>`) }} />}
              </div>
            </button>
          ))}
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700 text-[10px] text-gray-500 dark:text-gray-400 flex justify-between">
            <span>{results.length} résultats</span>
            <span>Esc pour fermer • Entrée pour ouvrir • ↑↓ navigation</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default GlobalSearchBar
