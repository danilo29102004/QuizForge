import { z } from "zod";

export const OptionLetterSchema = z.enum(["A", "B", "C", "D"]);
export type OptionLetter = z.infer<typeof OptionLetterSchema>;

export const OptionSchema = z.object({
  A: z.string().trim().min(1),
  B: z.string().trim().min(1),
  C: z.string().trim().min(1),
  D: z.string().trim().min(1),
});
export type Option = z.infer<typeof OptionSchema>;

export const QuestionSchema = z.object({
  question: z.string().trim().min(1),
  options: OptionSchema,
  correct: OptionLetterSchema,
  explanation: z.string().trim().min(1),
});
export type Question = z.infer<typeof QuestionSchema>;

export const QuizSchema = z.object({
  questions: z.array(QuestionSchema).length(5),
});
export type Quiz = z.infer<typeof QuizSchema>;

export const ScoreRequestSchema = z.object({
  id: z.string().min(1),
  answers: z.array(OptionLetterSchema.nullable()).max(5),
});
export type ScoreRequest = z.infer<typeof ScoreRequestSchema>;
