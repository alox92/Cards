export type NoteType = "basic" | "cloze";

export interface NoteFieldMap {
  front: string;
  back: string;
}

export interface Note {
  id: string;
  deckId: string;
  type: NoteType;
  fields: NoteFieldMap;
  tags: string[];
  created: number;
  updated: number;
}

export interface NoteCreationData {
  deckId: string;
  type?: NoteType;
  fields: NoteFieldMap;
  tags?: string[];
}

export class NoteEntity implements Note {
  id: string;
  deckId: string;
  type: NoteType;
  fields: NoteFieldMap;
  tags: string[];
  created: number;
  updated: number;

  constructor(data: NoteCreationData & { id?: string }) {
    this.id = data.id || NoteEntity.generateId();
    this.deckId = data.deckId;
    this.type = data.type || "basic";
    this.fields = data.fields;
    this.tags = data.tags || [];
    this.created = Date.now();
    this.updated = Date.now();
  }

  static generateId(): string {
    return `note_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  toJSON(): Note {
    const { id, deckId, type, fields, tags, created, updated } = this;
    return { id, deckId, type, fields, tags, created, updated };
  }
}
