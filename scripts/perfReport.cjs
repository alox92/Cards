#!/usr/bin/env node
// Génère perf-report.json fusionnant dernières entrées perf-smoke, bench-history, lighthouse-report et bundle manifest.
const fs = require('node:fs')

function readJson(p){ try { return JSON.parse(fs.readFileSync(p,'utf-8')) } catch { return null } }

function last(list){ if(Array.isArray(list) && list.length) return list[list.length-1]; return null }

function analyzeManifest(){
  const manPath = 'dist/.vite/manifest.json'
  if(!fs.existsSync(manPath)) return null
  try {
    const man = JSON.parse(fs.readFileSync(manPath,'utf-8'))
    let total = 0
    let entries = []
    for(const [k,v] of Object.entries(man)){
      if(v && v.file){
        const fPath = 'dist/'+v.file
        let size = 0
        try { size = fs.statSync(fPath).size } catch {}
        total += size
        entries.push({ id:k, file:v.file, size })
      }
    }
    entries.sort((a,b)=> b.size - a.size)
    return { totalBytes: total, largest: entries.slice(0,10) }
  } catch { return null }
}

function main(){
  const smoke = readJson('perf-smoke.json')
  const benchHist = readJson('bench-history.json')
  const bench = last(benchHist)
  const lighthouse = readJson('lighthouse-report.json')
  const bundle = analyzeManifest()
  const report = {
    generatedAt: new Date().toISOString(),
    smoke,
    bench,
    lighthouse,
    bundle,
    summary: {}
  }
  // Summary heuristique
  if(smoke){
    report.summary.smokeScore = Math.max(0, 100 - (smoke.buildQueueMs/50)*10 - (smoke.recordReviewMs/20)*10)
  }
  if(bench && bench.benches){
    const single = bench.benches.find(b=> b.name.includes('sm2Update single'))
    if(single) report.summary.sm2SingleOps = single.ops
  }
  if(bundle){
    report.summary.bundleKB = +(bundle.totalBytes/1024).toFixed(1)
  }
  fs.writeFileSync('perf-report.json', JSON.stringify(report, null, 2))
  console.log('[perf-report] écrit perf-report.json')
}

main()
