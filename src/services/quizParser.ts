import { QuizSchema, type Quiz } from "../types/quiz.js";

export class QuizValidationError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "QuizValidationError";
  }
}

export type QuizRawGenerator = () => Promise<string>;

function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced?.[1] ?? raw).trim();
}

export function parseQuiz(raw: string): Quiz {
  const jsonText = extractJson(raw);
  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonText);
  } catch (error) {
    throw new QuizValidationError(
      "La respuesta del modelo no contiene un JSON válido.",
      { cause: error },
    );
  }

  const result = QuizSchema.safeParse(parsed);

  if (!result.success) {
    const detail = result.error.issues
      .map((issue) => `${issue.path.join(".") || "raíz"}: ${issue.message}`)
      .join("; ");

    throw new QuizValidationError(
      `El cuestionario no cumple el formato esperado (${detail}).`,
    );
  }

  return result.data;
}

export async function generateValidatedQuiz(
  generate: QuizRawGenerator,
  maxRetries = 2,
): Promise<Quiz> {
  const attempts = Math.max(1, maxRetries + 1);
  let lastError: QuizValidationError | undefined;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const raw = await generate();

    try {
      return parseQuiz(raw);
    } catch (error) {
      if (!(error instanceof QuizValidationError)) {
        throw error;
      }

      lastError = error;
    }
  }

  throw new QuizValidationError(
    `No se pudo generar un cuestionario válido tras ${attempts} intentos: ${lastError?.message ?? "error desconocido"}`,
    { cause: lastError },
  );
}
