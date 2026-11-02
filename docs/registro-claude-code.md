# Registro de tareas hechas con Claude Code

Constancia de las tareas mecánicas de preparación del entorno ejecutadas con Claude Code. Cada tarea se hizo con confirmación previa del autor.

| Fecha | Tarea | Commit | REQ afectado |
|---|---|---|---|
| 2026-11-02 | Restaurar `src/types/quiz.ts` (`git checkout`) tras la prueba de edición, que solo había añadido un comentario | — (sin commit) | preparación |
| 2026-11-02 | Commit de `.opencode/agents/reviewer.md` (solo el commit; el contenido lo generó la Meta-Gema) | `d727f11` | preparación |
| 2026-11-02 | Inicializar el proyecto Node: `package.json` (ESM, scripts `typecheck`, `test`, `dev`), dependencias (express, zod; typescript, tsx, vitest, @types/node, @types/express) y `tsconfig.json` estricto. Verificado: `npm run typecheck` sin errores y `.gitignore` ya ignoraba `node_modules/`, `dist/` y `.env` | `d31a8e1` | preparación (hace verificable la norma 5: `tsc --noEmit`) |
| 2026-11-02 | Protección de `.env` en Claude Code: `.claude/settings.json` con `deny` de `Read(./.env)` (archivo creado por el autor; Claude Code solo hizo el commit) | `d54e707` | REQ-06 |

## Lo que NO ha hecho Claude Code

- **Meta-Gema y Gemas:** Instrucciones de la Meta-Gema redactadas por el autor con ayuda de un asistente de IA en chat y ejecutadas en Gemini. Hasta ahora solo existe la Gema Prompt Architect.
- **Agente reviewer:** generado por la Meta-Gema; Claude Code solo lo incluyó en un commit.
- **Comandos de OpenCode:** Pendientes: aún no se ha creado ninguno.
- **Mediciones de modelos:** Ejecutadas por el autor en su terminal con ollama y docs/probar_modelo.py.
