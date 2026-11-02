export const MIN_WORDS = 300;
export const MAX_WORDS = 3000;

export class InputValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InputValidationError";
  }
}

export function countWords(text: string): number {
  const trimmed = text.trim();

  if (!trimmed) {
    return 0;
  }

  return trimmed.split(/\s+/u).length;
}

export function validateInputText(text: unknown): string {
  if (typeof text !== "string" || text.trim() === "") {
    throw new InputValidationError("El texto es obligatorio.");
  }

  const trimmed = text.trim();
  const words = countWords(trimmed);

  if (words < MIN_WORDS) {
    throw new InputValidationError(
      `El texto debe tener al menos ${MIN_WORDS} palabras (tienes ${words}).`,
    );
  }

  if (words > MAX_WORDS) {
    throw new InputValidationError(
      `El texto no puede superar las 3.000 palabras (tienes ${words}).`,
    );
  }

  return trimmed;
}
