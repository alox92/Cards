// Utilities de sanitisation HTML pour l'éditeur rich text et le rendu
// Utilise DOMPurify si disponible, sinon un fallback simple (moins robuste)

type DomPurifyLike = {
  sanitize: (html: string, config?: Record<string, unknown>) => string
}

let DOMPurify: DomPurifyLike | null = null
let purifyPromise: Promise<void> | null = null

function initDOMPurify(): Promise<void> {
  if (!purifyPromise && typeof window !== 'undefined') {
    purifyPromise = import('dompurify')
      .then((module: any) => {
        const candidate = module?.default ?? module
        if (candidate && typeof candidate.sanitize === 'function') {
          DOMPurify = candidate as DomPurifyLike
        }
      })
      .catch(() => {
        DOMPurify = null
      })
  }
  return purifyPromise || Promise.resolve()
}

// Version synchrone pour compatibilité - essaie d'utiliser DOMPurify si déjà chargé
export function sanitizeHtml(html: string): string {
  if (!html) return ''
  html = stripBidiControls(html)
  
  // Tenter l'initialisation en arrière-plan si pas encore fait
  if (!DOMPurify && !purifyPromise) {
    initDOMPurify().catch(() => {/* ignore */})
  }
  
  try {
    if (DOMPurify && typeof window !== 'undefined') {
      return stripBidiControls(DOMPurify.sanitize(html, { USE_PROFILES: { html: true } }))
    }
  } catch {
    // ignore et fallback
  }
  // Fallback naïf: supprimer scripts, iframes, on* handlers
  return stripBidiControls(html)
    .replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script>/gi, '')
    .replace(/<\s*iframe[^>]*>[\s\S]*?<\s*\/\s*iframe>/gi, '')
    .replace(/ on[a-z]+\s*=\s*"[^"]*"/gi, '')
    .replace(/ on[a-z]+\s*=\s*'[^']*'/gi, '')
    .replace(/ on[a-z]+\s*=\s*[^\s>]+/gi, '')
}

// Sanitize simple HTML (usage affichage carte / résultats recherche).
// Stratégie: échapper tout puis réintroduire un sous‑ensemble sûr.

const ALLOWED = new Set([
  'b','i','u','s','em','strong','mark','br','span','code','pre',
  'p','blockquote','hr','sup','sub',
  'a','img',
  'ul','ol','li',
  'table','thead','tbody','tfoot','tr','td','th','caption','figure','figcaption',
  'h1','h2','h3','h4','h5','h6'
])

export function escapeHtml(str: string){
  return str
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;')
}

export function basicSanitize(html: string){
  if(!html) return ''
  html = stripBidiControls(html)
  try {
    const DP: any = (globalThis as any).DOMParser
    if(!DP){
      // Fallback minimal si DOM indisponible: retirer complètement les tags non autorisés
      return stripBidiControls(html).replace(/<([^>]+)>/g, (m, inside) => {
        const tag = inside.trim().toLowerCase().replace(/\/.*/,'').split(/\s+/)[0]
        return ALLOWED.has(tag.replace(/\//g,'')) ? m.replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi,'') : ''
      })
    }
    const parser = new DP()
    const doc = parser.parseFromString(html, 'text/html') as Document
    const allowed = ALLOWED

    const isSafeUrl = (url: string) => {
      try {
        const trimmed = url.trim()
        if(/^\s*javascript:/i.test(trimmed)) return false
        const u = new URL(trimmed, 'https://example.invalid')
        return ['http:','https:','mailto:','tel:','blob:'].includes(u.protocol)
      } catch { return false }
    }
    const isSafeDataImage = (src: string) => /^data:image\/(png|jpeg|jpg|gif|webp);base64,/i.test(src.trim())

    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT)
    const toRemove: Element[] = []
    const toUnwrap: Element[] = []
    while(walker.nextNode()){
      const el = walker.currentNode as HTMLElement
      const tag = el.tagName.toLowerCase()
      if(['script','style','iframe','object','embed','link','meta','svg','math'].includes(tag)) { toRemove.push(el); continue }
      if(!allowed.has(tag)) { toUnwrap.push(el); continue }

      for(const attr of [...el.attributes]){
        const name = attr.name.toLowerCase()
        const value = attr.value
        if(/^on/i.test(name)) { el.removeAttribute(attr.name); continue }
        // basic: pas de style inline
        if(name === 'style'){ el.removeAttribute('style'); continue }
        // whitelist par balise
        const allowedByTag: Record<string, Set<string>> = {
          'a': new Set(['href','title','target','rel']),
          'img': new Set(['src','alt','title','width','height']),
          'td': new Set(['colspan','rowspan']),
          'th': new Set(['colspan','rowspan','scope']),
        }
        const perTag = allowedByTag[tag]
        if(perTag && !perTag.has(name)){ el.removeAttribute(attr.name); continue }
        if(!perTag && !['id','class'].includes(name)){ el.removeAttribute(attr.name); continue }

        if(tag === 'a' && name === 'href'){ if(!isSafeUrl(value)) el.removeAttribute('href') }
        if(tag === 'a' && name === 'target'){ if(!/^_(blank|self)$/i.test(value)) el.setAttribute('target','_self') }
        if(tag === 'a' && name === 'rel'){
          const rel = new Set((value||'').toLowerCase().split(/\s+/).filter(Boolean))
          ;['noopener','noreferrer','nofollow'].forEach(r=> rel.add(r))
          el.setAttribute('rel', Array.from(rel).join(' '))
        }
        if(tag === 'img' && name === 'src'){
          const v = value.trim()
          const ok = /^https?:/i.test(v) || /^blob:/i.test(v) || isSafeDataImage(v)
          if(!ok){ toRemove.push(el); break }
        }
      }
    }
    for(const el of toUnwrap){ const p = el.parentNode; if(!p) continue; while(el.firstChild){ p.insertBefore(el.firstChild, el) } el.remove() }
    toRemove.forEach(e=> e.remove())
    return stripBidiControls(doc.body.innerHTML)
  } catch { return '' }
}

export function highlightAndSanitize(text: string, query: string){
  const safe = escapeHtml(text)
  if(!query) return safe
  const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')
  return safe.replace(new RegExp(safeQuery,'ig'), m=> `<mark>${m}</mark>`) // mark déjà autorisé
}

// Sanitation riche (éditeurs) :
// - supprime éléments dangereux
// - restreint aux balises autorisées
// - nettoie attributs (href/src sûrs, pas d'events)
// - filtre styles inline à un petit sous‑ensemble
export function sanitizeRich(html: string){
  if(!html) return ''
  html = stripBidiControls(html)
  try {
    const DP: any = (globalThis as any).DOMParser
    if(!DP){
      // environnement non‑DOM (SSR?) — fallback sur sanitizeHtml/basique
      return sanitizeHtml(html)
    }

    const parser = new DP()
    const doc = parser.parseFromString(html, 'text/html') as Document

    const ALLOWED_RICH = new Set([
      'b','strong','i','em','u','s','mark','br','span','code','pre',
      'p','blockquote','hr','sup','sub',
      'a','img',
      'ul','ol','li',
      'table','thead','tbody','tfoot','tr','td','th','caption',
      'figure','figcaption',
      'h1','h2','h3','h4','h5','h6'
    ])

    const isSafeUrl = (url: string) => {
      try {
        const trimmed = url.trim()
        if(/^\s*javascript:/i.test(trimmed)) return false
        if(/^\s*data:/i.test(trimmed)) return false // par défaut, bloquer data: sur liens
        const u = new URL(trimmed, 'https://example.invalid')
        return ['http:','https:','mailto:','tel:','blob:'].includes(u.protocol)
      } catch { return false }
    }

    const isSafeDataImage = (src: string) => {
      const s = src.trim()
      // autoriser uniquement certaines images data: (pas de SVG inline)
      return /^data:image\/(png|jpeg|jpg|gif|webp);base64,/i.test(s)
    }

    const sanitizeInlineStyle = (styleVal: string) => {
      const out: string[] = []
      // autorisés: color, background-color, text-align, font-weight, font-style, text-decoration,
      //             font-size, line-height, margins, width/max-width
      const allowedProps = new Set([
        'color','background-color','text-align','font-weight','font-style','text-decoration',
        'font-size','line-height',
        'margin','margin-top','margin-bottom','margin-left','margin-right',
        'width','max-width'
      ])
      const isSafeColor = (v: string) => /^(#[0-9a-fA-F]{3}|#[0-9a-fA-F]{6}|rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)|rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*(0|1|0?\.\d+)\s*\)|hsl\([^)]*\)|hsla\([^)]*\)|[a-zA-Z]+)$/.test(v)
      const isSafeAlign = (v: string) => /^(left|right|center|justify)$/i.test(v)
      const isSafeWeight = (v: string) => /^(normal|bold|[1-9]00)$/i.test(v)
      const isSafeStyle = (v: string) => /^(normal|italic|oblique)$/i.test(v)
      const isSafeDecoration = (v: string) => /^(none|underline|line-through|overline)$/i.test(v)
      const isSafeLength = (v: string) => /^(0|\d{1,3}(?:\.\d+)?(px|rem|em|%)|auto)$/i.test(v)
      const isSafeFontSize = (v: string) => /^(xx-small|x-small|small|medium|large|x-large|xx-large|smaller|larger|\d{1,3}(?:\.\d+)?(px|rem|em|%)?)$/i.test(v)
      const isSafeLineHeight = (v: string) => /^(normal|\d{1,3}(?:\.\d+)?(px|rem|em)?|\d(?:\.\d+)?)$/i.test(v)
      const isSafeWidth = (v: string) => /^(auto|\d{1,3}(?:\.\d+)?(px|%)?)$/i.test(v)
      for(const decl of styleVal.split(';')){
        const [rawProp, rawVal] = decl.split(':')
        if(!rawProp || !rawVal) continue
        const prop = rawProp.trim().toLowerCase()
        const val = rawVal.trim()
        if(!allowedProps.has(prop)) continue
        if(prop === 'color' || prop === 'background-color'){ if(isSafeColor(val)) out.push(`${prop}:${val}`); continue }
        if(prop === 'text-align'){ if(isSafeAlign(val)) out.push(`${prop}:${val}`); continue }
        if(prop === 'font-weight'){ if(isSafeWeight(val)) out.push(`${prop}:${val}`); continue }
        if(prop === 'font-style'){ if(isSafeStyle(val)) out.push(`${prop}:${val}`); continue }
        if(prop === 'text-decoration'){ if(isSafeDecoration(val)) out.push(`${prop}:${val}`); continue }
        if(prop === 'font-size'){ if(isSafeFontSize(val)) out.push(`${prop}:${val}`); continue }
        if(prop === 'line-height'){ if(isSafeLineHeight(val)) out.push(`${prop}:${val}`); continue }
        if(prop === 'margin' || prop === 'margin-top' || prop === 'margin-bottom' || prop === 'margin-left' || prop === 'margin-right'){
          // margin peut être une liste de 1 à 4 valeurs
          const parts = val.split(/\s+/)
          if(parts.every(p=> isSafeLength(p))) out.push(`${prop}:${val}`)
          continue
        }
        if(prop === 'width' || prop === 'max-width'){ if(isSafeWidth(val)) out.push(`${prop}:${val}`); continue }
      }
      return out.join(';')
    }

    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT)
    const toRemove: Element[] = []
    const toUnwrap: Element[] = []
    while(walker.nextNode()){
      const el = walker.currentNode as HTMLElement
      const tag = el.tagName.toLowerCase()
      if(['script','style','iframe','object','embed','link','meta','svg','math'].includes(tag)) { toRemove.push(el); continue }
      if(!ALLOWED_RICH.has(tag)) { toUnwrap.push(el); continue }

      // Nettoyage des attributs génériques
      for(const attr of [...el.attributes]){
        const name = attr.name.toLowerCase()
        const value = attr.value
        if(/^on/i.test(name)) { el.removeAttribute(attr.name); continue }
        if(name === 'srcdoc') { el.removeAttribute(attr.name); continue }
        if(name === 'dir') { el.removeAttribute(attr.name); continue }
        // Retirer tout attribut non listé explicitement par balise
        const allowedByTag: Record<string, Set<string>> = {
          'a': new Set(['href','title','target','rel','style']),
          'img': new Set(['src','alt','title','width','height','style']),
          'td': new Set(['colspan','rowspan','style']),
          'th': new Set(['colspan','rowspan','scope','style']),
          'figure': new Set(['style']),
          'figcaption': new Set(['style']),
        }
        const globalAllowed = new Set(['style'])
        const perTag = allowedByTag[tag]
        const isAllowed = perTag ? perTag.has(name) : globalAllowed.has(name)
        if(!isAllowed){ el.removeAttribute(attr.name); continue }

        // Vérifs spécifiques
        if(tag === 'a' && name === 'href'){
          if(!isSafeUrl(value)) el.removeAttribute('href')
        }
        if(tag === 'a' && name === 'target'){
          // uniquement _blank ou _self
          if(!/^_(blank|self)$/i.test(value)) el.setAttribute('target','_self')
        }
        if(tag === 'img' && name === 'src'){
          const v = value.trim()
          const ok = /^https?:/i.test(v) || /^blob:/i.test(v) || isSafeDataImage(v)
          if(!ok){ toRemove.push(el); break }
        }
        if(name === 'style'){
          const cleaned = sanitizeInlineStyle(value)
          if(cleaned) el.setAttribute('style', cleaned)
          else el.removeAttribute('style')
        }
      }

      if(tag === 'a'){
        // renforcer rel
        const existingRel = (el.getAttribute('rel')||'').toLowerCase()
        const relParts = new Set(existingRel.split(/\s+/).filter(Boolean))
        ;['noopener','noreferrer','nofollow'].forEach(r=> relParts.add(r))
        el.setAttribute('rel', Array.from(relParts).join(' '))
      }
    }

    // unwrap des balises non autorisées
    for(const el of toUnwrap){
      const parent = el.parentNode
      if(!parent) continue
      while(el.firstChild){ parent.insertBefore(el.firstChild, el) }
      el.remove()
    }
    // suppression des éléments dangereux
    toRemove.forEach(e=> e.remove())

    return stripBidiControls(doc.body.innerHTML)
  } catch { return '' }
}

// Supprime les caractères de contrôle bidi responsables d'inversions visuelles
// U+202A..U+202E (LRE/RLE/LRO/RLO/PDF), U+2066..U+2069 (LRI/RLI/FSI/PDI),
// U+200E (LRM), U+200F (RLM), U+061C (ALM)
const BIDI_CONTROL_REGEX = /[\u202A\u202B\u202D\u202E\u202C\u2066\u2067\u2068\u2069\u200E\u200F\u061C]/g
export function stripBidiControls(input: string){
  return (input || '').replace(BIDI_CONTROL_REGEX, '')
}
