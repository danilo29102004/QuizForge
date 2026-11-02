import { randomUUID } from "node:crypto";
import type { Quiz } from "../types/quiz.js";

const quizzes = new Map<string, Quiz>();

export function saveQuiz(quiz: Quiz): string {
  const id = randomUUID();
  quizzes.set(id, quiz);
  return id;
}

export function getQuiz(id: string): Quiz | undefined {
  return quizzes.get(id);
}

export function clearQuizStore(): void {
  quizzes.clear();
}
