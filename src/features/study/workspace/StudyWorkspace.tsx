import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import useDecksService from '@/ui/hooks/useDecksService'
import useDeckDerivedStats from '@/ui/hooks/useDeckDerivedStats'
import useServiceStudySession from '@/ui/hooks/useServiceStudySession'
import { useLocation } from 'react-router-dom'
import CardCreateDrawer from '@/ui/components/cards/CardCreateDrawer'

// Session orchestrator hook remplacé par useServiceStudySession (logique réelle)

// MVP skeleton Study Workspace (tri-colonnes adaptatif)
// TODO: intégrer data réelle (decks, session, stats) + shared transitions

export const StudyWorkspace = () => {
  const { decks, loading: decksLoading } = useDecksService()
  const location = useLocation()
  const [activeDeck, setActiveDeck] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(true)
  const [revealed, setRevealed] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  // Préférence focus
  useEffect(()=>{ try { if(localStorage.getItem('ariba.pref.autoFocusStudy')==='1') setFocusMode(true) } catch { /* ignore */ } }, [])
  const [showCreate, setShowCreate] = useState(false)
  // Hydrate depuis query param deck
  useEffect(()=>{
    const params = new URLSearchParams(location.search)
    const qDeck = params.get('deck')
    if(qDeck && qDeck !== activeDeck){ setActiveDeck(qDeck) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search])
  const session = useServiceStudySession({ deckId: activeDeck || undefined, dailyNewLimit: 15 })
  const activeDeckEntity = useMemo(()=> decks.find(d=>d.id===activeDeck), [decks, activeDeck])
  const derived = useDeckDerivedStats(activeDeck || undefined)

  // Audio + vibration simple
  const audioCtxRef = useRef<AudioContext|null>(null)
  const feedback = useCallback((quality:number)=>{ try {
    if(typeof window === 'undefined') return
    if(!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    const ctx = audioCtxRef.current
    const osc = ctx!.createOscillator(); const gain = ctx!.createGain()
    osc.type='sine'; osc.frequency.value = quality>=4?660: quality>=3?520: 330
    gain.gain.setValueAtTime(0.0001, ctx!.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.18, ctx!.currentTime+0.015)
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx!.currentTime+0.35)
    osc.connect(gain).connect(ctx!.destination); osc.start(); osc.stop(ctx!.currentTime+0.4)
    if('vibrate' in navigator) navigator.vibrate(quality>=3? 15 : [10,30,10])
  } catch {/* ignore */} },[])

  const spaceDownAt = useRef<number|null>(null)
  const spaceLongTriggered = useRef(false)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if(!session.currentCard || session.finished) return
    if(['Space','ArrowLeft','ArrowRight','ArrowUp','KeyF','Escape'].includes(e.code)) e.preventDefault()
  if(e.code==='KeyF'){ setFocusMode(f=>{ const v=!f; try { localStorage.setItem('ariba.pref.autoFocusStudy', v? '1':'0') } catch{}; return v }); return }
    if(e.code==='Escape' && focusMode){ setFocusMode(false); return }
    if(e.code==='Space') {
      if(spaceDownAt.current==null){ spaceDownAt.current = Date.now(); spaceLongTriggered.current=false }
      if(!revealed) setRevealed(true)
      return
    }
    if(e.code==='ArrowRight'){
      if(!revealed){ setRevealed(true); return }
      feedback(3); void session.answer(3); setRevealed(false)
    } else if(e.code==='ArrowLeft') {
      if(!revealed){ setRevealed(true); return }
      feedback(1); void session.answer(1); setRevealed(false)
    } else if(e.code==='ArrowUp') {
      if(!revealed){ setRevealed(true); return }
      feedback(4); void session.answer(4); setRevealed(false)
    }
  }, [session, revealed, feedback, focusMode])

  const handleKeyUp = useCallback((e: KeyboardEvent)=>{
    if(e.code==='Space'){
      const down = spaceDownAt.current; const dur = down? Date.now()-down:0
      spaceDownAt.current = null
      if(revealed && !spaceLongTriggered.current){
        if(dur>550){ spaceLongTriggered.current=true; feedback(3); void session.answer(3); setRevealed(false) }
        else { setRevealed(false) }
      }
    }
  }, [revealed, feedback, session])

  useEffect(()=>{ window.addEventListener('keydown', handleKeyDown); window.addEventListener('keyup', handleKeyUp); return ()=> { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp) } }, [handleKeyDown, handleKeyUp])

  return (
    <>
    <div className="h-full flex flex-col">
      <header className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center gap-4 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md">
        <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Workspace Étude</h1>
        {activeDeck && <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-300">Deck: {activeDeck}</span>}
        <div className="ml-auto flex gap-2">
          <button onClick={()=>setShowPreview(s=>!s)} className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition">{showPreview? 'Masquer preview':'Afficher preview'}</button>
          <button onClick={()=>setShowCreate(true)} disabled={!activeDeck} className="text-xs px-2 py-1 rounded bg-blue-600 text-white disabled:opacity-40 hover:bg-blue-500 transition">+ Carte</button>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        {/* Colonne Deck Explorer */}
        <aside className="w-64 shrink-0 border-r border-gray-200 dark:border-gray-800 overflow-y-auto p-3 hidden md:block" aria-label="Explorateur de decks">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] uppercase tracking-wide font-semibold text-gray-400">Decks</div>
            {decksLoading && <div className="animate-pulse text-[10px] text-gray-400">…</div>}
          </div>
          <ul className="space-y-1">
            {decks.map(d => (
              <li key={d.id}>
                <button onClick={()=>setActiveDeck(d.id)} className={`w-full group text-left px-2 py-1.5 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition flex items-center justify-between ${activeDeck===d.id ? 'bg-gray-200 dark:bg-gray-700 font-medium':''}`}>{d.name}
                  <span className="text-[10px] text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300 ml-2">{d.totalCards}</span>
                </button>
              </li>
            ))}
            {!decksLoading && decks.length===0 && (
              <li className="text-xs text-gray-400 px-2 py-1">Aucun deck</li>
            )}
          </ul>
        </aside>
        {/* Zone centrale carte */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <motion.div layoutId={activeDeck ? `deck-${activeDeck}`: undefined} layout className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm min-h-[240px] flex flex-col items-center justify-center text-gray-500 text-sm relative">
            {!activeDeck && <p className="mt-2 text-xs text-gray-400">Sélectionnez un deck pour commencer.</p>}
            {activeDeck && (
              <div className="text-center space-y-2">
                <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-100">{activeDeckEntity?.name}</h2>
                <div className="flex gap-3 text-[11px] text-gray-400">
                  <span>Due {derived.loading ? '…' : derived.dueCards}</span>
                  <span>New {derived.loading ? '…' : derived.newCards}</span>
                  <span>Mature {derived.loading ? '…' : derived.mature}</span>
                </div>
                {!session.session && (
                  <button disabled={!activeDeck || session.loading} onClick={()=>{ session.rebuild(); setRevealed(false) }} className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-xs hover:bg-blue-500 disabled:opacity-50 transition">
                    {session.loading? 'Préparation…':'Démarrer session'}
                  </button>
                )}
                {session.session && !session.finished && session.currentCard && (
                  <div className="flex flex-col items-center gap-4">
                    <FlipStudyCard front={session.currentCard.frontText} back={session.currentCard.backText} revealed={revealed} onToggle={()=>setRevealed(r=>!r)} focus={focusMode} />
                    <div className="flex gap-2 justify-center">
                      <button disabled={session.answering} onClick={()=>{ feedback(4); void session.answer(4); setRevealed(false) }} className="px-3 py-1.5 rounded-md bg-emerald-600 text-white text-xs hover:bg-emerald-500 disabled:opacity-40 transition" title="↑ après flip">Facile</button>
                      <button disabled={session.answering} onClick={()=>{ feedback(3); void session.answer(3); setRevealed(false) }} className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-xs hover:bg-blue-500 disabled:opacity-40 transition" title="→ après flip / Space long">Bien</button>
                      <button disabled={session.answering} onClick={()=>{ feedback(1); void session.answer(1); setRevealed(false) }} className="px-3 py-1.5 rounded-md bg-amber-600 text-white text-xs hover:bg-amber-500 disabled:opacity-40 transition" title="← après flip">Difficile</button>
                    </div>
                    <div className="text-[10px] text-gray-400">Space: flip (long &gt;550ms = Bien) · ↑ Facile · ← Difficile · → Bien · F Focus</div>
                  </div>
                )}
                {session.finished && (
                  <button onClick={()=>session.rebuild()} className="px-3 py-1.5 rounded-md bg-purple-600 text-white text-xs hover:bg-purple-500 transition">Rejouer</button>
                )}
              </div>
            )}
          </motion.div>
          {showPreview && (
            <motion.div layout className="grid lg:grid-cols-3 gap-4">
              {session.finished && (
                <div className="h-24 rounded-lg border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-xs text-green-700 dark:text-green-300 font-medium">Session terminée</div>
              )}
            </motion.div>
          )}
        </main>
        {/* Panneau stats session */}
        <aside className="w-72 shrink-0 border-l border-gray-200 dark:border-gray-800 overflow-y-auto p-4 hidden lg:block">
          <div className="text-[11px] uppercase tracking-wide font-semibold text-gray-400 mb-3">Session</div>
          <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-center">
                <div className="text-[10px] text-gray-400 mb-1 uppercase tracking-wide">Progress</div>
        <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">{session.session ? (session.session.cardsStudied ? Math.round((session.session.cardsStudied / (session.session.cardsStudied + session.remaining))*100) : 0) : 0}%</div>
              </div>
              <div className="p-3 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-center">
                <div className="text-[10px] text-gray-400 mb-1 uppercase tracking-wide">Accuracy</div>
        <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">{session.session ? (session.session.cardsStudied ? Math.round((session.session.correctAnswers / session.session.cardsStudied)*100) : 0) : '—'}%</div>
              </div>
              <div className="p-3 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-center">
                <div className="text-[10px] text-gray-400 mb-1 uppercase tracking-wide">Due</div>
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">{derived.loading ? '…' : derived.dueCards}</div>
              </div>
              <div className="p-3 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-center">
                <div className="text-[10px] text-gray-400 mb-1 uppercase tracking-wide">New</div>
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">{derived.loading ? '…' : derived.newCards}</div>
              </div>
          </div>
          <div className="text-[11px] uppercase tracking-wide font-semibold text-gray-400 mb-2">Actions</div>
          <div className="flex flex-col gap-2">
      {!session.session && <button disabled={!activeDeck || session.loading} onClick={()=>session.rebuild()} className="px-3 py-2 rounded-md bg-blue-600 text-white text-xs hover:bg-blue-500 disabled:opacity-50 transition">Préparer</button>}
      {session.session && !session.finished && <button disabled={session.answering || !session.currentCard} onClick={()=>session.answer(4)} className="px-3 py-2 rounded-md bg-blue-600 text-white text-xs hover:bg-blue-500 disabled:opacity-40 transition">Répondre (Facile)</button>}
      {session.session && !session.finished && <button disabled={session.answering || !session.currentCard} onClick={()=>session.answer(1)} className="px-3 py-2 rounded-md bg-amber-500 text-white text-xs hover:bg-amber-400 disabled:opacity-40 transition">Répondre (Diff.)</button>}
      {session.finished && <button onClick={()=>session.rebuild()} className="px-3 py-2 rounded-md bg-purple-600 text-white text-xs hover:bg-purple-500 transition">Relancer</button>}
          </div>
        </aside>
      </div>
  </div>
  <CardCreateDrawer deckId={activeDeck} open={showCreate} onClose={()=>setShowCreate(false)} />
  {focusMode && session.currentCard && createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center">
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.9 }} className="relative z-10 flex flex-col items-center gap-6">
        <FlipStudyCard front={session.currentCard.frontText} back={session.currentCard.backText} revealed={revealed} onToggle={()=>setRevealed(r=>!r)} focus />
        <div className="flex gap-3">
          <button onClick={()=> setFocusMode(false)} className="px-3 py-1.5 rounded-md bg-gray-700 text-white text-xs hover:bg-gray-600">Fermer (Esc)</button>
        </div>
        <div className="text-[10px] text-gray-300">Esc / F quitter · Space flip</div>
      </motion.div>
    </div>, document.body)
  }
  </>
  )
}

export default StudyWorkspace

// Carte flip 3D contrôlée par revealed
const FlipStudyCard = ({ front, back, revealed, onToggle, focus }: { front:string; back:string; revealed:boolean; onToggle:()=>void; focus?:boolean }) => {
  return (
    <div className={"relative select-none " + (focus? 'w-[min(80vw,900px)] h-[420px] mx-auto':'w-72 h-44')} style={{ perspective:'1200px' }}>
      <button onClick={onToggle} className="absolute inset-0 w-full h-full group [transform-style:preserve-3d] transition-transform duration-500 will-change-transform" style={{ transform: revealed? 'rotateY(180deg)':'rotateY(0deg)' }}>
        <div className="absolute inset-0 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 flex flex-col items-center justify-center p-4 text-center text-sm font-medium text-gray-700 dark:text-gray-200 [backface-visibility:hidden] shadow-md group-active:scale-[.98]">
          <div className={focus? 'text-lg leading-snug whitespace-pre-wrap break-words max-h-full overflow-y-auto custom-scroll':'line-clamp-5 leading-snug'}>{front}</div>
          <div className="absolute bottom-2 right-2 text-[10px] text-gray-400">Espace ↺</div>
        </div>
        <div className="absolute inset-0 rounded-xl border border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 flex flex-col items-center justify-center p-4 text-center text-sm font-medium text-indigo-800 dark:text-indigo-200 [backface-visibility:hidden] shadow-md rotate-y-180">
          <div className={focus? 'text-lg leading-snug whitespace-pre-wrap break-words max-h-full overflow-y-auto custom-scroll':'line-clamp-5 leading-snug'}>{back}</div>
          <div className="absolute bottom-2 right-2 text-[10px] text-indigo-400">← / →</div>
        </div>
      </button>
    </div>
  )
}
