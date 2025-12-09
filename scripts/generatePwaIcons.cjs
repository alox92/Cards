/*
 Génère des icônes PWA valides (192x192, 512x512) dans public/icons
 Utilise un simple dégradé bleu + cercle blanc centré.
*/
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PNG } = require('pngjs')

const outDir = path.resolve(__dirname, '..', 'public', 'icons')
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

function clamp(v, min, max){ return Math.max(min, Math.min(max, v)) }

function drawIcon(size){
  const png = new PNG({ width: size, height: size })
  const cx = size / 2
  const cy = size / 2
  const radius = size * 0.32

  for(let y=0; y<size; y++){
    for(let x=0; x<size; x++){
      const idx = (size * y + x) << 2

      // Fond: dégradé radial bleu
      const dx = (x - cx) / size
      const dy = (y - cy) / size
      const d = Math.sqrt(dx*dx + dy*dy)
      const t = clamp(1 - d * 1.4, 0, 1)
      const baseR = 59, baseG = 130, baseB = 246 // #3b82f6
      const darkR = 15, darkG = 23, darkB = 42    // #0f172a
      const r = Math.round(darkR + (baseR - darkR) * t)
      const g = Math.round(darkG + (baseG - darkG) * t)
      const b = Math.round(darkB + (baseB - darkB) * t)

      // Cercle central blanc (logo minimal)
      const dist = Math.hypot(x - cx, y - cy)
      const inCircle = dist <= radius
      if(inCircle){
        png.data[idx  ] = 255
        png.data[idx+1] = 255
        png.data[idx+2] = 255
        png.data[idx+3] = 255
      } else {
        png.data[idx  ] = r
        png.data[idx+1] = g
        png.data[idx+2] = b
        png.data[idx+3] = 255
      }
    }
  }
  return png
}

async function run(){
  const sizes = [192, 512]
  for(const s of sizes){
    const png = drawIcon(s)
    const file = path.join(outDir, `pwa-${s}.png`)
    await new Promise((resolve, reject)=>{
      png.pack().pipe(fs.createWriteStream(file)).on('finish', resolve).on('error', reject)
    })
    console.log('Generated', file)
  }
}

run().catch(err=>{ console.error(err); process.exit(1) })
