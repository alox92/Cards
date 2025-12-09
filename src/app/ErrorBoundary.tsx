import React from 'react'
import { logger } from '@/utils/logger'

interface ErrorBoundaryState { hasError: boolean; error?: any }

interface ErrorBoundaryProps { fallback?: React.ReactNode }
interface ErrorBoundaryProps { fallback?: React.ReactNode; children?: React.ReactNode }

// Fallback minimal offline + message erreur
function DefaultFallback(){
  const offline = typeof navigator !== 'undefined' && navigator.onLine === false
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui', textAlign: 'center' }}>
      <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Une erreur s'est produite</h1>
      {offline && <p style={{ marginTop: '0.5rem' }}>Vous semblez hors‑ligne. Reconnectez-vous puis rechargez la page.</p>}
      {!offline && <p style={{ marginTop: '0.5rem' }}>Rechargez la page. Si le problème persiste, exportez les logs diagnostics.</p>}
      <button onClick={()=> window.location.reload()} style={{ marginTop: '1rem', background:'#2563eb', color:'#fff', padding:'0.5rem 1rem', borderRadius:4 }}>Recharger</button>
    </div>
  )
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }
  static getDerivedStateFromError(error: any): ErrorBoundaryState { return { hasError: true, error } }
  componentDidCatch(error: any, info: any){
    logger.error('ErrorBoundary', 'Unhandled react error', { error: String(error), info })
  }
  render(){
    if(this.state.hasError){ return this.props.fallback || <DefaultFallback /> }
    return this.props.children
  }
}

export default ErrorBoundary
