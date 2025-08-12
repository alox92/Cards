// Cloze parser: transforme texte contenant {{c1::...}} en version masquée + map
export interface ClozeParseResult { masked: string; map: Array<{ index:number; original:string }>; count: number }
const CLOZE_REGEX = /\{\{c(\d+)::(.*?)(?:::(.*?))?}}/g

export function parseCloze(source: string): ClozeParseResult {
  const map: Array<{index:number; original:string}> = []
  let masked = source
  let match: RegExpExecArray | null
  while((match = CLOZE_REGEX.exec(source))){
    const idx = Number(match[1])
    const original = match[2]
    map.push({ index: idx, original })
  }
  // Remplacement tardif pour éviter indices cassés
  masked = source.replace(CLOZE_REGEX, (_, n) => `[...](${n})`)
  return { masked, map, count: map.length }
}
