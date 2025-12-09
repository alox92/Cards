import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, startOfWeek, endOfWeek, addMonths, subMonths } from 'date-fns'
import { fr } from 'date-fns/locale'
import Icons from '@/ui/components/common/Icons'

interface CalendarDayData {
  date: Date
  dueCards: number
  studiedCards: number
  newCards: number
}

interface CalendarViewProps {
  data: CalendarDayData[]
  onDayClick?: (date: Date) => void
  onStartStudy?: (date: Date) => void
  className?: string
}

type ViewMode = 'month' | 'week'

/**
 * Vue Calendrier pour la planification d'étude
 * Affiche les cartes dues par jour avec navigation mois/semaine
 */
export const CalendarView: React.FC<CalendarViewProps> = ({
  data,
  onDayClick,
  onStartStudy,
  className = ''
}) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Créer un map pour accès rapide aux données
  const dataMap = useMemo(() => {
    const map = new Map<string, CalendarDayData>()
    data.forEach(d => {
      const key = format(d.date, 'yyyy-MM-dd')
      map.set(key, d)
    })
    return map
  }, [data])

  // Calculer les jours à afficher
  const days = useMemo(() => {
    if (viewMode === 'month') {
      const monthStart = startOfMonth(currentDate)
      const monthEnd = endOfMonth(currentDate)
      const calStart = startOfWeek(monthStart, { locale: fr })
      const calEnd = endOfWeek(monthEnd, { locale: fr })
      return eachDayOfInterval({ start: calStart, end: calEnd })
    } else {
      const weekStart = startOfWeek(currentDate, { locale: fr })
      const weekEnd = endOfWeek(currentDate, { locale: fr })
      return eachDayOfInterval({ start: weekStart, end: weekEnd })
    }
  }, [currentDate, viewMode])

  // Obtenir les données d'un jour
  const getDayData = (date: Date): CalendarDayData | null => {
    const key = format(date, 'yyyy-MM-dd')
    return dataMap.get(key) || null
  }

  // Navigation
  const goToPreviousMonth = () => setCurrentDate(prev => subMonths(prev, 1))
  const goToNextMonth = () => setCurrentDate(prev => addMonths(prev, 1))
  const goToToday = () => setCurrentDate(new Date())

  // Handler click jour
  const handleDayClick = (date: Date) => {
    setSelectedDate(date)
    onDayClick?.(date)
  }

  // Obtenir la couleur selon le nombre de cartes dues
  const getDayColor = (dayData: CalendarDayData | null) => {
    if (!dayData || dayData.dueCards === 0) return 'bg-gray-50 dark:bg-gray-800'
    if (dayData.dueCards < 5) return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
    if (dayData.dueCards < 20) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
    return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
  }

  const selectedDayData = selectedDate ? getDayData(selectedDate) : null

  return (
    <div className={`calendar-view ${className}`}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousMonth}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <Icons.ChevronLeft size="md" />
            </button>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white min-w-[200px] text-center">
              {format(currentDate, 'MMMM yyyy', { locale: fr })}
            </h2>
            <button
              onClick={goToNextMonth}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <Icons.ChevronRight size="md" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              Aujourd'hui
            </button>

            <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 text-sm transition ${
                  viewMode === 'month'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                Mois
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1.5 text-sm transition ${
                  viewMode === 'week'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                Semaine
              </button>
            </div>
          </div>
        </div>

        {/* Légende */}
        <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800"></div>
            <span>1-4 cartes</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800"></div>
            <span>5-19 cartes</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800"></div>
            <span>20+ cartes</span>
          </div>
        </div>
      </div>

      {/* Grid Calendrier */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        {/* Jours de la semaine */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-600 dark:text-gray-400 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Jours du mois */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => {
            const dayData = getDayData(day)
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isTodayDate = isToday(day)
            const isSelected = selectedDate && format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')

            return (
              <motion.button
                key={index}
                onClick={() => handleDayClick(day)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`
                  relative aspect-square rounded-lg border-2 p-2 transition-all
                  ${getDayColor(dayData)}
                  ${!isCurrentMonth ? 'opacity-30' : ''}
                  ${isTodayDate ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800' : 'border-transparent'}
                  ${isSelected ? 'ring-4 ring-purple-300 dark:ring-purple-700' : ''}
                  hover:shadow-lg
                `}
              >
                <div className="flex flex-col h-full">
                  <div className={`text-sm font-medium ${isTodayDate ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                    {format(day, 'd')}
                  </div>
                  
                  {dayData && dayData.dueCards > 0 && (
                    <div className="mt-auto">
                      <div className="text-xs font-bold text-gray-900 dark:text-white">
                        {dayData.dueCards}
                      </div>
                      {dayData.studiedCards > 0 && (
                        <div className="text-[10px] text-green-600 dark:text-green-400">
                          ✓ {dayData.studiedCards}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Détails jour sélectionné */}
      <AnimatePresence>
        {selectedDate && selectedDayData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-4 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
              </h3>
              <button
                onClick={() => setSelectedDate(null)}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Icons.Settings size="sm" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {selectedDayData.dueCards}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Cartes dues</div>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {selectedDayData.studiedCards}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Étudiées</div>
              </div>
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {selectedDayData.newCards}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Nouvelles</div>
              </div>
            </div>

            {selectedDayData.dueCards > 0 && onStartStudy && (
              <button
                onClick={() => onStartStudy(selectedDate)}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition shadow-lg"
              >
                🚀 Commencer la session d'étude
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CalendarView
