import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

type FeedbackType = 'click' | 'success' | 'error' | 'warning'

interface FeedbackCenterContextValue {
  play: (type?: FeedbackType) => void
  successParticles: (accuracy: number) => void
  enableSound: boolean
  enableHaptics: boolean
  toggleSound: () => void
  toggleHaptics: () => void
  particlesRequest?: { id: number; intensity: number }
}

const FeedbackCenterContext = createContext<FeedbackCenterContextValue | null>(null)
let particleIdSeq = 0

export const FeedbackCenterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [enableSound, setEnableSound] = useState(true)
  const [enableHaptics, setEnableHaptics] = useState(true)
  const audioCache = useRef<Record<string, HTMLAudioElement>>({})
  const [particlesRequest, setParticlesRequest] = useState<{ id: number; intensity: number }>()

  const play = useCallback((type: FeedbackType = 'click') => {
    if (enableSound) {
      const key = type
      if (!audioCache.current[key]) {
        const sources: Record<string, string> = {
          click: 'UklGRhQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQwAAAABAQEBAQEBAQ==',
          success: 'UklGRiQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQwAAAAAgICAf39/fw==',
          error: 'UklGRiQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQwAAAABAICAf39/fw==',
          warning: 'UklGRiQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQwAAAAAgIB/AQEBAQ=='
        }
        audioCache.current[key] = new Audio(`data:audio/wav;base64,${sources[key]}`)
        audioCache.current[key].volume = 0.15
      }
      audioCache.current[key].currentTime = 0
      audioCache.current[key].play().catch(()=>{})
    }
    if (enableHaptics && navigator.vibrate) {
      const pattern = type === 'success' ? [10,20,10] : type === 'error' ? [30,40,30] : [8]
      navigator.vibrate(pattern)
    }
  }, [enableSound, enableHaptics])

  const successParticles = useCallback((accuracy: number) => {
    const intensity = Math.min(1, Math.max(0, accuracy))
    setParticlesRequest({ id: ++particleIdSeq, intensity })
    play('success')
  }, [play])

  const value = useMemo(() => ({
    play,
    successParticles,
    enableSound,
    enableHaptics,
    toggleSound: () => setEnableSound(s => !s),
    toggleHaptics: () => setEnableHaptics(h => !h),
    particlesRequest
  }), [play, successParticles, enableSound, enableHaptics, particlesRequest])

  return <FeedbackCenterContext.Provider value={value}>{children}</FeedbackCenterContext.Provider>
}

export function useFeedback(){
  const ctx = useContext(FeedbackCenterContext)
  if(!ctx) throw new Error('useFeedback must be used inside FeedbackCenterProvider')
  return ctx
}
