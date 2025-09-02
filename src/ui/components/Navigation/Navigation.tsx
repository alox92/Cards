import { useState, useCallback, useMemo, memo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MOTION_VARIANTS, PERFORMANCE_STYLES } from '@/utils/performanceOptimizer'
import { groupedRoutes, primaryNavigationOrder } from '@/ui/routes/routeConfig'
import { StaggerContainer, StaggerItem } from '@/ui/components/animations/micro'

interface NavigationProps {
  onThemeToggle: () => void
  currentTheme: 'light' | 'dark'
  onCollapseChange?: (collapsed: boolean) => void
}

const Navigation = memo(({ onThemeToggle, currentTheme, onCollapseChange }: NavigationProps) => {
  const location = useLocation()
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Memoize menu groups computation to avoid recalculation
  const menuGroups = useMemo(() => 
    primaryNavigationOrder
      .filter(cat => groupedRoutes[cat])
      .map(cat => ({ category: cat, routes: groupedRoutes[cat].filter(r => !r.path.includes(':')) })),
    []
  )

  // Optimize collapse handler with useCallback
  const handleCollapseToggle = useCallback(() => {
    const next = !isCollapsed
    setIsCollapsed(next)
    onCollapseChange?.(next)
  }, [isCollapsed, onCollapseChange])

  // Memoize category names mapping
  const getCategoryName = useCallback((category: string) => {
    const categoryNames = {
      'learn': 'Apprentissage',
      'organize': 'Organisation', 
      'create': 'Création',
      'analyze': 'Analyse',
      'system': 'Système'
    }
    return categoryNames[category as keyof typeof categoryNames] || category
  }, [])

  return (
    <motion.nav
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      className={`fixed inset-y-0 left-0 z-50 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <motion.div
            animate={{ opacity: isCollapsed ? 0 : 1 }}
            className="flex items-center space-x-2"
          >
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">Ariba</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Flashcards</p>
              </div>
            )}
          </motion.div>
          
          <motion.button
            onClick={handleCollapseToggle}
            variants={MOTION_VARIANTS.button}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            whileFocus="focus"
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            style={PERFORMANCE_STYLES.button}
          >
            <span className="text-gray-400">
              {isCollapsed ? '→' : '←'}
            </span>
          </motion.button>
        </div>

        <div className="flex-1 p-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
          <StaggerContainer>
            {menuGroups.map(group => (
              <StaggerItem key={group.category}>
                {!isCollapsed && (
                  <div className="px-3 py-2 text-[10px] uppercase tracking-wider font-semibold text-gray-400 dark:text-gray-500">
                    {getCategoryName(group.category)}
                  </div>
                )}
                <ul className="mb-3 space-y-1">
                  {group.routes.map(route => {
                    const isActive = location.pathname === route.path || (route.path !== '/' && location.pathname.startsWith(route.path))
                    return (
                      <li key={route.id}>
                        <motion.div
                          variants={MOTION_VARIANTS.button}
                          initial="initial"
                          whileHover="hover"
                          whileTap="tap"
                          style={PERFORMANCE_STYLES.button}
                        >
                          <Link
                            to={route.path}
                            className={`nav-item-ultra btn-ultra-smooth flex items-center px-3 py-2 rounded-lg transition-all duration-200 group relative ${
                              isActive
                                ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                            }`}
                            style={PERFORMANCE_STYLES.base}
                          >
                            <span className="text-xl">{route.icon}</span>
                            {!isCollapsed && (
                              <motion.span
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.15, ease: 'easeOut' }}
                                className="ml-3 text-sm font-medium flex items-center gap-1"
                              >
                                {route.label}{route.legacy && <span className="text-[9px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400">legacy</span>}
                              </motion.span>
                            )}
                            {isActive && (
                              <motion.div layoutId="activeIndicator" className="absolute inset-y-0 left-0 w-1 bg-primary-600 rounded-r-lg" />
                            )}
                          </Link>
                        </motion.div>
                      </li>
                    )
                  })}
                </ul>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <motion.button
            onClick={onThemeToggle}
            variants={MOTION_VARIANTS.button}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            whileFocus="focus"
            className={`btn-ultra-smooth game-btn-ultra flex items-center w-full px-3 py-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${
              isCollapsed ? 'justify-center' : ''
            }`}
            style={PERFORMANCE_STYLES.button}
          >
            <span className="text-xl">
              {currentTheme === 'dark' ? '☀️' : '🌙'}
            </span>
            {!isCollapsed && (
              <span className="ml-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                {currentTheme === 'dark' ? 'Mode clair' : 'Mode sombre'}
              </span>
            )}
          </motion.button>
        </div>
      </div>
    </motion.nav>
  )
})

export default Navigation
