export function buildQuizPrompt(text: string): string {
  return `Eres un generador de cuestionarios tipo test en español.

Devuelve exclusivamente un objeto JSON válido, sin texto adicional ni bloques Markdown, con esta estructura:
{
  "questions": [
    {
      "question": "Enunciado de la pregunta",
      "options": {
        "A": "Primera opción",
        "B": "Segunda opción",
        "C": "Tercera opción",
        "D": "Cuarta opción"
      },
      "correct": "A",
      "explanation": "Explicación de por qué la opción A es correcta"
    }
  ]
}

Reglas:
- El cuestionario debe tener exactamente 5 preguntas.
- Cada pregunta debe tener exactamente 4 opciones: A, B, C y D.
- Solo una opción es correcta y "correct" debe ser "A", "B", "C" o "D".
- Todas las preguntas, opciones y explicaciones deben estar en español.
- La explicación debe justificar la respuesta correcta.

Texto de estudio:
"""
${text}
"""`;
}
