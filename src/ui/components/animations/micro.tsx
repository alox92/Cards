import { motion, AnimatePresence } from 'framer-motion'
import { PropsWithChildren } from 'react'
import { MotionTokens } from '@/ui/design/tokens'

// Micro interactions utilitaires – Phase 1

export const FadeIn: React.FC<PropsWithChildren<{ delay?: number; y?: number }>> = ({ children, delay=0, y=12 }) => (
  <motion.div initial={{ opacity:0, y }} animate={{ opacity:1, y:0 }} transition={{ duration: MotionTokens.duration.base/1000, delay, ease: MotionTokens.ease.standard as any }}>
    {children}
  </motion.div>
)

export const ScaleTap: React.FC<PropsWithChildren<{ whileHoverScale?: number }>> = ({ children, whileHoverScale=1.02 }) => (
  <motion.div whileHover={{ scale: whileHoverScale }} whileTap={{ scale:0.95 }} transition={{ type:'spring', stiffness:340, damping:22 }}>
    {children}
  </motion.div>
)

export const StaggerContainer: React.FC<PropsWithChildren<{ stagger?: number }>> = ({ children, stagger=0.05 }) => (
  <motion.div initial="hidden" animate="show" variants={{ hidden:{}, show:{ transition:{ staggerChildren: stagger }}}}>{children}</motion.div>
)

export const StaggerItem: React.FC<PropsWithChildren> = ({ children }) => (
  <motion.div variants={{ hidden:{ opacity:0, y:8 }, show:{ opacity:1, y:0, transition:{ duration:0.28, ease: MotionTokens.ease.standard as any }}}}>{children}</motion.div>
)

export { AnimatePresence }
