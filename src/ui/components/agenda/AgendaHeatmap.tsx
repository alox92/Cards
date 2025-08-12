import { useEffect, useState, useMemo } from 'react'
import { container } from '@/application/Container'
import { AGENDA_SCHEDULER_TOKEN, AgendaScheduler, DaySchedule } from '@/application/services/AgendaScheduler'
import { motion } from 'framer-motion'

interface AgendaHeatmapProps { year?: number; className?: string }

function intensityColor(count: number, max: number): string {
  if (count === 0) return 'var(--heatmap-empty, #e5e7eb)'
  const ratio = Math.min(1, count / (max || 1))
  const start = [191, 219, 254]
  const end = [30, 64, 175]
  const mix = start.map((s, i) => Math.round(s + (end[i] - s) * ratio))
  return `rgb(${mix[0]}, ${mix[1]}, ${mix[2]})`
}

export default function AgendaHeatmap({ year = new Date().getFullYear(), className = '' }: AgendaHeatmapProps) {
  const scheduler = container.resolve<AgendaScheduler>(AGENDA_SCHEDULER_TOKEN)
  const [data, setData] = useState<DaySchedule[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true); setError(null)
    scheduler.yearlyHeatmap()
      .then(res => setData(res.filter(d => d.day.startsWith(String(year)))))
      .catch(e => setError(e.message || 'Erreur agenda'))
      .finally(() => setLoading(false))
  }, [scheduler, year])

  const byDay = useMemo(() => { const map = new Map<string, number>(); data.forEach(d => map.set(d.day, d.due)); return map }, [data])
  const max = useMemo(() => data.reduce((m, d) => Math.max(m, d.due), 0), [data])

  const days: string[] = useMemo(() => { const arr: string[] = []; const start = new Date(year, 0, 1); const end = new Date(year + 1, 0, 1); for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) { arr.push(d.toISOString().slice(0, 10)) } return arr }, [year])

  if (loading) return <div className="p-4 text-sm text-gray-500">Chargement agenda...</div>
  if (error) return <div className="p-4 text-sm text-red-500">{error}</div>

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Agenda {year}</h2>
        <div className="text-xs text-gray-500 dark:text-gray-400">Cartes dues / jour</div>
      </div>
      <div className="grid grid-cols-53 gap-1 overflow-x-auto" style={{ gridAutoRows: '14px' }}>
        {days.map(day => { const count = byDay.get(day) || 0; return (
          <motion.div key={day} className="rounded-sm cursor-pointer group relative" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ background: intensityColor(count, max) }} title={`${day}: ${count} due`} whileHover={{ scale: 1.4, zIndex: 10 }}>
            <div className="hidden group-hover:block absolute bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] bg-gray-900 text-white px-2 py-1 rounded shadow">{day} • {count} carte{count>1?'s':''}</div>
          </motion.div>) })}
      </div>
      <div className="flex items-center space-x-1 text-[10px] text-gray-500 dark:text-gray-400">
        <span>Faible</span>
        {[0,0.25,0.5,0.75,1].map(r => (<span key={r} className="w-4 h-4 rounded-sm" style={{ background: intensityColor(r*max, max) }} />))}
        <span>Élevé</span>
      </div>
    </div>
  )
}
