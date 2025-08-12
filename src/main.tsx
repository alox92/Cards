import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import '@/application/migrations/migrateDataUrlImagesToMedia'
import { ServiceProvider } from '@/ui/components/providers/ServiceProvider'
import { getFPSMonitor } from '@/utils/fpsMonitor'
import { logger } from '@/utils/logger'
import FLAGS from '@/utils/featureFlags'
import { PERFORMANCE_BUDGETS } from '@/utils/performanceBudgets'
import { reflowAuditor } from '@/utils/reflowAudit'

// Import du service worker pour PWA
// import { registerSW } from 'virtual:pwa-register'

// Configuration du service worker
// const updateSW = registerSW({
//   onNeedRefresh() {
//     if (confirm('Une nouvelle version est disponible. Voulez-vous l\'installer ?')) {
//       updateSW(true)
//     }
//   },
//   onOfflineReady() {
//     console.log('Application prête pour un usage hors ligne')
//   },
// })

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ServiceProvider>
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
      </BrowserRouter>
    </ServiceProvider>
  </React.StrictMode>
)

// Démarrage monitor global dev (si non déjà lancé par App) + flush batch périodique
{
  // Activation diagnostics via param URL ?diag=1 même en prod
  const params = new URLSearchParams(window.location.search)
  if(params.get('diag') === '1') {
    (FLAGS as any).diagnosticsEnabled = true
    logger.info('Diagnostics','Activation via param URL ?diag=1')
  }
  // Activation automatique reflow auditor si diagnostics actifs en dev
  if(FLAGS.diagnosticsEnabled && (import.meta as any).env?.DEV){
    reflowAuditor.enable()
  }

  const mon = getFPSMonitor();
  if(!(mon as any).running) mon.start()
  setInterval(()=> logger.flushBatch(), 5000)

  // Budget watcher (fps + mémoire)
  const budget = PERFORMANCE_BUDGETS
  setInterval(()=>{
    // FPS check (utilise stats courants)
    const stats = mon.getStats() as any
    if(stats.avg && stats.avg < budget.fpsMinAcceptable){
      logger.warn('PerformanceBudget','FPS en dessous du minimum', { avg: stats.avg, minAcceptable: budget.fpsMinAcceptable })
    }
    // Memory check si API disponible
    const mem: any = (performance as any).memory
    if(mem?.usedJSHeapSize){
      const mb = mem.usedJSHeapSize / 1024 / 1024
      if(mb > budget.memoryHardLimitMB){
        logger.error('PerformanceBudget','Dépassement mémoire HARD', { usedMB: Math.round(mb), hard: budget.memoryHardLimitMB })
      } else if(mb > budget.memorySoftLimitMB){
        logger.warn('PerformanceBudget','Dépassement mémoire SOFT', { usedMB: Math.round(mb), soft: budget.memorySoftLimitMB })
      }
    }
  }, 6000)
}
