import { generateWithOllama } from "../llm/ollama.js";
import type { Quiz } from "../types/quiz.js";
import { validateInputText } from "../validation/input.js";
import { generateValidatedQuiz } from "./quizParser.js";

export interface GenerateQuizOptions {
  signal?: AbortSignal;
  generateRaw?: (text: string, signal?: AbortSignal) => Promise<string>;
}

export async function generateQuiz(
  text: string,
  options: GenerateQuizOptions = {},
): Promise<Quiz> {
  const validatedText = validateInputText(text);
  const generateRaw =
    options.generateRaw ??
    ((input: string, signal?: AbortSignal) =>
      generateWithOllama(input, { signal }));

  return generateValidatedQuiz(() =>
    generateRaw(validatedText, options.signal),
  );
}
