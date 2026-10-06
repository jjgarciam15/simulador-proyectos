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
| Preguntas con trampas, 5 opciones como máximo | IMPLEMENTADA (2.4.3): todas las preguntas tienen exactamente 5 opciones; el módulo de 3 opciones de la V1 se retiró en 2.4.2 | `questionsV2.ts`, `appliedCases.ts`, `questionRules.test.ts` |
| Pistas en tres niveles e intentos 100/80/60 % | IMPLEMENTADA (existente) | `questionsV2.ts` |
| Cadena de valor construida por el jugador | IMPLEMENTADA | `chainBank`, `ChainBuilder` |
| Presupuesto sin valores precargados, guía y diagnóstico | IMPLEMENTADA | `budgetReview.ts`, `BudgetReviewPanel` |
| Escasez y contingencia | IMPLEMENTADA | `difficultyRules`, `budgetRules` |
| Información imperfecta y centro de información | IMPLEMENTADA | `InformationCenter.tsx` |
| Actores, matriz, negociación y aceptación social | IMPLEMENTADA (existente) | Diagnóstico, `negotiations.ts` |
| Dilemas sin opción perfecta | IMPLEMENTADA | `data/dilemmas.ts` |
| Eventos condicionales configurables | IMPLEMENTADA (2.4.3): dilemas y eventos de ejecución usan condiciones y modificadores declarados como datos, con el mismo evaluador; la reducción por estudio es un modificador. Los factores continuos (apoyo social, riesgo sistémico, condición ambiental real) siguen en la fórmula | `dilemmas.ts`, `engine.ts`, `events.test.ts` |
| Consecuencias inmediatas, diferidas y sistémicas | IMPLEMENTADA | `v2.consequences`, `v2.delayed`, `v2.eventRisk` |
| Bitácora del proyecto | IMPLEMENTADA | `ConsequenceLog`, `Journal` |
| Evaluación ex ante explicada con datos de la partida | IMPLEMENTADA | `ExAnteBrief.tsx` |
| Escenarios y sensibilidad | IMPLEMENTADA (existente) | `Evaluation.tsx` |
| Laboratorio regulatorio, «No intervenir», puzzle, fallo regulatorio | IMPLEMENTADA | `regulationLab.ts`, `RegulatoryPuzzle.tsx` |
| Catálogo amplio de instrumentos (impuestos, subsidios, provisión pública…) | PARCIAL: tres instrumentos por misión (no intervenir, focalizado, estricto); los subsidios aparecen como dilema | `scenarios.ts` |
| ODS sin preselección, justificados y valorados | IMPLEMENTADA | `SDGBuilder`, `sdgReview` |
| Introducción de etapas y «Aprender más» | IMPLEMENTADA | `CommandCenter.tsx` |
| Tutor contextual | IMPLEMENTADA (2.4.3): asesores, «Aprender más» y enlaces «¿Dudas? Repasa…» al concepto en cada herramienta; sin tutor conversacional | `Characters.tsx`, `ConceptLinks` |
| Dificultad centralizada y explicada | IMPLEMENTADA; no modifica el plazo | `difficultyRules`, `DifficultyGuide` |
| Puntuación V2, coherencia transversal, bonificaciones y penalizaciones | IMPLEMENTADA | `scoringV2.ts`, `coherence.ts` |
| Resultado detallado, aciertos y errores, perfil radar, historia por reglas | IMPLEMENTADA | `ScoreV2.tsx`, `ledger.ts` |
| Logros educativos | IMPLEMENTADA | `recognition.ts` |
| Rejugabilidad | IMPLEMENTADA por semilla (demanda, costos, severidad, eventos, dilemas, orden de tarjetas); el presupuesto base no varía por semilla | — |
| Motor configurable de misiones | PARCIAL: `Spec`, plantillas de dilemas y balance en datos; las preguntas se generan en código | `data/` |
| Validación de misiones | IMPLEMENTADA | `missions.ts` |
| Microinteracciones | IMPLEMENTADA, discretas y con `prefers-reduced-motion` | `v3.css` |
| Reinicio controlado | IMPLEMENTADA para etapa y misión (existente); no por decisión individual | `ResetStage.tsx` |
| Analítica local | IMPLEMENTADA: intentos, pistas, cambios, decisiones y tiempo por etapa (2.4.1), solo en el navegador | `stageTime` |
| Modo docente | PREPARADA / NO IMPLEMENTADA | ver `MANUAL_CREACION.md` |
| Modo reto | IMPLEMENTADA (existente) | `challenges.ts` |
| Lint | IMPLEMENTADA (2.4.3): ESLint en `pnpm check` y en la CI | `eslint.config.js` |

### Criterios de aceptación

Todos se responden SÍ: el jugador construye presupuesto, cadena de valor y selección de ODS; puede cambiar de alternativa conservando el progreso, con etapas marcadas para revisión, y volver a etapas anteriores. Hay restricciones reales (fondo 100/92/85 %), consecuencias inmediatas, diferidas y sistémicas, incertidumbre controlada por semilla, y los actores importan (apoyo, negociación, dilemas, exposición social). La evaluación ex ante usa las decisiones previas; regular exige analizar la severidad, y no intervenir puede ser correcto; existen fallas regulatorias. La puntuación es explicable, los modos de dificultad difieren en ocho parámetros, la partida continúa tras recargar, hay rejugabilidad, una misión nueva se define con datos y la aplicación compila.

### Pendientes reales

Resueltos en 2.4.1–2.4.3: eventos de ejecución condicionales, tiempo por etapa, ESLint y pruebas E2E permanentes.

- Ampliar el catálogo de instrumentos regulatorios por misión: exige definir parámetros nuevos de balance (costo, corrección, efectos laterales) y recalibrar la puntuación regulatoria; no se añadieron para no inventar datos.
- Piloto con estudiantes para calibrar balance, duración y dificultad percibida (requiere personas, no código).
- Fuera del alcance local: OCR de PDF escaneados (requiere modelos de idioma externos), modo docente con cuentas y servidor, y publicación con enlace.

---

# V2.2 · Evolución académica, económica y de simulación (25 de septiembre de 2026)

Ampliación obligatoria del prompt maestro V2 (registrada completa en `MANUAL_CREACION.md → Historial de prompts`). Estados: IMPLEMENTADA, PARCIAL, PREPARADA, PENDIENTE.

## Línea base

`pnpm test`: 156 pruebas aprobadas (14 archivos). `pnpm typecheck` y `pnpm build`: sin errores. No hay script de lint. No existía un «Examen 2» en el repositorio: se diseña desde cero.

## Investigación académica (fuentes verificadas)

| Tema | Fuente | Dato adoptado |
|---|---|---|
| Tasa social de descuento | DNP, Resolución 1092 de 2022 | 9 % efectivo anual para proyectos de inversión pública |
| RPC de insumos y de la divisa | DNP, *Archivos de Economía* 497 (2019), Hernández, Matamoros y Sánchez | RPC divisa 1,032; obras civiles 0,903; edificaciones 0,905; energía distribuida 0,901; agua 0,826; gasolinas y combustibles 0,822; cemento 0,875; hierro y acero 0,873; transporte de pasajeros 0,874 |
| RPC de mano de obra | DNP, *Archivos de Economía* 498 (2019), Matamoros, Lamprea y Hernández | 2018: calificada urbana 1,018; no calificada urbana 0,607; rural 0,722 |
| Metodologías de valoración | MinAmbiente, *Guía de aplicación de la valoración económica ambiental* (Resolución 1084 de 2018) | Preferencias reveladas (costo de viaje, precios hedónicos, costos evitados o inducidos: productividad, costos de producción, costo de la enfermedad; gastos de prevención, restauración, reemplazo, gastos defensivos); preferencias declaradas (valoración contingente, experimentos de elección y conjoint); la transferencia de beneficios «no es un método de valoración como tal» |
| Marco general | OECD (2018), *Cost-Benefit Analysis and the Environment* | Distinción preferencias reveladas/declaradas; valores de uso y de no uso |

Diferencia documentada: la guía de MinAmbiente ubica los métodos basados en costos dentro de la familia de preferencias reveladas (información de mercados relacionados), mientras que parte de la literatura internacional los presenta como una familia aparte. El simulador los muestra como «Basados en costos y gastos», con una nota sobre esa clasificación, y recuerda que no son una medida técnicamente exacta del bienestar.

## Diseño

- **Estructura de partida.** Se conservan ocho etapas y se agrupan los nuevos módulos para no alargar la experiencia: Formulación incorpora objetivos generales y específicos; Preparación incorpora efectos e impactos; Evaluación incorpora valoración económica, flujo financiero, flujo económico con RPC, VPN paso a paso, sensibilidad, estrés, valor de quiebre y evaluación distributiva; Decisión incorpora comparador, matriz de decisión y comité evaluador.
- **Motor de cálculo genérico** (`src/domain/flows.ts`): funciones puras sobre un `FlowCase` (rubros, periodos, tasas, RPC, beneficios). Las misiones construyen su caso desde la alternativa, la población y el presupuesto de la partida; el Examen 2 usa un caso propio con números verificables a mano.
- **Valoración** (`src/domain/valuation.ts`): medición → método → valor unitario → unidades → beneficio anual; ajuste por idoneidad del método (óptima, válida, parcial, inadecuada), confianza (alta, media, baja) según método y calidad del estudio, y detección de doble conteo.
- **Trazabilidad** (`src/domain/traceability.ts`): vínculos problema → objetivo → alternativa → actividad → producto → efecto → impacto → método → valor → flujo → indicador → decisión, con detección de vacíos.
- **Puntuación V3**: dimensiones nuevas para objetivos, efectos, valoración, flujos, RPC y comité; pesos por perfil de misión, normalizados. Las partidas V2 anteriores conservan su fórmula.

## Resultado V2.2

Validación final: `pnpm typecheck` sin errores; `pnpm test` 192 pruebas aprobadas en 17 archivos; `pnpm build` correcto. Revisión en navegador (Playwright, 1440 px y 390 px): objetivos, efectos e impactos, valoración, hojas de flujo financiero y económico, comparador, comité (aprendizaje y evaluación), Cómo jugar, tutorial, Centro de aprendizaje y Examen 2 completo en modo práctica, sin errores de consola ni desbordamiento horizontal en móvil.

### Estado por requisito

| Área | Estado | Evidencia o límite |
|---|---|---|
| Trazabilidad problema → decisión | IMPLEMENTADA | `traceability.ts`, pantalla «Trazabilidad», 40 % de la dimensión de coherencia |
| Objetivos general y específicos | IMPLEMENTADA | `ObjectivesBuilder`, requisito para cerrar Formulación |
| Alternativas con trade-offs | IMPLEMENTADA | Detalle en Formulación y comparador con 14 criterios |
| Efectos e impactos (incluye doble conteo y empleo) | IMPLEMENTADA | `impacts.ts`, `ImpactsBuilder` |
| Módulo de valoración, biblioteca y árbol de decisión | IMPLEMENTADA | 10 métodos, costo de estudio, confianza, idoneidad por impacto |
| Experimento de elección didáctico | IMPLEMENTADA | `ChoiceExperiment` |
| Presupuesto (O&M, residual, reposición, contingencia) | IMPLEMENTADA | Planificador V2 + caso de flujo |
| Flujo financiero tipo hoja de cálculo | IMPLEMENTADA | `FlowSheet`, colores por tipo de celda, explicación por celda |
| Calculadora de VPN paso a paso | IMPLEMENTADA | `NpvCalculator` |
| Línea de tiempo del proyecto | IMPLEMENTADA | `Timeline` |
| Flujo económico con RPC y TSD 9 % | IMPLEMENTADA | `EconomicFlow`, `rpc.ts` con fuentes |
| Costos hundidos, costo de oportunidad, financiero vs. económico, doble conteo | IMPLEMENTADA | Detección de errores y preguntas del comité |
| Escenarios, estrés, sensibilidad, variable crítica y valor de quiebre | IMPLEMENTADA | `SensitivityLab` |
| Supuestos y procedencia de datos | IMPLEMENTADA | `AssumptionsPanel`, etiquetas de tipo de dato |
| Rangos de incertidumbre | IMPLEMENTADA (2.4.3) | Escenarios, estrés y simulación Monte Carlo reproducible (`risk.ts`) |
| Evaluación distributiva | IMPLEMENTADA | `Distribution` |
| Comparador y matriz de decisión | IMPLEMENTADA | Pesos del jugador; no elige automáticamente |
| Comité evaluador | IMPLEMENTADA | 5 preguntas derivadas de la partida |
| Regulación | IMPLEMENTADA (V2) | Sin cambios en la V2.2 salvo trazabilidad; catálogo de instrumentos limitado |
| ODS | IMPLEMENTADA (V2) | Pregunta del comité y eslabón de trazabilidad |
| Examen 2 | IMPLEMENTADA | 13 pasos, dos modos, intentos guardados; independiente de las misiones |
| Modos Aprendizaje / Evaluación | IMPLEMENTADA | `help.ts`: retroalimentación diferida y una pista en evaluación |
| Centro de aprendizaje | IMPLEMENTADA | 33 conceptos, búsqueda, categorías, relacionados, mini ejercicios |
| Práctica rápida | IMPLEMENTADA | VPN y RPC |
| Cómo jugar y tutorial | IMPLEMENTADA | Siete pasos y tutorial de cuatro decisiones |
| Perfil de misión y módulos habilitados | IMPLEMENTADA | `missionProfiles.ts` |
| Puntuación V3 con pesos configurables | IMPLEMENTADA | 12 dimensiones, renormalización |
| Anti-farming | IMPLEMENTADA | Se puntúa el estado confirmado |
| Recomendaciones y rejugabilidad | IMPLEMENTADA | Recomendaciones por dimensión débil; semilla |
| Tokens de diseño y contraste | IMPLEMENTADO | Auditoría automática WCAG AA de todas las pantallas: 0 textos bajo el umbral (`src/contrast.css`) |
| Arrastrar y soltar accesible | PARCIAL | Alternativa por selección; DnD verificado con eventos sintéticos |
| Tutor contextual | IMPLEMENTADA (2.4.3) | Introducciones, pistas y enlaces al concepto en cada módulo; sin tutor conversacional |
| Modo docente | PREPARADA | Datos y reglas reutilizables; sin interfaz |
| Analítica de tiempo por etapa | IMPLEMENTADO | Acción `stageTime` (no puntúa); panel «Tiempo por etapa» en resultados |
| Validación de contenido | IMPLEMENTADA | Pruebas de catálogo: tarjetas de impacto con método idóneo y flujos de las nueve misiones |

### Deuda técnica

- `engine.ts` mezcla código original compacto con bloques nuevos legibles; conviene separarlo por etapa.
- `App.tsx` concentra navegación y modales; conviene extraer un enrutador de vistas.
- El paquete de producción supera 500 kB; conviene dividirlo por etapa con importación dinámica.

# V2.4 · Plataforma de proyectos (25 de septiembre de 2026)

Especificación acumulativa V2 + V2.2 + V2.4 (el prompt V2.3 no se recibió; su importación se implementó aquí). Prompt completo en `MANUAL_CREACION.md → Historial de prompts`.

## Línea base y diseño

Línea base: 192 pruebas (17 archivos), tipos y compilación sin errores. Decisión central: no crear simuladores paralelos. `NormalizedProject` → `MissionGenerator` → mismo `Scenario` y mismo `act()`; las misiones generadas se registran en tiempo de ejecución junto a las oficiales (que no cambian). Orden seguido: arquitectura (P0) → Builder (P1) → importación (P2) → experiencia (P3) → pruebas, E2E y documentación.

## Resultado

`pnpm typecheck` sin errores; `pnpm test` 220 pruebas en 20 archivos; `pnpm build` correcto (pdf.js se carga bajo demanda). E2E en navegador A–E aprobadas sin errores de consola.

| Área | Estado | Evidencia o límite |
|---|---|---|
| NormalizedProject + schemaVersion + migraciones | IMPLEMENTADO | `types.ts`, `schema.ts`, pruebas de versión futura y v0 |
| ProjectSource (official, imported_pdf, imported_excel, manual) | IMPLEMENTADO | Adapta revisión, confianza y estado de respuestas |
| MissionGenerator por reglas sobre el motor único | IMPLEMENTADO | Misión generada jugada completa en prueba; misiones oficiales convertidas pasan por el mismo generador |
| Puzzles auditables (esperada / plausible / requiere revisión) | IMPLEMENTADO | 12 tipos de actividad con fuente; editor del creador |
| Selección de fases y configuración (dificultad, modo, duración) | IMPLEMENTADO | Exploración = cambios sin costo |
| Partida rápida | PARCIAL | Reduce módulos (sin flujo económico ni comité); las ocho etapas siguen presentes |
| Project Builder (asistente, borradores, autoguardado, completitud, validación, vista previa, crear partida) | IMPLEMENTADO | E2E B |
| Asistencia académica y «Revisar mi proyecto» | IMPLEMENTADO | Heurísticas que advierten sin corregir |
| Árbol del problema visual con arrastrar y alternativa por teclado | IMPLEMENTADO | DnD HTML5; botones «Mover a…», subir y bajar |
| Modo creador/profesor (respuestas, distractores, dificultad, actividades, vista previa como jugador) | IMPLEMENTADO | Datos ocultos por campo: PREPARADO (campo en el esquema, sin interfaz) |
| Publicación local / compartir | PARCIAL | Exportar/importar `.proyecta.json` validado; sin enlace de publicación |
| Importación PDF nativa | IMPLEMENTADO | pdf.js local, página de origen, E2E C |
| OCR de PDF escaneado | PENDIENTE | Se detecta y se pide completar manualmente |
| Importación Excel (hojas, encabezados, tablas, valores, fórmulas como texto, sin macros) | IMPLEMENTADO | Lector propio; E2E D verifica números |
| Seguridad (extensión, MIME, tamaño, firma, corrupción) y privacidad local | IMPLEMENTADO | Pruebas de rechazo |
| Referencias de fuente, confianza, «No identificada», revisión obligatoria | IMPLEMENTADO | Bloqueo hasta confirmar la revisión |
| Mis proyectos (oficiales, importados, creados, borradores, partidas; acciones) | IMPLEMENTADO | Duplicar proyecto y partida |
| Restablecer partidas y preparar para compartir con verificación tras recargar | IMPLEMENTADO | E2E E: solo queda la preferencia de sonido; 9 misiones oficiales |
| Paleta, tokens (color, tipografía, espaciado, radios, sombras, transiciones) | IMPLEMENTADO | `tokens.css`; pantallas nuevas y V2.2 los usan |
| Rediseño visual completo de pantallas antiguas | PARCIAL | Heredan la paleta donde usan tokens; su estructura se conserva |
| Dashboard | PARCIAL | Recursos, etapa, alternativa y riesgo ya visibles; se añadió «antes → después» y animación de medidores |
| Hoja tipo Excel: entrada, dato, calculado, advertencia, error | IMPLEMENTADO | Filas marcadas en modo aprendizaje |
| Personajes con 7 estados y 5 roles | IMPLEMENTADO | Estado derivado de la partida, en texto y animación |
| Microinteracciones, eventos, logros, mapa, movimiento reducido | IMPLEMENTADO | `v5.css` |
| Centro de aprendizaje desde el Builder (modal) | IMPLEMENTADO | Enlaces «¿Qué es esto?» |
| Ejemplos del Centro que ayudan a llenar el proyecto con confirmación | IMPLEMENTADO | Árbol del problema e impactos; solo se copian tras confirmar |
| TeacherProject / Assignment / StudentAttempt / Result | PREPARADO | Tipos documentados |
| Comparación de intentos | IMPLEMENTADO | Tabla por misión en resultados |

### Deuda técnica V2.4

- `App.tsx` crece con cada vista; conviene un enrutador de vistas y un contexto para el almacén de proyectos.
- El registro de misiones generadas escribe en tablas por misión existentes (`missionImpacts`, `missionProfiles`, `directSDGs`, `missions`); una interfaz de consulta única sería más limpia.
- Heurísticas de asistencia basadas en palabras clave: útiles para advertir, no para calificar.

## Verificación integral (25 de septiembre de 2026)

Revisión de todo lo solicitado (lista original, V2, V2.2 y V2.4) y búsqueda de fallos:

- `pnpm check`: tipos sin errores, 224 pruebas en 21 archivos, compilación correcta; `pnpm repo:check` sin hallazgos.
- Recorrido automático en navegador de las 9 misiones oficiales × 2 dificultades × 3 momentos (en curso, en ejecución, terminada), todas las etapas y todas sus herramientas: 1.060 vistas sin errores de página, de consola, textos inválidos (NaN, undefined) ni desbordamiento horizontal; también a 390 px.
- Mismo recorrido para misiones generadas desde un proyecto creado, un PDF y un Excel: 158 vistas sin problemas.
- Pruebas de extremo a extremo A–E y Examen 2 completo: sin errores.
- Auditoría de contraste WCAG AA en inicio, ayuda, Mis proyectos, importación, los 10 pasos del Builder, Examen 2, todas las etapas del juego y resultados: 0 textos bajo el umbral.
- Móvil (390 px) en inicio, Builder, Mis proyectos e importación: sin desbordamiento.

Fallos encontrados y corregidos en esta revisión:

1. Comité, Centro de aprendizaje, Examen 2, tutorial y actividades generadas tenían 3–4 opciones: ahora todas las preguntas tienen 5–7 opciones con trampas (prueba `questionRules.test.ts`).
2. En el Centro de aprendizaje y el Examen 2 la respuesta correcta aparecía siempre primero: las opciones se mezclan de forma reproducible.
3. Tarjetas de «Encargos especiales» del inicio y herramientas del panel derecho del juego con texto casi invisible; otros 70 textos con contraste bajo.
4. Barra de pasos y tablas del Builder desbordaban la pantalla en móvil.
5. El control flotante de sonido tapaba el texto del pie de página.
6. Solicitud de `favicon.ico` inexistente (error 404 en consola).
7. Restos de la palabra «árbol» sin «del problema».

Siguen como PARCIAL / PENDIENTE / PREPARADO (decisión documentada, no fallos): OCR de PDF escaneados (requeriría descargar modelos de idioma de un servicio externo), partida rápida con menos etapas, datos ocultos del creador, publicación compartible más allá del archivo `.proyecta.json`, modo profesor con servidor, rediseño estructural de pantallas antiguas y los límites V2 ya listados (catálogo de instrumentos, tiempo en meses, tutor conversacional).
