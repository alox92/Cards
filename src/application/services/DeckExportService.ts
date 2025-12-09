import type { CardRepository } from "@/domain/repositories/CardRepository";
import type { DeckRepository } from "@/domain/repositories/DeckRepository";
import type { CardEntity } from "@/domain/entities/Card";

export interface ExportedDeck {
  deck: {
    id: string;
    name: string;
    description?: string;
    created: number;
    updated: number;
  };
  cards: Array<ReturnType<CardEntity["toJSON"]>>;
}

export class DeckExportService {
  constructor(
    private deckRepo: DeckRepository,
    private cardRepo: CardRepository
  ) {}

  async exportDeck(deckId: string): Promise<ExportedDeck | null> {
    const deck = await this.deckRepo.getDeck(deckId);
    if (!deck) return null;
    const cards = await this.cardRepo.getByDeckId(deckId);
    const serialized = cards.map((c) => c.toJSON());
    return {
      deck: {
        id: deck.id,
        name: deck.name,
        description: (deck as any).description,
        created: deck.created,
        updated: deck.updated,
      },
      cards: serialized,
    };
  }
}

export const DECK_EXPORT_SERVICE_TOKEN = "DeckExportService";
