import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { DemoCard } from '@/ui/components/Card/DemoCard'
import { useState, useEffect } from 'react'
import useDecksService from '@/ui/hooks/useDecksService'
import { motion as m } from 'framer-motion'

const HomePage = () => {
  const navigate = useNavigate()
  const [currentFeature, setCurrentFeature] = useState(0)
  const [showWelcome, setShowWelcome] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setShowWelcome(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature(prev => (prev + 1) % features.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const handleStartLearning = () => {
    navigate('/study')
  }

  const handleExploreDecks = () => {
    navigate('/decks')
  }

  const handleViewStats = () => {
    navigate('/stats')
  }

  const handleOpenSettings = () => {
    navigate('/settings')
  }

  const demoCard = {
    frontText: 'Hello',
    backText: 'Bonjour / Salut',
    category: 'Vocabulaire Anglais',
    difficulty: 1
  }

  // Decks récents
  const { decks, loading: decksLoading } = useDecksService()
  const recentDecks = [...decks].sort((a:any,b:any)=> (b.lastStudied||0) - (a.lastStudied||0)).slice(0,4)

  const features = [
    {
      icon: '🧠',
      title: 'IA d\'Apprentissage',
      description: 'Algorithme SM-2 pour optimiser vos révisions',
      color: 'from-blue-400 to-purple-500'
    },
    {
      icon: '📊',
      title: 'Statistiques Avancées',
      description: 'Suivez vos progrès en temps réel',
      color: 'from-green-400 to-teal-500'
    },
    {
      icon: '🎯',
      title: 'Modes de Jeu',
      description: 'Quiz, Speed Round, Matching et plus',
      color: 'from-orange-400 to-red-500'
    },
    {
      icon: '🎨',
      title: 'Interface Moderne',
      description: 'Design responsive avec mode sombre',
      color: 'from-pink-400 to-purple-500'
    },
    {
      icon: '⚡',
      title: 'Performance',
      description: '7 systèmes d\'optimisation intégrés',
      color: 'from-yellow-400 to-orange-500'
    },
    {
      icon: '📱',
      title: 'PWA Ready',
      description: 'Fonctionne hors ligne sur tous vos appareils',
      color: 'from-indigo-400 to-blue-500'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
      {/* Écran de bienvenue avec effet spectaculaire */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ opacity: 1, scale: 1 }}
            exit={{ 
              opacity: 0, 
              scale: 0.8,
              y: -50,
              rotateX: 90
            }}
            transition={{ duration: 1, ease: "backInOut" }}
            className="fixed inset-0 z-50 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                duration: 1.5, 
                ease: "backOut",
                type: "spring",
                stiffness: 200
              }}
              className="text-center"
            >
              <motion.div
                animate={{ 
                  rotateY: 360,
                  scale: [1, 1.2, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="w-32 h-32 mx-auto mb-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-6xl animate-glow-pulse"
              >
                🎓
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="text-6xl font-bold text-gradient mb-4"
              >
                Cards
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.6 }}
                className="text-xl text-white/80 max-w-2xl mx-auto"
              >
                Préparez-vous à une expérience d'apprentissage révolutionnaire
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.5, duration: 0.5 }}
                className="mt-8"
              >
                <div className="w-2 h-2 bg-white rounded-full mx-auto animate-pulse"></div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Particules d'arrière-plan */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 30 }, (_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-400/30 rounded-full"
            animate={{
              x: [0, Math.random() * 200 - 100],
              y: [0, Math.random() * 200 - 100],
              opacity: [0.3, 1, 0.3],
              scale: [1, 2, 1]
            }}
            transition={{
              duration: Math.random() * 4 + 2,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header spectaculaire avec animation */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: showWelcome ? 3.5 : 0 }}
          className="text-center mb-12"
        >
          <motion.h1
            className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4"
            animate={{ 
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
            }}
            transition={{ duration: 6, repeat: Infinity }}
            style={{
              background: 'linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab)',
              backgroundSize: '400% 400%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            Bienvenue sur{' '}
            <span className="inline-block animate-float-3d">
              Cards
            </span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: showWelcome ? 4 : 0.5, duration: 0.8 }}
            className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8"
          >
            Application de cartes flash intelligente avec{' '}
            <span className="text-gradient font-bold">7 systèmes d'optimisation révolutionnaires</span>{' '}
            pour un apprentissage adaptatif et performant
          </motion.p>

          {/* Boutons d'action avec effets magiques */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: showWelcome ? 4.5 : 1, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <motion.button 
              onClick={handleStartLearning}
              className="btn-magical btn-ultra-smooth game-btn-ultra text-lg px-8 py-4 relative overflow-hidden group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="relative z-10 flex items-center space-x-2">
                <span>🚀</span>
                <span>Commencer à Apprendre</span>
              </span>
            </motion.button>
            
            <motion.button 
              onClick={handleExploreDecks}
              className="btn-secondary btn-ultra-smooth game-btn-ultra text-lg px-8 py-4 transform hover:scale-105 transition-all duration-300 hover-3d-lift"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="flex items-center space-x-2">
                <span>📚</span>
                <span>Explorer les Paquets</span>
              </span>
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Carte de démonstration avec rotation 3D */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotateY: -90 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ delay: showWelcome ? 5 : 1.5, duration: 1, ease: "backOut" }}
          className="max-w-md mx-auto mb-16 perspective-1000"
        >
          <motion.div
            animate={{ 
              rotateY: [0, 5, 0, -5, 0],
              y: [0, -10, 0, -5, 0]
            }}
            transition={{ 
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="relative"
          >
            <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">
              <span className="text-gradient">🎯 Essayez notre système</span>
            </h2>
            <div className="hover-3d-lift">
              <DemoCard {...demoCard} />
            </div>
          </motion.div>
        </motion.div>

        {/* Grille des fonctionnalités avec carrousel */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: showWelcome ? 5.5 : 2, duration: 0.8 }}
          className="max-w-6xl mx-auto mb-16"
        >
          <motion.h2
            className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white"
            animate={{ 
              scale: [1, 1.02, 1],
              textShadow: [
                "0 0 20px rgba(59, 130, 246, 0.3)",
                "0 0 40px rgba(139, 92, 246, 0.5)",
                "0 0 20px rgba(59, 130, 246, 0.3)"
              ]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            ✨ Fonctionnalités Révolutionnaires
          </motion.h2>
          
          {/* Fonctionnalité mise en avant */}
          <motion.div
            key={currentFeature}
            initial={{ opacity: 0, x: 100, rotateY: 90 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            exit={{ opacity: 0, x: -100, rotateY: -90 }}
            transition={{ duration: 0.8, ease: "backOut" }}
            className="card p-8 mb-8 text-center"
          >
            <motion.div
              animate={{ 
                rotate: 360,
                scale: [1, 1.2, 1]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-6xl mb-4"
            >
              {features[currentFeature].icon}
            </motion.div>
            <h3 className="text-2xl font-bold text-gradient mb-4">
              {features[currentFeature].title}
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              {features[currentFeature].description}
            </p>
          </motion.div>
          
          {/* Grille de toutes les fonctionnalités */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: showWelcome ? 6 + index * 0.1 : 2.5 + index * 0.1 }}
                className={`card cursor-pointer transition-all duration-300 ${
                  index === currentFeature ? 'ring-2 ring-blue-400 scale-105' : ''
                }`}
                onClick={() => setCurrentFeature(index)}
                whileHover={{ scale: 1.05, rotateY: 10 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div
                  animate={index === currentFeature ? { 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  } : {}}
                  transition={{ duration: 1, repeat: index === currentFeature ? Infinity : 0 }}
                  className="text-4xl mb-4"
                >
                  {feature.icon}
                </motion.div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Actions rapides avec animations 3D */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: showWelcome ? 6.5 : 3, duration: 0.8 }}
          className="max-w-4xl mx-auto mb-16"
        >
          <h2 className="text-3xl font-bold text-center mb-8 text-gradient">
            🎮 Actions Rapides
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div 
              onClick={handleViewStats}
              className="card cursor-pointer group"
              whileHover={{ scale: 1.02, rotateY: 5, rotateX: 5 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-center">
                <motion.div
                  animate={{ 
                    rotateY: 360,
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="text-5xl mb-4 group-hover:animate-bounce-in-3d"
                >
                  📈
                </motion.div>
                <h3 className="text-xl font-semibold text-gradient mb-2">
                  Statistiques Avancées
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Consultez vos performances et progrès détaillés
                </p>
              </div>
            </motion.div>

            <motion.div 
              onClick={handleOpenSettings}
              className="card cursor-pointer group"
              whileHover={{ scale: 1.02, rotateY: -5, rotateX: 5 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-center">
                <motion.div
                  animate={{ 
                    rotate: [0, 90, 180, 270, 360],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ duration: 6, repeat: Infinity }}
                  className="text-5xl mb-4 group-hover:animate-bounce-in-3d"
                >
                  ⚙️
                </motion.div>
                <h3 className="text-xl font-semibold text-gradient mb-2">
                  Paramètres
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Personnalisez votre expérience d'apprentissage
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Résumé decks récents */}
        <motion.div
          initial={{ opacity:0, y:40 }}
          animate={{ opacity:1, y:0 }}
          transition={{ delay: showWelcome ? 6.8 : 3.3, duration:0.6 }}
          className="max-w-5xl mx-auto mb-20"
        >
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">📚 Paquets Récents</h2>
          {decksLoading && <div className="text-center text-sm text-gray-500 dark:text-gray-400">Chargement...</div>}
          {!decksLoading && recentDecks.length === 0 && (
            <div className="card p-6 text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">Aucun paquet encore. Créez votre premier pour commencer l'aventure !</p>
              <button onClick={handleExploreDecks} className="btn-primary">➕ Nouveau paquet</button>
            </div>
          )}
          {!decksLoading && recentDecks.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {recentDecks.map((d)=>(
                <m.button
                  key={d.id}
                  whileHover={{ y:-4, scale:1.03 }}
                  whileTap={{ scale:0.96 }}
                  onClick={()=>navigate(`/study/${d.id}`)}
                  className="card text-left relative overflow-hidden group"
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-blue-500/10 via-fuchsia-500/10 to-purple-600/10" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{d.icon || '📘'}</span>
                      <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">{d.name}</h3>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3 mb-3">{d.description || 'Pas de description'}</p>
                    <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400">
                      <span>{d.totalCards} cartes</span>
                      <span>{d.masteredCards} maîtrisées</span>
                      <span className="text-blue-600 dark:text-blue-400">Étudier →</span>
                    </div>
                  </div>
                </m.button>
              ))}
            </div>
          )}
          {decks.length > 4 && (
            <div className="text-center mt-6">
              <button onClick={handleExploreDecks} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-sm">Voir tous les paquets</button>
            </div>
          )}
        </motion.div>

        {/* Footer avec informations système et effets */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: showWelcome ? 7 : 3.5, duration: 0.8 }}
          className="text-center py-8 border-t border-gray-200 dark:border-gray-700"
        >
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            {[
              { icon: '🧠', text: 'IA d\'apprentissage adaptatif' },
              { icon: '⚡', text: '7 systèmes d\'optimisation' },
              { icon: '📱', text: 'Compatible PWA' },
              { icon: '🌙', text: 'Mode sombre intégré' }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: showWelcome ? 7.5 + index * 0.1 : 4 + index * 0.1 }}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full text-gray-700 dark:text-gray-300 hover:scale-105 transition-transform cursor-pointer"
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, delay: index * 0.5 }}
                >
                  {item.icon}
                </motion.span>
                <span>{item.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default HomePage
