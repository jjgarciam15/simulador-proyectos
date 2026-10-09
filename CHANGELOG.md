# Cambios

## 4.1.0 · Partida rápida por módulos (9 de octubre de 2026)

- **Partida rápida.** Se juegan solo los módulos elegidos, entre las siete etapas de Diagnóstico a Ejecución, sin recorrer la partida completa. Por ejemplo, solo Preparación para repasar la planeación.
  - Se abre desde el botón «Partida rápida» del inicio o desde «Tipo de partida» al elegir cualquier misión oficial.
  - Las etapas no elegidas se resuelven con la solución de referencia del modo presentación, aplicada por el mismo motor del juego. Esas decisiones quedan en la Bitácora y en el menú de etapas aparecen como «auto».
  - Si el jugador cambia la alternativa, las etapas automáticas siguientes se resuelven sobre ella.
  - La partida termina en Ex post con los resultados. «Repetir estos módulos» vuelve a jugar la misma selección.
- **Nota de la partida rápida.**
  - Solo pesan las dimensiones de los módulos jugados, reescaladas a 100 %, y los ejercicios de práctica de esos módulos.
  - Las bonificaciones, las penalizaciones y la coherencia transversal no se aplican.
  - En el desglose, las dimensiones de las etapas automáticas aparecen con el aviso «Resuelta automáticamente · no cuenta».
  - Una partida rápida no cuenta para la campaña.
- **Modo presentación:** ahora usa la misma solución de referencia por etapa que la partida rápida, sin duplicar código. La partida de ejemplo no cambia.

## 4.0.0 · Ludo · Reino de Liones (7 de octubre de 2026)

- **Nuevo nombre.**
  - El simulador se llama **Ludo**, antes PROYECTA.
  - El territorio que se reconstruye es el **Reino de Liones**, antes Aurora.
  - El cambio cubre la interfaz, los textos de las misiones, el informe final («Informe Ludo»), los documentos, el paquete portátil (`LUDO-<versión>-portable.zip`, `ABRIR_LUDO.cmd`) y los identificadores de los proyectos de ejemplo (`LIONES-AGUA-01`, `LIONES-SALUD-01`).
- **Emblema propio.**
  - Escudo carmesí con corona dorada y un dado: el juego y el reino en un mismo símbolo.
  - Aparece en el encabezado del inicio, en la barra de la partida, en la portada y como icono de la pestaña (`favicon.svg`).
- **Diseño real.**
  - Paleta de noche índigo, estandartes carmesí y oro.
  - Logotipo «LUDO» en letra con serifa dorada.
  - Botones principales dorados con un brillo lento, que se desactiva si el sistema pide reducir el movimiento.
  - Tarjetas con filo dorado y una retícula heráldica de fondo.
  - Barra de la partida con línea dorada y franja de fases carmesí→oro.
  - El contraste de los textos se mantiene en nivel AA.
- **Campos numéricos solo por escritura.**
  - Ya no tienen botones de subir y bajar.
  - Las flechas del teclado y la rueda del mouse no cambian el valor; con la rueda, la página se desplaza normalmente.
- **Compatibilidad.**
  - Las partidas, los proyectos y las preferencias guardados siguen en las mismas claves del navegador, así que nada se pierde al actualizar.
  - Los proyectos se exportan ahora como `.ludo.json` y se siguen importando los `.proyecta.json` de versiones anteriores, porque el formato interno es el mismo.
  - La plantilla de Excel se descarga como `plantilla-proyecto-ludo.xlsx`.

## 3.1.0 · Ley 388 en los proyectos propios y carga más liviana (7 de octubre de 2026)

- **Crear proyecto con datos de la Ley 388.**
  - Cada alternativa tiene un apartado opcional «Territorio (Ley 388 de 1997)»: clase de suelo, predios por adquirir, hecho generador de plusvalía y descripción del sitio, que no debe nombrar la clase de suelo porque el jugador la infiere.
  - En Regulación se puede elegir el determinante que el proyecto debe respetar primero.
  - En la partida, esos datos reemplazan el perfil de referencia, y la vista previa indica qué alternativas los tienen.
  - Los valores inválidos se descartan al guardar.
- **Comité evaluador:** pregunta qué exige el plan de ordenamiento para construir la alternativa en su sitio (5 opciones, derivadas de la partida).
- **Historia final e informe descargable:**
  - La historia separa la regulación económica del ordenamiento territorial.
  - Antes, una partida con el territorio en regla podía leerse como un problema regulatorio.
  - El informe incluye el sitio, las tres notas territoriales y sus consecuencias.
- **Carga más liviana:**
  - Las etapas del juego, el Centro de aprendizaje, el Examen 2 y Crear o importar proyecto se cargan cuando se abren.
  - El paquete inicial bajó de 715 kB a 490 kB (162 kB comprimido) y desapareció la advertencia de tamaño.
  - El menú de secciones se actualiza cuando termina de cargar una etapa.
  - Funciona igual en la copia portátil.

## 3.0.0 · Regulación con la Ley 388 de 1997 (7 de octubre de 2026)

- **Reforma de la etapa de Regulación.**
  - La regulación económica (falla de mercado, instrumento proporcional, cadena causal) se integra con el ordenamiento territorial de la Ley 388 de 1997.
  - La etapa abre con «La Ley 388 de 1997 en tu proyecto»: ficha territorial de la alternativa (municipio, sitio, predios, promotor y motivo de utilidad pública) y un repaso de la ley en siete secciones, con artículos y cómo aparece cada una en el juego.
- **Contenido de la ley**, verificado en el texto compilado:
  - Principios (art. 2), tipos de plan según la población (art. 9) y determinantes (art. 10).
  - Programa de ejecución (art. 18), planes parciales (art. 19), concertación y vigencias (arts. 24 a 28).
  - Clases de suelo (arts. 30 a 35), cesiones, reparto de cargas y beneficios (arts. 37 a 39 y 45) y desarrollo prioritario (arts. 52 a 57).
  - Motivos de utilidad pública (art. 58), enajenación voluntaria y expropiación (arts. 59 a 65).
  - Participación en la plusvalía: hechos generadores, tasa del 30 % al 50 %, exigibilidad y destino (arts. 73 a 90).
  - Se señalan las modificaciones posteriores relevantes (Leyes 2079 de 2021 y 2294 de 2023).
- **Perfil territorial de cada proyecto:**
  - Las 36 alternativas de las nueve misiones tienen sitio, clase de suelo, predios y hecho generador propios. Por ejemplo, la central térmica está en suelo de protección, la ciudadela en suelo de expansión y la ampliación vial necesita 60 predios.
  - Los proyectos privados no pueden invocar utilidad pública.
  - Los proyectos propios reciben un perfil de referencia.
- **Tres puzzles nuevos** (todas las preguntas con 5 opciones, retroalimentación al pasar el mouse):
  - **Encaje en el ordenamiento.** Efecto: plan parcial (2 meses) o relocalización (2 meses y 1 % del presupuesto) si se identifican a tiempo.
  - **Ruta de adquisición de predios.** Efecto: costo de avalúos, ofertas y negociación.
  - **Participación en la plusvalía.** Efecto: cofinanciación de proyectos públicos; pago previsto en privados.
- **Consecuencias al invertir:**
  - Licencia negada en suelo de protección: 6 meses y 3 % de sobrecosto.
  - Sin plan parcial: 4 meses de retraso.
  - Determinante ignorada: 2 meses de retraso.
  - Adquisición impugnable: menos legitimidad y más riesgo de eventos.
  - Plusvalía no prevista: sobrecosto y 2 meses de retraso.
- **Nuevo evento de ejecución «Predios sin liberar»,** más probable con una ruta predial irregular y con muchos predios.
- **Calificación:**
  - La dimensión pasa a llamarse «Regulación, territorio y ODS»: 40 % regulación económica, 40 % ordenamiento territorial y 20 % ODS.
  - Nueva relación de coherencia «Proyecto ↔ territorio (Ley 388)», ítems en «Aciertos y errores», dos ejercicios de práctica y tres conceptos en el Centro de aprendizaje: plan de ordenamiento y clases de suelo, adquisición de predios y plusvalía.
- La etapa no avanza sin los tres puzzles, y cambiar de alternativa exige rehacerlos.
- La partida de presentación los resuelve y el recorrido muestra la Ley 388.
- Las partidas guardadas antes de 3.0 conservan sus reglas y su nota; el análisis comparativo reconoce el nombre anterior de la dimensión.

## 2.9.0 · Actores con perfil sorteado en cada partida (7 de octubre de 2026)

- **Perfil aleatorio:** en las nueve misiones y en los proyectos propios, cada partida nueva sortea el poder, el interés y la posición de cada actor.
  - El mismo código de partida repite el perfil.
  - El mapa poder × interés se califica con el perfil de esa partida, así que hay que leer las fichas cada vez.
  - Los valores son claramente altos (66–95) o bajos (15–52), nunca ambiguos cerca del umbral de 60.
  - Siempre hay al menos un actor clave (alto poder y alto interés) y, entre los actores no gubernamentales, al menos uno en contra y uno a favor.
- **El gobierno es neutral:** autoridades, organismos, alcaldías, ministerios, catastro y otras instituciones públicas mantienen siempre posición 0, y tus decisiones no la mueven.
- **Mejor integración de los actores en el simulador:**
  - **La posición cambia con tus decisiones.** Consultar, negociar, involucrar e informar la mejoran; ignorar la empeora. En la mesa, escuchar y llegar a un acuerdo la mejoran; un acuerdo rechazado o cerrar sin acuerdo la empeoran. La ficha muestra la posición actual y la inicial, y cada botón indica cuánto la mueve.
  - **Ignorar a un actor en contra cuesta más apoyo,** y consultarlo, negociar con él o involucrarlo da más.
  - **En la mesa de acuerdos,** un actor muy en contra (−50 o menos) solo acepta un acuerdo si antes lo escuchas; el estudio social ya no basta. Cerrar sin acuerdo con un actor en contra cuesta más apoyo.
  - **En la ejecución,** los actores poderosos en contra aumentan la probabilidad de conflictos sociales, y el aviso nombra al actor que encabeza el reclamo. Los eventos sociales positivos no cambian.
  - **El panel de actores** muestra la posición con icono, palabra y valor; los puntos de la matriz se colorean según la posición, y una leyenda indica el nivel de oposición organizada.
  - **Coherencia y Ex post:** cuentan como actores clave también los poderosos que empiezan en contra, y «Aciertos y errores» señala si invertiste con actores poderosos en contra.
- **Compatibilidad:** las partidas guardadas antes de 2.9 conservan los perfiles de referencia y su comportamiento anterior. Un perfil guardado inválido se descarta.
- **Crear proyecto** explica que los valores registrados de los actores quedan como referencia y que en cada partida se sortean.

## 2.8.0 · Retroalimentación sobre cada elemento, al pasar el mouse (7 de octubre de 2026)

- **La retroalimentación ya no va en una lista aparte.** Al confirmar un módulo, cada tarjeta, opción o fila se marca en su propio lugar:
  - Verde con ✓ si es correcta, ámbar con ! si está parcialmente bien y rojo con ✕ si es incorrecta.
  - Al pasar el mouse, enfocarla con el teclado o tocarla en el celular aparece el porqué: qué está bien o mal, dónde va y la explicación.
  - Así se encuentran los errores directamente en el árbol o en el módulo.
- **Módulos con este sistema:** Árbol del problema, mapa de actores (poder e interés), objetivos, cadena de valor (incluidas las tarjetas bien descartadas o que faltó usar), efectos e impactos, valoración económica (método y medición), laboratorio regulatorio (cada eslabón), ODS y comité evaluador.
- Cada módulo muestra la nota, una leyenda con cuántos elementos hay de cada color y, plegada, la lista completa para quien la prefiera.
- Solo se marcan los elementos que siguen como se confirmaron: si mueves algo, pierde el color hasta que vuelvas a confirmar.
- Respeta la dificultad: en modo difícil solo se ve la nota, y en el modo evaluación la retroalimentación sigue apareciendo al final.
- Árbol: el nivel de cada tarjeta va en su propia línea, sin encimarse con el texto. Cuando el banco se vacía, el árbol usa todo el ancho.

## 2.7.0 · Árbol del problema jerárquico, solo arrastrando (7 de octubre de 2026)

- **Árbol con la estructura de la pizarra:**
  - El problema central queda en el medio, las causas crecen hacia abajo y los efectos hacia arriba, unidos por líneas.
  - Cada causa directa cuelga del problema central y cada causa indirecta cuelga de la causa que explica. Se puede anidar a cualquier profundidad (por ejemplo, una causa de una causa indirecta).
  - Los efectos funcionan igual: cada efecto indirecto cuelga del efecto que lo produce.
  - Así se ve qué efecto surge de cada causa.
- **Sin selector «Ubicar en…»:**
  - Con mouse, las tarjetas se arrastran directamente.
  - En pantallas táctiles se arrastran desde el asa ⋮⋮, y también se pueden mover tocando la tarjeta y luego el destino.
  - Con teclado, Enter levanta la tarjeta y Enter sobre el destino la suelta.
  - La página se desplaza sola al llevar una tarjeta cerca del borde.
  - Funciona con cualquier nivel de zoom y en móvil.
- **Puntuación:**
  - Una tarjeta suma completa solo si está en el nivel correcto y cuelga de la causa o el efecto correcto.
  - El nivel correcto colgando de otra tarjeta suma la mitad.
  - La revisión indica de qué tarjeta debía colgar cada una.
  - Las nueve misiones definen de qué causa directa surge su causa indirecta adicional.
- Las partidas guardadas con el árbol anterior (solo niveles) se convierten automáticamente sin perder la nota.
- El motor rechaza árboles con más de un problema central, tarjetas que cuelgan del lado equivocado o ciclos.

## 2.6.0 · Modo presentación y desplazamiento más ágil (6 de octubre de 2026)

- **Modo presentación** (botón en el inicio):
  - Abre una partida de ejemplo completa y resuelta: estudios, Árbol del problema, actores y negociación, objetivos, cadena de valor, presupuesto con partidas detalladas, indicadores, impactos, valoración, flujos con RPC, regulación, ODS, mitigaciones, comité, práctica, ejecución y Ex post con la nota y su desglose.
  - La genera el mismo motor del juego con las respuestas de referencia (`src/domain/demo.ts`): es reproducible y funciona en las nueve misiones.
  - Una barra guía indica qué mostrar en cada etapa y permite pasar de una a otra.
  - Es de solo lectura (cualquier cambio muestra un aviso) y nunca se guarda sobre las partidas del jugador.
- **Desplazamiento más ágil:**
  - Ex post ahora va por secciones (antes era una sola página de unos 17.000 px; ahora la sección más larga mide unos 5.200 px), con «Ver todo en una página».
  - El cambio de sección es inmediato.
  - Botón «Arriba» en páginas largas.
  - «La historia de tus decisiones» muestra las primeras 10 y un botón para ver todas.
- La práctica de una partida terminada indica que ya no cambia la nota.

## 2.5.0 · Puntuación integral, menú de etapas ocultable y revisión de Crear e Importar proyecto (6 de octubre de 2026)

- **Puntuación integral.** Cada dimensión se calcula a partir de las actividades que la forman, y el resultado final muestra el «Desglose completo»: unas 30 actividades con tu resultado, su peso en la nota y los puntos que aportó, con una suma igual a la nota base.
  - Nueva dimensión **Práctica de conceptos**, que suma por acertar en lugar de solo descontar por pistas.
  - La **negociación con actores** cuenta dentro de Diagnóstico cuando se negoció.
  - Se indica qué decisiones (dilemas, eventos, estudios y mitigaciones) cuentan a través de otras dimensiones.
- **Menú de etapas ocultable** durante la partida, en escritorio y tableta. Amplía el área de trabajo (en 1.366 px pasa de 893 a 1.102 px) y se recuerda.
- **Crear proyecto:**
  - El Árbol del problema del juego incluye todas las causas y efectos del autor (antes solo dos).
  - Se eliminaron las advertencias duplicadas en Costos y finanzas.
  - El resumen muestra «sin dato» y explica la cadena de valor y los impactos vacíos.
  - Las dificultades usan los nombres del juego.
  - La lista de revisión anuncia su estado a lectores de pantalla.
- **Importar proyecto:**
  - La plantilla Excel vacía ya no crea causas y efectos con el texto «Directa» o «Indirecta».
  - Los avisos dicen «nombre del proyecto».
  - El error de formato menciona `.proyecta.json`.
  - Probados archivos inválidos, PDF falso o sin texto, JSON roto, plantilla vacía y exportación con reimportación.

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
