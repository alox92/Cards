import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import Icons from '../common/Icons'

interface FlashCard3DProps {
  frontText: string
  backText: string
  category?: string
  difficulty?: number
  onAnswer?: (correct: boolean) => void
  autoFlip?: boolean
  className?: string
}

export const FlashCard3D = ({
  frontText,
  backText,
  category = "Général",
  difficulty = 1,
  onAnswer,
  autoFlip = false,
  className = ""
}: FlashCard3DProps) => {
  const [isFlipped, setIsFlipped] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [showParticles, setShowParticles] = useState(false)
  const prefersReducedMotion = useReducedMotion()
  const forceReducedMotion =
    typeof document !== 'undefined' &&
    document.documentElement.classList.contains('reduced-motion-force')
  const reduceMotion = prefersReducedMotion || forceReducedMotion

  useEffect(() => {
    if (autoFlip) {
      const timer = setTimeout(() => setIsFlipped(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [autoFlip])

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
    setShowParticles(true)
    setTimeout(() => setShowParticles(false), 1000)
  }

  const handleAnswer = (correct: boolean) => {
    setShowParticles(true)
    setTimeout(() => setShowParticles(false), 1500)
    onAnswer?.(correct)
  }

  const getDifficultyColor = (level: number) => {
    switch (level) {
      case 1: return 'from-green-400 via-emerald-500 to-teal-600'
      case 2: return 'from-yellow-400 via-orange-500 to-amber-600'
      case 3: return 'from-red-400 via-pink-500 to-rose-600'
      default: return 'from-blue-400 via-indigo-500 to-purple-600'
    }
  }

  const particlesArray = !reduceMotion
    ? Array.from({ length: 20 }, (_, i) => (
    <motion.div
      key={i}
      className={`absolute w-2 h-2 rounded-full ${
        Math.random() > 0.5 ? 'bg-yellow-400' : 'bg-blue-400'
      }`}
      initial={{ 
        opacity: 0, 
        scale: 0,
        x: 0,
        y: 0,
        rotate: 0
      }}
      animate={showParticles ? {
        opacity: [0, 1, 0],
        scale: [0, 1.5, 0],
        x: (Math.random() - 0.5) * 300,
        y: (Math.random() - 0.5) * 300,
        rotate: Math.random() * 360
      } : {}}
      transition={{
        duration: 1.5,
        delay: i * 0.05,
        ease: "easeOut"
      }}
      style={{
        left: '50%',
        top: '50%',
      }}
    />
    ))
    : null

  return (
    <div className={`relative perspective-1000 ${className}`}>
      {/* Particules d'effet */}
      <AnimatePresence>
        {showParticles && particlesArray && (
          <div className="absolute inset-0 pointer-events-none z-20">
            {particlesArray}
          </div>
        )}
      </AnimatePresence>

      {/* Carte principale avec rotation 3D */}
      <motion.div
        className="relative w-full h-80 cursor-pointer preserve-3d"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ 
          rotateY: isFlipped ? 180 : 0,
          scale: isHovered ? 1.05 : 1,
          y: isHovered ? -10 : 0
        }}
        transition={{ 
          duration: 0.8, 
          ease: [0.23, 1, 0.32, 1],
          type: "spring",
          stiffness: 300,
          damping: 30
        }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onClick={handleFlip}
        whileTap={{ scale: 0.95 }}
      >
        {/* Face avant (recto) */}
        <motion.div
          className="absolute inset-0 w-full h-full backface-hidden rounded-2xl shadow-2xl overflow-hidden"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* Fond avec gradient animé */}
          <div className={`absolute inset-0 bg-gradient-to-br ${getDifficultyColor(difficulty)} opacity-90`}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/20"></div>
            
            {/* Motif décoratif */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 right-4 w-32 h-32 border-2 border-white rounded-full animate-spin-slow"></div>
              <div className="absolute bottom-4 left-4 w-24 h-24 border border-white rounded-full animate-pulse"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 border border-white/50 rounded-full animate-ping"></div>
            </div>
          </div>

          {/* Contenu face avant */}
          <div className="relative z-10 h-full flex flex-col justify-between p-8 text-white">
            <div className="flex justify-between items-start">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                {category}
              </span>
              <div className="flex space-x-1">
                {Array.from({ length: difficulty }).map((_, i) => (
                  reduceMotion ? (
                    <div
                      key={i}
                      className="w-2 h-2 bg-white rounded-full"
                    />
                  ) : (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-white rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
                    />
                  )
                ))}
              </div>
            </div>

            <div className="text-center flex-1 flex items-center justify-center">
              <motion.h2 
              <motion.h2 
                className="text-3xl font-bold leading-tight drop-shadow-lg"
                animate={reduceMotion ? undefined : { 
                  textShadow: isHovered 
                    ? "0 0 20px rgba(255,255,255,0.8)" 
                    : "0 2px 4px rgba(0,0,0,0.3)" 
                }}
                transition={reduceMotion ? undefined : { duration: 0.3 }}
              >
                {frontText}
              </motion.h2>
            </div>

            <div className="text-center">
              <motion.div 
              <motion.div 
                className="inline-flex items-center space-x-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full"
                animate={reduceMotion ? undefined : { y: [0, -5, 0] }}
                transition={reduceMotion ? undefined : { duration: 2, repeat: Infinity }}
              >
                <span className="text-sm font-medium">Cliquez pour révéler</span>
                {reduceMotion ? (
                  <span>🔄</span>
                ) : (
                  <motion.span 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    🔄
                  </motion.span>
                )}
              </motion.div>
            </div>
          </div>

          {/* Reflet lumineux */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0"
            animate={isHovered ? { 
              opacity: [0, 0.3, 0],
              x: [-100, 400]
            } : {}}
            transition={{ duration: 1.5 }}
            style={{ transform: 'skewX(-20deg)' }}
          />
        </motion.div>

        {/* Face arrière (verso) */}
        <motion.div
          className="absolute inset-0 w-full h-full backface-hidden rounded-2xl shadow-2xl overflow-hidden"
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          {/* Fond avec gradient différent */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 opacity-90">
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/10"></div>
            
            {/* Motif décoratif différent */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-8 left-8 w-16 h-16 border-2 border-white rounded-lg rotate-45 animate-bounce"></div>
              <div className="absolute bottom-8 right-8 w-20 h-20 border border-white rounded-lg animate-pulse"></div>
              <div className="absolute top-1/3 right-1/4 w-12 h-12 border border-white/50 rounded-full animate-spin"></div>
            </div>
          </div>

          {/* Contenu face arrière */}
          <div className="relative z-10 h-full flex flex-col justify-between p-8 text-white">
            <div className="text-right">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                Réponse
              </span>
            </div>

            <div className="text-center flex-1 flex items-center justify-center">
              <motion.h2 
                className="text-2xl font-semibold leading-relaxed drop-shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {backText}
              </motion.h2>
            </div>

            {onAnswer && (
              <motion.div 
                className="flex space-x-4 justify-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAnswer(false)
                  }}
                  className="px-6 py-3 bg-red-500/80 backdrop-blur-sm rounded-xl font-medium 
                    transform transition-all duration-300 hover:scale-110 hover:bg-red-400
                    focus:outline-none focus:ring-4 focus:ring-red-300"
                  whileHover={{ scale: 1.1, rotate: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="flex items-center gap-2">
                    <Icons.Cancel size="sm" />
                    Difficile
                  </span>
                </motion.button>
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAnswer(true)
                  }}
                  className="px-6 py-3 bg-green-500/80 backdrop-blur-sm rounded-xl font-medium 
                    transform transition-all duration-300 hover:scale-110 hover:bg-green-400
                    focus:outline-none focus:ring-4 focus:ring-green-300"
                  whileHover={{ scale: 1.1, rotate: 2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="flex items-center gap-2">
                    <Icons.Check size="sm" />
                    Facile
                  </span>
                </motion.button>
              </motion.div>
            )}
          </div>

          {/* Reflet lumineux verso */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0"
            animate={isHovered ? { 
              opacity: [0, 0.2, 0],
              x: [-100, 400]
            } : {}}
            transition={{ duration: 1.5, delay: 0.2 }}
            style={{ transform: 'skewX(-20deg)' }}
          />
        </motion.div>

        {/* Ombre dynamique */}
        <div 
          className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-3/4 h-8 
            bg-black/20 rounded-full blur-lg transition-all duration-300"
          style={{
            transform: `translateX(-50%) ${isHovered ? 'translateY(5px) scale(1.1)' : ''}`,
            opacity: isHovered ? 0.3 : 0.1
          }}
        />
      </motion.div>

      {/* Indicateur de flip */}
      <motion.div
        className="absolute top-4 right-4 z-30 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full 
          flex items-center justify-center shadow-lg"
        animate={{ 
          rotate: isFlipped ? 180 : 0,
          scale: isHovered ? 1.2 : 1
        }}
        transition={{ duration: 0.5 }}
      >
        <span className="text-lg">🔄</span>
      </motion.div>
    </div>
  )
}

// Styles CSS supplémentaires à ajouter
export const card3DStyles = `
  .perspective-1000 {
    perspective: 1000px;
  }
  
  .preserve-3d {
    transform-style: preserve-3d;
  }
  
  .backface-hidden {
    backface-visibility: hidden;
  }
  
  @keyframes spin-slow {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  
  .animate-spin-slow {
    animation: spin-slow 8s linear infinite;
  }
`
