import { createContext } from 'react'

export type FeedbackType = 'click' | 'success' | 'error' | 'warning'

export interface FeedbackCenterContextValue {
  play: (type?: FeedbackType) => void
  successParticles: (accuracy: number) => void
  enableSound: boolean
  enableHaptics: boolean
  toggleSound: () => void
  toggleHaptics: () => void
  particlesRequest?: { id: number; intensity: number }
}

export const FeedbackCenterContext = createContext<FeedbackCenterContextValue | null>(null)
