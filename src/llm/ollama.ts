import { buildQuizPrompt } from "./quizPrompt.js";

export const DEFAULT_OLLAMA_URL = "http://localhost:11434";
export const DEFAULT_OLLAMA_MODEL = "qwen2.5-coder:7b-8k";
export const DEFAULT_OLLAMA_TIMEOUT_MS = 180_000;

export class OllamaUnavailableError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "OllamaUnavailableError";
  }
}

export class OllamaTimeoutError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "OllamaTimeoutError";
  }
}

export interface OllamaGenerateOptions {
  baseUrl?: string;
  model?: string;
  timeoutMs?: number;
  signal?: AbortSignal;
}

interface OllamaGenerateResponse {
  response?: unknown;
}

export async function generateWithOllama(
  text: string,
  options: OllamaGenerateOptions = {},
): Promise<string> {
  const baseUrl = (options.baseUrl ?? DEFAULT_OLLAMA_URL).replace(/\/+$/, "");
  const model = options.model ?? DEFAULT_OLLAMA_MODEL;
  const timeoutMs = options.timeoutMs ?? DEFAULT_OLLAMA_TIMEOUT_MS;
  const controller = new AbortController();
  let timedOut = false;

  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const onExternalAbort = () => controller.abort();

  if (options.signal) {
    if (options.signal.aborted) {
      controller.abort();
    } else {
      options.signal.addEventListener("abort", onExternalAbort, { once: true });
    }
  }

  try {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model,
        prompt: buildQuizPrompt(text),
        stream: false,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new OllamaUnavailableError(
        `Ollama respondió con el estado ${response.status}.`,
      );
    }

    const data = (await response.json()) as OllamaGenerateResponse;

    if (typeof data.response !== "string") {
      throw new OllamaUnavailableError(
        "Ollama devolvió una respuesta con un formato inesperado.",
      );
    }

    return data.response;
  } catch (error) {
    if (timedOut) {
      throw new OllamaTimeoutError(
        `Ollama no respondió en ${Math.round(timeoutMs / 1000)} s.`,
        { cause: error },
      );
    }

    if (options.signal?.aborted) {
      throw error;
    }

    if (error instanceof OllamaUnavailableError) {
      throw error;
    }

    throw new OllamaUnavailableError(
      "Ollama no disponible. Comprueba que el servicio esté en marcha.",
      { cause: error },
    );
  } finally {
    clearTimeout(timeoutId);
    options.signal?.removeEventListener("abort", onExternalAbort);
  }
}
