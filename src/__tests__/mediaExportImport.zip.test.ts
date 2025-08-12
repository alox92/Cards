import { describe, it, expect } from 'vitest'
import { exportMediaZip, importMediaZip } from '@/application/media/mediaExportImport'
import { container } from '@/application/Container'
import { CARD_REPOSITORY_TOKEN, type CardRepository } from '@/domain/repositories/CardRepository'
import { DexieMediaRepository, MEDIA_REPOSITORY_TOKEN } from '@/infrastructure/persistence/dexie/DexieMediaRepository'
import { CardEntity } from '@/domain/entities/Card'

const ONE_PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGJk+M/wHwAFAgJ/VJxT8QAAAABJRU5ErkJggg=='
const hasIndexedDB = typeof indexedDB !== 'undefined'

describe('media zip export/import', () => {
  it('génère et réimporte une archive zip', async () => {
    if(!hasIndexedDB){
      const blob = await exportMediaZip()
      expect(blob).toBeInstanceOf(Blob)
      return
    }
    const cardRepo = container.resolve<CardRepository>(CARD_REPOSITORY_TOKEN)
    const mediaRepo = container.resolve<DexieMediaRepository>(MEDIA_REPOSITORY_TOKEN)

    const card = new CardEntity({ deckId:'d_zip', frontText:'F', backText:'B', frontImage: ONE_PIXEL, backImage: ONE_PIXEL })
    await cardRepo.create(card)
    const frontBlob = await (await fetch(ONE_PIXEL)).blob(); const frontRef = await mediaRepo.save(frontBlob,'image', frontBlob.type)
    card.frontImage = frontRef.id; (card.mediaRefs ||= []).push(frontRef)
    await cardRepo.update(card)

    const zipBlob = await exportMediaZip()
    expect(zipBlob.size).toBeGreaterThan(0)

    // Purge DB
    const { aribaDB } = await import('@/infrastructure/persistence/dexie/AribaDB')
    await aribaDB.cards.clear(); await aribaDB.media.clear()

    const result = await importMediaZip(zipBlob)
    expect(result.media).toBeGreaterThanOrEqual(1)
    const restored = await cardRepo.getById(card.id)
    expect(restored).not.toBeNull()
  })
})
