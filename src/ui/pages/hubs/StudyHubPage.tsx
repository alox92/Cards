import { useEffect, useMemo, useState } from 'react'
import FuturisticLayout from '@/ui/components/layout/FuturisticLayout'
import { StaggerContainer, StaggerItem } from '@/ui/components/animations/micro'
import useDecksService from '@/ui/hooks/useDecksService'
import useGlobalStats from '@/ui/hooks/useGlobalStats'
import { useNavigate } from 'react-router-dom'
import { Skeleton } from '@/ui/components/common/Skeleton'
import { motion } from 'framer-motion'
import useDeckDerivedStats from '@/ui/hooks/useDeckDerivedStats'
import { container } from '@/application/Container'
import { DECK_SERVICE_TOKEN, DeckService } from '@/application/services/DeckService'
import CardCreateDrawer from '@/ui/components/cards/CardCreateDrawer'

/**
 * StudyHubPage (Phase 2) – Point d'entrée unifié apprentissage.
 * Objectifs:
 *  - Reprendre une session (future: session persistée)
 *  - Accès rapide: Étudier, Revoir (spaced repetition), Ajouter carte.
 *  - Aperçu stats globales + streak.
 *  - Suggestions (placeholder IA / adaptation) – à brancher plus tard.
 */
export default function StudyHubPage(){
  const { decks, loading: decksLoading, refresh: refreshDecks } = useDecksService()
  const { stats, loading: statsLoading, refresh } = useGlobalStats(45000)
  const navigate = useNavigate()
  const [filter, setFilter] = useState('')
  const deckService = container.resolve<DeckService>(DECK_SERVICE_TOKEN)
  // État création deck
  const [createDeckOpen, setCreateDeckOpen] = useState(false)
  const [newDeckName, setNewDeckName] = useState('')
  const [newDeckIcon, setNewDeckIcon] = useState('📘')
  const [newDeckDesc, setNewDeckDesc] = useState('')
  const [creatingDeck, setCreatingDeck] = useState(false)
  const [deckError, setDeckError] = useState<string|null>(null)
  // Drawer création carte rapide
  const [cardDrawerDeckId, setCardDrawerDeckId] = useState<string|null>(null)

  const filteredDecks = useMemo(()=> decks.filter(d => !filter.trim() || d.name.toLowerCase().includes(filter.toLowerCase())), [decks, filter])

  useEffect(()=>{ /* prefetch simple: rien pour l'instant */ },[])

  return (
    <FuturisticLayout>
      <div className="min-h-screen p-6 pb-24">
        <div className="max-w-7xl mx-auto">
          <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-10">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">🎯 Hub d'Apprentissage</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Centralisez vos sessions, créez des cartes et visualisez votre progression.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={()=>refresh()} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-sm">↻ Rafraîchir stats</button>
              <button onClick={()=>navigate('/decks')} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm">📚 Gérer Paquets</button>
              <button onClick={()=>navigate('/stats')} className="px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700 text-sm">📊 Statistiques</button>
            </div>
          </header>

      {/* Stats globales */}
          <section className="mb-12">
            {statsLoading && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_,i)=>(<Skeleton key={i} className="h-24 rounded-xl" />))}
              </div>
            )}
            {stats && !statsLoading && (
              <StaggerContainer>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StaggerItem><StatCard label="Cartes" value={stats.totalCards} icon="🗂️" trend={stats.newCardsToday + ' nv. ajd'} /></StaggerItem>
                  <StaggerItem><StatCard label="Révisions" value={stats.reviewsToday} icon="🔁" trend={stats.dueTomorrow + ' demain'} /></StaggerItem>
                  <StaggerItem><StatCard label="Précision" value={Math.round(stats.accuracy*100)+'%'} icon="🎯" trend={Math.round(stats.avgSessionAccuracy*100)+'% sess.'} /></StaggerItem>
                  <StaggerItem><StatCard label="À réviser" value={stats.dueToday} icon="⏱️" trend={stats.currentStreak + ' streak'} /></StaggerItem>
                </div>
              </StaggerContainer>
            )}
          </section>

          {/* Barre de filtre + actions rapides */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Filtrer un paquet..." className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm w-full md:w-72" />
            <div className="flex gap-3 flex-wrap">
              <button onClick={()=>navigate('/study-service')} className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 text-sm">⚡ Étude Rapide</button>
              <button onClick={()=>navigate('/study')} className="px-4 py-2 rounded bg-amber-600 text-white hover:bg-amber-700 text-sm">🧠 Session Legacy</button>
        <button onClick={()=> setCreateDeckOpen(true)} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm">➕ Nouveau Paquet</button>
            </div>
          </div>

          {/* Liste decks */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Paquets ({filteredDecks.length})</h2>
              <button onClick={()=>navigate('/decks')} className="text-xs px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">Tout voir</button>
            </div>
            {decksLoading && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {Array.from({length:8}).map((_,i)=>(<Skeleton key={i} className="h-40 rounded-xl" />))}
              </div>
            )}
            {!decksLoading && filteredDecks.length===0 && (
              <div className="p-10 text-center rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
                <div className="text-5xl mb-2">📭</div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Aucun paquet trouvé.</p>
              </div>
            )}
            {!decksLoading && filteredDecks.length>0 && (
              <StaggerContainer>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {filteredDecks.slice(0,12).map(deck => (
                    <StaggerItem key={deck.id}>
                      <DeckCard deck={deck} onClick={() => navigate(`/deck/${deck.id}/cards`)} onQuickAddCard={(id)=> setCardDrawerDeckId(id)} />
                    </StaggerItem>
                  ))}
                </div>
              </StaggerContainer>
            )}
          </section>
          {/* Drawer création carte rapide */}
          <CardCreateDrawer deckId={cardDrawerDeckId} open={!!cardDrawerDeckId} onClose={()=> { setCardDrawerDeckId(null); refreshDecks() }} />
          {/* Modal création deck */}
          {createDeckOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={()=>!creatingDeck && setCreateDeckOpen(false)} />
              <div className="relative w-full max-w-md mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Nouveau Paquet</h3>
                  <button disabled={creatingDeck} onClick={()=> setCreateDeckOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm">✕</button>
                </div>
                <input value={newDeckName} onChange={e=>setNewDeckName(e.target.value)} placeholder="Nom" className="px-3 py-2 rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-sm" />
                <input value={newDeckIcon} onChange={e=>setNewDeckIcon(e.target.value)} placeholder="Icône (emoji)" className="px-3 py-2 rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-sm" />
                <textarea value={newDeckDesc} onChange={e=>setNewDeckDesc(e.target.value)} placeholder="Description" className="px-3 py-2 rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-sm resize-none h-24" />
                {deckError && <div className="text-xs text-red-500">{deckError}</div>}
                <div className="flex gap-2 mt-2">
                  <button disabled={creatingDeck} onClick={()=> setCreateDeckOpen(false)} className="flex-1 px-3 py-2 rounded bg-gray-200 dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600">Annuler</button>
                  <button disabled={!newDeckName.trim() || creatingDeck} onClick={async ()=>{
                    setCreatingDeck(true); setDeckError(null)
                    try { await deckService.createDeck({ name: newDeckName.trim(), description: newDeckDesc.trim(), icon: newDeckIcon || '📘' } as any); setCreateDeckOpen(false); setNewDeckName(''); setNewDeckDesc(''); refreshDecks() } catch(e:any){ setDeckError(e.message||'Erreur création deck') } finally { setCreatingDeck(false) }
                  }} className="flex-1 px-3 py-2 rounded bg-blue-600 text-white text-xs disabled:opacity-40 hover:bg-blue-500">{creatingDeck?'Création…':'Créer'}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </FuturisticLayout>
  )
}

interface StatCardProps { label: string; value: number | string; icon: string; trend?: string }
const StatCard = ({ label, value, icon, trend }: StatCardProps) => (
  <motion.div layout whileHover={{ y:-3 }} className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
    <div className="flex items-center justify-between mb-2">
      <span className="text-lg" role="img" aria-label="icon">{icon}</span>
      {trend && <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-medium">{trend}</span>}
    </div>
    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1 tabular-nums">{value}</div>
    <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</div>
  </motion.div>
)

interface DeckCardProps { deck: any; onClick: () => void; onQuickAddCard: (deckId:string)=>void }
const DeckCard = ({ deck, onClick, onQuickAddCard }: DeckCardProps) => {
  const { dueCards, newCards, mature, loading } = useDeckDerivedStats(deck.id)
  const hasDue = !loading && dueCards > 0
  return (
  <motion.div layoutId={`deck-${deck.id}`} className={`relative w-full p-4 rounded-xl bg-white dark:bg-gray-800 border ${hasDue ? 'border-amber-400 dark:border-amber-500 ring-1 ring-amber-400/40' : 'border-gray-200 dark:border-gray-700'} hover:border-blue-500/60 transition-colors shadow-sm`}>
    <button onClick={onClick} className="absolute inset-0 w-full h-full rounded-xl focus:outline-none" aria-label={`Ouvrir ${deck.name}`} />
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl" role="img" aria-label="icon">{deck.icon || '📘'}</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-medium">{deck.totalCards} cartes</span>
          <button onClick={(e)=>{ e.stopPropagation(); e.preventDefault(); onQuickAddCard(deck.id) }} title="Ajouter une carte" className="relative z-10 text-xs px-2 py-0.5 rounded bg-blue-600 text-white hover:bg-blue-500 focus:outline-none">＋</button>
        </div>
      </div>
      <div className="font-semibold text-gray-800 dark:text-gray-100 truncate mb-1">{deck.name}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 min-h-[32px]">{deck.description || '—'}</div>
      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-gray-400 dark:text-gray-500">
        <span>Maîtrisées {deck.masteredCards}</span>
        <span>Due {loading ? '…' : dueCards}</span>
        <span>Nouv. {loading ? '…' : newCards}</span>
        <span>Matures {loading ? '…' : mature}</span>
      </div>
      {hasDue && (
        <span className="absolute -top-1 -right-1 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-semibold shadow">{dueCards}</span>
      )}
    </motion.div>
  )
}
