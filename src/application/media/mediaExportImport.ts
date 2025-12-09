import { container } from "@/application/Container";
import {
  MEDIA_REPOSITORY_TOKEN,
  DexieMediaRepository,
} from "@/infrastructure/persistence/dexie/DexieMediaRepository";
import { CARD_REPOSITORY_TOKEN } from "@/domain/repositories/CardRepository";
import type { CardRepository } from "@/domain/repositories/CardRepository";
import { CardEntity } from "@/domain/entities/Card";
import { logger } from "@/utils/logger";
// Lazy-load JSZip to keep it out of the main bundle
let _JSZip: any;
async function getJSZip() {
  if (!_JSZip) {
    _JSZip = (await import("jszip")).default;
  }
  return _JSZip;
}
import { aribaDB } from "@/infrastructure/persistence/dexie/AribaDB";

export interface MediaManifestEntry {
  id: string;
  type: string;
  mime: string;
  size: number;
  created: number;
  checksum: string;
}
export interface MediaArchive {
  manifest: MediaManifestEntry[];
  cards: any[];
  blobs: Record<string, Blob>;
}

async function sha256(buffer: ArrayBuffer) {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const hash = await crypto.subtle.digest("SHA-256", buffer);
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  // Fallback simple (non cryptographique) pour environnements tests sans subtle
  let h = 0;
  const view = new Uint8Array(buffer);
  for (const b of view) {
    h = (h * 31 + b) >>> 0;
  }
  return `00000000${h.toString(16)}`.slice(-8);
}

function cloneCardForArchive(card: any) {
  if (card && typeof card.toJSON === "function") {
    return card.toJSON();
  }
  return JSON.parse(JSON.stringify(card));
}

// Exporte toutes les cartes + blobs référencés dans mediaRefs
export async function exportMediaArchive(): Promise<MediaArchive> {
  const cardRepo = container.resolve<CardRepository>(CARD_REPOSITORY_TOKEN);
  const mediaRepo = container.resolve<DexieMediaRepository>(
    MEDIA_REPOSITORY_TOKEN
  );

  const cards = await cardRepo.getAll();
  const cardsForArchive = cards.map(cloneCardForArchive);

  const requiredMediaIds = new Set<string>();
  for (const card of cards) {
    if (!Array.isArray(card.mediaRefs)) continue;
    for (const ref of card.mediaRefs) {
      if (ref?.id) {
        requiredMediaIds.add(ref.id);
      }
    }
  }

  const manifest: MediaManifestEntry[] = [];
  const blobs: Record<string, Blob> = {};

  const mediaEntries = await Promise.all(
    Array.from(requiredMediaIds).map(async (id) => {
      const row = await mediaRepo.get(id);
      if (!row) {
        logger.warn(
          "MediaExport",
          "Référence média introuvable lors de l'export",
          { id }
        );
        return null;
      }

      const blob =
        row.blob instanceof Blob
          ? row.blob
          : new Blob([row.blob], { type: row.mime });
      const checksum = row.checksum ?? (await sha256(await blob.arrayBuffer()));

      return {
        id,
        manifest: {
          id,
          type: row.type,
          mime: row.mime,
          size: blob.size,
          created: row.created,
          checksum,
        } satisfies MediaManifestEntry,
        blob,
      };
    })
  );

  for (const entry of mediaEntries) {
    if (!entry) continue;
    manifest.push(entry.manifest);
    blobs[entry.id] = entry.blob;
  }

  return { manifest, cards: cardsForArchive, blobs };
}

// Réimporte un archive en évitant d'écraser les media déjà présents (skip si id existe)
export async function importMediaArchive(archive: MediaArchive) {
  const cardRepo = container.resolve<CardRepository>(CARD_REPOSITORY_TOKEN);
  const mediaRepo = container.resolve<DexieMediaRepository>(
    MEDIA_REPOSITORY_TOKEN
  );
  // Restaurer media
  for (const m of archive.manifest) {
    const existing = await mediaRepo.get(m.id);
    if (!existing) {
      await aribaDB.media.put({
        id: m.id,
        type: m.type as any,
        mime: m.mime,
        blob: archive.blobs[m.id],
        created: m.created,
        checksum: m.checksum,
      } as any);
    }
  }
  // Upsert cartes (simple: si existe on update, sinon create)
  for (const card of archive.cards) {
    const entity =
      card instanceof CardEntity ? card : CardEntity.fromJSON(card);
    const existing = await cardRepo.getById(entity.id);
    if (existing) {
      await cardRepo.update(entity);
    } else {
      await cardRepo.create(entity);
    }
  }
  return { media: archive.manifest.length, cards: archive.cards.length };
}

// Création d'une archive ZIP (binaire) contenant manifest.json, cards.json et dossiers /media
export async function exportMediaZip(): Promise<Blob> {
  const arch = await exportMediaArchive();
  const JSZip = await getJSZip();
  const zip = new JSZip();
  zip.file(
    "manifest.json",
    JSON.stringify({ manifest: arch.manifest }, null, 2)
  );
  zip.file("cards.json", JSON.stringify(arch.cards, null, 2));
  const mediaFolder = zip.folder("media")!;
  for (const id of Object.keys(arch.blobs)) {
    mediaFolder.file(id, arch.blobs[id]);
  }
  const blob = await zip.generateAsync({ type: "blob" });
  try {
    localStorage.setItem("ariba_last_media_export", Date.now().toString());
  } catch {}
  return blob;
}

// Lecture d'une archive ZIP et import: vérifie checksums; skip en cas de mismatch
export async function importMediaZip(blob: Blob) {
  const JSZip = await getJSZip();
  const zip = await JSZip.loadAsync(blob);
  const manifestContent = await zip.file("manifest.json")!.async("string");
  const cardsContent = await zip.file("cards.json")!.async("string");
  const { manifest } = JSON.parse(manifestContent);
  const cards = JSON.parse(cardsContent);
  const blobs: Record<string, Blob> = {};
  for (const entry of manifest) {
    const file = zip.file(`media/${entry.id}`);
    if (file) {
      const ab = await file.async("arraybuffer");
      const b = new Blob([ab], { type: entry.mime });
      const sum = await sha256(ab);
      if (sum === entry.checksum) {
        blobs[entry.id] = b;
      } else {
        logger.warn("MediaImport", "[media import] checksum mismatch", {
          entryId: entry.id,
        });
      }
    }
  }
  return await importMediaArchive({ manifest, cards, blobs });
}

// Export incrémental basé sur timestamp localStorage 'ariba_last_media_export'
export async function exportMediaZipIncremental(): Promise<Blob> {
  let last = 0;
  try {
    const v = localStorage.getItem("ariba_last_media_export");
    if (v) last = parseInt(v, 10) || 0;
  } catch {}
  const full = await exportMediaArchive();
  const subsetManifest = full.manifest.filter((m) => m.created > last);
  const subsetBlobs = Object.fromEntries(
    Object.entries(full.blobs).filter(([id]) =>
      subsetManifest.find((m) => m.id === id)
    )
  );
  const subsetIds = new Set(subsetManifest.map((m) => m.id));
  // Inclure uniquement les cartes qui référencent au moins un media nouveau
  const subsetCards = full.cards.filter(
    (c) =>
      Array.isArray(c.mediaRefs) &&
      c.mediaRefs.some((r: any) => subsetIds.has(r.id))
  );
  const JSZip = await getJSZip();
  const zip = new JSZip();
  zip.file(
    "manifest.json",
    JSON.stringify({ manifest: subsetManifest }, null, 2)
  );
  zip.file("cards.json", JSON.stringify(subsetCards, null, 2));
  const folder = zip.folder("media")!;
  for (const m of subsetManifest) {
    folder.file(m.id, subsetBlobs[m.id]);
  }
  const blob = await zip.generateAsync({ type: "blob" });
  try {
    localStorage.setItem("ariba_last_media_export", Date.now().toString());
  } catch {}
  return blob;
}
