import { describe, it, expect } from "vitest";
import { migrateDataUrlImagesToMedia } from "@/application/migrations/migrateDataUrlImagesToMedia";
import { CardEntity } from "@/domain/entities/Card";
import { container } from "@/application/Container";
import {
  CARD_REPOSITORY_TOKEN,
  type CardRepository,
} from "@/domain/repositories/CardRepository";
import {
  MEDIA_REPOSITORY_TOKEN,
  DexieMediaRepository,
} from "@/infrastructure/persistence/dexie/DexieMediaRepository";

// DataURL minimal (1x1 png) pour test
const ONE_PIXEL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGJk+M/wHwAFAgJ/VJxT8QAAAABJRU5ErkJggg==";

describe("Migration DataURL -> media refs", () => {
  it("convertit front/back DataURLs en media ids et crée les refs (skip si IndexedDB manquant)", async () => {
    const hasIndexedDB = typeof indexedDB !== "undefined";
    const repo = container.resolve<CardRepository>(CARD_REPOSITORY_TOKEN);
    const mediaRepo = container.resolve<DexieMediaRepository>(
      MEDIA_REPOSITORY_TOKEN
    );

    // Crée carte legacy
    const card = new CardEntity({
      deckId: "d1",
      frontText: "F",
      backText: "B",
      frontImage: ONE_PIXEL,
      backImage: ONE_PIXEL,
    });
    await repo.create(card);

    const result: any = await migrateDataUrlImagesToMedia();
    if (result.skipped) {
      // Migration ignorée faute d'IndexedDB: on vérifie que la carte reste DataURL
      const unchanged = await repo.getById(card.id);
      expect(unchanged!.frontImage).toBe(ONE_PIXEL);
      return;
    }
    expect(result.total).toBeGreaterThan(0);

    const updated = await repo.getById(card.id);
    expect(updated).not.toBeNull();
    if (hasIndexedDB) {
      expect(updated!.frontImage).toMatch(/^media_/); // id remplacé
      expect(updated!.backImage).toMatch(/^media_/);
      expect(
        updated!.mediaRefs && updated!.mediaRefs.length
      ).toBeGreaterThanOrEqual(2);
      const mediaRow = await mediaRepo.get(updated!.frontImage!);
      expect(mediaRow?.blob).toBeTruthy();
    } else {
      // En environnement sans IndexedDB, on laisse DataURL intact et aucune ref ajoutée
      expect(updated!.frontImage!.startsWith("data:image/")).toBe(true);
    }
  });
});
