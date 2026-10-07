# Ludo: investigación y fortalecimiento MGA

Revisión: 11 de septiembre de 2026. Se consultaron documentación y páginas oficiales; no se realizó una evaluación experimental de aprendizaje ni una prueba extensa de los juegos externos.

## Referentes y decisiones de diseño

| Referente | Hallazgo documentado | Aplicación en Ludo |
| --- | --- | --- |
| [Cities: Skylines II — economía y producción](https://www.paradoxinteractive.com/games/cities-skylines-ii/features/economy-production) | Presenta una economía formada por flujos entre hogares, empresas y servicios. | Hacer explícita la ruta desde actividades financiadas hasta servicios y resultados. Se conserva la separación entre caja y beneficio social. |
| [Frostpunk — 11 bit studios](https://11bitstudios.com/games/frostpunk/) | Sitúa al jugador al frente de una sociedad que debe sobrevivir bajo restricciones. | El Consejo del Reino de Liones plantea preguntas sobre necesidades y decisiones. Los retos conceptuales no conceden recursos por acertar ni convierten la formación en acumulación de premios. |
| [En-ROADS — Climate Interactive](https://www.climateinteractive.org/en-roads/) y su [guía de dinámicas](https://docs.climateinteractive.org/projects/en-roads/en/latest/guide/background.html) | Permite explorar escenarios; su guía propone reflexionar sobre cuándo y cuánto cambian los resultados. | Registrar una predicción antes de experimentar con sensibilidad y contrastarla al terminar. La reflexión se guarda sin calificar automáticamente el texto. |

Estas aplicaciones son decisiones propias de diseño educativo. No implican equivalencia entre los modelos, aval de sus autores ni evidencia de eficacia pedagógica para Ludo.

## Base conceptual

Los [lineamientos conceptuales MGA del DNP, 2023](https://mgaayuda.dnp.gov.co/Recursos/Documento_conceptual_2023.pdf) distinguen identificación, preparación, evaluación y programación. La cadena articula recursos, actividades, bienes o servicios y resultados; los indicadores requieren metas y verificación. Referencias de lectura: páginas impresas 62–66 para cadena de valor, 71–72 para riesgos y 108–110 para indicadores. La paginación del visor puede diferir en una página.

## Lo implementado

1. **Mapa causal explícito.** En Diagnóstico, después de seleccionar tarjetas, el jugador conecta situaciones mediante origen y destino. Se requieren cuatro enlaces en partidas nuevas. Se comprueba la dirección causal y se penalizan conexiones incorrectas en el modelo; no se obliga a acertar para poder aprender del resultado.
2. **Cadena de valor construida por el jugador.** En Preparación se elige una causa, su objetivo específico, la clasificación del producto y las actividades que lo generan. Estas actividades deben existir en el cronograma. El análisis detecta actividades eliminadas o sin recursos. También reconoce alternativas que actúan sobre una causa indirecta para contribuir a la directa.
3. **Expediente revisable.** Se muestran criterios sobre causalidad, población, objetivo, cadena, medición y supuestos. Cada criterio explica qué revisar y en qué fase. Un criterio registrado no certifica que la redacción o evidencia sean válidas.
4. **Retos del Consejo.** Cuatro ejercicios breves practican problema frente a solución, entrega frente a resultado, medios de verificación y supuestos. Permiten repetir y recibir explicación sin alterar recursos ni puntuación.
5. **Predecir y explicar.** En Evaluación se guardan hipótesis y condiciones externas. Al finalizar, el jugador puede registrar una reflexión que conserva el resultado original.
6. **Matriz de seguimiento.** Antes de invertir y al finalizar, una tabla relaciona fin, propósito, producto y actividades con indicadores, línea base, meta, fuente, frecuencia y responsable. Se muestran los vacíos en lugar de inventar mediciones.

## Efectos sobre el juego

Para contenido versión 3:

`coherencia = 0,70 × coherencia anterior + 0,15 × conexiones causales + 0,15 × cadena de valor`

La coherencia anterior utiliza el Árbol del problema (45 %), objetivo general (25 %) y correspondencia con la alternativa (30 %). Las conexiones tienen cuatro relaciones esperadas; los enlaces incorrectos restan. La cadena comprueba cuatro elementos con el mismo peso: causa abordada, objetivo asociado, producto clasificado como servicio y dos actividades con recursos.

Estos pesos son parámetros pedagógicos propios, **no una fórmula oficial de la MGA**. La coherencia afecta el beneficio social modelado y su dimensión de puntuación. Las hipótesis, supuestos y reflexiones textuales no se puntúan. Una buena caja tampoco demuestra automáticamente buenos resultados sociales.

Las partidas de contenido 1 y 2 conservan su fórmula y sus requisitos anteriores. Pueden consultar el laboratorio; para experimentar las nuevas consecuencias se recomienda iniciar una misión. Los resultados previos no se recalculan.

## Ruta sugerida para probarlo

Abre `ABRIR_LUDO.cmd` y comienza una misión nueva:

- Diagnóstico: selecciona nodos en el Árbol del problema y abre la última herramienta, **Laboratorio MGA**. Conecta cuatro relaciones y confirma.
- Formulación: elige objetivo y alternativa; comprueba qué causa atiende la propuesta.
- Preparación: confirma cronograma e indicadores, construye la cadena y revisa las observaciones.
- Evaluación: registra una predicción, cambia un supuesto en sensibilidad y contrasta el resultado.
- Decisión: consulta el Consejo de revisión y la matriz; vuelve a etapas anteriores si necesitas reformular.
- Ex post: explica las desviaciones usando los indicadores y el diario. Guarda tu reflexión.

## Alcance y próximos desarrollos académicos

El laboratorio sigue siendo una adaptación acotada: nueve casos simulados con nodos configurados, una ruta de objetivo específico y producto, y revisión estructural. No sustituye el catálogo oficial de productos ni la evaluación de viabilidad en MGA Web. La selección de etiquetas no valida automáticamente un indicador; las fuentes y justificaciones requieren discusión docente.

Quedan para desarrollo posterior: múltiples objetivos y productos, programación de metas por periodo, evidencia documental contrastable, análisis detallado de localización y tamaño, y valoración docente de textos. La hipótesis de mayor aprendizaje debe probarse con estudiantes mediante una evaluación antes/después y tareas de transferencia a un caso nuevo.

## Validación de esta entrega

- 36 pruebas automatizadas aprobadas, incluyendo nueve escenarios hasta el cierre, consecuencias de enlaces incorrectos, ausencia de puntuación textual, persistencia y compatibilidad.
- Recorrido manual en navegador desde diagnóstico hasta evaluación: conexiones causales, selección de alternativa, cronograma y cadena confirmada.
- Comprobación de tipos y compilación local.

Implementación: `src/domain/mga.ts`, `src/features/MgaLab.tsx`, integración con `src/domain/engine.ts` y pruebas en `src/domain/engine.test.ts`.

## Actualización: revisión de indicadores

El expediente señala unidades incompatibles con la medida calculada, gasto presentado como resultado, avance físico presentado como impacto, metas de cobertura superiores a la población objetivo y porcentajes fuera de escala. También invita a justificar metas iguales a la línea base. Son observaciones educativas; no califican automáticamente la redacción ni modifican puntuaciones existentes.

La verificación actual comprende **40 pruebas aprobadas**. Las cuatro nuevas cubren consistencia de unidades, clasificación del gasto, límites de metas y beneficios netos negativos.
