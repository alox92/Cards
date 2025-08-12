import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { container } from '@/application/Container'
import { CARD_SERVICE_TOKEN, CardService } from '@/application/services/CardService'
import { eventBus } from '@/core/events/EventBus'

interface CardCreateDrawerProps { deckId: string | null; open: boolean; onClose: () => void }

export const CardCreateDrawer = ({ deckId, open, onClose }: CardCreateDrawerProps) => {
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string|null>(null)
  const cardService = container.resolve<CardService>(CARD_SERVICE_TOKEN)

  async function submit(){
    if(!deckId) return
    setLoading(true); setError(null)
    try {
      const card = await cardService.create(deckId, { frontText: front.trim(), backText: back.trim() })
      eventBus.publish({ type:'card.created', payload:{ cardId: card.id, deckId } })
      setFront(''); setBack('')
      onClose()
    } catch(e:any){ setError(e.message||'Erreur création') }
    finally { setLoading(false) }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-40 flex" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
          <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ x:360 }} animate={{ x:0 }} exit={{ x:360 }} transition={{ type:'spring', stiffness:220, damping:28 }} className="w-[360px] bg-white dark:bg-gray-900 h-full shadow-xl border-l border-gray-200 dark:border-gray-700 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Nouvelle carte {deckId && <span className="text-gray-400">(Deck {deckId})</span>}</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm">✕</button>
            </div>
            <div className="flex flex-col gap-3 overflow-y-auto">
              <textarea value={front} onChange={e=>setFront(e.target.value)} placeholder="Question / Recto" className="w-full text-sm p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 resize-none h-24" />
              <textarea value={back} onChange={e=>setBack(e.target.value)} placeholder="Réponse / Verso" className="w-full text-sm p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 resize-none h-32" />
              {error && <div className="text-xs text-red-500">{error}</div>}
            </div>
            <div className="mt-auto flex gap-2">
              <button onClick={onClose} className="flex-1 px-3 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs hover:bg-gray-300 dark:hover:bg-gray-600">Annuler</button>
              <button disabled={!front.trim() || !back.trim() || !deckId || loading} onClick={submit} className="flex-1 px-3 py-2 rounded bg-blue-600 text-white text-xs disabled:opacity-40 hover:bg-blue-500">{loading? 'Création…':'Créer'}</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default CardCreateDrawer
