import { container } from '../Container'
import { DexieMediaRepository } from '@/infrastructure/persistence/dexie/DexieMediaRepository'

export class MediaService {
  private repo: DexieMediaRepository
  constructor(repo?: DexieMediaRepository){ this.repo = repo || container.resolve(DexieMediaRepository as any) }
  async saveImage(file: File){ return this.repo.save(file, 'image', file.type) }
  async saveAudio(file: File){ return this.repo.save(file, 'audio', file.type) }
  async savePdf(file: File){ return this.repo.save(file, 'pdf', file.type) }
  async getUrl(id: string){ const row = await this.repo.get(id); return row? URL.createObjectURL(row.blob): null }
}
export const MEDIA_SERVICE_TOKEN = 'MediaService'
