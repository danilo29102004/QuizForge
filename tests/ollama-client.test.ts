import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_OLLAMA_MODEL,
  DEFAULT_OLLAMA_TIMEOUT_MS,
  OllamaTimeoutError,
  OllamaUnavailableError,
  generateWithOllama,
} from "../src/llm/ollama.js";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("generateWithOllama", () => {
  it("usa el endpoint y el modelo local correctos", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ response: "contenido generado" }), {
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await generateWithOllama("texto de prueba");

    expect(result).toBe("contenido generado");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:11434/api/generate");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({ "content-type": "application/json" });

    const body = JSON.parse(String(init.body)) as {
      model: string;
      prompt: string;
      stream: boolean;
    };

    expect(body.model).toBe(DEFAULT_OLLAMA_MODEL);
    expect(body.stream).toBe(false);
    expect(body.prompt).toContain("texto de prueba");
    expect(String(url)).not.toContain("openrouter");
  });

  it("aborta la petición a los 180 segundos", async () => {
    vi.useFakeTimers();

    let capturedSignal: AbortSignal | undefined;
    const fetchMock = vi.fn((_input: unknown, init?: { signal?: AbortSignal }) => {
      capturedSignal = init?.signal;

      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(new DOMException("The operation was aborted.", "AbortError"));
        });
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const promise = generateWithOllama("texto de prueba");
    const expectation = expect(promise).rejects.toBeInstanceOf(
      OllamaTimeoutError,
    );

    await vi.advanceTimersByTimeAsync(DEFAULT_OLLAMA_TIMEOUT_MS - 1);
    expect(capturedSignal?.aborted).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    await expectation;

    expect(capturedSignal?.aborted).toBe(true);
  });

  it("traduce un error de conexión a Ollama no disponible", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("fetch failed")),
    );

    await expect(generateWithOllama("texto de prueba")).rejects.toThrow(
      OllamaUnavailableError,
    );
    await expect(generateWithOllama("texto de prueba")).rejects.toThrow(
      /Ollama no disponible/,
    );
  });
});
