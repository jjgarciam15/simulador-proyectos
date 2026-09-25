# Aprender formulando en Aurora

La actualización introduce una ruta visible en cada etapa: responder un caso, contrastar la explicación y aplicar el concepto en otra situación. Son 16 casos por misión, disponibles en los nueve escenarios. El diagnóstico usa el contexto del escenario y el microcaso de VPN ajusta sus montos al escenario; los demás casos comparten conceptos transversales. No constituyen 144 preguntas distintas.

## Recorrido

| Etapa | Práctica |
|---|---|
| Diagnóstico | Necesidad sustentada con evidencia y unidades del déficit |
| Formulación | Objetivo común, alternativas y comparación sin duplicaciones |
| Preparación | Recursos, actividades, productos e indicadores de resultados |
| Evaluación | Cálculo de VPN y valor presente de cobros diferidos |
| Regulación | Distinguir metodología, registro, alineación y requisitos jurídicos |
| Decisión | Contrastar valor financiero/social y evitar duplicar transferencias |
| Ejecución | Seguimiento, supuestos y sostenibilidad operativa |
| Ex post | Diferencia de valor sacrificada entre alternativas factibles |

El jugador declara si responde con dudas o con seguridad. La ruta muestra aciertos iniciales, aciertos en situaciones distintas y conceptos por repasar. Guarda la primera respuesta; recargar no permite sustituirla. Se puede revisar el contenido de etapas recorridas y seguir practicando desde un informe terminado. No se exige responder correctamente para continuar ni se cobra por equivocarse. La práctica es opcional y no altera recursos, eventos, premios ni puntuación del proyecto.

Las explicaciones cierran con una acción concreta en las herramientas: revisar población, cadena, indicadores, flujo o comparador. Este puente orienta el uso de las herramientas sin señalar una alternativa ganadora. Reemplaza los cuatro cuestionarios breves que no guardaban respuestas.

## Laboratorio económico

En Evaluación, predecir antes de experimentar: inversión de 100 M COP hoy y dos cobros netos de 60 al cierre de los años 1 y 2. El jugador cambia tasa real (0–30 %) y retraso (0–3 años), observa cada valor presente y la suma. Al 10 %, el VPN inicial es 4,13; retrasar los cobros un año lo lleva a −5,33 M COP. Al 0 %, es 20 independientemente del retraso en este microcaso.

Las cantidades y tasas son educativas. No hay inflación, deuda ni valor residual en el microcaso. Un puente adicional compara la alternativa real del jugador con un año extra de retraso utilizando el motor y sus supuestos confirmados; conserva todos los demás supuestos y no revela condiciones ocultas. Como se desplazan ingresos y costos de operación, el efecto neto del proyecto no se presume idéntico al microcaso.

## Referencias y alcance

Revisión de fuentes: 13 de septiembre de 2026.

- [MGA en el DNP](https://www.dnp.gov.co/LaEntidad_/subdireccion-general-inversiones-seguimiento-evaluacion/direccion-proyectos-informacion-para-inversion-publica/Paginas/metodologia-general-ajustada-mga.aspx): metodología para formular y estructurar proyectos de inversión pública.
- [Lineamientos conceptuales DNP, enero de 2023](https://mgaayuda.dnp.gov.co/Recursos/Documento_conceptual_2023.pdf): fundamento metodológico y distinción entre formulación y registro en la herramienta. Identifica como antecedentes el artículo 343 de la Constitución, el artículo 49 de la Ley 152 de 1994 y la Resolución 1450 de 2013.
- [Normatividad publicada por DNP](https://dnp.gov.co/LaEntidad_/subdireccion-general-inversiones-seguimiento-evaluacion/direccion-proyectos-informacion-para-inversion-publica/Paginas/normatividad-vigente.aspx): consulta oficial para profundizar en los instrumentos aplicables.

MGA no equivale a todo el marco normativo; la regulación económica de un servicio tampoco sustituye la revisión jurídica de la inversión. Las ocho fases del juego son una adaptación, no ocho módulos oficiales. Los escenarios privados practican evaluación económica sin afirmar una obligación general de usar MGA. Esta actividad no acredita viabilidad oficial ni sustituye revisión jurídica o sectorial.

## Registro y validación

`src/domain/learning.ts` define casos versionados, respuestas válidas, resumen y experimento puro. `GameState.learning` es opcional para mantener compatibilidad. La acción `learn` conserva la primera respuesta y permite repaso posterior sin modificar el resultado cerrado. El informe HTML incorpora las evidencias de práctica, incluso las guardadas después del cierre, antes de una nueva descarga.

`src/features/LearningJourney.tsx` contiene la ruta y el laboratorio; `src/learning.css`, sus estilos. La vista de prueba de `.local/learning-preview.html` solo facilita revisión durante desarrollo y no se incluye en producción.

Validación automatizada: 63 pruebas, incluidos casos por escenario, recursos inalterados, respuesta única, requisitos de transferencia, persistencia, descuento y reporte ex post. Revisión de interfaz: error seguido de transferencia correcta, recuperación desde historial, controles por teclado y laboratorio a 390 px sin desbordamiento horizontal.

La precisión en estos ejercicios no demuestra por sí sola adquisición duradera de conocimientos. Se requiere pilotaje con estudiantes para validar dificultad, retención, transferencia fuera del simulador y duración de las sesiones. La predicción del laboratorio exploratorio es temporal; los 16 casos de la ruta sí se guardan.
