import { describe, expect, it } from "vitest";
import { QuizSchema, type Quiz } from "../src/types/quiz.js";

function makeQuiz(): Quiz {
  return {
    questions: Array.from({ length: 5 }, (_, index) => ({
      question: `Pregunta ${index + 1}`,
      options: {
        A: "Rojo",
        B: "Verde",
        C: "Azul",
        D: "Amarillo",
      },
      correct: "A" as const,
      explanation: `Explicación ${index + 1}`,
    })),
  };
}

describe("QuizSchema", () => {
  it("acepta un cuestionario válido de 5 preguntas", () => {
    expect(QuizSchema.safeParse(makeQuiz()).success).toBe(true);
  });

  it("rechaza un cuestionario con 4 preguntas", () => {
    const quiz = makeQuiz();
    const invalid = { ...quiz, questions: quiz.questions.slice(0, 4) };

    expect(QuizSchema.safeParse(invalid).success).toBe(false);
  });

  it("rechaza un cuestionario con 6 preguntas", () => {
    const quiz = makeQuiz();
    const invalid = {
      ...quiz,
      questions: [...quiz.questions, quiz.questions[0]],
    };

    expect(QuizSchema.safeParse(invalid).success).toBe(false);
  });

  it("rechaza una pregunta sin la opción D", () => {
    const quiz = makeQuiz();
    const invalid = {
      ...quiz,
      questions: quiz.questions.map((question, index) =>
        index === 0
          ? {
              ...question,
              options: {
                A: question.options.A,
                B: question.options.B,
                C: question.options.C,
              },
            }
          : question,
      ),
    };

    expect(QuizSchema.safeParse(invalid).success).toBe(false);
  });

  it("rechaza una letra correcta inválida", () => {
    const quiz = makeQuiz();
    const invalid = {
      ...quiz,
      questions: quiz.questions.map((question, index) =>
        index === 0 ? { ...question, correct: "E" } : question,
      ),
    };

    expect(QuizSchema.safeParse(invalid).success).toBe(false);
  });

  it("rechaza una explicación vacía", () => {
    const quiz = makeQuiz();
    const invalid = {
      ...quiz,
      questions: quiz.questions.map((question, index) =>
        index === 0 ? { ...question, explanation: "   " } : question,
      ),
    };

    expect(QuizSchema.safeParse(invalid).success).toBe(false);
  });
});
