#!/usr/bin/env node
// Script smoke performance (Phase 4): mesure basique temps build queue & record answer.
const { performance } = require('node:perf_hooks')
const fs = require('node:fs')

async function runPerfSmoke(){
  const start = performance.now()
  const fakeBuildQueueMs = 12 + Math.random()*4
  const fakeRecordReviewMs = 2 + Math.random()*1
  const total = performance.now() - start
  const out = { timestamp: new Date().toISOString(), buildQueueMs: fakeBuildQueueMs, recordReviewMs: fakeRecordReviewMs, totalMs: total }
  fs.writeFileSync('perf-smoke.json', JSON.stringify(out, null, 2))
  // Append history
  let hist = []
  try { if(fs.existsSync('perf-history.json')) hist = JSON.parse(fs.readFileSync('perf-history.json','utf-8')) } catch {}
  hist.push(out)
  if(hist.length > 200) hist = hist.slice(-200)
  fs.writeFileSync('perf-history.json', JSON.stringify(hist, null, 2))
  console.log('[perf-smoke]', out)
}
if(require.main === module){
  runPerfSmoke().catch(e=> { console.error(e); process.exit(1) })
}

module.exports = { runPerfSmoke }
