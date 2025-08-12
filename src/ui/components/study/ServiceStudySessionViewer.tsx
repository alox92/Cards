import { motion, AnimatePresence } from 'framer-motion'
import useServiceStudySession from '@/ui/hooks/useServiceStudySession'

export function ServiceStudySessionViewer({ deckId }: { deckId: string }) {
  const { loading, error, currentCard, remaining, answer, finished, session } = useServiceStudySession({ deckId })

  if(finished){
    // Déclenche un rafraîchissement global (événement idempotent car composant re-rendu une seule fois en état fini)
    if(typeof window !== 'undefined') {
      setTimeout(() => window.dispatchEvent(new Event('ariba:session-finished')), 0)
    }
  }

  if(loading) return <div className="text-sm text-gray-500">Préparation…</div>
  if(error) return <div className="text-sm text-red-500">{error}</div>
  if(finished) return (
    <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
      <div className="text-emerald-700 dark:text-emerald-300 font-medium mb-1">Session terminée</div>
      <div className="text-xs text-gray-600 dark:text-gray-400">{session?.cardsStudied} cartes étudiées – {(session && session.cardsStudied)? Math.round((session.correctAnswers/session.cardsStudied)*100):0}% réussite</div>
    </div>
  )
  if(!currentCard) return <div className="text-sm text-indigo-600">Aucune carte à étudier 🎉</div>

  return (
    <div className="relative w-full max-w-md">
      <AnimatePresence mode="wait">
        <motion.div key={currentCard.id}
          initial={{ opacity: 0, y: 30, rotateX: 25, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, rotateX: -15, scale: 0.9 }}
          transition={{ duration: 0.38, ease: [0.16,0.84,0.44,1], rotateX: { type: 'spring', stiffness: 120 } }}
          className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-6 border border-gray-200 dark:border-gray-700 backdrop-blur">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs uppercase tracking-wider text-indigo-500 font-medium">Carte</div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400">Restantes: {remaining}</div>
          </div>
          <div className="font-semibold text-gray-900 dark:text-gray-100 text-lg mb-4 whitespace-pre-line">{currentCard.frontText}</div>
          <div className="flex gap-2 mt-4 flex-wrap">
            {[0,1,2,3,4,5].map(q => (
              <button key={q} onClick={() => answer(q)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors outline-none focus:ring-2 focus:ring-indigo-500/40 ${q<3?'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200':'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'} hover:brightness-110`}>{q}</button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default ServiceStudySessionViewer
