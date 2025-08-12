import { container } from '@/application/Container'
import { CARD_REPOSITORY_TOKEN } from '@/domain/repositories/CardRepository'
import type { CardRepository } from '@/domain/repositories/CardRepository'
import { MEDIA_REPOSITORY_TOKEN, DexieMediaRepository } from '@/infrastructure/persistence/dexie/DexieMediaRepository'
import { CardEntity } from '@/domain/entities/Card'

const isDataUrl = (v?: string) => !!v && v.startsWith('data:image/')

export async function migrateDataUrlImagesToMedia(){
  // Si IndexedDB indisponible (environnements tests Node sans polyfill), on ignore la migration.
  if (typeof indexedDB === 'undefined') {
    return { total: 0, converted: 0, skipped: true }
  }
  const cardRepo = container.resolve<CardRepository>(CARD_REPOSITORY_TOKEN)
  const mediaRepo = container.resolve<DexieMediaRepository>(MEDIA_REPOSITORY_TOKEN)
  const cards = await cardRepo.getAll()
  let converted = 0
  for(const card of cards){
    let mutated = false
    if(isDataUrl(card.frontImage)){
      try { const blob = await (await fetch(card.frontImage!)).blob(); const ref = await mediaRepo.save(blob,'image', blob.type); card.frontImage = ref.id; (card.mediaRefs ||= []).push(ref); mutated = true } catch(e){ console.warn('Migration frontImage échouée', card.id, e) }
    }
    if(isDataUrl(card.backImage)){
      try { const blob = await (await fetch(card.backImage!)).blob(); const ref = await mediaRepo.save(blob,'image', blob.type); card.backImage = ref.id; (card.mediaRefs ||= []).push(ref); mutated = true } catch(e){ console.warn('Migration backImage échouée', card.id, e) }
    }
    if(mutated){
      converted++
      await cardRepo.update(card as CardEntity)
    }
  }
  return { total: cards.length, converted }
}

if(typeof window !== 'undefined' && !(window as any).__ARIBA_MIGRATION_DISABLED__){
  try {
    const LS_KEY = 'ariba_media_migration_v1_done'
    const ls = (window as any).localStorage
    const already = ls?.getItem?.(LS_KEY)
    if(!already){
      migrateDataUrlImagesToMedia().then(r => {
        if(r.converted>0){ console.info(`[Migration] Images converties DataURL->media: ${r.converted}/${r.total}`) }
        try { ls?.setItem?.(LS_KEY, Date.now().toString()) } catch {}
      }).catch(e => console.warn('[Migration] Échec migration images', e))
    }
  } catch {}
}
