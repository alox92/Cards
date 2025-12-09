import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import "fake-indexeddb/auto";
import { DexieStudySessionRepository } from "../../../../infrastructure/persistence/dexie/DexieStudySessionRepository";
import { StudySession } from "../../../../domain/entities/StudySession";
import { aribaDB } from "../../../../infrastructure/persistence/dexie/AribaDB";

// Mock logger to avoid console noise
vi.mock("../../../../utils/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("DexieStudySessionRepository", () => {
  let repo: DexieStudySessionRepository;

  beforeEach(async () => {
    localStorage.clear();
    repo = new DexieStudySessionRepository();
    await aribaDB.open();
    await aribaDB.sessions.clear();
  });

  afterEach(async () => {
    await aribaDB.sessions.clear();
    localStorage.clear();
  });

  const createSession = (
    id: string,
    deckId: string,
    startTime: number
  ): StudySession => ({
    id,
    deckId,
    startTime,
    cardsStudied: 10,
    correctAnswers: 8,
    totalTimeSpent: 60000,
    averageResponseTime: 6000,
    studyMode: "quiz",
    performance: {
      accuracy: 0.8,
      speed: 1,
      consistency: 1,
      improvement: 0,
      streak: 1,
    },
  });

  it("should create and retrieve recent sessions", async () => {
    const s1 = createSession("s1", "d1", 1000);
    const s2 = createSession("s2", "d1", 2000);
    await repo.create(s1);
    await repo.create(s2);

    const recent = await repo.getRecent();
    expect(recent).toHaveLength(2);
    // Should be ordered by startTime reverse (descending)
    expect(recent[0]?.id).toBe("s2");
    expect(recent[1]?.id).toBe("s1");
  });

  it("should get sessions by deck", async () => {
    const s1 = createSession("s1", "d1", 1000);
    const s2 = createSession("s2", "d2", 2000);
    await repo.create(s1);
    await repo.create(s2);

    const d1Sessions = await repo.getByDeck("d1");
    expect(d1Sessions).toHaveLength(1);
    expect(d1Sessions[0]?.id).toBe("s1");
  });

  it("should update a session", async () => {
    const s1 = createSession("s1", "d1", 1000);
    await repo.create(s1);

    s1.cardsStudied = 20;
    await repo.update(s1);

    const recent = await repo.getRecent();
    expect(recent[0]?.cardsStudied).toBe(20);
  });

  it("should clear sessions", async () => {
    const s1 = createSession("s1", "d1", 1000);
    await repo.create(s1);

    await repo.clear();
    const recent = await repo.getRecent();
    expect(recent).toHaveLength(0);
  });

  it("should migrate from localStorage if needed", async () => {
    const legacySessions = [createSession("legacy1", "d1", 500)];
    localStorage.setItem(
      "ariba-study-store",
      JSON.stringify({
        state: { recentSessions: legacySessions },
      })
    );

    // Re-instantiate repo to trigger migration check (though it's lazy on method call)
    // But we need a fresh instance or reset the 'migrated' flag if it was accessible.
    // Since 'migrated' is private, we rely on the fact that we create a new repo in beforeEach.
    // However, the test setup clears DB in beforeEach.

    // We need to ensure DB is empty before calling a method on repo
    await aribaDB.sessions.clear();

    // Call a method to trigger migration
    const recent = await repo.getRecent();

    expect(recent).toHaveLength(1);
    expect(recent[0]?.id).toBe("legacy1");
  });
});
