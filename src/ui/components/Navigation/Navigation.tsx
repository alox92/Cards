import { useState, useCallback, useMemo, memo } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MOTION_VARIANTS,
  PERFORMANCE_STYLES,
} from "@/utils/performanceOptimizer";
import { groupedRoutes, primaryNavigationOrder } from "@/ui/routes/routeConfig";
import {
  StaggerContainer,
  StaggerItem,
} from "@/ui/components/animations/micro";
import Icons from "@/ui/components/common/Icons";

interface NavigationProps {
  onThemeToggle: () => void;
  currentTheme: "light" | "dark";
  onCollapseChange?: (collapsed: boolean) => void;
}

const Navigation = memo(
  ({ onThemeToggle, currentTheme, onCollapseChange }: NavigationProps) => {
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Memoize menu groups computation to avoid recalculation
    const menuGroups = useMemo(
      () =>
        primaryNavigationOrder
          .filter((cat) => groupedRoutes[cat])
          .map((cat) => ({
            category: cat,
            routes: groupedRoutes[cat].filter((r) => !r.path.includes(":")),
          })),
      []
    );

    // Optimize collapse handler with useCallback
    const handleCollapseToggle = useCallback(() => {
      const next = !isCollapsed;
      setIsCollapsed(next);
      onCollapseChange?.(next);
    }, [isCollapsed, onCollapseChange]);

    // Memoize category meta (label + icon) for clean, icon-based sections
    const getCategoryMeta = useCallback((category: string) => {
      const meta = {
        learn: { label: "Étude", icon: <Icons.Study size="sm" /> },
        organize: { label: "Contenu", icon: <Icons.Decks size="sm" /> },
        analyze: { label: "Progression", icon: <Icons.Stats size="sm" /> },
        create: { label: "Assistant", icon: <Icons.Sparkles size="sm" /> },
        system: { label: "Système", icon: <Icons.Settings size="sm" /> },
      } as const;
      return (
        meta[category as keyof typeof meta] || { label: category, icon: null }
      );
    }, []);

    return (
      <motion.nav
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        className={`fixed inset-y-0 left-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-r border-white/70 dark:border-white/10 shadow-[0_18px_60px_rgba(15,23,42,0.16)] transition-all duration-300 ${
          isCollapsed ? "w-16" : "w-64"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900">
            <motion.div
              animate={{ opacity: isCollapsed ? 0 : 1 }}
              className="flex items-center space-x-3"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              {!isCollapsed && (
                <div>
                  <h1 className="text-xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Ariba
                  </h1>
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                    Flashcards Intelligence
                  </p>
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
              <span className="text-gray-400">{isCollapsed ? "→" : "←"}</span>
            </motion.button>
          </div>

          <div className="flex-1 p-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
            <StaggerContainer>
              {menuGroups.map((group) => (
                <StaggerItem key={group.category}>
                  {!isCollapsed && (
                    <div className="px-3 py-3 mt-4 first:mt-0">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-400 flex items-center gap-2">
                        {getCategoryMeta(group.category).icon}
                        <span>{getCategoryMeta(group.category).label}</span>
                      </h3>
                    </div>
                  )}
                  <ul className="mb-2 space-y-0.5">
                    {group.routes.map((route) => {
                      const isActive =
                        location.pathname === route.path ||
                        (route.path !== "/" &&
                          location.pathname.startsWith(route.path));
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
                              className={`nav-item-ultra btn-ultra-smooth flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                                isActive
                                  ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/30"
                                  : "text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 dark:hover:from-gray-800 dark:hover:to-gray-800/50 hover:text-gray-900 dark:hover:text-white"
                              }`}
                              style={PERFORMANCE_STYLES.base}
                            >
                              <span
                                className={`text-xl ${
                                  isActive ? "scale-110" : ""
                                } transition-transform`}
                              >
                                {route.icon}
                              </span>
                              {!isCollapsed && (
                                <motion.span
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{
                                    duration: 0.15,
                                    ease: "easeOut",
                                  }}
                                  className="ml-3 text-sm font-semibold flex items-center gap-1"
                                >
                                  {route.label}
                                  {route.legacy && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-bold">
                                      LEGACY
                                    </span>
                                  )}
                                </motion.span>
                              )}
                              {isActive && (
                                <motion.div
                                  layoutId="activeIndicator"
                                  className="absolute inset-y-0 left-0 w-1 bg-white rounded-r-full shadow-xl"
                                />
                              )}
                            </Link>
                          </motion.div>
                        </li>
                      );
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
                isCollapsed ? "justify-center" : ""
              }`}
              style={PERFORMANCE_STYLES.button}
            >
              <Icons.Settings size="md" />
              {!isCollapsed && (
                <span className="ml-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                  {currentTheme === "dark" ? "Mode clair" : "Mode sombre"}
                </span>
              )}
            </motion.button>
          </div>
        </div>
      </motion.nav>
    );
  }
);

export default Navigation;
