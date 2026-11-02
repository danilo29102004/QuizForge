import { pathToFileURL } from "node:url";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import {
  OllamaTimeoutError,
  OllamaUnavailableError,
} from "./llm/ollama.js";
import {
  generateQuiz,
  type GenerateQuizOptions,
} from "./services/quizGenerator.js";
import { QuizValidationError } from "./services/quizParser.js";
import { saveQuiz } from "./services/quizStore.js";
import type { Quiz } from "./types/quiz.js";
import { InputValidationError } from "./validation/input.js";

export type GenerateQuiz = (
  text: string,
  options?: GenerateQuizOptions,
) => Promise<Quiz>;

export interface AppDependencies {
  generateQuiz: GenerateQuiz;
}

export function createApp(
  dependencies: AppDependencies = { generateQuiz },
) {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  app.post("/api/quiz", async (request: Request, response: Response) => {
    try {
      const quiz = await dependencies.generateQuiz(request.body?.text);
      const id = saveQuiz(quiz);
      const questions = quiz.questions.map(({ question, options }) => ({
        question,
        options,
      }));

      response.status(200).json({ id, questions, usedCloud: false });
    } catch (error) {
      if (error instanceof InputValidationError) {
        response.status(400).json({ error: error.message });
        return;
      }

      if (error instanceof QuizValidationError) {
        response.status(502).json({ error: error.message });
        return;
      }

      if (
        error instanceof OllamaTimeoutError ||
        error instanceof OllamaUnavailableError
      ) {
        response.status(503).json({ error: error.message });
        return;
      }

      console.error(error);
      response
        .status(500)
        .json({ error: "Error interno al generar el cuestionario." });
    }
  });

  app.use(
    (
      error: unknown,
      _request: Request,
      response: Response,
      next: NextFunction,
    ) => {
      if (isPayloadTooLarge(error)) {
        response
          .status(413)
          .json({ error: "El texto enviado es demasiado grande." });
        return;
      }

      next(error);
    },
  );

  return app;
}

function isPayloadTooLarge(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const candidate = error as { status?: unknown; type?: unknown };
  return candidate.status === 413 || candidate.type === "entity.too.large";
}

const entryPoint = process.argv[1];

if (entryPoint && import.meta.url === pathToFileURL(entryPoint).href) {
  const port = Number(process.env.PORT ?? 3000);
  createApp().listen(port, () => {
    console.log(`QuizForge escuchando en http://localhost:${port}`);
  });
}
