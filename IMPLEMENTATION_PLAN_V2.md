# Plan de implementación V2 · iteración 2 (25 de septiembre de 2026)

Este plan corresponde a la solicitud «Implementación integral V2» registrada en `MANUAL_CREACION.md → Historial de prompts`. Parte de una auditoría completa del repositorio. **No es una reescritura:** la V2 anterior (22–23 de septiembre) ya implementó buena parte de lo pedido y se conserva.

Estados usados en este documento: **IMPLEMENTADA** (funciona y está validada), **PARCIAL** (funciona con alcance reducido), **PREPARADA / NO IMPLEMENTADA** (solo arquitectura o documentación).

## 1. Estado actual (auditoría)

### Arquitectura encontrada

- SPA React 19 + TypeScript 5.8 + Vite 6 + Tailwind 4 + Recharts + Lucide. Sin backend, router ni servicios externos. Gestión con pnpm 11.19.0; Node 24 fijado (`.nvmrc`, `engines`).
- `src/App.tsx` coordina vistas (inicio, ayuda, historial, partida), el `SaveData` central y la persistencia.
- Motor puro en `src/domain/engine.ts`: `act(state, action)` devuelve un estado nuevo (copia estructurada). `coreAct` conserva las reglas V1; `act` añade las reglas V2 (dependencias, revisiones, negociación, preguntas).
- Estado de partida: `GameState` (`src/domain/types.ts`) con `v2?: V2State` opcional y versionado (`src/domain/projectV2.ts`).
- Contenido: nueve misiones generadas a partir de `Spec` (`src/data/scenarios.ts`, `src/data/expansion.ts`), narrativa en `src/data/world.ts`, balance en `src/data/balance.ts`.
- Persistencia: `localStorage` (`proyecta-v1`, espacio QA con `?qa=1`) con validación estructural en `src/domain/storage.ts`.
- Pruebas: Vitest, 13 archivos, 136 pruebas (línea base ejecutada en esta sesión: todas pasan; `tsc -b` y `vite build` sin errores). No hay lint configurado.

### Funcionalidades existentes que se conservan

Mapa de ocho etapas con estados; visita gratuita de etapas desbloqueadas antes de invertir; revisiones dependientes (`dependencyRules`) que conservan el trabajo; alternativa visible con botón «Cambiar alternativa»; planificador de recursos; centro de información básico; estudios que revelan información sin alterar la realidad; negociación con actores; matriz de poder/interés; cadena de valor por tarjetas; presupuesto desde cero con calculadora cantidad × costo; contingencia; financiación (crédito, socio, cofinanciación); evaluación financiera y social (VPN, TIR, B/C, CAUE, recuperación), sensibilidad y escenarios; costo-eficiencia; laboratorio de bienestar regulatorio con «No intervenir»; argumento regulatorio; 17 ODS sin preselección con justificación; práctica con pistas de tres niveles e intentos (100/80/60 %); eventos de ejecución deterministas por semilla; diario de decisiones; puntuación V2 de ocho dimensiones con radar; reconocimientos; modo reto; partidas en pausa.

### Problemas encontrados

Técnicos:
- Archivos muy densos (`App.tsx`, `engine.ts` escritos en pocas líneas largas). Se evita reformatearlos para no producir un diff ilegible; el código nuevo se escribe en módulos separados y legibles.
- Los eventos son una lista plana (`probability`, `cost`, `delay`, `benefit`) que solo aparece en ejecución. No hay condiciones declarativas, opciones con efectos propios ni efectos diferidos.
- La cadena de valor usa un banco genérico de 12 tarjetas igual en todas las misiones; no hay tarjetas parcialmente correctas ni arrastrar y soltar.

Funcionales (brechas frente a la nueva solicitud):
- Antes de invertir no hay dilemas ni eventos: las decisiones de formulación no generan incertidumbre ni consecuencias diferidas.
- La regulación mal diseñada no produce consecuencias en el proyecto. «No intervenir» nunca puede ser la mejor respuesta de forma demostrable.
- El argumento regulatorio es de tres selecciones; no reconstruye la cadena causal completa.
- La puntuación no tiene un componente explícito de coherencia transversal ni bonificaciones visibles; la historia final es una frase genérica.
- El presupuesto se evalúa con suficiencia, mantenimiento y exceso de reserva, pero no entrega un diagnóstico explicable (subestimación, desperdicio, contingencia fuera de rango, coherencia con la cadena y los compromisos).
- Los estudios solo pueden contratarse en Diagnóstico.
- Las introducciones de etapa son de una línea; falta la estructura «Qué vas a hacer / Por qué importa / Qué debes decidir / Cómo afecta» y «Aprender más».
- Quedan referencias a «árbol» sin «del problema».
- Las preguntas tienen cinco opciones; se pide entre cinco y siete con distractores más plausibles.

## 2. Arquitectura objetivo

Se mantiene el motor único y el estado central. Se agregan módulos de dominio puros y configuraciones de datos:

| Responsabilidad | Módulo nuevo o evolucionado |
|---|---|
| Contenido de dilemas y eventos condicionales | `src/data/dilemmas.ts` (plantillas declarativas por misión) |
| Motor de dilemas y consecuencias diferidas | `src/domain/dilemmas.ts` |
| Diagnóstico regulatorio, puzzle causal y fallo regulatorio | `src/domain/regulationLab.ts` |
| Coherencia transversal, bonificaciones y penalizaciones | `src/domain/coherence.ts` |
| Diagnóstico explicable del presupuesto | `src/domain/budgetReview.ts` |
| Cadena de valor por misión | `chainBank` en `src/domain/projectV2.ts` |
| UI | `src/features/Dilemmas.tsx`, `src/features/RegulatoryPuzzle.tsx`, `src/features/StageIntro.tsx`, ampliaciones de `BuildersV2`, `ScoreV2`, `CommandCenter` |

Reglas de separación: contenido en `src/data`, reglas y cálculo en `src/domain`, presentación en `src/features`. Ningún componente calcula la puntuación.

## 3. Fases

1. **Base:** plan, terminología «Árbol del problema», estudios contratables en cualquier etapa previa a la inversión (con revisión de dependencias). Validar pruebas.
2. **Core educativo:** banco de cadena de valor por misión (correctas, parciales y distractores) con arrastrar y soltar y controles accesibles; diagnóstico de presupuesto; sexto distractor en la práctica. Validar.
3. **Simulación:** motor de dilemas declarativo (condiciones, probabilidad modificada por decisiones, opciones, efectos inmediatos, diferidos y sistémicos, semilla), bitácora y riesgo sistémico en ejecución. Validar.
4. **Evaluación:** la evaluación ex ante ya usa decisiones de la partida; se añade explicación breve y se muestra el efecto de los dilemas. Validar.
5. **Regulación:** severidad oculta de la falla por semilla (revelada por estudios), recomendación calculada, puzzle causal de ocho eslabones, consecuencias del fallo regulatorio. Validar.
6. **ODS:** ya implementado; se integra en la matriz de coherencia.
7. **Experiencia:** coherencia transversal, bonificaciones y penalizaciones explicables, historia final por reglas, introducciones de etapa, logros nuevos. Validar.
8. **Hardening:** pruebas nuevas, `pnpm check`, recorrido manual en navegador, documentación.

## 4. Riesgos

- **Regresión de pruebas del catálogo:** los dilemas podrían bloquear el recorrido automático. Mitigación: los dilemas solo bloquean el compromiso de inversión, y los ayudantes de prueba los resuelven explícitamente.
- **Cambio de puntuación:** partidas cerradas conservan su `outcome` congelado; los cambios solo afectan partidas nuevas.
- **Partidas guardadas V2 anteriores:** los campos nuevos son opcionales. Una partida sin `dilemmas` simplemente no tiene dilemas previos; no se reinterpreta su historial.
- **Balance:** efectos de dilemas acotados y expresados como fracción del presupuesto de la misión; se comprueba que siga existiendo un cierre viable por misión y dificultad.

## 5. Estrategia de compatibilidad

- `V2State` recibe campos opcionales (`dilemmas`, `pendingDilemma`, `delayed`, `eventRisk`, `puzzle`). La validación de `storage.ts` los acepta ausentes.
- Los identificadores de tarjetas de la cadena anteriores (`capital`, `design`, `service`, `access`, `welfare`, …) se conservan.
- No se cambian claves de `localStorage` ni el formato de `SaveData`.

## 6. Seguimiento de ejecución

Se actualiza al cerrar cada fase (ver sección final «Resultado de la ejecución»).

## Resultado de la ejecución

Ejecutado el 25 de septiembre de 2026 en tres commits validados (dominio → interfaz y puntuación → documentación y correcciones de la prueba manual). Cada fase terminó con `pnpm typecheck` y `pnpm test` en verde.

### Validación final

| Comprobación | Resultado |
|---|---|
| `pnpm test` | 156 pruebas en 14 archivos, todas aprobadas (línea base: 136 en 13) |
| `pnpm typecheck` | Sin errores |
| `pnpm build` | Correcto; paquetes de ~360, 299 y 378 kB antes de gzip |
| Compilación en subruta (`vite build --base=/simulador-proyectos/`) | Correcta; las imágenes respetan la base |
| Navegador (Chromium, build de producción, modo QA) | Inicio y comparación de dificultades; dilema pendiente resuelto; panel lateral con alternativa y variables; planificador presupuestal con guía y diagnóstico; laboratorio regulatorio; resultado con historia, ajustes, coherencia y aciertos/errores; vista móvil de 390 px sin desbordamiento horizontal. Único error de consola: `favicon.ico` inexistente (previo). |
| Arrastrar y soltar en la cadena | Verificado con eventos `DragEvent` nativos (5 → 6 tarjetas). El arrastre simulado con ratón de Playwright no dispara eventos HTML5 en modo headless; el selector sigue como alternativa accesible. |

Correcciones hechas a partir de la prueba manual: unidad «M» duplicada, contraste del panel lateral oscuro, redacción de la historia final, criterio de aciertos en dilemas, rutas de imágenes para despliegue en subruta y un diagnóstico de presupuesto demasiado indulgente (un presupuesto vacío obtenía 64/100; ahora queda por debajo de 60).

### Estado por requisito

| Requisito | Estado | Dónde |
|---|---|---|
| Terminología «Árbol del problema» | IMPLEMENTADA | engine, learning, Endgame, documentos |
| Estado central, persistencia, continuar y pausa | IMPLEMENTADA (existente, ampliada con campos opcionales) | `projectV2.ts`, `storage.ts` |
| Navegación sin repetir el recorrido | IMPLEMENTADA (existente) | `ProjectMap`, acción `visit` |
| «Requiere revisión» con razón visible | IMPLEMENTADA (existente). No hay un estado «inconsistente» separado: las razones se muestran por etapa | `invalidateV2`, `dependencyRules` |
| Alternativa detallada y cambiable sin perder progreso | IMPLEMENTADA | `CommandCenter.tsx` |
| Centro de mando y variables vivas | IMPLEMENTADA | `CommandCenter.tsx`, `ResourceDeck` |
| Tiempo como recurso | PARCIAL: meses como unidad; no hay días ni semanas | motor, dilemas |
| Planificador de recursos | IMPLEMENTADA (existente) | panel derecho |
| Preguntas con 5–7 opciones y trampas | IMPLEMENTADA en la práctica V2 (7 y 6 opciones). El módulo de 3 opciones solo existe para partidas guardadas antes de la V2 | `questionsV2.ts`, `appliedCases.ts` |
| Pistas en tres niveles e intentos 100/80/60 % | IMPLEMENTADA (existente) | `questionsV2.ts` |
| Cadena de valor construida por el jugador | IMPLEMENTADA | `chainBank`, `ChainBuilder` |
| Presupuesto sin valores precargados, guía y diagnóstico | IMPLEMENTADA | `budgetReview.ts`, `BudgetReviewPanel` |
| Escasez y contingencia | IMPLEMENTADA | `difficultyRules`, `budgetRules` |
| Información imperfecta y centro de información | IMPLEMENTADA | `InformationCenter.tsx` |
| Actores, matriz, negociación y aceptación social | IMPLEMENTADA (existente) | Diagnóstico, `negotiations.ts` |
| Dilemas sin opción perfecta | IMPLEMENTADA | `data/dilemmas.ts` |
| Eventos condicionales configurables | PARCIAL: el modelo completo (condiciones, probabilidad dependiente, opciones, efectos diferidos) se aplica a los dilemas previos a la inversión; los eventos de ejecución conservan su lista anterior, modulada ahora por el riesgo sistémico | `dilemmas.ts`, `engine.ts` |
| Consecuencias inmediatas, diferidas y sistémicas | IMPLEMENTADA | `v2.consequences`, `v2.delayed`, `v2.eventRisk` |
| Bitácora del proyecto | IMPLEMENTADA | `ConsequenceLog`, `Journal` |
| Evaluación ex ante explicada con datos de la partida | IMPLEMENTADA | `ExAnteBrief.tsx` |
| Escenarios y sensibilidad | IMPLEMENTADA (existente) | `Evaluation.tsx` |
| Laboratorio regulatorio, «No intervenir», puzzle, fallo regulatorio | IMPLEMENTADA | `regulationLab.ts`, `RegulatoryPuzzle.tsx` |
| Catálogo amplio de instrumentos (impuestos, subsidios, provisión pública…) | PARCIAL: tres instrumentos por misión (no intervenir, focalizado, estricto); los subsidios aparecen como dilema | `scenarios.ts` |
| ODS sin preselección, justificados y valorados | IMPLEMENTADA | `SDGBuilder`, `sdgReview` |
| Introducción de etapas y «Aprender más» | IMPLEMENTADA | `CommandCenter.tsx` |
| Tutor contextual | PARCIAL: asesores de la misión y «Aprender más»; no hay un tutor por concepto a demanda | `Characters.tsx` |
| Dificultad centralizada y explicada | IMPLEMENTADA; no modifica el plazo | `difficultyRules`, `DifficultyGuide` |
| Puntuación V2, coherencia transversal, bonificaciones y penalizaciones | IMPLEMENTADA | `scoringV2.ts`, `coherence.ts` |
| Resultado detallado, aciertos y errores, perfil radar, historia por reglas | IMPLEMENTADA | `ScoreV2.tsx`, `ledger.ts` |
| Logros educativos | IMPLEMENTADA | `recognition.ts` |
| Rejugabilidad | IMPLEMENTADA por semilla (demanda, costos, severidad, eventos, dilemas, orden de tarjetas); el presupuesto base no varía por semilla | — |
| Motor configurable de misiones | PARCIAL: `Spec`, plantillas de dilemas y balance en datos; las preguntas se generan en código | `data/` |
| Validación de misiones | IMPLEMENTADA | `missions.ts` |
| Microinteracciones | IMPLEMENTADA, discretas y con `prefers-reduced-motion` | `v3.css` |
| Reinicio controlado | IMPLEMENTADA para etapa y misión (existente); no por decisión individual | `ResetStage.tsx` |
| Analítica local | PARCIAL: intentos, pistas, cambios y decisiones; no mide el tiempo por etapa | — |
| Modo docente | PREPARADA / NO IMPLEMENTADA | ver `MANUAL_CREACION.md` |
| Modo reto | IMPLEMENTADA (existente) | `challenges.ts` |
| Lint | No configurado (no existía; no se añadió) | — |

### Criterios de aceptación

Todos se responden SÍ: el jugador construye presupuesto, cadena de valor y selección de ODS; puede cambiar de alternativa conservando el progreso, con etapas marcadas para revisión, y volver a etapas anteriores. Hay restricciones reales (fondo 100/92/85 %), consecuencias inmediatas, diferidas y sistémicas, incertidumbre controlada por semilla, y los actores importan (apoyo, negociación, dilemas, exposición social). La evaluación ex ante usa las decisiones previas; regular exige analizar la severidad, y no intervenir puede ser correcto; existen fallas regulatorias. La puntuación es explicable, los modos de dificultad difieren en ocho parámetros, la partida continúa tras recargar, hay rejugabilidad, una misión nueva se define con datos y la aplicación compila.

### Pendientes reales

- Migrar los eventos de ejecución al modelo condicional de los dilemas.
- Ampliar el catálogo de instrumentos regulatorios por misión.
- Medir el tiempo por etapa en la analítica local.
- Piloto con estudiantes para calibrar balance, duración y dificultad percibida.
- Configurar lint (ESLint) y pruebas E2E permanentes.
