// Palette & accent color utilities extracted from App.tsx for reuse & memoization.
// Phase 1 refactor: centralize dynamic accent color generation.

let lastHex: string | null = null
let cached: Record<string,string> | null = null

function hexToHsl(hex: string){
  const clean = hex.replace('#','')
  if(!/^([0-9a-fA-F]{6})$/.test(clean)) return null
  const r = parseInt(clean.substring(0,2),16)/255
  const g = parseInt(clean.substring(2,4),16)/255
  const b = parseInt(clean.substring(4,6),16)/255
  const max = Math.max(r,g,b), min = Math.min(r,g,b)
  let h = 0, s = 0
  const l = (max+min)/2
  const d = max - min
  if(d!==0){
    s = l > .5 ? d/(2 - max - min) : d/(max + min)
    switch(max){
      case r: h = (g-b)/d + (g < b ? 6 : 0); break
      case g: h = (b-r)/d + 2; break
      case b: h = (r-g)/d + 4; break
    }
    h /= 6
  }
  return {h,s,l}
}

function hslToHex(h:number,s:number,l:number){
  const hue2rgb = (p:number,q:number,t:number)=>{
    if(t<0) t+=1
    if(t>1) t-=1
    if(t<1/6) return p + (q-p)*6*t
    if(t<1/2) return q
    if(t<2/3) return p + (q-p)*(2/3 - t)*6
    return p
  }
  let r:number,g:number,b:number
  if(s===0){ r=g=b=l } else {
    const q = l < .5 ? l * (1 + s) : l + s - l*s
    const p = 2*l - q
    r = hue2rgb(p,q,h + 1/3)
    g = hue2rgb(p,q,h)
    b = hue2rgb(p,q,h - 1/3)
  }
  const toHex = (v:number)=>{
    const cl = Math.round(Math.min(255, Math.max(0, v*255)))
    return cl.toString(16).padStart(2,'0')
  }
  return '#' + toHex(r)+toHex(g)+toHex(b)
}

export function applyAccentPalette(hex: string){
  if(hex === lastHex && cached){
    // Already applied
    return cached
  }
  const root = document.documentElement
  const hsl = hexToHsl(hex)
  if(!hsl) return null
  const {h,s,l} = hsl
  const lightnessScale = [0.9,0.8,0.7,0.6,0.5,0.4,0.32,0.24,0.16]
  const result: Record<string,string> = {}
  lightnessScale.forEach((L, idx) => {
    const name = `--accent-${(idx+1)*100}`
    const val = hslToHex(h,s,L)
    root.style.setProperty(name, val)
    result[name] = val
  })
  root.style.setProperty('--accent-h', (h*360).toFixed(1))
  root.style.setProperty('--accent-s', (s*100).toFixed(1)+'%')
  root.style.setProperty('--accent-l', (l*100).toFixed(1)+'%')
  lastHex = hex
  cached = result
  return result
}
