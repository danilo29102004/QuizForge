# Contexto global de QuizForge

QuizForge es una web app que transforma apuntes en cuestionarios tipo test usando LLMs (Ollama en local, OpenRouter en la nube).

## Normas del proyecto
1. **Stack:** Node.js, Express y TypeScript (backend); HTML, Tailwind CSS y TypeScript (frontend).
2. **Formato estricto:** toda salida del LLM para cuestionarios debe cumplir el esquema definido en `src/types/quiz.ts` y validarse con Zod.
3. **Modo híbrido:** usar por defecto el modelo local `ollama/qwen2.5-coder:7b-8k`. Si Ollama no está disponible o no completa la respuesta en 180 s, conmutar a OpenRouter.
4. **Claves:** nunca escribir API keys en el código ni en archivos versionados; se leen de variables de entorno.
5. **Verificación:** todo código generado debe pasar `tsc --noEmit` antes de darse por terminado.

## Requisitos (referenciarlos por su ID)
- REQ-01: 5 preguntas desde un texto de 300+ palabras, en local, en menos de 180 s y sin llamadas a OpenRouter.
- REQ-02: cada pregunta tiene 4 opciones (A, B, C, D), una correcta y una explicación.
- REQ-03: si Ollama no está disponible o supera los 180 s, se usa OpenRouter con aviso y sin perder el texto cargado.
- REQ-04: puntuación con formato "3/5 (60 %)" y detalle de las preguntas falladas.
- REQ-05: el JSON del LLM se valida con Zod; hasta 2 reintentos; si falla, mensaje de error claro.
- REQ-06: ninguna API key en el repositorio.
- REQ-07: aviso de privacidad visible cuando el modo nube está activo.
