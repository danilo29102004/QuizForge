## Decisión del autor
- Orden de implementación ajustado: REQ-02/05 → REQ-01 → REQ-04 → REQ-08 → REQ-07 → REQ-03 → REQ-06.
- REQ-07 y REQ-08 se verifican manualmente (sin tests de DOM).
- REQ-09 (longitud de entrada): adoptado como propuesta.
- REQ-10, REQ-11 y REQ-12: descartados (fuera del alcance; REQ-12 duplica REQ-03).
- Seguridad a incluir en la implementación: no enviar correct/explanation antes de puntuar, escapar el texto del LLM, limitar el cuerpo de Express.