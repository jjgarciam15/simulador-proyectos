# PROYECTA · Reconstruir Aurora

Simulador educativo en español de **formulación y evaluación de proyectos**. El jugador administra un proyecto en un territorio ficticio (Aurora): tiene presupuesto y tiempo limitados, compra información, elige una alternativa, construye la cadena de valor y el presupuesto, enfrenta dilemas y eventos, decide la regulación y los ODS, y al final ve las consecuencias de sus decisiones con una nota explicada.

Integra MGA, economía, regulación económica, gestión de recursos, evaluación ex ante, riesgo y ODS. Los datos son simulados: no acredita viabilidad oficial ni sustituye MGA Web.

## Propósito

Pasar de «respondo actividades para avanzar» a «administro un proyecto y mis decisiones tienen consecuencias». El simulador recompensa analizar, priorizar, administrar, justificar, anticipar y corregir.

## Formas de jugar

| Experiencia | Qué es | Cómo se entra |
|---|---|---|
| **Jugar historia** | Nueve misiones oficiales en Aurora, con narrativa y datos diseñados. | Inicio → «Jugar historia» o «Comenzar reconstrucción». |
| **Importar proyecto** | Convierte un PDF o un Excel en una estructura académica editable y luego en una simulación. | Inicio → «Importar proyecto» (o Mis proyectos). |
| **Crear proyecto** | Formula tu propio proyecto paso a paso; el sistema revisa su coherencia y lo convierte en una simulación. | Inicio → «Crear proyecto» (o Mis proyectos). |

Las tres fuentes llegan al **mismo motor**:

```
Oficial ──────────────┐
PDF / Excel → parser ─┼─> NormalizedProject → validación → MissionGenerator → motor único (act) → puzzles, flujos, decisiones → puntuación → comité → resultado
Manual → Builder ─────┘
```

**Mis proyectos** reúne oficiales, importados, creados, borradores y partidas. Cada tarjeta muestra origen, estado, completitud, dificultad y última edición, con acciones jugar, continuar, editar, duplicar, eliminar, generar partida y vista previa. Una misión oficial se puede duplicar como proyecto editable para crear variantes; la oficial no cambia.

### Project Builder (crear o revisar un proyecto)

Asistente por pasos agrupados, con autoguardado en el navegador, indicador de completitud calculado con los campos que la misión realmente necesita y la progresión Problema → Objetivo → Alternativas → Proyecto.

| Paso | Qué pide | Asistencia académica |
|---|---|---|
| 1. Información general | Perfil (estudiante o creador/profesor), nombre, descripción, sector, ubicación, tipo (público/privado), horizonte | — |
| 2. Problema, causas y efectos | Árbol visual efectos ↑ problema ↑ causas; arrastrar o «Mover a…» con teclado; nivel directo/indirecto | Advierte si el problema parece una solución («Comprar buses») o si una causa parece efecto; nunca cambia el texto |
| 3. Actores y población | Población total, afectada, objetivo y atendida hoy; actores con interés, poder, posición e influencia | Objetivo ≤ afectada ≤ total |
| 4. Objetivos | Objetivo general, específicos ligados a una causa y fines ligados a efectos | «El objetivo específico 2 parece no responder a ninguna causa identificada» |
| 5. Alternativas | 2–4 alternativas: inversión, O&M, ingresos, beneficio social, duración, vida útil, residual, capacidad, cobertura, riesgo, balance ambiental, trade-off y causas que atiende | Tabla comparativa en vivo, sin elegir la mejor |
| 6. Cadena de valor | Insumos → actividades → productos → resultados → impactos (las conexiones se iluminan) | — |
| 7. Efectos, impactos y valoración | Efecto o impacto, dirección, grupo, magnitud, duración, tipo de cambio en bienestar, método, valor anual, medida por persona, doble conteo | — |
| 8. Costos, beneficios y finanzas | Costos por clasificación, beneficios (ingreso, ahorro, beneficio económico, impacto valorado), presupuesto, plazo, tasas, ajustes económicos y supuestos | Distingue ingreso financiero de beneficio económico |
| 9. Riesgos, regulación y ODS | Riesgos con probabilidad, impacto y mitigación; falla de mercado, externalidades, regulación, tarifas, subsidios, competencia, restricciones; ODS sugeridos por el creador o que identificará el jugador | — |
| (Creador) Actividades | Revisa y edita las actividades generadas: pregunta, opciones, respuestas, explicación, puntos, dificultad; distractores del Árbol del problema; vista previa como jugador | — |
| 10. Revisar y crear partida | «Revisar mi proyecto» (✓ / ! / ✕ por elemento), resumen, fases que tus datos permiten, dificultad (Fácil/Intermedio/Avanzado), modo (Aprendizaje/Evaluación/Exploración), duración (Rápida/Normal/Completa) y **CREAR PARTIDA INTERACTIVA** | Los errores bloquean; las advertencias no |

Los datos ausentes nunca se inventan: si el generador necesita un valor (por ejemplo, presupuesto), usa un supuesto documentado que se muestra en la partida. Cada misión generada es una copia congelada del proyecto: editarlo después no altera partidas en curso.

### Importar PDF o Excel

- **Local y privado:** el archivo se procesa en el navegador; no se envía a ningún servicio.
- **Seguridad:** extensión (.pdf, .xlsx), tipo MIME, tamaño (≤ 15 MB) y firma del archivo; los libros con macros (.xlsm, .xls…) se rechazan; las fórmulas se leen como texto y **no se ejecutan**.
- **PDF:** extracción nativa del texto con pdf.js (sin evaluación de código). Reconoce «Etiqueta: valor», listas bajo «Causas», «Efectos», «Objetivos específicos» y bloques «Alternativa 1: …». Los PDF escaneados no tienen texto: el OCR no está incluido y se pide completar manualmente.
- **Excel:** lee hojas, encabezados, tablas y valores; reconoce pares etiqueta/valor y tablas de alternativas, actores, costos y riesgos. Hay una **plantilla descargable**.
- **Trazabilidad:** cada dato guarda su página, hoja y celda, y una confianza (alta, media, baja). Lo que falta aparece como «No identificada».
- **Revisión obligatoria:** el proyecto se abre en el mismo Project Builder; hay que confirmar la revisión antes de generar la partida.
- **Formato portable:** un proyecto se exporta e importa como `.proyecta.json` (datos versionados, sin código), validado contra el esquema.

### Restablecer partidas y preparar para compartir

Mis proyectos → «Restablecer partidas…». Hay que escribir `RESTABLECER`.

| Se borra (datos del jugador) | Se conserva (datos del sistema) |
|---|---|
| Partidas activas, en pausa y terminadas; puntuaciones, respuestas, progreso y bitácoras (`proyecta-v1`, `proyecta-v1:unreadable`) | Las nueve misiones oficiales, su contenido e ilustraciones |
| Proyectos importados y creados, borradores y misiones generadas (`proyecta-projects-v1`) | Metodologías y Centro de aprendizaje |
| Intentos del Examen 2 (`proyecta-exam2-v1`) | Preferencias de sonido, animación y tamaño (zoom), y el código |

Con «Preparar el simulador para compartir» la página se recarga y verifica el estado cero (0 partidas, 0 proyectos personales, 0 importados, 0 misiones generadas) y que las misiones oficiales siguen disponibles.

## Qué aprenderás

- Construir el **Árbol del problema** (causas, problema central, efectos) y transformarlo en objetivos.
- Comparar **alternativas** con trade-offs reales: inversión, operación y mantenimiento, cobertura, plazo, riesgo y ambiente.
- Armar la **cadena de valor** y un **presupuesto** sin valores precargados, con contingencia y mantenimiento.
- Distinguir **productos, efectos e impactos** y elegir un **método de valoración** (precios de mercado, costo de viaje, valoración contingente, transferencia de beneficios, etc.).
- Construir el **flujo financiero** tipo hoja de cálculo, calcular el **VPN paso a paso** y pasar al **flujo económico con RPC** y tasa social de descuento.
- Probar **escenarios, estrés, variable crítica y valor de quiebre**, revisar el **impacto distributivo** y defender la decisión ante un **comité evaluador**.
- Diagnosticar una **falla regulatoria**, elegir instrumentos proporcionales y sustentar los **ODS** con evidencia.

## Cómo jugar

1. En el inicio elige una misión (nueve territorios de Aurora), la dificultad (guiado, intermedio · profesional, experto) y el modo (**Aprendizaje** o **Evaluación**). El perfil de la misión indica qué módulos aplican.
2. Recorre las etapas en orden. Cada etapa se divide en herramientas (pestañas numeradas); lo que confirmas cambia el estado del proyecto: saldo, plazo, información, apoyo, legitimidad y riesgo.
3. Puedes volver a una etapa completada desde el menú lateral sin repetir el recorrido. Cambiar algo ya confirmado cuesta un mes y 0,2 % del presupuesto, y marca como **«Requiere revisión»** lo que dependía de ello (con el motivo concreto).
4. La alternativa en estudio aparece siempre en el panel derecho; se puede cambiar en Formulación sin borrar el trabajo.
5. Al comprometer la inversión (Decisión) el plan se congela y comienza la ejecución: eventos condicionados, dilemas y consecuencias diferidas.
6. En Ex post ves la nota con cada dimensión explicada, errores y aciertos, la historia del proyecto y recomendaciones.

**Modo presentación:** en el inicio, «Modo presentación» abre una partida de ejemplo completa y resuelta. Es la misión «Agua para todos», jugada por el mismo motor con las respuestas de referencia de cada herramienta, y termina con su nota y el desglose completo. Una barra guía indica qué mostrar en cada etapa y permite pasar de una etapa a otra. Es de solo lectura y no se guarda: no toca tus partidas ni tus resultados.

**Desplazamiento:**
- Cada etapa, incluida Ex post, se recorre por secciones con pestañas que quedan fijas arriba.
- Ex post tiene el botón «Ver todo en una página».
- Al cambiar de sección el salto es inmediato.
- En las páginas largas aparece el botón «Arriba».

**Más espacio de trabajo:** en escritorio y tableta, el botón «Ocultar» de la cabecera del juego esconde el menú de etapas de la izquierda y amplía el área central; «Etapas» lo vuelve a mostrar. La preferencia se recuerda. En teléfonos se usa el menú ☰.

**Tamaño de la pantalla (zoom):** la barra flotante de abajo a la izquierda, visible en todas las pantallas (inicio, juego, Project Builder, exámenes y ventanas), tiene botones para **alejar (−)** y **acercar (+)** de 10 en 10 % entre 60 % y 160 %. El botón del porcentaje vuelve al **ajuste automático**, que adapta el simulador al ancho de la ventana: 75 % en portátiles pequeños, 100 % a 1.440 px y hasta 135 % en monitores grandes; en teléfonos queda en 100 % y el máximo se limita para que nada se salga de la pantalla. El panel ✨ incluye un deslizador fino. La preferencia se guarda en el navegador y no afecta la partida.

Apoyos: **Centro de aprendizaje** (menú lateral o «Cómo jugar»), tutorial interactivo de tres minutos, **Práctica rápida** (VPN y RPC sin jugar una misión) y **Examen 2** (caso aplicado independiente, en el encabezado).

## Modos

| Modo | Retroalimentación | Pistas | Indicador de coherencia |
|---|---|---|---|
| Aprendizaje | Inmediata sobre cada elemento: verde (✓) correcto, ámbar (!) a revisar, rojo (✕) error; al pasar el mouse, enfocar o tocar se ve el porqué | Ilimitadas (pistas guiadas en dificultad guiado) | Con detalle |
| Evaluación | Diferida: se ve la nota al final | Una por pregunta | Solo nivel |

La dificultad cambia lo que conoces y tu exposición al riesgo, no la realidad subyacente: guiado (100 % del efectivo, explicaciones), intermedio (92 %), experto (85 %, menos ayudas).

## Fases del simulador

| # | Fase | Objetivo | Conceptos | Qué recibe | Qué hace el jugador | Decisiones clave | Salida | Dependencias | Puntuación |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Diagnóstico | Entender el problema antes de proponer | Árbol del problema, causa-efecto, actores, población objetivo | Caso, centro de información, actores | Compra estudios; construye el Árbol del problema arrastrando 14 tarjetas mezcladas (8 correctas y 6 trampas): cada causa cuelga del problema o de la causa que explica, cada efecto del problema o del efecto que lo produce, y las trampas quedan fuera; conecta causas y efectos; ubica a los actores (su poder, interés y posición se sortean en cada partida; el gobierno siempre es neutral) y gestiona su posición; focaliza | Qué información comprar; qué nodos y enlaces | Árbol del problema y población | Ninguna | Diagnóstico y Árbol del problema |
| 2 | Formulación | Convertir el problema en objetivos y elegir alternativa | Objetivo general y específicos, alternativas, costo de oportunidad | Árbol del problema confirmado | Construye objetivos desde el Árbol del problema; compara 3–4 alternativas | Objetivo; alternativa | Objetivos y alternativa en estudio | Diagnóstico | Alternativa y objetivos |
| 3 | Preparación | Traducir la alternativa en recursos | Cadena de valor, presupuesto, contingencia, O&M, indicadores, efectos e impactos | Alternativa y objetivos | Arma la cadena de valor (arrastrar o seleccionar), el presupuesto sin valores precargados (obligatorio: operación, mantenimiento, interventoría y contingencias, con partidas detalladas de operación y mantenimiento), indicadores; clasifica efectos e impactos | Asignación del presupuesto; clasificación | Plan de recursos y mapa de impactos | Formulación | Cadena de valor y presupuesto; efectos e impactos |
| 4 | Evaluación | Saber si el proyecto crea valor | Valoración económica, flujo financiero, VPN, RPC, tasa social, costos hundidos, doble conteo, sensibilidad | Presupuesto, impactos, datos del caso | Elige métodos de valoración (con costo de estudio y confianza), construye el flujo financiero y el económico, prueba escenarios y valor de quiebre, revisa la distribución | Método por impacto; qué entra al flujo; RPC | VPN financiero y económico, variable crítica | Preparación | Efectos, impactos y valoración; Flujos, VPN y RPC; Evaluación ex ante |
| 5 | Regulación | Corregir fallas sin crear otras | Falla de mercado/regulatoria, instrumentos, proporcionalidad, ODS | Proyecto evaluado | Resuelve el puzzle regulatorio (falla → evidencia → instrumento → efecto) y sustenta ODS | Instrumento; ODS con evidencia | Argumento regulatorio y ODS | Evaluación | Regulación y ODS |
| 6 | Decisión | Comprometer o no la inversión | Comparación de alternativas, matriz de decisión, riesgo, financiación | Todo lo anterior | Compara alternativas, responde al comité evaluador, fija contingencia y financiación, justifica | Invertir, esperar o rediseñar | Plan congelado | Regulación | Compromisos y riesgo; Comité evaluador |
| 7 | Ejecución | Gestionar lo que sale distinto | Eventos condicionados, dilemas, consecuencias diferidas | Plan congelado | Responde eventos y dilemas | Adaptar o continuar | Servicio entregado | Decisión | Ejecución y servicio |
| 8 | Ex post | Aprender de la experiencia | Evaluación ex post, valor observado, trazabilidad | Resultado | Revisa nota, historia, errores y recomendaciones | Rejugar con otra estrategia | Informe y logros | Ejecución | Valor observado; Coherencia y trazabilidad |

## Mecánicas principales

- **Recursos escasos:** cada estudio, actor o mitigación cuesta dinero y tiempo; avanzar de etapa consume un mes.
- **Dependencias y «Requiere revisión»:** cambiar una decisión anterior invalida lo que dependía de ella y explica por qué.
- **Dilemas y eventos condicionados:** aparecen según tus decisiones previas y su efecto puede llegar etapas después.
- **Hoja de flujo:** celdas con colores por tipo (dato entregado, debes calcular, debes ingresar, calculado automáticamente); al seleccionar una celda se explica su cálculo.
- **Plataforma de proyectos:** `NormalizedProject` (`src/domain/project/types.ts`, `schemaVersion` 1) es el contrato común; `MissionGenerator` (`generator.ts`) lo traduce al mismo `Scenario` de las misiones oficiales y registra la misión en tiempo de ejecución (`store.ts`). No hay simuladores paralelos para PDF, Excel o proyectos manuales.
- **Flujos:** `src/domain/flows.ts` es el único motor de flujos, VPN, RPC, escenarios y valor de quiebre; lo usan las misiones, la calculadora y el Examen 2.
- **Semilla:** el código de condiciones reproduce demanda, costos, eventos y dilemas para comparar estrategias.

## Puntuación

Las partidas V2.2 usan **13 dimensiones**: Diagnóstico y Árbol del problema, Alternativa y objetivos, Cadena de valor y presupuesto, Efectos/impactos y valoración, Flujos/VPN/RPC, Evaluación ex ante, Regulación y ODS, Compromisos y riesgo, Ejecución y servicio, Valor observado, Coherencia y trazabilidad, Comité evaluador y **Práctica de conceptos**. Los pesos dependen del rol (público o privado) y del perfil de la misión; si un módulo no aplica, su peso se reparte (`src/data/balance.ts`, `scoringWeightsV3`).

**Puntuación integral:** cada dimensión se compone de las actividades que la forman, con su propio peso. Por ejemplo, Diagnóstico combina enlaces causales, Árbol del problema, mapa de actores, focalización y, si negociaste, la negociación con actores. Al final de la partida, «Desglose completo» lista unas 30 actividades con tu resultado, su peso en la nota y los puntos que aportó, y la suma coincide con la nota base. La práctica de conceptos suma por acertar: es el promedio de los ejercicios que se pueden responder antes del cierre, y un ejercicio sin responder cuenta 0. Las pistas y los intentos extra ya descuentan dentro de cada ejercicio. Los dilemas, eventos, estudios y mitigaciones no tienen nota propia, pero cuentan a través de los recursos, el riesgo y la ejecución, y el desglose lo indica.

Nota final = (base ponderada − penalizaciones + bonificaciones) × factor de dificultad. Cada dimensión explica su cálculo, los errores y aciertos. La nota usa el estado confirmado, no el número de intentos: reconfirmar un módulo o repetir el Examen 2 no acumula puntos.

## Stack

| Capa | Tecnología |
|---|---|
| Interfaz | React 19 + TypeScript 5.8 |
| Compilación | Vite 6 |
| Estilos | Tailwind CSS 4 y hojas CSS propias (`src/*.css`) |
| Gráficos | Recharts |
| Íconos | Lucide |
| Pruebas | Vitest (unitarias) y Playwright (E2E) · ESLint |
| Paquetes | pnpm 11.19.0 |

No hay backend, base de datos, cuentas ni servicios externos: es una aplicación estática.

## Requisitos

- **Node.js 24** (fijado en `.nvmrc` y en `engines` de `package.json`). Con Node 22 funciona, pero pnpm muestra un aviso «Unsupported engine».
- **pnpm 11.19.0**. Si no lo tienes: `npm install -g pnpm@11.19.0`.

## Instalación

```bash
git clone https://github.com/jjgarciam15/simulador-proyectos.git
cd simulador-proyectos
pnpm install --frozen-lockfile
```

`pnpm-lock.yaml` fija las versiones exactas.

## Variables de entorno

No se requieren variables de entorno ni claves API.

## Desarrollo y ejecución

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo en http://127.0.0.1:5173 |
| `pnpm typecheck` | Comprobación de tipos (`tsc -b`) |
| `pnpm test` | Pruebas Vitest del motor, puntuación y contenido |
| `pnpm build` | Tipos + compilación de producción en `dist/` |
| `pnpm preview` | Sirve `dist/` localmente para revisarlo |
| `pnpm lint` | ESLint: errores de código y reglas de hooks de React |
| `pnpm check` | Tipos, lint, pruebas y compilación (lo que ejecuta la CI) |
| `pnpm e2e` | Pruebas de extremo a extremo con Playwright sobre `dist/` (ejecuta `pnpm build` antes) |
| `pnpm repo:check` | Revisa que no se versionen dependencias, compilaciones ni credenciales |
| `pnpm portable` | Compila y genera el paquete portátil para Windows en `release/` (no requiere Node para usarlo) |

TypeScript se compila en modo estricto, sin variables ni importaciones sin uso.

En Windows, después de instalar dependencias, `ABRIR_PROYECTA.cmd` inicia (o reutiliza) Vite en el puerto 5173 y abre una ventana de aplicación. Los registros quedan en `.local/`.

## Pruebas

```bash
pnpm test
```

Cubren: motor y finanzas, flujos financiero y económico (VPN, RPC, residual, valor de quiebre), análisis de riesgo Monte Carlo, valoración, trazabilidad, comité, Examen 2, puntuación V2/V3 (bonificaciones y penalizaciones), presupuesto y sus datos básicos obligatorios, Árbol del problema, cadena de valor, dependencias y «requiere revisión», dilemas, eventos de ejecución condicionales y consecuencias diferidas, semilla determinista, laboratorio regulatorio, ODS, dificultad, persistencia y el catálogo completo (nueve misiones × tres dificultades). Incluyen además el Project Builder, la normalización manual/PDF/Excel hacia el mismo generador, la partida generada completa, formato portable, reset, personajes, la regla de **5 opciones por pregunta** en todo el simulador y una prueba de robustez con acciones aleatorias y malformadas. Última ejecución: 250 pruebas en 28 archivos, todas aprobadas.

```bash
pnpm build && pnpm e2e
```

Las pruebas de extremo a extremo (`e2e/`, Playwright) arrancan una misión, construyen el Árbol del problema, revisan el Centro de aprendizaje, el límite de 5 opciones, el zoom, el menú de etapas ocultable y el modo presentación, y fallan ante cualquier error de consola.

## Compilación

```bash
pnpm build
```

Genera `dist/` con `index.html`, `assets/` y `art/`. Es un sitio estático.

## Despliegue

`dist/` se puede publicar en cualquier hosting estático. No abras `index.html` con `file://`: debe servirse por HTTP.

**En la raíz de un dominio** (Netlify, Vercel, Cloudflare Pages, un servidor Nginx/Apache):

1. Comando de compilación: `pnpm build`.
2. Carpeta de publicación: `dist`.
3. Versión de Node: 24.

La app no tiene rutas internas (no usa router), así que no requiere reglas de reescritura.

**En una subruta** (por ejemplo GitHub Pages en `https://usuario.github.io/simulador-proyectos/`):

```bash
pnpm typecheck
pnpm exec vite build --base=/simulador-proyectos/
```

Las imágenes y los recursos respetan la ruta base (`import.meta.env.BASE_URL`). Publica el contenido de `dist/` en esa subruta.

**Comprobación local del build:** `pnpm preview` (no es un servidor de producción).

La CI de GitHub (`.github/workflows/ci.yml`, «Validar simulador») ejecuta `pnpm install --frozen-lockfile`, `pnpm repo:check` y `pnpm check` (tipos, lint, pruebas y compilación) y después las pruebas E2E con Chromium, en cada push a `main` y en cada pull request. **No despliega.**

## Persistencia

- La partida se guarda automáticamente en el `localStorage` del navegador (clave `proyecta-v1`) tras cada decisión confirmada. Los proyectos, borradores y misiones generadas se guardan en `proyecta-projects-v1` con autoguardado.
- Se puede cerrar la pestaña y continuar después («Continuar misión»). Al empezar otra misión, la actual queda **en pausa** y se puede retomar desde el inicio.
- `?qa=1` usa espacios de guardado separados (`proyecta-qa-v1`, `proyecta-qa-projects-v1`) para pruebas.
- Si el guardado falla, aparece un aviso y la sesión sigue en memoria.
- Limpiar los datos del navegador borra las partidas. Otro navegador, puerto o dominio usa otro almacenamiento.
- No hay cuentas, sincronización ni seguimiento externo.

## Arquitectura

```
src/
  data/        Contenido y balance: misiones, dilemas, ODS, reglas de dificultad y puntuación
  domain/      Reglas puras: motor (act), estado, dilemas, regulación, presupuesto,
               coherencia, puntuación, persistencia, validación y pruebas
  features/    Pantallas de cada etapa y herramientas (dilemas, laboratorio, resultados)
  domain/project  NormalizedProject, validación, MissionGenerator, almacén, esquema y
                  migraciones, importación PDF/XLSX (import/)
  features/projects  Mis proyectos, Project Builder, importación, reset, inicio
  features/v22 Objetivos, efectos e impactos, valoración, hoja de flujo, RPC, sensibilidad,
               comparador, comité, Centro de aprendizaje, Cómo jugar y Examen 2
  components/  Controles, gráficos, navegación, personajes y efectos
public/art/    Ilustraciones locales
scripts/       Lanzador de Windows y revisión del repositorio
```

- **Motor único y puro:** `act(estado, acción)` en `src/domain/engine.ts` valida y devuelve un estado nuevo. La interfaz nunca calcula reglas ni puntuación.
- **Estado central:** `GameState` (`src/domain/types.ts`) con `v2` versionado (`src/domain/projectV2.ts`): etapas completadas, revisiones, cadena, actores, ODS, regulación, dilemas, consecuencias, etc.
- **Contenido configurable:** las nueve misiones se generan desde datos (`src/data/scenarios.ts`, `expansion.ts`); los dilemas son plantillas declarativas (`src/data/dilemmas.ts`); el balance está en `src/data/balance.ts`.
- **Flujos:** `src/domain/flows.ts` es el único motor de flujos, VPN, RPC, escenarios y valor de quiebre; lo usan las misiones, la calculadora y el Examen 2.
- **Semilla:** el código de condiciones reproduce demanda, costos técnicos, severidad de la falla regulatoria, eventos y dilemas.

La memoria técnica completa está en [`MANUAL_CREACION.md`](MANUAL_CREACION.md) y la ejecución de esta versión en [`IMPLEMENTATION_PLAN_V2.md`](IMPLEMENTATION_PLAN_V2.md).

## Versión portátil (copiar y usar sin instalar nada)

Para llevar el simulador a otro computador Windows **sin instalar Node.js, npm ni pnpm**:

1. Descarga `PROYECTA-<versión>-portable.zip`: desde la pestaña **Actions → Paquete portátil** (artefacto de cada actualización de `main`) o desde **Releases** cuando se publica una etiqueta `v*`. También se genera localmente con `pnpm portable` (queda en `release/`).
2. Descomprímelo (clic derecho → Extraer todo) y haz doble clic en `ABRIR_PROYECTA.cmd`.
3. Deja abierta la ventana negra mientras usas el simulador; para terminar, ciérrala.

El paquete contiene la aplicación compilada (`app/`) y `servidor-portatil.ps1`, un servidor mínimo en PowerShell (incluido en Windows) que solo escucha en `127.0.0.1`, no sirve archivos fuera de `app/` y usa el puerto 5173 (o el siguiente libre). Se copia con USB, OneDrive o correo; las partidas quedan en el navegador de cada equipo (para llevar un proyecto propio, exporta el `.proyecta.json`).

## Actualizar a una versión nueva

```bash
git pull origin main
pnpm install
```

Si el simulador estaba abierto, ciérralo antes (o reinicia el servidor): una instancia iniciada con las dependencias anteriores sigue fallando aunque ya estén instaladas.

## Solución de problemas

| Problema | Solución |
|---|---|
| `Cannot find module`, dependencias ausentes o «Failed to resolve import "fflate"» después de actualizar | Cierra el simulador y ejecuta `pnpm install`. `ABRIR_PROYECTA.cmd` ahora detecta dependencias faltantes y las instala solo |
| Aviso «Unsupported engine» | Usa Node 24 (`nvm use`); con Node 22 funciona igual |
| Puerto 5173 ocupado | Cierra la otra instancia o revisa `.local/servidor-error.log` (lanzador Windows) |
| La partida no se guarda | Revisa permisos o cuota del almacenamiento del navegador; mantén la pestaña abierta |
| «No se pudo leer la partida guardada» | El guardado es de un formato incompatible; se conserva una copia en `proyecta-v1:unreadable` al guardar una nueva |
| «La misión generada no está disponible» | El proyecto se eliminó o se restablecieron los datos: genera la partida de nuevo desde Mis proyectos |
| Un PDF importado no muestra datos | Probablemente es escaneado (sin texto). Completa el proyecto en el Builder o exporta el PDF con texto seleccionable |
| El Excel se rechaza | Guárdalo como .xlsx sin macros |
| Imágenes rotas tras publicar en una subruta | Compila con `--base=/tu-subruta/` (ver Despliegue) |
| Pantalla en blanco al abrir `dist/index.html` | Sírvelo por HTTP (`pnpm preview` o un hosting estático) |

## Documentación

- [Memoria de creación e historial de prompts](MANUAL_CREACION.md)
- [Plan y resultado de la implementación V2](IMPLEMENTATION_PLAN_V2.md)
- [Entrega V2](ENTREGA_V2.md) · [Cambios](CHANGELOG.md)
- [Cómo contribuir](CONTRIBUTING.md) · [Seguridad](SECURITY.md)
- [Guía para GitHub](docs/GUIA_GITHUB.md) · [Licencia pendiente y recursos](docs/LICENCIA_Y_RECURSOS.md) · [Protocolo de piloto pedagógico](docs/PILOTO_PEDAGOGICO.md)
