import { aribaDB, type MediaRow } from "./AribaDB";

export interface MediaRepository {
  save(
    blob: Blob,
    type: MediaRow["type"],
    mime: string
  ): Promise<{ id: string; key: string; type: MediaRow["type"] }>;
  get(id: string): Promise<MediaRow | undefined>;
  delete(id: string): Promise<void>;
}

export interface DexieMediaRepositoryOptions {
  enableDedup?: boolean;
}

export class DexieMediaRepository implements MediaRepository {
  constructor(private readonly options: DexieMediaRepositoryOptions = {}) {}

  async save(blob: Blob, type: MediaRow["type"], mime: string) {
    const genId = () =>
      `media_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const checksum = await this.computeChecksumSafe(blob);

    if (checksum && this.shouldDeduplicate()) {
      try {
        const existing = await aribaDB.media
          .where("checksum")
          .equals(checksum)
          .first();
        if (existing && existing.mime === mime && existing.type === type) {
          return { id: existing.id, key: existing.id, type: existing.type };
        }
      } catch {
        // ignore lookup failures and fall back to creating a fresh entry
      }
    }

    const id = genId();
    const row: MediaRow = {
      id,
      type,
      mime,
      blob,
      created: Date.now(),
      checksum: checksum ?? undefined,
    };

    await aribaDB.media.put(row);
    return { id, key: id, type };
  }

  async get(id: string) {
    const row = await aribaDB.media.get(id);
    if (!row) {
      return undefined;
    }
    return this.ensureBlob(row);
  }

  async delete(id: string) {
    await aribaDB.media.delete(id);
  }

  private shouldDeduplicate(): boolean {
    return this.options.enableDedup ?? false;
  }

  private async computeChecksumSafe(blob: Blob): Promise<string | undefined> {
    try {
      const hash = await this.computeChecksum(blob);
      return hash;
    } catch {
      return undefined;
    }
  }

  private async computeChecksum(blob: Blob): Promise<string> {
    const CHUNK_SIZE = 1024 * 1024;

    if (typeof crypto !== "undefined" && crypto.subtle) {
      try {
        if (
          typeof (blob as any).stream === "function" &&
          typeof (globalThis as any).ReadableStream !== "undefined"
        ) {
          const reader = blob.stream().getReader();
          const chunks: Uint8Array[] = [];
          let total = 0;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
              chunks.push(value);
              total += value.length;
              if (total > 50 * CHUNK_SIZE) {
                break;
              }
            }
          }

          const merged = new Uint8Array(total);
          let offset = 0;
          for (const chunk of chunks) {
            merged.set(chunk, offset);
            offset += chunk.length;
          }

          const hash = await crypto.subtle.digest("SHA-256", merged);
          return Array.from(new Uint8Array(hash))
            .map((x) => x.toString(16).padStart(2, "0"))
            .join("");
        }
      } catch {
        // fallback to arrayBuffer approach
      }

      try {
        const buffer = await blob.arrayBuffer();
        const hash = await crypto.subtle.digest("SHA-256", buffer);
        return Array.from(new Uint8Array(hash))
          .map((x) => x.toString(16).padStart(2, "0"))
          .join("");
      } catch {
        // ignore and fallback to lightweight hash
      }
    }

    const buffer = await blob.arrayBuffer();
    let h = 0;
    const view = new Uint8Array(buffer);
    for (const value of view) {
      h = (h * 31 + value) >>> 0;
    }
    return `00000000${h.toString(16)}`.slice(-8);
  }

  private ensureBlob(row: MediaRow): MediaRow {
    const currentBlob: unknown = (row as any).blob;

    if (currentBlob instanceof Blob) {
      return row;
    }

    if (typeof Blob === "undefined") {
      return row;
    }

    let normalised: Blob | undefined;

    if (currentBlob instanceof ArrayBuffer) {
      normalised = new Blob([currentBlob], { type: row.mime });
    } else if (ArrayBuffer.isView(currentBlob)) {
      const view = currentBlob as ArrayBufferView;
      const copy = new Uint8Array(view.byteLength);
      copy.set(new Uint8Array(view.buffer, view.byteOffset, view.byteLength));
      normalised = new Blob([copy], { type: row.mime });
    } else if (typeof currentBlob === "string") {
      try {
        normalised = new Blob([currentBlob], { type: row.mime });
      } catch {
        normalised = undefined;
      }
    }

    if (!normalised) {
      return row;
    }

    return { ...row, blob: normalised };
  }
}

export const MEDIA_REPOSITORY_TOKEN = "MEDIA_REPOSITORY";
