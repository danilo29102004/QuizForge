import { describe, expect, it } from "vitest";
import { validateInputText } from "../src/validation/input.js";

function makeWords(count: number): string {
  return Array.from({ length: count }, (_, index) => `palabra${index}`).join(
    " ",
  );
}

describe("validateInputText", () => {
  it("rechaza un texto con menos de 300 palabras", () => {
    expect(() => validateInputText(makeWords(299))).toThrow(
      /al menos 300 palabras/,
    );
  });

  it("acepta un texto de exactamente 300 palabras", () => {
    const text = `  ${makeWords(300)}  `;

    expect(validateInputText(text)).toBe(makeWords(300));
  });

  it("acepta un texto de exactamente 3.000 palabras", () => {
    expect(validateInputText(makeWords(3000))).toBe(makeWords(3000));
  });

  it("rechaza un texto con más de 3.000 palabras", () => {
    expect(() => validateInputText(makeWords(3001))).toThrow(
      /3\.000 palabras/,
    );
  });

  it("rechaza un texto vacío", () => {
    expect(() => validateInputText("   ")).toThrow(/obligatorio/);
  });
});
