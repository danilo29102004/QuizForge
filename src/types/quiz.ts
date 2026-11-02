// Esquema de datos del cuestionario (se completará con Zod en la implementación)
export type OptionLetter = "A" | "B" | "C" | "D";

export interface Question {
  question: string;
  options: Record<OptionLetter, string>;
  correct: OptionLetter;
  explanation: string;
}

export interface Quiz {
  questions: Question[];
}
