---
description: Lanza una auditoría con el agente reviewer sobre la ruta indicada.
agent: reviewer
---
Audita la ruta `$ARGUMENTS` siguiendo tus instrucciones de agente reviewer.

- Si `$ARGUMENTS` está vacío, pregunta qué ruta auditar y no hagas nada más.
- No modifiques ningún archivo.
- Devuelve únicamente el informe con las dos secciones de tu formato de respuesta (`## Checklist por requisito` y `## Hallazgos`), con archivo y línea en cada hallazgo.
