import React, { useMemo, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import useDecksService from '@/ui/hooks/useDecksService'
import { container } from '@/application/Container'
import { DECK_SERVICE_TOKEN, DeckService } from '@/application/services/DeckService'
import { CARD_SERVICE_TOKEN, CardService } from '@/application/services/CardService'
import FuturisticLayout from '@/ui/components/layout/FuturisticLayout'
import { useFeedback } from '@/ui/components/feedback/FeedbackCenter'

const DecksPage: React.FC = () => {
  const navigate = useNavigate()
  const { decks, loading, error, refresh } = useDecksService()
  const [cardsLoading, setCardsLoading] = useState(false)
  const [cardsCount, setCardsCount] = useState(0)
  useEffect(()=>{ (async()=>{ try { setCardsLoading(true); let total = 0; try { const cardSvc = container.resolve<CardService>(CARD_SERVICE_TOKEN); total = await cardSvc.countAll() } catch { /* repo may not support yet */ } setCardsCount(total) } finally { setCardsLoading(false) } })() },[])
  const { play } = useFeedback()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newDeckName, setNewDeckName] = useState('')
  const [newDeckDescription, setNewDeckDescription] = useState('')

  const handleDeckClick = (deck: any) => {
    play('click')
    navigate(`/deck/${deck.id}/cards`)
  }
  const handleCreateDeck = async () => {
    if(!newDeckName.trim()) return
    const svc = container.resolve<DeckService>(DECK_SERVICE_TOKEN)
    await svc.createDeck({ name: newDeckName.trim(), description: newDeckDescription.trim(), color: '#3B82F6', icon: '📚', tags: [], isPublic: false })
    setShowCreateModal(false)
    setNewDeckName('')
    setNewDeckDescription('')
    refresh()
  }

  const animatedDecks = useMemo(() => decks, [decks])

  const cardVariants = {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: (i: number) => ({ opacity: 1, y: 0, scale: 1, transition: { delay: i * 0.045, duration: 0.5, ease: 'easeOut' } }),
    exit: { opacity: 0, y: -10, scale: 0.9, transition: { duration: 0.25 } }
  }

  return (
    <FuturisticLayout>
  <div className="min-h-screen bg-transparent p-6">
      <div className="max-w-7xl mx-auto relative">
        <div className="mb-10 text-center">
          <motion.h1
            className="text-4xl font-extrabold tracking-tight mb-3 bg-clip-text text-transparent bg-gradient-to-r from-[var(--dyn-accent)] via-fuchsia-500 to-[var(--dyn-accent-soft)] drop-shadow"
            initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.7 }}
          >
            📚 Mes Paquets
          </motion.h1>
          <motion.p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
            initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.35 }}
          >
            Gérez, organisez et explorez vos collections de cartes optimisées par l'IA (SM‑2 & Learning System)
          </motion.p>
        </div>
        {(loading || cardsLoading) && (
          <div className="flex items-center gap-3 mb-4 text-xs">
            {loading && <span className="px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 animate-pulse">Decks...</span>}
            {cardsLoading && <span className="px-2 py-1 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 animate-pulse">Cartes...</span>}
          </div>
        )}
    {!loading && !cardsLoading && (
          <div className="flex items-center gap-4 mb-4 text-xs text-gray-500 dark:text-gray-400">
            <span className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700">{decks.length} decks</span>
      <span className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700">{cardsCount>0?cardsCount:'—'} cartes</span>
          </div>
        )}
        {error && <div className="text-sm text-red-500 mb-4">{error}</div>}
    {(!loading && decks.length === 0) ? (
          <motion.div className="card relative overflow-hidden" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-fuchsia-500/5 to-purple-600/5 opacity-0 hover:opacity-100 transition-opacity" />
            <div className="text-center py-14 relative z-10">
              <div className="text-7xl mb-4 animate-pulse">📚</div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Aucun paquet trouvé</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6">Cliquez sur le bouton ci-dessous pour créer votre premier paquet. Des données de démo devraient aussi s'initialiser automatiquement.</p>
              <button className="btn-primary" onClick={() => setShowCreateModal(true)}>✨ Créer un paquet</button>
            </div>
          </motion.div>
        ) : (
          <AnimatePresence mode="sync">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {animatedDecks.map((deck, i) => (
              <motion.div
                layout
                key={deck.id}
                custom={i}
                variants={cardVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                whileHover={{ y:-6, rotate:0.4 }}
                whileTap={{ scale:0.97 }}
                onClick={() => handleDeckClick(deck)}
                className="relative group cursor-pointer p-5 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur border border-gray-200/60 dark:border-gray-700/50 shadow-sm hover:shadow-xl transition-all overflow-hidden"
                style={{ '--deck-color': deck.color } as any}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-[var(--dyn-accent-soft,rgba(99,102,241,0.15))] via-fuchsia-500/10 to-purple-600/20" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl drop-shadow-sm">{deck.icon || '📘'}</span>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight group-hover:text-[var(--dyn-accent)] transition-colors">{deck.name}</h3>
                    </div>
                    <span className="w-3.5 h-3.5 rounded-full ring-2 ring-white/60 dark:ring-gray-900/60 shadow" style={{ backgroundColor: deck.color }} />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3 min-h-[48px]">{deck.description || 'Aucune description'}</p>
                  <div className="flex justify-between text-xs font-medium text-gray-500 dark:text-gray-400">
                    <span>{deck.totalCards} cartes</span>
                    <span>{deck.masteredCards} maîtrisées</span>
                  </div>
                  <div className="flex gap-2 mt-5">
                    <button
                      onClick={(e) => { e.stopPropagation(); play('click'); navigate(`/deck/${deck.id}/cards`) }}
                      className="flex-1 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors"
                    >🗂️ Cartes</button>
                    <button
                      onClick={(e) => { e.stopPropagation(); play('success'); navigate(`/workspace/study?deck=${deck.id}`) }}
                      className="flex-1 py-2 text-sm rounded-lg text-center bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium shadow hover:from-emerald-500 hover:to-teal-500 focus:outline-none focus:ring-2 focus:ring-[var(--dyn-accent)]"
                    >⚡ Étudier</button>
                  </div>
                </div>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-[var(--dyn-accent-soft,rgba(99,102,241,0.15))] blur-2xl opacity-40 group-hover:opacity-70 transition-opacity" />
              </motion.div>
            ))}
            <motion.div
              key="add-card"
              onClick={() => { setShowCreateModal(true); play('click') }}
              className="group relative flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-[var(--dyn-accent)] dark:hover:border-[var(--dyn-accent)] cursor-pointer text-center min-h-[230px] overflow-hidden"
              initial={{ opacity:0, scale:0.9 }}
              animate={{ opacity:1, scale:1 }}
              whileHover={{ scale:1.04 }}
              whileTap={{ scale:0.95 }}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-[var(--dyn-accent-soft,rgba(99,102,241,0.15))] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="text-5xl mb-3 text-gray-400 group-hover:text-[var(--dyn-accent)] transition-colors">➕</div>
                <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300 group-hover:text-[var(--dyn-accent)] transition-colors">Nouveau paquet</h3>
              </div>
            </motion.div>
          </div>
          </AnimatePresence>
        )}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Créer un nouveau paquet</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nom du paquet</label>
                  <input type="text" value={newDeckName} onChange={e => setNewDeckName(e.target.value)} placeholder="Ex: Vocabulaire Anglais" className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" autoFocus />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description (optionnelle)</label>
                  <textarea value={newDeckDescription} onChange={e => setNewDeckDescription(e.target.value)} rows={3} placeholder="Décrivez le contenu de ce paquet..." className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white">Annuler</button>
                <button onClick={handleCreateDeck} disabled={!newDeckName.trim()} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">Créer le paquet</button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
      {/* FABs */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-40">
        <button onClick={()=> setShowCreateModal(true)} className="shadow-lg rounded-full h-14 w-14 bg-gradient-to-br from-indigo-600 to-fuchsia-600 text-white text-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition" title="Créer un paquet">📚</button>
        {decks.length>0 && <button onClick={()=> navigate('/create')} className="shadow-lg rounded-full h-14 w-14 bg-gradient-to-br from-emerald-600 to-teal-600 text-white text-3xl flex items-center justify-center hover:scale-105 active:scale-95 transition" title="Créer une carte">＋</button>}
      </div>
    </div>
    </FuturisticLayout>
  )
}

export default DecksPage
