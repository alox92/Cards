import { useContext } from 'react'
import { FeedbackCenterContext, type FeedbackCenterContextValue } from './FeedbackCenterContext.ts'

export function useFeedback(): FeedbackCenterContextValue{
  const ctx = useContext(FeedbackCenterContext)
  if(!ctx) throw new Error('useFeedback must be used inside FeedbackCenterProvider')
  return ctx
}

export default useFeedback
