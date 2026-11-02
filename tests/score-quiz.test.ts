import { describe, expect, it } from "vitest";
import { scoreQuiz } from "../src/services/scoreQuiz.js";
import type { OptionLetter, Quiz } from "../src/types/quiz.js";

const correctAnswers: OptionLetter[] = ["A", "B", "C", "D", "A"];

function makeQuiz(): Quiz {
  return {
    questions: correctAnswers.map((correct, index) => ({
      question: `Pregunta ${index + 1}`,
      options: {
        A: "Opción A",
        B: "Opción B",
        C: "Opción C",
        D: "Opción D",
      },
      correct,
      explanation: `Explicación ${index + 1}`,
    })),
  };
}

describe("scoreQuiz", () => {
  it("calcula 3/5 (60 %) y detalla las dos preguntas falladas", () => {
    const result = scoreQuiz(makeQuiz(), {
      answers: ["A", "B", "A", "A", "A"],
    });

    expect(result.score).toBe("3/5 (60 %)");
    expect(result.correctCount).toBe(3);
    expect(result.total).toBe(5);
    expect(result.failed).toHaveLength(2);
    expect(result.failed[0]).toEqual({
      position: 3,
      question: "Pregunta 3",
      selected: "A",
      selectedText: "Opción A",
      correct: "C",
      correctText: "Opción C",
      explanation: "Explicación 3",
    });
    expect(result.failed[1]).toMatchObject({
      position: 4,
      selected: "A",
      correct: "D",
      explanation: "Explicación 4",
    });
  });

  it("funciona con 0/5", () => {
    const result = scoreQuiz(makeQuiz(), {
      answers: ["D", "C", "B", "A", "D"],
    });

    expect(result.score).toBe("0/5 (0 %)");
    expect(result.correctCount).toBe(0);
    expect(result.failed).toHaveLength(5);
  });

  it("funciona con 5/5", () => {
    const result = scoreQuiz(makeQuiz(), { answers: correctAnswers });

    expect(result.score).toBe("5/5 (100 %)");
    expect(result.correctCount).toBe(5);
    expect(result.failed).toHaveLength(0);
  });

  it("cuenta como fallo las preguntas sin responder", () => {
    const result = scoreQuiz(makeQuiz(), {
      answers: ["A", "B", null, null, "A"],
    });

    expect(result.score).toBe("3/5 (60 %)");
    expect(result.failed).toHaveLength(2);
    expect(result.failed[0]).toMatchObject({
      position: 3,
      selected: null,
      selectedText: null,
      correct: "C",
    });
  });

  it("cuenta como fallo las respuestas que faltan al final", () => {
    const result = scoreQuiz(makeQuiz(), { answers: ["A", "B"] });

    expect(result.score).toBe("2/5 (40 %)");
    expect(result.failed).toHaveLength(3);
    expect(result.failed[0]).toMatchObject({ position: 3, selected: null });
  });
});
