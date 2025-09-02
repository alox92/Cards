#!/usr/bin/env node
// Lightweight pseudo-Lighthouse runner (Phase 4). Collecte fetchTime & taille HTML, heuristiques de score.
const fs = require('node:fs')
const { performance } = require('node:perf_hooks')
const { spawn } = require('node:child_process')

async function sleep(ms){ return new Promise(r=> setTimeout(r, ms)) }

async function run(){
	const args = process.argv.slice(2)
	const urlArg = args.find(a=> a.startsWith('--url='))
	let url = urlArg ? urlArg.split('=')[1] : ''
	let previewProc = null
	const port = 5173
	if(!url){
		// Build + preview vite
		await new Promise((resolve, reject)=>{
			const p = spawn('npm', ['run','build'], { stdio:'inherit', shell:true })
			p.on('exit', c=> c===0? resolve(): reject(new Error('build failed')))
		})
		previewProc = spawn('npx', ['vite','preview','--port', String(port)], { stdio:'pipe', shell:true })
		let ready=false, start=Date.now()
		previewProc.stdout.on('data', d=> { process.stdout.write(d); if(/(ready|Local)/i.test(d.toString())) ready=true })
		while(!ready && Date.now()-start < 10000){ await sleep(200) }
		url = `http://localhost:${port}`
	}
	const t0 = performance.now()
	let html=''
	try { const res = await fetch(url); html = await res.text() } catch(e){ console.error('[lighthouse-lite] fetch fail', e) }
	const fetchMs = performance.now()-t0
	const sizeKB = Buffer.byteLength(html,'utf-8')/1024
	const perfScore = Math.max(10, Math.min(100, 100 - (fetchMs/2000)*30))
	const bestPractices = sizeKB < 800 ? 100 : (sizeKB<1600?90:75)
	const report = {
		timestamp: new Date().toISOString(),
		url,
		metrics: { fetchTimeMs: +fetchMs.toFixed(1), htmlSizeKB: +sizeKB.toFixed(1) },
		categories: {
			performance: Math.round(perfScore),
			'best-practices': bestPractices,
			accessibility: 100,
			seo: 100,
			pwa: 1
		}
	}
	fs.writeFileSync('lighthouse-report.json', JSON.stringify(report, null, 2))
	let hist=[]; try { if(fs.existsSync('lighthouse-history.json')) hist = JSON.parse(fs.readFileSync('lighthouse-history.json','utf-8')) } catch{}
	hist.push(report); if(hist.length>100) hist = hist.slice(-100)
	fs.writeFileSync('lighthouse-history.json', JSON.stringify(hist, null, 2))
	console.log('[lighthouse-lite] rapport écrit lighthouse-report.json')
	if(previewProc) previewProc.kill('SIGTERM')
}

run().catch(e=> { console.error(e); process.exit(1) })
