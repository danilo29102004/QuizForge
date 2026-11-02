import { describe, expect, it, vi } from "vitest";
import {
  QuizValidationError,
  generateValidatedQuiz,
  parseQuiz,
} from "../src/services/quizParser.js";
import type { Quiz } from "../src/types/quiz.js";

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

function makeRawQuiz(): string {
  return JSON.stringify(makeQuiz());
}

describe("parseQuiz", () => {
  it("acepta JSON limpio", () => {
    expect(parseQuiz(makeRawQuiz()).questions).toHaveLength(5);
  });

  it("acepta JSON dentro de un bloque Markdown", () => {
    const raw = `Aquí tienes el cuestionario:\n\`\`\`json\n${makeRawQuiz()}\n\`\`\``;

    expect(parseQuiz(raw).questions).toHaveLength(5);
  });

  it("lanza un error controlado si el JSON está malformado", () => {
    expect(() => parseQuiz('{"questions": [')).toThrow(QuizValidationError);
    expect(() => parseQuiz('{"questions": [')).toThrow(/JSON válido/);
  });
});

describe("generateValidatedQuiz", () => {
  it("reintenta y acepta la segunda respuesta válida", async () => {
    const generate = vi
      .fn()
      .mockResolvedValueOnce("respuesta inválida")
      .mockResolvedValueOnce(makeRawQuiz());

    const quiz = await generateValidatedQuiz(generate);

    expect(quiz.questions).toHaveLength(5);
    expect(generate).toHaveBeenCalledTimes(2);
  });

  it("tras 2 reintentos fallidos lanza un error claro", async () => {
    const generate = vi.fn().mockResolvedValue("respuesta inválida");

    await expect(generateValidatedQuiz(generate)).rejects.toThrow(
      /No se pudo generar un cuestionario válido tras 3 intentos/,
    );
    expect(generate).toHaveBeenCalledTimes(3);
  });

  it("no hace un cuarto intento cuando el esquema no es válido", async () => {
    const generate = vi
      .fn()
      .mockResolvedValue(makeRawQuiz().replace('"questions"', '"preguntas"'));

    await expect(generateValidatedQuiz(generate)).rejects.toBeInstanceOf(
      QuizValidationError,
    );
    expect(generate).toHaveBeenCalledTimes(3);
  });
});
