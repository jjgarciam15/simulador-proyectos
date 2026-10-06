# Cambios

## 2.4.4 · Zoom de la interfaz en todas las pantallas (6 de octubre de 2026)

- Barra flotante con **alejar (−)**, **acercar (+)** y el porcentaje actual, visible en todas las pantallas: inicio, juego, Project Builder, exámenes y ventanas. Va de 60 % a 160 % en pasos de 10 %; el panel de ajustes tiene un deslizador fino.
- **Ajuste automático** (predeterminado) según el ancho de la ventana: 75 % en pantallas de 1.024 px, 95 % a 1.366 px, 100 % a 1.440 px y 135 % en monitores Full HD o mayores. En teléfonos queda en 100 %.
- En teléfonos el máximo se limita (por ejemplo 120 % a 390 px) para que el contenido nunca quede más angosto que 320 px ni se salga de la pantalla.
- La preferencia se guarda en el navegador y no cambia la partida ni la puntuación. El menú de etapas deja espacio para que la barra no tape sus últimos enlaces.
- Verificado con el recorrido completo de 1.218 vistas a 60 %, 100 % y 160 %, sin desbordes ni errores, más una prueba E2E del zoom.

## 2.4.3 · Preguntas de 5 opciones, revisión del repositorio y pendientes terminados (6 de octubre de 2026)

- **Preguntas: 5 opciones como máximo.** Práctica de la partida (antes 7), casos aplicados (antes 6), comité (algunas tenían 6), objetivo general (4) y específicos (6), métodos de valoración (5–7 según dificultad), Examen 2 (7 métodos) y actividades de proyectos propios (hasta 7) pasan a 5. La respuesta válida nunca se recorta. En los métodos de valoración la dificultad cambia cuántas de las 5 opciones son cercanas a la correcta, no su número. La prueba `questionRules.test.ts` exige exactamente 5.
- **Análisis de riesgo Monte Carlo** (Evaluación → Sensibilidad): 500 simulaciones reproducibles del flujo del jugador. Los rangos salen de los escenarios optimista y pesimista; la banda de demanda depende de si se compró el estudio de demanda. Muestra probabilidad de VPN negativo, P10/P50/P90 e histograma.
- **Tutor por concepto a demanda:** cada herramienta del juego (árbol, objetivos, alternativas, cadena de valor, presupuesto, actores, impactos, valoración, flujos, sensibilidad, comparación, regulación, ODS y comité) enlaza los conceptos que usa en el Centro de aprendizaje. Leerlos no cambia la partida.
- **Eventos de ejecución condicionales:** aceptan condiciones y modificadores de probabilidad declarados como datos, evaluados igual que los dilemas. La regla «el estudio reduce el evento a la mitad» ahora es un dato; 54 partidas de referencia dan resultados idénticos antes y después.
- **Robustez:** el motor valida la forma de cada acción. Se corrige que reabrir o visitar con una etapa no numérica dejara la partida en la etapa «NaN». Nueva prueba con miles de acciones aleatorias y malformadas.
- **Calidad del código:** ESLint (`pnpm lint`, incluido en `pnpm check` y en la CI), TypeScript sin variables ni importaciones sin uso, y pruebas E2E permanentes con Playwright (`pnpm e2e`, trabajo nuevo en la CI).
- **Carga inicial más liviana:** el lector de PDF (≈460 KB) ya no se descarga al abrir el simulador; solo al importar un PDF.

## 2.4.2 · Árbol y presupuesto construidos por el jugador, aprendizaje con 5 opciones y retiro de la versión 1 (26 de septiembre de 2026)

- Árbol del problema (partidas V2): ya no aparece ordenado por niveles. Banco mezclado de 14 tarjetas por misión: 8 correctas (incluye una causa directa, una indirecta y un efecto adicionales propios de cada misión) y 6 trampas (solución disfrazada «Falta de…», objetivo redactado en positivo, causa demasiado general, situación que no explica el problema y las dos trampas anteriores). El jugador arrastra cada tarjeta a su nivel o la ubica con una lista accesible por teclado; las trampas van a «No pertenece al árbol».
- Puntuación: nivel exacto 1, lado correcto (causa/efecto) pero nivel equivocado 0,5, trampa incluida o tarjeta válida descartada 0. El diagnóstico pondera 35 % enlaces causales, 25 % construcción del árbol, 25 % actores y 15 % focalización. Es obligatorio confirmar el árbol para avanzar.

- Los 16 casos de aprendizaje (iniciales y de transferencia) tienen 5 opciones: respuesta razonada, dos errores y dos trampas plausibles. La práctica V2 conserva 7 opciones.
- La regla de 5–7 opciones cubre también estos casos en la prueba `questionRules.test.ts`.
- Corrección de redacción: «En «Una ciudad en movimiento», …».

- Presupuesto construido por el jugador: para salir de Preparación hay que ingresar los datos básicos (reserva de operación, mantenimiento anual, interventoría y contingencias mayores que cero) y al menos una partida detallada de operación y otra de mantenimiento con cantidad y costo unitario. Una lista «Datos básicos por completar» muestra lo que falta.
- La alternativa elegida queda fijada en la parte superior del panel derecho (inversión, O&M, cobertura y obra) con acceso al detalle.
- Se eliminó lo que quedaba de la versión 1 en la interfaz: árbol, cadena de valor y presupuesto preestablecidos, recorrido de aprendizaje de 3 opciones, ruta MGA antigua y sus estilos. Las partidas de la versión 1 guardadas en el navegador (en curso, en pausa y terminadas) se descartan al abrir el simulador; las partidas nuevas no se ven afectadas.

## 2.4.1 · paquete portátil (25 de septiembre de 2026)

- `pnpm portable` genera `PROYECTA-<versión>-portable.zip`: aplicación compilada + servidor PowerShell; se abre con doble clic en Windows sin instalar Node.js.
- Flujo de GitHub Actions «Paquete portátil»: artefacto en cada push a `main` y Release al publicar una etiqueta `v*`.
- `ABRIR_PROYECTA.cmd` (versión de desarrollo) instala dependencias faltantes tras actualizar y reinicia el servidor anterior.

## 2.4.1 · verificación integral (25 de septiembre de 2026)

- Todas las preguntas del juego, comité, Centro de aprendizaje, Examen 2, tutorial y actividades generadas tienen 5–7 opciones con trampas; las opciones se mezclan para que la correcta no quede siempre primera.
- Auditoría de contraste WCAG AA de todas las pantallas y corrección de 70 textos, incluidas las tarjetas de retos del inicio y las herramientas del panel derecho.
- Tiempo por etapa, comparación de intentos y ejemplos del Centro de aprendizaje con confirmación en el Project Builder.
- Builder sin desbordamiento en móvil; pie de página libre del control de sonido; ícono de la aplicación.

## 2.4.0 · plataforma de proyectos (25 de septiembre de 2026)

- Tres experiencias en el inicio: Jugar historia, Importar proyecto y Crear proyecto, más Continuar, Aprender y Cómo jugar.
- NormalizedProject versionado con migraciones y MissionGenerator por reglas sobre el mismo motor de las misiones oficiales.
- Project Builder: asistente por pasos, árbol del problema visual, asistencia académica, autoguardado, completitud, «Revisar mi proyecto», vista previa, configuración y creación de la partida; modo creador con editor de actividades y vista previa como jugador.
- Importación local de PDF (texto nativo) y Excel (sin macros) con seguridad, referencias de fuente, confianza y revisión obligatoria; plantilla Excel y formato portable `.proyecta.json`.
- Mis proyectos con oficiales, importados, creados, borradores y partidas; duplicar proyectos y partidas.
- Restablecer partidas y preparar el simulador para compartir con confirmación escrita y verificación tras recargar.
- Nueva paleta y tokens de diseño; personajes con estados y roles; microinteracciones y movimiento reducido; celdas de advertencia y error en la hoja de flujo.

## 2.2.0 · evolución académica, económica y de simulación (25 de septiembre de 2026)

- Objetivos general y específicos desde el Árbol del problema; clasificación de efectos e impactos con doble conteo.
- Módulo de valoración económica: 10 métodos, árbol de decisión, costo de estudio, idoneidad y confianza; experimento de elección didáctico.
- Hoja de flujo financiero tipo Excel, VPN paso a paso, línea de tiempo, flujo económico con RPC (DNP) y tasa social de descuento del 9 %.
- Escenarios, estrés, variable crítica, valor de quiebre, supuestos y evaluación distributiva.
- Comparador de alternativas, matriz de decisión ponderada y comité evaluador.
- Puntuación V3 de 12 dimensiones con pesos por rol y perfil de misión; trazabilidad del proyecto.
- Modos Aprendizaje y Evaluación, Centro de aprendizaje, práctica rápida, Cómo jugar, tutorial y Examen 2.
- Documentación: fases detalladas en README, capítulos académicos y referencias en la memoria.

## 2.1.0 · iteración 2 de la V2 (25 de septiembre de 2026)

- Dilemas condicionales previos a la inversión, con consecuencias inmediatas, diferidas y sistémicas, reproducibles por semilla.
- Laboratorio regulatorio: severidad oculta de la falla, valor neto por instrumento, «No intervenir» defendible, puzzle causal de ocho eslabones y fallo regulatorio.
- Cadena de valor por misión con 21 tarjetas (correctas, parciales y distractores), arrastrar y soltar y retroalimentación según dificultad.
- Planificador presupuestal sin valores precargados, con guía de rangos y diagnóstico explicable; fondo inicial 100/92/85 % según dificultad.
- Puntuación con coherencia transversal, bonificaciones y penalizaciones, historia por reglas y aciertos y errores por etapa; cinco logros nuevos.
- Preguntas de práctica con 6–7 opciones y trampas; introducciones de etapa; evaluación ex ante explicada con datos de la partida; comparación de dificultades; detalle de la alternativa y variables vivas; centro de información con estudios contratables en cualquier etapa.
- «Árbol del problema» en todos los textos. Despliegue en subruta. README reescrito; plan de implementación y memoria actualizados.

## 2.0.0 · preparación local para GitHub

- Ocho etapas navegables, revisiones dependientes y reinicio controlado antes de inversión.
- Cadena de valor MGA, mapa de actores, argumentos regulatorios y ODS.
- Presupuesto por cantidades y unidades persistido, conciliado con asignaciones y presente en el informe.
- Condiciones específicas para 36 actores en nueve misiones; términos conservados en partidas anteriores.
- 21 ejercicios por misión, con casos de déficit, VPN, transferencias, regulación y atribución, y feedback específico.
- Costo-eficiencia, mesas de negociación, perfil final 0–100, reconocimientos y retos reproducibles.
- Regresiones del catálogo en las tres dificultades; partición de bibliotecas en la compilación.
- Preparación de GitHub: exclusiones, CI de validación, plantillas, guía de contribución y revisión de archivos.

La versión no se ha publicado. El aprendizaje, la duración y el balance percibido requieren piloto con estudiantes. Consultar `ENTREGA_V2.md` para la evidencia de validación y `docs/PILOTO_PEDAGOGICO.md` para el protocolo.
