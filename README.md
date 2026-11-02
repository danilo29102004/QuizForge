# QuizForge

Generador de cuestionarios tipo test con LLMs locales (Ollama) y en la nube (OpenRouter).

## Puesta en marcha
1. `cp .env.example .env` y rellena `OPENROUTER_API_KEY`.
2. `export OPENROUTER_API_KEY="tu-clave"` (en la terminal donde abras OpenCode).
3. `ollama serve` (si no está ya en marcha) y `opencode` dentro de esta carpeta.

## Estructura
- `opencode.json`: modelos, proveedores y contexto.
- `AGENTS.md`: contexto global del proyecto.
- `.opencode/agents/` y `.opencode/commands/`: agentes y comandos (punto 5).
- `prompts/`: Meta-Gema y Gemas en `.md` (punto 4).
- `docs/`: documentación y capturas.
- `src/`, `tests/`: código y pruebas.
