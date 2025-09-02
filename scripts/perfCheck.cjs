#!/usr/bin/env node
// Compare dernières entrées perf-smoke & bench vs seuils.
const fs = require('node:fs')

const THRESHOLDS = {
  buildQueueMs: 25,           // Fictif: max acceptable
  recordReviewMs: 8,          // Fictif
  benchMinOps: {              // min ops/s pour certains tests clés (nom contient fragment)
    'sm2Update single': 5000000,
    'sm2Update batch 2000': 8000,
    'sm2Update x5000': 3500,
  }
}

function readJson(path){ try { return JSON.parse(fs.readFileSync(path,'utf-8')) } catch { return null } }

function fail(msg){ console.error('\x1b[31m[perfCheck] FAIL\x1b[0m', msg); process.exitCode = 1 }
function ok(msg){ console.log('\x1b[32m[perfCheck] OK\x1b[0m', msg) }

function checkSmoke(){
  const smoke = readJson('perf-smoke.json')
  if(!smoke){ fail('perf-smoke.json absent'); return }
  if(smoke.buildQueueMs > THRESHOLDS.buildQueueMs) fail(`buildQueueMs ${smoke.buildQueueMs.toFixed(2)} > ${THRESHOLDS.buildQueueMs}`)
  else ok(`buildQueueMs ${smoke.buildQueueMs.toFixed(2)}`)
  if(smoke.recordReviewMs > THRESHOLDS.recordReviewMs) fail(`recordReviewMs ${smoke.recordReviewMs.toFixed(2)} > ${THRESHOLDS.recordReviewMs}`)
  else ok(`recordReviewMs ${smoke.recordReviewMs.toFixed(2)}`)
}

function checkBench(){
  const hist = readJson('bench-history.json')
  if(!Array.isArray(hist) || hist.length === 0){ fail('bench-history.json vide'); return }
  const last = hist[hist.length-1]
  for(const [frag, minOps] of Object.entries(THRESHOLDS.benchMinOps)){
    const match = last.benches.find(b=> b.name.includes(frag))
    if(!match){ fail(`bench fragment manquant: ${frag}`); continue }
    if(match.ops < minOps) fail(`${match.name} ${match.ops} < ${minOps}`)
    else ok(`${match.name} ${match.ops}`)
  }
}

checkSmoke(); checkBench();
if(process.exitCode === 1){ console.error('[perfCheck] Regression détectée.') }
else console.log('[perfCheck] Tous les seuils respectés.')
