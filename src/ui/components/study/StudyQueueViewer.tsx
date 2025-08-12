import { motion, AnimatePresence } from 'framer-motion'
import { useStudyQueue } from '@/ui/hooks/useStudyQueue'
import { useState } from 'react'

export function StudyQueueViewer({ deckId }: { deckId: string }) {
  const { queue, loading, error, record } = useStudyQueue({ deckId, dailyNewLimit: 15 })
  const [startTime, setStartTime] = useState<number>(Date.now())

  if (loading) return <div className="text-sm text-gray-500">Préparation de la session...</div>
  if (error) return <div className="text-sm text-red-500">{error}</div>
  if (!queue.length) return <div className="text-sm text-emerald-600">Plus de cartes pour l'instant 🎉</div>

  const current = queue[0]

  const answer = async (quality: number) => {
    const elapsed = Date.now() - startTime
    await record(current, quality, elapsed)
    setStartTime(Date.now())
  }

  return (
    <div className="relative w-full max-w-md">
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
            initial={{ opacity: 0, y: 30, rotateX: 25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, rotateX: -15, scale: 0.9 }}
            transition={{ duration: 0.38, ease: [0.16,0.84,0.44,1], rotateX: { type: 'spring', stiffness: 120 } }}
            className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-6 border border-gray-200 dark:border-gray-700 backdrop-blur will-change-transform"
        >
          <div className="text-xs uppercase tracking-wider text-indigo-500 mb-2 font-medium">Carte ({queue.length})</div>
          <div className="font-semibold text-gray-900 dark:text-gray-100 text-lg mb-4 whitespace-pre-line">{current.frontText}</div>
          <div className="flex gap-2 mt-4 flex-wrap">
            {[0,1,2,3,4,5].map(q => (
              <button
                key={q}
                onClick={() => answer(q)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors outline-none focus:ring-2 focus:ring-indigo-500/40 ${q<3?'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200':'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'} hover:brightness-110`}
              >{q}</button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default StudyQueueViewer
