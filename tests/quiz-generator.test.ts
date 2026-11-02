import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_OLLAMA_TIMEOUT_MS,
  OllamaTimeoutError,
} from "../src/llm/ollama.js";
import { generateQuiz } from "../src/services/quizGenerator.js";
import type { Quiz } from "../src/types/quiz.js";
import { InputValidationError } from "../src/validation/input.js";

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

function ollamaResponse(content: string): Response {
  return new Response(JSON.stringify({ response: content }), { status: 200 });
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("generateQuiz", () => {
  it("genera 5 preguntas con Ollama simulado sin llamar a OpenRouter", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(ollamaResponse(JSON.stringify(makeQuiz())));
    vi.stubGlobal("fetch", fetchMock);

    const quiz = await generateQuiz(makeWords(300));

    expect(quiz.questions).toHaveLength(5);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const urls = fetchMock.mock.calls.map(([url]) => String(url));
    expect(urls).toEqual(["http://localhost:11434/api/generate"]);
    expect(urls.some((url) => url.includes("openrouter"))).toBe(false);
  });

  it("rechaza el texto inválido antes de llamar a Ollama", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(generateQuiz("texto demasiado corto")).rejects.toThrow(
      InputValidationError,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reintenta cuando Ollama devuelve un cuestionario no válido", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(ollamaResponse("respuesta inválida"))
      .mockResolvedValueOnce(ollamaResponse(JSON.stringify(makeQuiz())));
    vi.stubGlobal("fetch", fetchMock);

    const quiz = await generateQuiz(makeWords(300));

    expect(quiz.questions).toHaveLength(5);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("aplica el timeout de 180 s a cada intento, no al conjunto", async () => {
    vi.useFakeTimers();

    const firstAttemptMs = 100_000;
    let attempt = 0;
    let retrySignal: AbortSignal | undefined;

    const fetchMock = vi.fn(
      (_input: unknown, init?: { signal?: AbortSignal }) => {
        attempt += 1;

        if (attempt === 1) {
          return new Promise<Response>((resolve) => {
            setTimeout(
              () => resolve(ollamaResponse("respuesta inválida")),
              firstAttemptMs,
            );
          });
        }

        retrySignal = init?.signal;

        return new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("The operation was aborted.", "AbortError"));
          });
        });
      },
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = generateQuiz(makeWords(300)).then(
      () => undefined,
      (error: unknown) => error,
    );

    await vi.advanceTimersByTimeAsync(firstAttemptMs);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(retrySignal?.aborted).toBe(false);

    await vi.advanceTimersByTimeAsync(DEFAULT_OLLAMA_TIMEOUT_MS - 1);
    expect(retrySignal?.aborted).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    expect(await result).toBeInstanceOf(OllamaTimeoutError);
    expect(retrySignal?.aborted).toBe(true);
  });
});
