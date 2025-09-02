#!/usr/bin/env node
// Exécute vitest bench (texte) et ajoute snapshot agrégé à bench-history.json
const { spawn } = require('node:child_process')
const fs = require('node:fs')

function parseBench(text){
  const benches = []
  const lines = text.split(/\r?\n/)
  for(const raw of lines){
    if(!raw.includes('·')) continue
    const idx = raw.indexOf('·')
    if(idx === -1) continue
    let line = raw.slice(idx+1).trim() // après bullet
    if(!line) continue
    // Supprimer codes couleur ANSI
    line = line.replace(/\x1B\[[0-9;]*m/g,'')
    const tokens = line.split(/\s+/)
    const nameTokens = []
    let hz = null
    // Heuristique: les premiers tokens jusqu'à trouver un nombre >= 1000 ou contenant une virgule sont le hz, les précédents forment le nom
    for(let i=0;i<tokens.length;i++){
      const t = tokens[i]
      const num = parseFloat(t.replace(/,/g,''))
      const isNum = /^[\d,]+(\.\d+)?$/.test(t)
    // On considère le token comme hz si: valeur > 50000 (ops attendues) OU contient une virgule et il existe déjà au moins un token de nom.
    if(isNum && (num > 50000 || t.includes(',')) && nameTokens.length){ hz = t; break }
    nameTokens.push(t)
    }
    if(!hz) continue
    const ops = parseFloat(hz.replace(/,/g,''))
    if(Number.isNaN(ops)) continue
    const rawName = nameTokens.join(' ').trim()
    // Nettoyer éventuel restes (ex: trailing color resets)
    const name = rawName.replace(/[^\w\- ]+/g,' ').replace(/\s+/g,' ').trim()
    if(name) benches.push({ name, ops })
  }
  return benches
}

async function run(){
  console.log('[benchRecord] running vitest bench --run ...')
  let out = ''
  await new Promise((resolve, reject)=>{
    const p = spawn('npx', ['vitest','bench','--run'], { shell:true })
    p.stdout.on('data', d=> { process.stdout.write(d); out += d.toString() })
    p.stderr.on('data', d=> { process.stderr.write(d) })
    p.on('exit', c=> c===0? resolve(): reject(new Error('bench failed'))) 
  })
  const parsed = parseBench(out)
  if(process.env.BENCH_DEBUG){ console.log('[benchRecord][parsed]', parsed) }
  const snapshot = { timestamp: new Date().toISOString(), benches: parsed }
  let hist = []
  try { if(fs.existsSync('bench-history.json')) hist = JSON.parse(fs.readFileSync('bench-history.json','utf-8')) } catch{}
  // Nettoyer entrées vides anciennes
  hist = hist.filter(h=> Array.isArray(h.benches) ? h.benches.length>0 : true)
  hist.push(snapshot); if(hist.length>120) hist = hist.slice(-120)
  fs.writeFileSync('bench-history.json', JSON.stringify(hist, null, 2))
  console.log('[benchRecord] snapshot bench-history.json mis à jour (', parsed.length, 'bench(s) )')
}

run().catch(e=> { console.error(e); process.exit(1) })
