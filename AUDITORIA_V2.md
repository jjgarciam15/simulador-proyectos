# Auditoría previa · 22 de septiembre de 2026

## Arquitectura encontrada

SPA React 19 + TypeScript, Vite 6, Tailwind 4, Recharts y Lucide. No hay backend, cuentas ni API durante partidas. `App.tsx` coordina vistas locales (inicio, ayuda, historial, partida); no hay router. Ocho módulos funcionales usan `act` como motor puro. Los gráficos y los borradores son locales a componentes; el guardado recibe el estado confirmado.

`GameState` contiene semilla, versión de contenido, recursos, decisiones, estudios, actores, alternativa, presupuesto, cronograma, evaluación, regulación, ODS y snapshot de inversión. `storage.ts` usa localStorage, con espacio QA aislado. `scenarios.ts` compone nueve misiones de datos, incluidas tres de `expansion.ts`. Existen ilustraciones locales, personajes, efectos, recursos interactivos, lanzador Windows y 63 pruebas.

## Funciones que se conservan

Financiación con amortización; estudios que revelan sin cambiar la realidad; restricciones de caja; reserva; eventos deterministas y respuestas; evaluación financiera y social separadas; VPN/TIR/B-C/CAUE/recuperación; sensibilidad y escenarios; regulación y bienestar simplificados; 17 ODS; contrafactual con igual semilla; informes HTML; logros y campaña; reflexión sin calificación automática. Se conserva identidad Aurora y archivos de partidas antiguas.

## Brechas

- Volver cuesta recursos y requiere repetir etapas. `maxPhase` existe pero no permite navegación libre.
- Cambiar alternativa sustituye presupuesto y elimina actividades. No hay registro explícito de dependencias pendientes.
- Presupuesto y cronograma se proponen completos. La cadena se presenta en orden y el ejercicio de construcción es pequeño.
- Actores permiten estrategias pero la matriz está resuelta. ODS muestra respuestas orientadoras y no conserva argumentos individuales.
- Preguntas tienen tres opciones, un solo intento y feedback que revela la respuesta. No hay pistas graduadas ni penalizaciones pedagógicas.
- Puntuación mezcla proceso y desempeño; falta descomposición V2 con reglas de evidencia explícitas.
- Validación de guardado es parcial; no hay protección suficiente al reemplazar una partida. No existen README ni manual técnico principal.
- Valores de dificultad y efectos se repiten en el motor/UI. `App.tsx` y varias funciones del motor son muy densos. Paquete JS supera el umbral informativo de Vite. No hay script lint.

## Plan por fases, sin reescritura

1. Estado V2 opcional, dependencia/revisión, navegación libre antes de inversión, conservación de borradores confirmados, resguardo de partidas y documentación.
2. Construcción de cadena, presupuesto sin solución automática, preguntas/pistas/intentos, ODS y argumento regulatorio; puntuación con aportes explícitos. Compatibilidad mediante versión de reglas.
3. Mapa de actores, centro de información, planificación, consecuencias y validación de misiones. Reutilizar eventos, tiempo y financiación existentes.
4. Centro de mando, introducciones, perfil/informe e interacción accesible; probar una trayectoria y regresiones.
5. Documentar contratos de extensión para docente/reto/editor, sin botones de funciones inexistentes.

Cada fase requiere pruebas del motor y tipos antes de avanzar. La entrega distinguirá lo implementado de lo preparado o pendiente.
