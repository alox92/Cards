#!/usr/bin/env node
// Génère un badge SVG de couverture à partir de coverage-summary.json
const fs = require('fs')
const path = require('path')

const summaryPath = path.join(process.cwd(), 'coverage', 'coverage-summary.json')
if (!fs.existsSync(summaryPath)) {
  console.error('[coverage:badge] coverage-summary.json introuvable. Lancez d\'abord les tests avec --coverage.')
  process.exit(1)
}

const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'))
// On privilégie lines, sinon statements
const metric = summary.total.lines || summary.total.statements
const pct = metric.pct
let color = 'red'
if (pct >= 90) color = 'brightgreen'
else if (pct >= 80) color = 'green'
else if (pct >= 70) color = 'yellowgreen'
else if (pct >= 60) color = 'yellow'
else if (pct >= 50) color = 'orange'

const label = 'coverage'
const value = pct.toFixed(1) + '%'

// Dimensions approximatives selon longueur
const labelWidth = 70
const valueWidth = 60 + (value.length > 5 ? (value.length - 5) * 8 : 0)
const width = labelWidth + valueWidth

const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="20" role="img" aria-label="${label}: ${value}">\n  <linearGradient id="a" x2="0" y2="100%">\n    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>\n    <stop offset="1" stop-opacity=".1"/>\n  </linearGradient>\n  <mask id="m"><rect width="${width}" height="20" rx="3" fill="#fff"/></mask>\n  <g mask="url(#m)">\n    <rect width="${labelWidth}" height="20" fill="#555"/>\n    <rect x="${labelWidth}" width="${valueWidth}" height="20" fill="#${color}"/>\n    <rect width="${width}" height="20" fill="url(#a)"/>\n  </g>\n  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">\n    <text x="${labelWidth/2}" y="15" fill="#010101" fill-opacity=".3">${label}</text>\n    <text x="${labelWidth/2}" y="14">${label}</text>\n    <text x="${labelWidth + valueWidth/2}" y="15" fill="#010101" fill-opacity=".3">${value}</text>\n    <text x="${labelWidth + valueWidth/2}" y="14">${value}</text>\n  </g>\n</svg>`

const outDir = path.join(process.cwd(), 'coverage')
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
const outFile = path.join(outDir, 'badge.svg')
fs.writeFileSync(outFile, svg)
console.log(`[coverage:badge] Badge généré -> ${path.relative(process.cwd(), outFile)}`)

// Optionnel: rappel utilisateur
const mdSnippet = '![Coverage](./coverage/badge.svg)'
console.log(`Ajoutez ce badge au README si désiré:\n${mdSnippet}`)
