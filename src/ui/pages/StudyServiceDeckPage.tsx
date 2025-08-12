import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { container } from '@/application/Container'
import { DECK_SERVICE_TOKEN, DeckService } from '@/application/services/DeckService'
import { CARD_SERVICE_TOKEN, CardService } from '@/application/services/CardService'
import { CardEntity } from '@/domain/entities/Card'
import FuturisticLayout from '@/ui/components/layout/FuturisticLayout'
import { logger } from '@/utils/logger'

// Vue rapide: liste scrollable de cartes d'un deck avec création inline
const StudyServiceDeckPage: React.FC = () => {
  const { deckId } = useParams<{ deckId: string }>()
  const navigate = useNavigate()
  const deckService = container.resolve<DeckService>(DECK_SERVICE_TOKEN)
  const cardService = container.resolve<CardService>(CARD_SERVICE_TOKEN)
  const [deck, setDeck] = useState<any>(null)
  const [cards, setCards] = useState<CardEntity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [creating, setCreating] = useState(false)
  const [showBack, setShowBack] = useState(true)
  const [filter, setFilter] = useState('')
  const [selectedIndex, setSelectedIndex] = useState<number>(-1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFront, setEditFront] = useState('')
  const [editBack, setEditBack] = useState('')
  const [studySelectionActive, setStudySelectionActive] = useState(false)
  const [studySelIndex, setStudySelIndex] = useState(0)
  const listRef = useRef<HTMLDivElement | null>(null)

  const load = useCallback(async () => {
    if(!deckId) return
    setLoading(true)
    setError(null)
    try {
      const d = await deckService.getDeck(deckId)
      if(!d){ setError('Deck introuvable'); setDeck(null); setCards([]); return }
      setDeck(d)
      const list = await cardService.listByDeck(deckId)
      setCards(list)
    } catch(e:any){
      logger.error('StudyService','Erreur chargement deck/cards',{e})
      setError(e?.message || 'Erreur chargement')
    } finally { setLoading(false) }
  }, [deckId, deckService, cardService])

  useEffect(()=> { void load() }, [load])

  const handleCreate = async () => {
    if(!deckId || !front.trim() || !back.trim()) return
    setCreating(true)
    try {
      await cardService.create(deckId, { frontText: front.trim(), backText: back.trim(), tags: [], difficulty: 1 } as any)
      setFront(''); setBack('')
      await load()
    } catch(e:any){ alert('Échec création carte: '+ (e?.message||'inconnu')) }
    finally { setCreating(false) }
  }

  // Filtrage + Virtualisation
  const filtered = filter.trim() ? cards.filter(c => c.frontText.toLowerCase().includes(filter.toLowerCase()) || c.backText.toLowerCase().includes(filter.toLowerCase())) : cards
  const VIRTUALIZE_THRESHOLD = 1000
  const [mode, setMode] = useState<'virtual'|'pagination'>('virtual')
  const virtualize = mode==='virtual' && filtered.length > VIRTUALIZE_THRESHOLD
  const paginate = mode==='pagination' && filtered.length > VIRTUALIZE_THRESHOLD
  const PAGE_SIZE = 200
  const OVERSCAN = 10
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(600)
  const [itemHeight, setItemHeight] = useState(72)
  const firstItemRef = useRef<HTMLDivElement | null>(null)

  // mesurer la hauteur du conteneur à l'affichage / resize
  useEffect(()=> {
    const el = listRef.current
    if(!el) return
    const resize = () => setContainerHeight(el.clientHeight || 600)
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])
  // Mesure dynamique de la hauteur d’item (sur le premier visible)
  useEffect(()=> {
    if(virtualize && firstItemRef.current){
      const h = firstItemRef.current.getBoundingClientRect().height
      if(h && Math.abs(h-itemHeight)>2) setItemHeight(Math.round(h))
    }
  }, [virtualize, firstItemRef.current, itemHeight, filtered, scrollTop])

  const total = filtered.length
  const maxStart = Math.max(0, total - 1)
  // Pagination
  const [page, setPage] = useState(0)
  useEffect(()=> { if(page>0 && page*PAGE_SIZE>=filtered.length) setPage(0) }, [filtered.length, page])
  const pageCount = paginate ? Math.ceil(filtered.length / PAGE_SIZE) : 1
  const pageSlice = paginate ? filtered.slice(page*PAGE_SIZE, page*PAGE_SIZE + PAGE_SIZE) : filtered
  // Virtualisation
  const startIndex = virtualize ? Math.min(Math.floor(scrollTop / itemHeight), maxStart) : 0
  const visibleCount = virtualize ? Math.ceil(containerHeight / itemHeight) + OVERSCAN : total
  const endIndex = virtualize ? Math.min(total, startIndex + visibleCount) : total
  const visibleItems = virtualize ? filtered.slice(startIndex, endIndex) : (paginate ? pageSlice : filtered)
  const topPadding = virtualize ? startIndex * itemHeight : 0
  const bottomPadding = virtualize ? (total - endIndex) * itemHeight : 0

  // Sélection & édition
  const toggleSelect = (id: string) => setSelectedIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
  const clearSelection = () => setSelectedIds(new Set())
  const startEdit = (c: CardEntity) => { setEditingId(c.id!); setEditFront(c.frontText); setEditBack(c.backText) }
  const cancelEdit = () => { setEditingId(null); setEditFront(''); setEditBack('') }
  const saveEdit = async () => {
    if(!editingId) return
    try { const original = cards.find(c=> c.id===editingId); if(!original) return; const updated: CardEntity = { ...original, frontText: editFront, backText: editBack } as any; await cardService.update(updated); cancelEdit(); await load() } catch(e:any){ alert('Échec sauvegarde: '+(e?.message||'inconnu')) }
  }
  const deleteCard = async (id: string) => { if(!confirm('Supprimer cette carte ?')) return; try { await cardService.delete(id); await load(); setSelectedIds(s=> { const n=new Set(s); n.delete(id); return n }) } catch(e:any){ alert('Échec suppression: '+(e?.message||'inconnu')) } }

  // Mini étude sélection
  const selectionArray = Array.from(selectedIds)
  const currentStudyCard = studySelectionActive ? cards.find(c=> c.id===selectionArray[studySelIndex]) : null
  const nextStudy = () => setStudySelIndex(i=> Math.min(selectionArray.length-1, i+1))
  const prevStudy = () => setStudySelIndex(i=> Math.max(0, i-1))
  const closeStudy = () => { setStudySelectionActive(false); setStudySelIndex(0) }

  // Navigation clavier (liste & mini étude)
  const handleKey = useCallback((e: KeyboardEvent) => {
    if(studySelectionActive){
      if(e.key==='Escape'){ e.preventDefault(); closeStudy() }
      if(e.key==='ArrowRight'){ e.preventDefault(); nextStudy() }
      if(e.key==='ArrowLeft'){ e.preventDefault(); prevStudy() }
      if(e.key===' '){ e.preventDefault(); setShowBack(b=> !b) }
      return
    }
    if(!filtered.length) return
    if(['ArrowDown','j'].includes(e.key)){
      e.preventDefault();
      setSelectedIndex(i=> Math.min(filtered.length-1, i+1))
    }
    if(['ArrowUp','k'].includes(e.key)){
      e.preventDefault();
      setSelectedIndex(i=> Math.max(0, (i<0?0:i-1)))
    }
    if(e.key==='Enter' && selectedIndex>=0){ e.preventDefault(); setShowBack(b=> !b) }
    if(e.key===' ' && selectedIndex>=0){ e.preventDefault(); const id = filtered[selectedIndex].id!; toggleSelect(id) }
  }, [studySelectionActive, filtered, selectedIndex])
  useEffect(()=> { window.addEventListener('keydown', handleKey); return ()=> window.removeEventListener('keydown', handleKey) }, [handleKey])

  useEffect(()=> { // scroll auto élément sélectionné (approx via scrollTop cible)
    if(selectedIndex>=0 && virtualize){
      const container = listRef.current
      if(container){
        const itemTop = selectedIndex * itemHeight
        const itemBottom = itemTop + itemHeight
        if(itemTop < scrollTop){ container.scrollTop = itemTop - 8 }
        else if(itemBottom > scrollTop + containerHeight){ container.scrollTop = itemBottom - containerHeight + 8 }
      }
    }
  }, [selectedIndex, virtualize, scrollTop, containerHeight])

  // scroll auto tenant compte du slice

  return (
    <FuturisticLayout>
      <div className="min-h-screen p-4 bg-transparent">
        <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{deck ? deck.name : 'Deck'}</h1>
              <div className="text-xs text-gray-500 dark:text-gray-400">{cards.length} cartes • Vue liste rapide {virtualize && `(virtualisation)`}{paginate && `(pagination)`}</div>
            </div>
            <div className="flex gap-2">
                  {filtered.length > VIRTUALIZE_THRESHOLD && (
                    <select value={mode} onChange={e=> setMode(e.target.value as any)} className="px-2 py-1 text-xs rounded border bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                      <option value="virtual">Virtualisation</option>
                      <option value="pagination">Pagination</option>
                    </select>
                  )}
              <button onClick={()=> navigate(`/study/${deckId}`)} className="px-3 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700">Mode Session</button>
              <button onClick={()=> setShowBack(b=>!b)} className="px-3 py-1 text-sm rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">{showBack? 'Cacher verso':'Afficher verso'}</button>
              <button onClick={()=> load()} disabled={loading} className="px-3 py-1 text-sm rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50">↻</button>
              <button onClick={()=> navigate('/decks')} className="px-3 py-1 text-sm rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">← Decks</button>
              <button onClick={()=> setStudySelectionActive(true)} disabled={selectedIds.size===0} className="px-3 py-1 text-sm rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-40">Étudier sélection ({selectedIds.size})</button>
              {selectedIds.size>0 && <button onClick={clearSelection} className="px-2 py-1 text-xs rounded bg-red-500 text-white hover:bg-red-600">Reset</button>}
            </div>
          </div>
          {error && <div className="mb-4 p-3 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">{error}</div>}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-4">
              <div className="card p-4">
                <h2 className="font-semibold mb-2 text-gray-800 dark:text-gray-100">➕ Nouvelle carte</h2>
                <input value={front} onChange={e=>setFront(e.target.value)} placeholder="Recto" className="w-full mb-2 px-2 py-1 rounded border text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600" />
                <textarea value={back} onChange={e=>setBack(e.target.value)} placeholder="Verso" rows={3} className="w-full mb-2 px-2 py-1 rounded border text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600" />
                <button onClick={handleCreate} disabled={creating || !front.trim() || !back.trim()} className="w-full py-1.5 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 text-sm">{creating? 'Création...' : 'Créer'}</button>
              </div>
              <div className="card p-4">
                <h3 className="font-semibold text-sm mb-2">🔎 Filtrer</h3>
                <input value={filter} onChange={e=> setFilter(e.target.value)} placeholder="texte..." className="w-full px-2 py-1 rounded border text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600" />
                <div className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">{filtered.length} / {cards.length}</div>
              </div>
              <div className="card p-4 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
                <p className="font-medium text-gray-700 dark:text-gray-200 mb-1">Raccourcis:</p>
                <ul className="space-y-1 list-disc pl-4">
                  <li>↑/↓ ou j/k naviguer</li>
                  <li>Entrée: basculer recto/verso</li>
                  <li>Espace: sélectionner</li>
                  <li>Étudier sélection: mini session</li>
                </ul>
              </div>
              <div className="card p-3 text-xs text-gray-500 dark:text-gray-400">
                Base route: <Link to="/study-service" className="underline">liste des decks</Link>
              </div>
            </div>
            <div className="md:col-span-2">
              <div
                ref={listRef}
                data-testid="deck-card-list"
                data-mode={virtualize? 'virtual' : (paginate? 'pagination':'plain')}
                data-rendered-count={visibleItems.length}
                data-expected-max={virtualize ? (Math.ceil(containerHeight / itemHeight) + 10) : visibleItems.length}
                onScroll={(e)=> { if(virtualize) setScrollTop((e.target as HTMLElement).scrollTop) }}
                className="card p-0 max-h-[75vh] overflow-auto divide-y divide-gray-200 dark:divide-gray-700 relative"
              >
                {loading && <div className="p-4 text-sm">Chargement...</div>}
                {!loading && filtered.length === 0 && <div className="p-6 text-center text-sm text-gray-500">Aucune carte</div>}
                {virtualize && (
                  <div style={{ height: topPadding }} aria-hidden />
                )}
                {visibleItems.map((c,localIdx)=> {
                  const globalIndex = virtualize ? startIndex + localIdx : (paginate ? page*PAGE_SIZE + localIdx : localIdx)
                  const selected = selectedIds.has(c.id!)
                  const isEditing = editingId === c.id
                  const isCurrent = globalIndex === selectedIndex
                  const ref = (virtualize && localIdx===0) ? firstItemRef : undefined
                  return (
                    <div
                      key={c.id}
                      data-idx={globalIndex}
                      ref={ref}
                      onClick={(e)=> { if((e.target as HTMLElement).tagName!=='INPUT') setSelectedIndex(globalIndex) }}
                      className={`px-3 py-2 cursor-pointer focus:outline-none ${isCurrent?'bg-blue-50 dark:bg-blue-900/30':'hover:bg-gray-50 dark:hover:bg-gray-800/60'}`}
                      style={virtualize ? { minHeight: itemHeight * 0.6 } : undefined}
                    >
                      <div className="flex items-start gap-3">
                        <div className="pt-0.5 flex flex-col items-center w-8 select-none">
                          <input type="checkbox" checked={selected} onChange={()=> toggleSelect(c.id!)} className="mt-0.5" />
                          <span className="text-[10px] text-gray-400 dark:text-gray-500">{globalIndex+1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          {!isEditing && (
                            <>
                              <div className="font-medium text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">{c.frontText}</div>
                              {showBack && <div className="mt-1 text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap break-words">{c.backText}</div>}
                            </>
                          )}
                          {isEditing && (
                            <div className="space-y-1">
                              <input value={editFront} onChange={e=> setEditFront(e.target.value)} className="w-full px-2 py-1 rounded border text-xs bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600" />
                              <textarea value={editBack} onChange={e=> setEditBack(e.target.value)} rows={2} className="w-full px-2 py-1 rounded border text-xs bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600" />
                              <div className="flex gap-2 text-xs mt-1">
                                <button onClick={(e)=> { e.stopPropagation(); saveEdit() }} className="px-2 py-0.5 rounded bg-green-600 text-white hover:bg-green-700">Sauver</button>
                                <button onClick={(e)=> { e.stopPropagation(); cancelEdit() }} className="px-2 py-0.5 rounded bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500">Annuler</button>
                              </div>
                            </div>
                          )}
                          {c.tags && c.tags.length>0 && !isEditing && (
                            <div className="mt-1 flex flex-wrap gap-1">{c.tags.slice(0,6).map(t=> <span key={t} className="px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-[10px] text-gray-600 dark:text-gray-300">{t}</span>)}</div>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 ml-2 pt-0.5">
                          {!isEditing && <button onClick={(e)=> { e.stopPropagation(); startEdit(c) }} className="text-[10px] px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">✎</button>}
                          {!isEditing && <button onClick={(e)=> { e.stopPropagation(); deleteCard(c.id!) }} className="text-[10px] px-1 py-0.5 rounded bg-red-500 text-white hover:bg-red-600">✖</button>}
                        </div>
                      </div>
                    </div>
                  )
                })}
                {virtualize && (
                  <div style={{ height: bottomPadding }} aria-hidden />
                )}
              </div>
              {paginate && (
                <div className="flex items-center justify-center gap-2 mt-3 text-xs">
                  <button disabled={page===0} onClick={()=> setPage(p=> Math.max(0,p-1))} className="px-2 py-1 rounded border disabled:opacity-40">Prev</button>
                  <span>Page {page+1}/{pageCount}</span>
                  <button disabled={page>=pageCount-1} onClick={()=> setPage(p=> Math.min(pageCount-1,p+1))} className="px-2 py-1 rounded border disabled:opacity-40">Next</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {studySelectionActive && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-200">Étude sélection ({studySelIndex+1}/{selectionArray.length})</div>
              <div className="flex gap-2 items-center">
                <button onClick={()=> setShowBack(b=>!b)} className="px-2 py-1 text-xs rounded bg-gray-200 dark:bg-gray-700">Flip</button>
                <button onClick={closeStudy} className="px-2 py-1 text-xs rounded bg-red-500 text-white">Fermer</button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6">
              {currentStudyCard ? (
                <div className="relative">
                  <div className="mb-4 text-center text-lg font-semibold text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">{currentStudyCard.frontText}</div>
                  {showBack && <div className="mt-4 p-4 rounded bg-gray-100 dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">{currentStudyCard.backText}</div>}
                </div>
              ) : (
                <div className="text-center text-sm text-gray-500">Aucune carte</div>
              )}
            </div>
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex gap-2">
                <button onClick={prevStudy} disabled={studySelIndex===0} className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 disabled:opacity-40">←</button>
                <button onClick={nextStudy} disabled={studySelIndex>=selectionArray.length-1} className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 disabled:opacity-40">→</button>
              </div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400">Esc fermer • Espace/Flip</div>
            </div>
          </div>
        </div>
      )}
    </FuturisticLayout>
  )
}

export default StudyServiceDeckPage
