import React, { useEffect, useState } from 'react'
import { container } from '@/application/Container'
import { HEATMAP_STATS_SERVICE_TOKEN, HeatmapStatsService, DayHeat } from '@/application/services/HeatmapStatsService'

interface Props { days?: number }

// Simple heatmap grille (pas de lib externe pour MVP)
export const StudyHeatmap: React.FC<Props> = ({ days = 120 }) => {
  const service = container.resolve<HeatmapStatsService>(HEATMAP_STATS_SERVICE_TOKEN)
  const [data, setData] = useState<DayHeat[]>([])
  useEffect(() => { (async()=>{ try { setData(await service.getLastNDays(days)) } catch {/* ignore */} })() }, [service, days])
  if(!data.length) return <div className="text-xs text-gray-500 dark:text-gray-400">Chargement heatmap...</div>
  const max = Math.max(1, ...data.map(d=>d.reviews))
  return (
    <div>
      <div className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Activité (révisions / jour)</div>
      <div className="grid grid-cols-12 gap-1">
        {data.map(d => {
          const intensity = d.reviews / max
          const color = intensity === 0 ? 'bg-gray-200 dark:bg-gray-800' : intensity < 0.25 ? 'bg-green-200 dark:bg-green-900/40' : intensity < 0.5 ? 'bg-green-400 dark:bg-green-700' : intensity < 0.75 ? 'bg-green-500 dark:bg-green-600' : 'bg-green-600 dark:bg-green-500'
          return <div key={d.date} title={`${d.date}: ${d.reviews}`} className={`h-4 rounded ${color}`}></div>
        })}
      </div>
      <div className="mt-1 text-[10px] text-gray-500 dark:text-gray-400">{days} derniers jours</div>
    </div>
  )
}
export default StudyHeatmap
