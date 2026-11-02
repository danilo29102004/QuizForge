import { once } from "node:events";
import type { Server } from "node:http";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/server.js";
import { generateQuiz } from "../src/services/quizGenerator.js";
import { clearQuizStore } from "../src/services/quizStore.js";
import type { Quiz } from "../src/types/quiz.js";

function makeWords(count: number): string {
  return Array.from({ length: count }, (_, index) => `palabra${index}`).join(
    " ",
  );
}

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

interface QuizResponse {
  id: string;
  usedCloud: boolean;
  questions: Array<{
    question: string;
    options: Record<string, string>;
  }>;
}

const app = createApp({
  generateQuiz: (text, options) =>
    generateQuiz(text, {
      ...options,
      generateRaw: async () => JSON.stringify(makeQuiz()),
    }),
});

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  server = app.listen(0);
  await once(server, "listening");

  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("No se pudo obtener el puerto del servidor de prueba.");
  }

  baseUrl = `http://127.0.0.1:${address.port}`;
});

beforeEach(() => {
  clearQuizStore();
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

async function postQuiz(body: unknown): Promise<Response> {
  return fetch(`${baseUrl}/api/quiz`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/quiz", () => {
  it("devuelve 5 preguntas sin respuestas ni explicaciones", async () => {
    const response = await postQuiz({ text: makeWords(300) });
    const body = (await response.json()) as QuizResponse;

    expect(response.status).toBe(200);
    expect(typeof body.id).toBe("string");
    expect(body.usedCloud).toBe(false);
    expect(body.questions).toHaveLength(5);

    for (const question of body.questions) {
      expect(question).not.toHaveProperty("correct");
      expect(question).not.toHaveProperty("explanation");
      expect(Object.keys(question.options).sort()).toEqual([
        "A",
        "B",
        "C",
        "D",
      ]);
    }
  });

  it("devuelve 400 con mensaje claro si hay menos de 300 palabras", async () => {
    const response = await postQuiz({ text: makeWords(299) });
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/al menos 300 palabras/);
  });

  it("devuelve 400 con mensaje claro si hay más de 3.000 palabras", async () => {
    const response = await postQuiz({ text: makeWords(3001) });
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/3\.000 palabras/);
  });

  it("rechaza un cuerpo superior a 1 MB", async () => {
    const response = await postQuiz({ text: "x".repeat(1_100_000) });

    expect(response.status).toBe(413);
  });
});
