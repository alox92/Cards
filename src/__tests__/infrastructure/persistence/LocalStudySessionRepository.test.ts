import { describe, it, expect, beforeEach } from "vitest";
import { LocalStudySessionRepository } from "../../../infrastructure/persistence/LocalStudySessionRepository";
import { StudySession } from "../../../domain/entities/StudySession";

describe("LocalStudySessionRepository", () => {
  let repo: LocalStudySessionRepository;

  beforeEach(() => {
    localStorage.clear();
    repo = new LocalStudySessionRepository();
  });

  const createSession = (id: string, deckId: string): StudySession => ({
    id,
    deckId,
    startTime: Date.now(),
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
    const s1 = createSession("s1", "d1");
    await repo.create(s1);

    const recent = await repo.getRecent();
    expect(recent).toHaveLength(1);
    expect(recent[0]?.id).toBe("s1");
  });

  it("should get sessions by deck", async () => {
    const s1 = createSession("s1", "d1");
    const s2 = createSession("s2", "d2");
    await repo.create(s1);
    await repo.create(s2);

    const d1Sessions = await repo.getByDeck("d1");
    expect(d1Sessions).toHaveLength(1);
    expect(d1Sessions[0]?.id).toBe("s1");
  });

  it("should update a session", async () => {
    const s1 = createSession("s1", "d1");
    await repo.create(s1);

    s1.cardsStudied = 20;
    await repo.update(s1);

    const recent = await repo.getRecent();
    expect(recent[0]?.cardsStudied).toBe(20);
  });

  it("should clear sessions", async () => {
    const s1 = createSession("s1", "d1");
    await repo.create(s1);

    await repo.clear();
    const recent = await repo.getRecent();
    expect(recent).toHaveLength(0);
  });
});
