#!/usr/bin/env node
/**
 * Gate apprentissage Phase 5.
 * Évalue dérive de accuracy sur derniers snapshots learning-history.json.
 */
import fs from 'fs'
const FILE = 'learning-history.json'
const history = (()=>{ try { return JSON.parse(fs.readFileSync(FILE,'utf-8')) } catch { return [] } })()
if(history.length < 5){ console.log('[learnCheck] Pas assez de données (need >=5)'); process.exit(0) }
const lastN = history.slice(-10)
const accuracies = lastN.map(s=> s.accuracy).filter(a=> typeof a === 'number')
if(accuracies.length < 5){ console.log('[learnCheck] Accuracies insuffisantes'); process.exit(0) }
const avg = accuracies.reduce((a,b)=>a+b,0)/accuracies.length
const recent = accuracies.slice(-3)
const recentAvg = recent.reduce((a,b)=>a+b,0)/recent.length
const dropPct = avg ? ((avg - recentAvg)/avg)*100 : 0
const THRESH_DROP = 15 // %
if(dropPct > THRESH_DROP){
  console.error(`[learnCheck] Regression accuracy ${dropPct.toFixed(1)}% (> ${THRESH_DROP}%)`)
  process.exit(1)
}
console.log(`[learnCheck] OK avg=${avg.toFixed(1)} recent=${recentAvg.toFixed(1)} drop=${dropPct.toFixed(1)}%`)
