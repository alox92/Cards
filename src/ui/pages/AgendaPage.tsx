import AgendaHeatmap from '@/ui/components/agenda/AgendaHeatmap'
import { useState } from 'react'

export default function AgendaPage() {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  return (
    <div className="p-6 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Agenda de Révision</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Visualisez la charge de cartes dues par jour (SM-2).</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={()=>setYear(y=>y-1)} className="btn-secondary px-3 py-1">◀</button>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-16 text-center">{year}</span>
            <button onClick={()=>setYear(y=>y+1)} className="btn-secondary px-3 py-1">▶</button>
            {year !== currentYear && (
              <button onClick={()=>setYear(currentYear)} className="btn-primary px-3 py-1 text-xs">Aujourd'hui</button>
            )}
          </div>
        </header>
        <AgendaHeatmap year={year} />
      </div>
    </div>
  )
}
