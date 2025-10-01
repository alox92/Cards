/**
 * StudyPage - Page d'étude interactive avec l'Intelligent Learning System
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import FuturisticLayout from '@/ui/components/layout/FuturisticLayout'
import { motion } from 'framer-motion'
import { useFeedback } from '@/ui/components/feedback/useFeedback'
import ParticleBurst from '@/ui/components/effects/ParticleBurst'
// import { FlashCard } from '../components/Card/FlashCard'
// LEGACY NOTE: utilisation stores remplacée progressivement par services
import useServiceLegacyStudyStats from '@/ui/hooks/useServiceLegacyStudyStats'
import useServiceStudySession from '@/ui/hooks/useServiceStudySession'
import { useParams, useNavigate } from 'react-router-dom'
import { useSettingsStore } from '@/data/stores/settingsStore'
import useDecksService from '@/ui/hooks/useDecksService'
import { getIntelligentLearningSystem, IntelligentLearningSystem } from '../../core/IntelligentLearningSystem'
import useLearningProfile from '@/ui/hooks/useLearningProfile'
import { getFluidTransitionMastery, FluidTransitionMastery } from '../../core/FluidTransitionMastery'
import StudyHeatmap from '@/ui/components/Stats/StudyHeatmap'
import OcclusionStudyCard from '@/ui/components/Occlusion/OcclusionStudyCard'
// import { CardEntity } from '../../domain/entities/Card'

type StudyMode = 'quiz' | 'speed' | 'matching' | 'writing' | 'review'

// interface StudyStats { totalCards: number; correctAnswers: number; timeElapsed: number; currentStreak: number }

const StudyPage = () => {
  const { deckId } = useParams<{ deckId: string }>()
  const navigate = useNavigate()
  const { decks, loading: decksLoading } = useDecksService()
  const [selectedMode, setSelectedMode] = useState<StudyMode | null>(null)
  const [showMenu, setShowMenu] = useState(true)
  // Recommandations dynamiques (Phase 5)
  const [recommendations, setRecommendations] = useState<any[]>([])

  // Références (instances stables, évite ré-inits multiples en StrictMode)
  const learningSystemRef = useRef<IntelligentLearningSystem | null>(getIntelligentLearningSystem())
  const transitionSystemRef = useRef<FluidTransitionMastery | null>(getFluidTransitionMastery())
  // const sessionStartTimeRef = useRef<number>(0)

  // Stores
  // Legacy stores retirés: stats rapides via services (sans actions d'étude complètes)
  const quickStats = useServiceLegacyStudyStats()

  // Initialisation
  useEffect(() => {
    const initializeSystems = async () => {
      try {
        // Intelligent Learning System déjà obtenu via ref (singleton)
        // Initialiser le Fluid Transition Mastery (idempotent)
        await transitionSystemRef.current?.initialize()

        // Charger les recommandations initiales + abonner aux mises à jour
        const ils = learningSystemRef.current
        if(ils){
          try {
            // Première génération (si déjà prête)
            const current = ils.getRecommendations?.() || []
            if(current.length) setRecommendations(current)
            // Listener
            const handler = (e: any) => {
              setRecommendations([...(e.detail || [])])
            }
            ils.addEventListener('recommendations', handler as any)
            // Forcer une régénération si vide (éventuel retard init)
            if(!current.length){
              void ils.generateRecommendations?.().then(r => { if(r?.length) setRecommendations([...(r)]) })
            }
            // Cleanup listener lors unmount
            return () => ils.removeEventListener('recommendations', handler as any)
          } catch(err){ console.warn('StudyPage recommandations listener error', err) }
        }

        // Charger les decks
  // TODO: charger les decks via deckService quand migration complète

        console.log('✅ Systèmes d\'étude initialisés')
      } catch (error) {
        console.error('❌ Erreur initialisation systèmes:', error)
      }
    }

    initializeSystems()

    return () => {
      // Nettoyage spécifique page (pas de cleanup global du singleton ici)
    }
  }, [])

  /**
   * Démarre une session d'étude
   */
  // Appel inconditionnel du hook pour préserver l'ordre des hooks (deckId peut être undefined)
  const sessionHook = useServiceStudySession({ deckId })
  const { settings: globalSettings, updateSettings } = useSettingsStore()
  const learningState = useLearningProfile()
  const [sessionAlerts, setSessionAlerts] = useState<{ id:string; msg:string }[]>([])

  // Détection chute accuracy (comparaison glissante) pendant la session
  useEffect(()=>{
    if(!learningState.profile) return
    const acc = learningState.profile.performance.overallAccuracy
    setSessionAlerts(prev => {
      const last = prev.slice(-5)
      const accuracyPoints = (last as any).accuracySeries || []
      const series = [...accuracyPoints.slice(-19), acc]
      const base = series.length > 3 ? series.slice(0, -1).reduce((a,b)=>a+b,0)/(series.length-1) : acc
      const drop = base ? ((base - acc)/base)*100 : 0
      const alerts = [...prev.filter(a=> a.id !== 'acc-drop')]
      if(drop > 20){
        alerts.push({ id:'acc-drop', msg:`Baisse de précision ${drop.toFixed(1)}% – suggéré: micro‑pause ou révision ciblée.` })
      }
      ;(alerts as any).accuracySeries = series
      return alerts
    })
  }, [learningState.profile?.performance.overallAccuracy])
  const [elapsedMs, setElapsedMs] = useState(0)
  const [showBack, setShowBack] = useState(false)

  // Timer
  useEffect(() => {
    if(!sessionHook?.session || globalSettings.showStudyTimer === false) return
    let raf: number
    const tick = () => {
      if(sessionHook.session){
        setElapsedMs(Date.now() - sessionHook.session.startTime)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [sessionHook?.session, globalSettings.showStudyTimer])

  // Raccourcis clavier
  const handleKey = useCallback((e: KeyboardEvent) => {
  if(globalSettings.studyShortcuts === false) return
    if(!sessionHook || sessionHook.finished || sessionHook.loading) return
    if(e.code === 'Space'){
      e.preventDefault()
      setShowBack(b => !b)
    }
    if(e.key >= '0' && e.key <= '4'){
      const q = parseInt(e.key, 10)
      void sessionHook.answer(q)
      setShowBack(false)
    }
  }, [sessionHook, globalSettings.studyShortcuts])

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])
  const { successParticles, particlesRequest, play } = useFeedback()
  const startStudySession = async (mode: StudyMode) => {
    if(!deckId){ console.warn('Pas de deck sélectionné'); return }
    setSelectedMode(mode)
    setShowMenu(false)
  }

  /**
   * Traite la réponse à une carte
   */
  // const handleCardAnswer = async () => {}

  // endStudySession / returnToMenu retirés (placeholder)

  // Menu de sélection du mode d'étude
  // Vue session active
  // Reprise auto top-level (préserve ordre hooks)
  useEffect(() => { if(deckId) { void sessionHook.resume() } }, [deckId, sessionHook])

  if(!showMenu && deckId){
    const { currentCard, remaining, answer, finished, loading, error, session, rebuild } = sessionHook

    const formatElapsed = (ms:number) => {
      const s = Math.floor(ms/1000)
      const m = Math.floor(s/60)
      const sec = s % 60
      return `${m}:${sec.toString().padStart(2,'0')}`
    }

    // Wrapper answer to inject feedback
    const answerWithFeedback = async (quality: number) => {
      play('click')
      answer(quality)
      if(quality >= 4){
        // micro success burst for very good answer
        successParticles(0.35)
      }
    }
    return (
      <div className="relative min-h-screen bg-gray-50 dark:bg-gray-900 p-6 overflow-hidden">
        {particlesRequest && <ParticleBurst triggerId={particlesRequest.id} intensity={particlesRequest.intensity} />}
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              {selectedMode === 'review' ? '🔁 Révision Spaced Repetition' : '🧠 Session d\'étude'}
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">{remaining} restantes</span>
            </h1>
            <div className="flex gap-2 items-center">
              {globalSettings.showStudyTimer && session && (
                <div className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-sm font-mono tabular-nums">
                  ⏱ {formatElapsed(elapsedMs)}
                </div>
              )}
              {currentCard && currentCard.tags?.includes('leech') && (
                <span className="px-2 py-1 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-semibold">🪱 Leech</span>
              )}
              <button onClick={()=> updateSettings({ showStudyTimer: !globalSettings.showStudyTimer })} className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700">{globalSettings.showStudyTimer?'Masquer Timer':'Afficher Timer'}</button>
              <button onClick={()=> updateSettings({ studyShortcuts: !globalSettings.studyShortcuts })} className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700">Racc: {globalSettings.studyShortcuts?'ON':'OFF'}</button>
              <button onClick={() => rebuild()} className="px-3 py-1 text-sm rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">↻ Rebuild</button>
              {currentCard && (
                <button onClick={() => { sessionHook.bury?.([currentCard.id]); rebuild() }} className="px-3 py-1 text-sm rounded bg-amber-500 text-white hover:bg-amber-600">⏸ Bury</button>
              )}
              <button onClick={() => { setShowMenu(true); setSelectedMode(null) }} className="px-3 py-1 text-sm rounded bg-red-500 text-white hover:bg-red-600">✖ Quitter</button>
            </div>
          </div>
          {loading && (
            <div className="card p-6 animate-pulse">
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
              <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
              <div className="space-y-2 mb-6">
                <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-3 w-5/6 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-3 w-2/3 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-4">
                {[...Array(5)].map((_,i)=>(<div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded" />))}
              </div>
            </div>
          )}
          {error && <div className="card p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300">{error}</div>}
          {!loading && !finished && currentCard && (
            <div className="card p-6">
              <div className="mb-4">
                <div className="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Carte</div>
                <div className="relative h-64 select-none" style={{ perspective: `${globalSettings.card3DDepth || 1000}px` }}>
                  <div className={`absolute inset-0 preserve-3d transition-transform ${showBack ? 'rotate-y-180' : ''}`}
                       style={{ transformStyle:'preserve-3d', transitionDuration: `${globalSettings.cardFlipSpeedMs || 500}ms` }}>
                    {globalSettings.enable3D === false && (
                      <div className="absolute inset-0 rounded bg-gray-50 dark:bg-gray-800 opacity-10" />
                    )}
                    <div className="absolute inset-0 backface-hidden flex items-center justify-center p-2 text-center text-2xl font-semibold text-gray-900 dark:text-white whitespace-pre-wrap rounded bg-white dark:bg-gray-800 shadow" style={{ transform:'rotateY(0deg)' }}>
                      {currentCard.cardType === 'occlusion' ? <OcclusionStudyCard card={currentCard} showBack={false} /> : currentCard.frontText}
                    </div>
                    <div className="absolute inset-0 backface-hidden flex items-center justify-center p-2 text-center text-xl text-gray-800 dark:text-gray-100 whitespace-pre-wrap rounded bg-gray-100 dark:bg-gray-700 shadow" style={{ transform:'rotateY(180deg)' }}>
                      {currentCard.cardType === 'occlusion' ? (
                        currentCard.backImage ? <img src={currentCard.backImage} alt="verso" className="max-w-full max-h-full object-contain" /> : <OcclusionStudyCard card={currentCard} showBack={true} />
                      ) : currentCard.backText}
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">Espace: retourner • Chiffres 0‑4: noter</div>
                <div className="mt-3">
                  <button onClick={()=>setShowBack(b=>!b)} className="px-3 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700">{showBack?'Recto':'Verso'}</button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-2">
                {[0,1,2,3,4].map(q => (
                  <button key={q} onClick={() => { answerWithFeedback(q); setShowBack(false) }} className={`py-2 rounded text-sm font-medium transition-colors ${q<3?'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600':'bg-green-500 hover:bg-green-600 text-white'}`}>{q}</button>
                ))}
              </div>
            </div>
          )}
          {!loading && finished && (
            <div className="card p-8 text-center space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">🎉 Session terminée</h2>
              <p className="text-gray-600 dark:text-gray-400">{session?.cardsStudied} cartes étudiées. Précision {(session?.performance.accuracy || 0)*100 | 0}%</p>
              <div className="flex flex-wrap gap-2 justify-center">
                <button onClick={() => { setShowMenu(true); setSelectedMode(null) }} className="btn-primary">Retour menu</button>
                <button onClick={() => { setShowMenu(false); rebuild() }} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Refaire</button>
              </div>
            </div>
          )}
          {/* Big celebration when finished */}
          {!loading && finished && session?.performance && session.performance.accuracy !== undefined && (
            (() => { successParticles(session.performance.accuracy); return null })()
          )}
        </div>
      </div>
    )
  }

  // Écran de sélection quand aucun deckId fourni
  if(!deckId){
    return (
      <FuturisticLayout>
        <div className="min-h-screen p-8 bg-transparent">
          <div className="max-w-4xl mx-auto">
            <motion.h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>🎓 Choisissez un paquet pour étudier</motion.h1>
            {decksLoading && <div className="card p-4 mb-4">Chargement des paquets...</div>}
            {!decksLoading && decks.length === 0 && (
              <div className="card p-6 text-center">
                <div className="text-5xl mb-4">📭</div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Aucun paquet disponible. Créez-en un pour commencer.</p>
                <button onClick={()=>navigate('/decks')} className="btn-primary">➕ Créer un paquet</button>
              </div>
            )}
            {!decksLoading && decks.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {decks.slice(0,12).map(d => (
                  <motion.button
                    key={d.id}
                    whileHover={{ y:-4, scale:1.02 }}
                    whileTap={{ scale:0.97 }}
                    onClick={()=>navigate(`/study/${d.id}`)}
                    className="group relative card text-left cursor-pointer overflow-hidden"
                  >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-blue-500/10 via-fuchsia-500/10 to-purple-600/10" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{d.icon || '📚'}</span>
                        <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">{d.name}</h3>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3 mb-3">{d.description || 'Pas de description'}</p>
                      <div className="flex justify-between text-[11px] text-gray-500 dark:text-gray-400">
                        <span>{d.totalCards} cartes</span>
                        <span>{d.masteredCards} maîtrisées</span>
                        <span className="text-blue-600 dark:text-blue-400">Étudier →</span>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
            {decks.length > 12 && (
              <div className="text-center mt-8">
                <button onClick={()=>navigate('/decks')} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-sm">Voir tous les paquets</button>
              </div>
            )}
          </div>
        </div>
      </FuturisticLayout>
    )
  }

  return (
    <FuturisticLayout>
    <div className="min-h-screen bg-transparent backdrop-blur-sm p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <motion.h1 
            className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-fuchsia-500 to-purple-600 mb-4 drop-shadow"
            initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6 }}
          >
            🧠 Mode Étude Intelligent
          </motion.h1>
          <motion.p className="text-gray-600 dark:text-gray-300 max-w-xl mx-auto"
            initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.4 }}
          >
            IA adaptative, répétition espacée SM‑2, transitions fluides et optimisation mémoire.
          </motion.p>
        </div>

        {/* Recommandations */}
        {recommendations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              🎯 Recommandations personnalisées
            </h2>
            <div className="grid gap-4">
              {recommendations.slice(0, 3).map((rec, index) => (
                <div key={index} className="card border-l-4 border-blue-500">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{rec.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{rec.description}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      rec.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                      rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                      'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    }`}>
                      {rec.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Modes d'étude */}
        {sessionAlerts.length > 0 && (
          <div className="mb-6 space-y-2">
            {sessionAlerts.map(a=> (
              <div key={a.id} className="rounded bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 px-3 py-2 text-sm border border-amber-300/40">
                ⚠️ {a.msg}
              </div>
            ))}
          </div>
        )}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { key:'review', icon:'🔁', title:'Révision IA', desc:"Répétition espacée (SM-2)" },
            { key:'quiz', icon:'📝', title:'Quiz Adaptatif', desc:"Difficulté intelligente" },
            { key:'speed', icon:'⚡', title:'Speed Round', desc:"Rendu ultra-rapide" },
            { key:'matching', icon:'🎯', title:'Associations', desc:"Transitions fluides" },
            { key:'writing', icon:'✍️', title:'Écriture IA', desc:"Correction intelligente" }
          ].map(m => (
            <motion.button 
              whileHover={{ scale:1.05, rotate:0.5 }}
              whileTap={{ scale:0.96 }}
              key={m.key} onClick={() => startStudySession(m.key as StudyMode)} 
              className="card text-center cursor-pointer group relative overflow-hidden"
            >
              <motion.div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-blue-500/10 via-fuchsia-500/10 to-purple-600/10" />
              <div className="relative z-10">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{m.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{m.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{m.desc}</p>
              </div>
            </motion.button>
          ))}
          <div className="card text-center bg-gradient-to-br from-purple-500 to-blue-600 text-white relative overflow-hidden">
            <motion.div className="absolute inset-0 opacity-30" animate={{ backgroundPosition:['0% 0%','100% 100%'] }} transition={{ repeat:Infinity, duration:15, ease:'linear' }} style={{ backgroundImage:'repeating-linear-gradient(45deg,rgba(255,255,255,0.15)0,rgba(255,255,255,0.15)2px,transparent 2px,transparent 6px)' }} />
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-lg font-semibold mb-1">Système Intégré</h3>
            <p className="text-purple-100 text-sm">7 systèmes d'optimisation</p>
            <div className="mt-2 text-xs text-purple-200">SystemIntegrationMaster + MemoryManager</div>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stat-card text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{quickStats.decks}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Decks actifs</div>
          </div>
          <div className="stat-card text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{quickStats.due}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Cartes dues</div>
          </div>
          <div className="stat-card text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{quickStats.fresh}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Nouvelles cartes</div>
          </div>
          <div className="stat-card text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              7/7
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Systèmes actifs</div>
          </div>
        </div>
        {/* Heatmap activité */}
        <div className="mt-8 card p-4">
          <StudyHeatmap days={120} />
        </div>

        {/* Indicateur des systèmes */}
        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-center gap-2 text-green-800 dark:text-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">
              Tous les systèmes d'optimisation sont opérationnels
            </span>
          </div>
        </div>
      </div>
    </div>
    </FuturisticLayout>
  )
}

export default StudyPage
