import { describe, it, expect } from 'vitest'
import { exportMediaArchive, importMediaArchive } from '@/application/media/mediaExportImport'
import { container } from '@/application/Container'
import { CARD_REPOSITORY_TOKEN, type CardRepository } from '@/domain/repositories/CardRepository'
import { DexieMediaRepository, MEDIA_REPOSITORY_TOKEN } from '@/infrastructure/persistence/dexie/DexieMediaRepository'
import { CardEntity } from '@/domain/entities/Card'

const ONE_PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGJk+M/wHwAFAgJ/VJxT8QAAAABJRU5ErkJggg=='

// Ce test se limite aux environnements disposant d'IndexedDB.
const hasIndexedDB = typeof indexedDB !== 'undefined'

describe('media export/import', () => {
  it('exporte puis réimporte media et cartes', async () => {
    if(!hasIndexedDB){
      // Skip logique: on vérifie simplement que l'export retourne des structures vides
      const empty = await exportMediaArchive()
      expect(Array.isArray(empty.manifest)).toBe(true)
      return
    }
    const cardRepo = container.resolve<CardRepository>(CARD_REPOSITORY_TOKEN)
    const mediaRepo = container.resolve<DexieMediaRepository>(MEDIA_REPOSITORY_TOKEN)

    // Crée une carte avec images DataURL puis déclenche migration manuelle pour disposer de mediaRefs
    const card = new CardEntity({ deckId:'d_exp', frontText:'F', backText:'B', frontImage: ONE_PIXEL, backImage: ONE_PIXEL })
    await cardRepo.create(card)
    // Simule migration: sauvegarde 1blob pour front/back
    const frontBlob = await (await fetch(ONE_PIXEL)).blob(); const frontRef = await mediaRepo.save(frontBlob,'image', frontBlob.type)
    const backBlob = await (await fetch(ONE_PIXEL)).blob(); const backRef = await mediaRepo.save(backBlob,'image', backBlob.type)
    card.frontImage = frontRef.id; card.backImage = backRef.id; (card.mediaRefs ||= []).push(frontRef, backRef)
    await cardRepo.update(card)

    const archive = await exportMediaArchive()
    expect(archive.manifest.length).toBeGreaterThanOrEqual(2)
    expect(Object.keys(archive.blobs).length).toBeGreaterThanOrEqual(2)

    // Purge la carte et media pour tester import (simple suppression via repos / DB directe)
  const { aribaDB } = await import('@/infrastructure/persistence/dexie/AribaDB')
  await aribaDB.cards.clear()
  await aribaDB.media.clear()

    const result = await importMediaArchive(archive)
    expect(result.cards).toBeGreaterThanOrEqual(1)
    expect(result.media).toBeGreaterThanOrEqual(2)
    const restored = await cardRepo.getById(card.id)
    expect(restored?.mediaRefs?.length).toBeGreaterThanOrEqual(2)
  })
})
