import { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface FuturisticLayoutProps { children: ReactNode; subtle?: boolean }

/**
 * FuturisticLayout
 * Arrière-plan gradient + motifs animés légers pour un look futuriste sans coûts GPU excessifs.
 */
export function FuturisticLayout({ children, subtle = false }: FuturisticLayoutProps){
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Gradient principal */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.15),transparent_60%),radial-gradient(circle_at_80%_70%,rgba(168,85,247,0.18),transparent_65%)]" />
      {/* Grille animée */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07] bg-[linear-gradient(rgba(255,255,255,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.15)_1px,transparent_1px)] bg-[size:60px_60px]"
        animate={!subtle ? { backgroundPosition: ['0px 0px','60px 60px'] } : undefined}
        transition={{ duration: 20, ease: 'linear', repeat: Infinity }}
      />
      {/* Halo animé */}
      {!subtle && (
        <motion.div
          className="pointer-events-none absolute -inset-32 blur-3xl bg-gradient-to-tr from-blue-500/10 via-fuchsia-400/10 to-purple-600/10"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  )
}
export default FuturisticLayout
