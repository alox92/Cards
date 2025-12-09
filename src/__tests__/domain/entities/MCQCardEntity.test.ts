import { describe, it, expect } from "vitest";
import { MCQCardEntity, MCQOption } from "../../../domain/entities/MCQCard";

describe("MCQCardEntity", () => {
  const validOptions: MCQOption[] = [
    { id: "o1", text: "A", isCorrect: true },
    { id: "o2", text: "B", isCorrect: false },
  ];

  it("should create a valid MCQCardEntity", () => {
    const card = new MCQCardEntity("c1", "d1", "Q?", validOptions);
    expect(card).toBeDefined();
    expect(card.id).toBe("c1");
  });

  it("should throw error if less than 2 options", () => {
    const options = [{ id: "o1", text: "A", isCorrect: true }];
    expect(() => new MCQCardEntity("c1", "d1", "Q?", options)).toThrow(
      "Un QCM doit avoir au moins 2 options"
    );
  });

  it("should throw error if no correct option", () => {
    const options = [
      { id: "o1", text: "A", isCorrect: false },
      { id: "o2", text: "B", isCorrect: false },
    ];
    expect(() => new MCQCardEntity("c1", "d1", "Q?", options)).toThrow(
      "Un QCM doit avoir au moins une réponse correcte"
    );
  });

  it("should throw error if multiple answers but only 1 correct option", () => {
    const options = [
      { id: "o1", text: "A", isCorrect: true },
      { id: "o2", text: "B", isCorrect: false },
    ];
    expect(() => new MCQCardEntity("c1", "d1", "Q?", options, true)).toThrow(
      "Un QCM à réponses multiples doit avoir au moins 2 bonnes réponses"
    );
  });

  it("should check answers correctly (single)", () => {
    const card = new MCQCardEntity("c1", "d1", "Q?", validOptions);

    const resultCorrect = card.checkAnswers(["o1"]);
    expect(resultCorrect.isCorrect).toBe(true);
    expect(resultCorrect.partialCredit).toBe(1);

    const resultIncorrect = card.checkAnswers(["o2"]);
    expect(resultIncorrect.isCorrect).toBe(false);
  });

  it("should check answers correctly (multiple)", () => {
    const options = [
      { id: "o1", text: "A", isCorrect: true },
      { id: "o2", text: "B", isCorrect: true },
      { id: "o3", text: "C", isCorrect: false },
    ];
    const card = new MCQCardEntity("c1", "d1", "Q?", options, true);

    // All correct
    const r1 = card.checkAnswers(["o1", "o2"]);
    expect(r1.isCorrect).toBe(true);
    expect(r1.partialCredit).toBe(1);

    // Partial
    const r2 = card.checkAnswers(["o1"]);
    expect(r2.isCorrect).toBe(false);
    expect(r2.partialCredit).toBe(0.5);

    // Incorrect included
    const r3 = card.checkAnswers(["o1", "o3"]);
    expect(r3.isCorrect).toBe(false);
    expect(r3.partialCredit).toBe(0); // (1 - 1) / 2 = 0
  });

  it("should shuffle options", () => {
    const options = [
      { id: "o1", text: "A", isCorrect: true },
      { id: "o2", text: "B", isCorrect: false },
      { id: "o3", text: "C", isCorrect: false },
    ];
    const card = new MCQCardEntity("c1", "d1", "Q?", options);
    const shuffled = card.shuffleOptions();

    expect(shuffled).toHaveLength(3);
    expect(shuffled.map((o) => o.id)).toContain("o1");
  });
});
