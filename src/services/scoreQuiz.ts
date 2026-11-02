import type {
  OptionLetter,
  Quiz,
  ScoreRequest,
} from "../types/quiz.js";

export interface FailedQuestion {
  position: number;
  question: string;
  selected: OptionLetter | null;
  selectedText: string | null;
  correct: OptionLetter;
  correctText: string;
  explanation: string;
}

export interface QuizScore {
  score: string;
  correctCount: number;
  total: number;
  failed: FailedQuestion[];
}

export function scoreQuiz(
  quiz: Quiz,
  { answers }: Pick<ScoreRequest, "answers">,
): QuizScore {
  const failed: FailedQuestion[] = [];
  let correctCount = 0;

  quiz.questions.forEach((question, index) => {
    const selected = answers[index] ?? null;

    if (selected === question.correct) {
      correctCount += 1;
      return;
    }

    failed.push({
      position: index + 1,
      question: question.question,
      selected,
      selectedText: selected ? question.options[selected] : null,
      correct: question.correct,
      correctText: question.options[question.correct],
      explanation: question.explanation,
    });
  });

  const total = quiz.questions.length;
  const percent = Math.round((correctCount / total) * 100);

  return {
    score: `${correctCount}/${total} (${percent} %)`,
    correctCount,
    total,
    failed,
  };
}
