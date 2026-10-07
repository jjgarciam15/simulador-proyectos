# Contribuir a Ludo

Usa Node 24 y la versión de pnpm fijada en `package.json`. Instala con `pnpm install --frozen-lockfile` y ejecuta `pnpm check` antes de proponer cambios. El proyecto todavía no tiene una licencia abierta concedida: consulta `docs/LICENCIA_Y_RECURSOS.md` antes de reutilizarlo.

- Cambia contenido en `src/data`, reglas puras en `src/domain` y presentación en `src/features` o `src/components`.
- Conserva la realidad subyacente y la reproducción por semilla. Los estudios revelan, no vuelven a sortear.
- Valida recursos antes de confirmar y no cobres por explorar controles.
- Separa caja, financiación, costos de recursos y beneficios sociales. Los datos nuevos deben estar identificados como simulados o acompañados de fuente verificable.
- Conserva condiciones de partidas anteriores. Si cambias eventos o contratos, versiona sus reglas.
- No califiques semánticamente textos libres con coincidencias de palabras.
- Añade pruebas de consecuencias observables y casos límite; consulta `src/testSupport/gameFixture.ts` para preparar expedientes sin duplicar el motor.
- Revisa teclado, foco, mensajes de error, móvil y preferencias de movimiento reducido.
- Actualiza `ENTREGA_V2.md` y el registro de cambios; no declares validación pedagógica sin evidencia de un piloto.

Para reportar errores incluye escenario, dificultad, semilla, etapa y pasos. No incluyas identidades, evaluaciones personales ni partidas de estudiantes en incidencias públicas.
