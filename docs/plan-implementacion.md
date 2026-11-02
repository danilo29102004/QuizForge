# Plan de implementación de QuizForge

## Supuestos del plan

- **REQ-09:** entrada entre **300 y 3.000 palabras**, con mensajes claros si no se alcanza el mínimo o se supera el máximo.
- **Frontend:** un único `public/app.js` en JavaScript, sin compilación ni bundler. Tailwind por CDN para no añadir build de CSS.
- **Seguridad:** el servidor guarda el quiz completo en memoria y nunca envía `correct` ni `explanation` antes de puntuar.
- **Sin tests de DOM** para REQ-07/REQ-08, según la Decisión del autor.

---

## Paso 1 — REQ-02: esquema Zod del cuestionario

**Archivos**
- Modificar `src/types/quiz.ts`: esquemas Zod `OptionSchema`, `QuestionSchema` y `QuizSchema`; exactamente 5 preguntas, opciones A–D no vacías, `correct` válido y explicación no vacía. Tipos inferidos con `z.infer`.
- Crear `tests/quiz-schema.test.ts`.

**Test Vitest**
- Acepta un quiz válido de 5 preguntas.
- Rechaza 4 o 6 preguntas, una opción ausente, `correct` inválido o explicación vacía.

**Comprobación**
```bash
npm run typecheck && npx vitest run tests/quiz-schema.test.ts
```

---

## Paso 2 — REQ-05: parseo y reintentos de validación

**Archivos**
- Crear `src/services/quizParser.ts`: extrae JSON de bloques Markdown, parsea, valida con `QuizSchema` y reintenta hasta 2 veces (3 intentos totales). Al agotar intentos lanza un error claro en español.
- Crear `tests/quiz-parser.test.ts`.

**Test Vitest**
- Acepta JSON limpio y JSON dentro de ```json.
- Reintenta si la primera respuesta es inválida y acepta la segunda.
- Tras 2 reintentos fallidos lanza error claro y no hace un cuarto intento.
- JSON malformado produce error controlado.

**Comprobación**
```bash
npm run typecheck && npx vitest run tests/quiz-parser.test.ts
```

---

## Paso 3 — REQ-01/REQ-09: validación de entrada y cliente Ollama

**Archivos**
- Crear `src/validation/input.ts`: texto obligatorio, **mínimo 300 palabras y máximo 3.000 palabras**. Error claro y distinto para texto demasiado corto y demasiado largo.
- Crear `src/llm/quizPrompt.ts`: prompt que exige JSON válido, 5 preguntas, 4 opciones, una correcta y explicación.
- Crear `src/llm/ollama.ts`: llamada a `http://localhost:11434/api/generate` con `qwen2.5-coder:7b-8k`, `stream:false`, timeout de 180 s y `AbortSignal`.
- Crear `tests/input-validation.test.ts` y `tests/ollama-client.test.ts`.

**Test Vitest**
- Menos de 300 palabras: rechazado con mensaje de mínimo.
- Exactamente 300 palabras: aceptado.
- Exactamente 3.000 palabras: aceptado.
- Más de 3.000 palabras: rechazado con mensaje de máximo.
- El cliente usa el modelo y endpoint correctos.
- Timeout de 180 s aborta la petición.
- Error de conexión se traduce a “Ollama no disponible”.
- No se llama a OpenRouter.

**Comprobación**
```bash
npm run typecheck && npx vitest run tests/input-validation.test.ts tests/ollama-client.test.ts
```

---

## Paso 4 — REQ-01: servicio de generación y endpoint local

**Archivos**
- Crear `src/services/quizGenerator.ts`: valida entrada → Ollama → parser con reintentos → `Quiz`.
- Crear `src/services/quizStore.ts`: almacén en memoria `id → Quiz` con `randomUUID`.
- Crear `src/server.ts`: Express, `express.json({ limit: "1mb" })`, `POST /api/quiz`. Devuelve `{ id, questions, usedCloud: false }` con preguntas públicas sin respuestas.
- Crear `tests/quiz-generator.test.ts` y `tests/quiz-routes.test.ts`.

**Test Vitest**
- Generación con Ollama simulado devuelve 5 preguntas y no llama a OpenRouter.
- El endpoint responde sin `correct` ni `explanation`.
- Texto con menos de 300 o más de 3.000 palabras devuelve 400 con mensaje claro.
- Cuerpo excesivo rechazado por el límite de Express.

**Comprobación**
```bash
npm run typecheck && npx vitest run tests/quiz-generator.test.ts tests/quiz-routes.test.ts
```

Verificación real con Ollama:
```bash
npm run dev
time curl -s -X POST http://localhost:3000/api/quiz \
  -H 'content-type: application/json' \
  --data '{"text":"<contenido de docs/texto-prueba.txt>"}'
```
Debe tardar menos de 180 s y no producir tráfico a OpenRouter.

---

## Paso 5 — REQ-04: puntuación y detalle de fallos

**Archivos**
- Crear `src/services/scoreQuiz.ts`: compara respuestas, calcula aciertos y devuelve `"3/5 (60 %)"` más la lista de fallos con pregunta, opción elegida, respuesta correcta y explicación.
- Modificar `src/types/quiz.ts`: esquema Zod de respuestas enviadas.
- Modificar `src/server.ts`: `POST /api/score` con `{ id, answers }`; 404 si el quiz no existe.
- Crear `tests/score-quiz.test.ts` y ampliar `tests/quiz-routes.test.ts`.

**Test Vitest**
- 3 aciertos de 5 producen exactamente `3/5 (60 %)`.
- Se detallan las 2 preguntas falladas con su explicación.
- Funciona con 0/5 y 5/5.
- Preguntas sin responder cuentan como fallo.
- El endpoint no devuelve el quiz completo.

**Comprobación**
```bash
npm run typecheck && npx vitest run tests/score-quiz.test.ts tests/quiz-routes.test.ts
```

---

## Paso 6 — REQ-08: página, progreso y cancelación

**Archivos**
- Crear `public/index.html`: textarea, botón Generar, indicador de progreso, botón Cancelar, formulario de preguntas, botón Corregir y zona de resultados. Tailwind por CDN.
- Crear `public/app.js`: único archivo JavaScript del cliente, sin compilación ni bundler. Usa `fetch` con `AbortController` y renderiza todo el contenido del LLM con `textContent`; nunca `innerHTML`.
- Modificar `src/server.ts`: servir `public/` como estáticos.
- No se modifica `package.json` ni se añade esbuild.

**Test Vitest**
- No aplica: verificación manual, según la Decisión del autor.

**Comprobación**
```bash
npm run typecheck
```
Manual: `npm run dev`, abrir `http://localhost:3000`, generar, comprobar spinner, cancelar y verificar que el texto del textarea se conserva.

---

## Paso 7 — REQ-07: aviso de privacidad en modo nube

**Archivos**
- Modificar `public/index.html`: aviso oculto “Modo nube: el texto se enviará a OpenRouter”.
- Modificar `public/app.js`: mostrar el aviso solo si la respuesta trae `usedCloud: true`.
- Modificar `src/server.ts`: incluir `usedCloud` en la respuesta (fijo en `false` hasta el paso 8).

**Test Vitest**
- No aplica: verificación manual.

**Comprobación**
```bash
npm run typecheck
```
Manual: con Ollama local el aviso permanece oculto; comprobar su aspecto retirando temporalmente `hidden` desde DevTools. La visibilidad real con la nube se valida en el paso 8.

---

## Paso 8 — REQ-03: fallback a OpenRouter

**Archivos**
- Crear `src/llm/openrouter.ts`: lee `OPENROUTER_API_KEY` de entorno, llama a OpenRouter con timeout y sin registrar la clave.
- Modificar `src/services/quizGenerator.ts`: si Ollama falla o supera 180 s, usa OpenRouter; devuelve `usedCloud: true`. Si ambos fallan, error claro.
- Modificar `src/server.ts`: propagar cancelación del cliente a la petición LLM y devolver `usedCloud`.
- Crear `tests/fallback.test.ts`.

**Test Vitest**
- Ollama disponible: no se llama a OpenRouter y `usedCloud` es `false`.
- Ollama caído o timeout: se llama a OpenRouter y `usedCloud` es `true`.
- Si OpenRouter falla también, el error es claro.
- Sin `OPENROUTER_API_KEY`, error claro sin exponer la clave.
- El texto original no se modifica durante el fallback.
- La respuesta pública sigue sin `correct` ni `explanation`.

**Comprobación**
```bash
npm run typecheck && npx vitest run tests/fallback.test.ts
```
Manual: detener Ollama o usar `OLLAMA_URL=http://localhost:1`, generar y comprobar aviso de privacidad y que el texto sigue en el textarea.

---

## Paso 9 — REQ-06: higiene de secretos

**Archivos**
- Crear `src/config/env.ts`: centraliza `OPENROUTER_API_KEY`, `OLLAMA_URL`, `OLLAMA_MODEL` y `OPENROUTER_MODEL` desde variables de entorno.
- Modificar clientes LLM para usar `env.ts`.
- Verificar `.env.example` con clave vacía y `.gitignore` con `.env`.
- Crear `tests/no-secrets.test.ts`: recorre archivos versionados y falla si encuentra patrones de clave real (`sk-or-v1-...`) o una `OPENROUTER_API_KEY` con valor.

**Test Vitest**
- No hay claves en archivos versionados.
- `.env` no está trackeado.

**Comprobación**
```bash
npm run typecheck && npx vitest run tests/no-secrets.test.ts
git check-ignore -v .env
git grep -nE 'sk-or-v1-' -- . ':!package-lock.json'
```
El último comando debe devolver **0 coincidencias**.

---

## Verificación final

```bash
npm run typecheck
npm test
```

Flujo manual completo: pegar entre 300 y 3.000 palabras → generar 5 preguntas con Ollama (<180 s) → responder → obtener `x/5 (y %)` y fallos detallados → cancelar una generación → probar textos fuera del rango y ver ambos errores → simular caída de Ollama y comprobar fallback con aviso de privacidad y texto conservado.
