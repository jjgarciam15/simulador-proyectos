# Memoria del simulador PROYECTA

## Visión y método

Gestión de proyectos en un territorio ficticio después del Gran Apagón. El jugador diagnostica, formula, prepara, evalúa, regula, compromete, ejecuta y explica resultados. La secuencia educativa es contexto, información, análisis, decisión, consecuencia y revisión. La MGA se aprende mediante formulación; la nota del juego no es certificación de conocimientos ni viabilidad legal.

## Estado de evolución

V2 funcional implementada sobre la base anterior (22–23 de septiembre de 2026) y ampliada en la iteración 2 (25 de septiembre de 2026): dilemas condicionales con consecuencias diferidas y sistémicas, laboratorio regulatorio con severidad oculta y puzzle causal, cadena de valor por misión con tarjetas parciales, planificador presupuestal con guía y diagnóstico, coherencia transversal, bonificaciones y penalizaciones explicables, aciertos y errores, preguntas con 6–7 opciones y nuevos logros. Ver la sección «Iteración 2 de la V2».

Validación de la iteración 2: 156 pruebas automatizadas en 14 archivos, tipos y compilación sin errores; revisión en navegador del inicio y la comparación de dificultades, un dilema resuelto, el panel lateral, el planificador presupuestal, el laboratorio regulatorio, el resultado con aciertos y errores, y la vista móvil de 390 px sin desbordamiento horizontal. No sustituye un piloto con estudiantes.

## Reglas V2 y límites pedagógicos

La evaluación ex ante se puntúa usando la fotografía de información y valor esperado al invertir; los eventos posteriores afectan ejecución y valor observado. Los pesos por rol están en `src/data/balance.ts`. El perfil muestra ocho dimensiones, peso y aporte; resta penalizaciones de práctica con tope de 8 puntos y aplica factor 0,35 en abandono/insolvencia. Las justificaciones se almacenan sin calificación semántica automática. Las insignias no conceden dinero ni puntos adicionales.

La ayuda contextual de práctica responde a opciones elegidas y ofrece una pausa tras dos errores. No adapta ocultamente probabilidades, fondos o respuestas. La analítica local cuenta casos, respuestas, pistas y reintentos; aún no estima dominio ni tiempo efectivo de estudio. El editor visual, panel docente y calibración con estudiantes siguen pendientes. El modo reto está implementado. La calculadora conserva cantidades, unidades y precios simulados en partidas de presupuesto; no son precios oficiales.


## Ampliación V2: costo-eficiencia y acuerdos

El laboratorio económico compara costo descontado por persona-año atendida con umbral exploratorio de acceso y restricciones de caja/plazo. No monetiza el resultado físico ni suma tarifas o financiación. `costEfficiency.ts` contiene los cálculos y pruebas con tasa cero y ausencia de resultados.

`negotiations.ts` define mesas de hasta tres rondas por actor: escuchar, acordar con evidencia, acompañamiento inmediato o cierre sin acuerdo. Las obligaciones se conservan tras reiniciar. Al invertir se contrastan con el presupuesto y afectan apoyo/legitimidad. La fotografía para reproducir estrategias conserva el estado anterior a liquidar acuerdos, evitando duplicar bonificaciones o penalizaciones. Los parámetros son educativos; las condiciones ya se personalizaron para los 36 actores y falta calibrarlas con estudiantes.
## Arquitectura y decisiones

App conserva un SaveData central, persistido tras decisiones válidas. Los controles tienen borradores y bloqueo de salida cuando faltan confirmaciones. `coreAct` mantiene el motor previo y `act` incorpora acciones/dependencias V2. `GameState.v2` es opcional y versionado. Las nueve misiones se construyen a partir de Spec; no requieren duplicar pantallas. Financiación, flujo financiero, social y del inversionista permanecen separados.

## Misiones y recursos

Agua, movilidad, residuos, salud, planta productiva, mercado concentrado, energía, alimentos y vivienda; cuatro alternativas cada una. Recursos: caja, compromisos, gasto, reservas, tiempo, información, capacidad, apoyo, legitimidad y sostenibilidad. Crédito con intereses/amortización; socio con participación en retornos; cofinanciación condicionada y diferida. La reserva es parte del presupuesto, no dinero adicional.

## Incertidumbre y consecuencias

La semilla fija demanda, condiciones técnicas y ambientales. Estudios reducen incertidumbre sin cambiar esas condiciones. Eventos reproducibles por periodo y categoría; estudios, mitigación, información y apoyo alteran exposición. Consecuencias inmediatas: desembolsos/apoyo. Diferidas: retrasos y desempeño. Sistémicas: fiabilidad, cobertura, flujos y resultado. Diario conserva decisión, mes, etapa, costo y explicación. Comparación contrafactual usa semilla y restricciones de la inversión.

## Evaluación, regulación y ODS

VPN, TIR, B/C, CAUE, recuperación simple/descontada; flujos anuales y ejecución mensual. Tasas reales/nominales compatibles. Sensibilidad y tres escenarios. Bienestar regulatorio con curvas educativas y HHI; no son estimaciones oficiales. Los 17 ODS tienen efectos calculados por alternativa y desempeño. Marcos políticos históricos y ficticios identificados en `policyFrameworks.json`.

## Dificultad y balance

`data/balance.ts` centraliza fondos V2, ayudas y exposición: fácil +8 % de fondo; intermedio base; difícil −8 %. La realidad subyacente mantiene la misma semilla. No premiar seleccionar todo; no permitir compromisos sin respaldo; conservar varias alternativas razonables. El plazo y la financiación no desaparecen ante un VPN social favorable.

## Persistencia y extensión

localStorage, QA aislado y errores visibles. Estado anterior se conserva sin activar silenciosamente V2. Futuros modos docente, editor y reto deben usar configuraciones de misión y exportaciones del mismo estado, no un segundo motor. No hay LMS, cuentas, multijugador ni analítica externa. El piloto educativo y la calibración empírica siguen siendo necesarios.

## Iteración 2 de la V2 · 25 de septiembre de 2026

Esta sección describe la evolución ejecutada a partir de la solicitud «Implementación integral V2» (ver Historial de prompts). El detalle de la ejecución, riesgos y estados está en `IMPLEMENTATION_PLAN_V2.md`. Estados: **IMPLEMENTADA**, **PARCIAL**, **PREPARADA / NO IMPLEMENTADA**.

### Flujo de juego

Problema (Diagnóstico) → Árbol del problema → Actores → Alternativas (Formulación) → Cadena de valor → Presupuesto (Preparación) → Evaluación ex ante → Regulación → ODS → Decisión de inversión → Ejecución → Resultado. Cada etapa empieza con «Qué vas a hacer / Por qué importa / Qué debes decidir / Cómo afecta el proyecto» y «Aprender más» (`src/features/CommandCenter.tsx`).

### Motor de dilemas y consecuencias (IMPLEMENTADA)

- Contenido: `src/data/dilemmas.ts`. Once plantillas declarativas con `conditions` (estudio faltante o disponible, apoyo, rol, política, presión ambiental, contingencia), `probability` (base × modificadores que dependen de decisiones × dificultad), `choices` con `effects` inmediatos y `delayed` diferidos, `concept` y `explanation`. Los textos usan marcadores de la misión ({mission}, {alternative}, {actor0}…).
- Motor: `src/domain/dilemmas.ts` (selección por semilla, condiciones, textos, efectos) e integración en `act` (`src/domain/engine.ts`). Se sortea como máximo un dilema al completar por primera vez una etapa previa a la inversión. Un dilema pendiente bloquea avanzar y comprometer la inversión, pero no borra ni bloquea el resto del trabajo.
- Efectos inmediatos: caja (fracción del presupuesto de la misión, escalada por dificultad), meses, apoyo, legitimidad, información, capacidad, sostenibilidad. Los ingresos (cofinanciación, crédito de proveedor) se registran en `v2.inflows` para conservar la contabilidad.
- Consecuencias diferidas: se guardan en `v2.delayed` y se aplican una sola vez al comprometer la inversión. Consecuencias sistémicas: `v2.eventRisk` modifica la probabilidad de los eventos de ejecución; `performance` cambia el desempeño observado.
- Bitácora del proyecto: el diario ahora se llama Bitácora e incluye `v2.consequences` (inmediatas, diferidas y sistémicas) además de cada decisión con mes, costo y tiempo.
- Aleatoriedad controlada: `random(seed, "dilemma:"+id)`; misma semilla y decisiones ⇒ mismos dilemas. Un dilema no se repite al volver a completar una etapa.

### Laboratorio regulatorio (IMPLEMENTADA)

- `src/domain/regulationLab.ts` y `src/features/RegulatoryPuzzle.tsx`.
- Severidad oculta de la falla por semilla (0,3–1,4). El jugador ve un rango: ±0,1 con estudio de demanda; ±0,35/0,40/0,50 sin estudio según dificultad. Valor de la información: estudiar puede cambiar la decisión.
- Valor neto educativo por instrumento = daño corregido − costo regulatorio − efectos secundarios (captura y barreras, mayores cuando la capacidad administrativa es baja). Los instrumentos a menos de 8 puntos del mejor son defendibles. **No intervenir es correcto cuando la falla es leve** (verificado con semillas en pruebas).
- Puzzle causal de ocho eslabones: Problema → Evidencia → Falla → Instrumento → Incentivo → Comportamiento → Resultado → Efecto adverso, con 29 tarjetas (distractores creíbles). La clave depende del instrumento elegido, por lo que admite varias estrategias coherentes. Tras el primer eslabón roto, los siguientes valen la mitad.
- Fallo regulatorio al invertir: sobrerregulación (barreras, menor inversión), costo regulatorio sin beneficio, persistencia de la falla (más exposición a eventos) e incentivo perverso por diagnóstico equivocado. Todo queda en la bitácora.
- Puntuación regulatoria de partidas con puzzle: 60 % cadena causal + 40 % proporcionalidad, multiplicado por 0,6 si el diagnóstico no es coherente. Las partidas anteriores conservan la regla previa.

### Cadena de valor (IMPLEMENTADA)

`chainBank` construye 21 tarjetas por misión desde el Árbol del problema y la alternativa: correctas, parcialmente relacionadas (media nota, p. ej. «Contrato de obra firmado») y distractores. Se barajan por semilla. El jugador arrastra tarjetas a los niveles (o usa el selector accesible) y conecta relaciones. Retroalimentación según dificultad: fácil explica cada error, intermedio señala qué falla, difícil solo da la nota. Se conservan los identificadores anteriores para no invalidar partidas guardadas.

### Presupuesto y recursos (IMPLEMENTADA)

- Sin valores precargados: el presupuesto empieza en cero y las actividades sin costo.
- Guía de referencia por categoría (rangos calculados con la alternativa y la población objetivo) y diagnóstico en vivo (`src/domain/budgetReview.ts`): suficiencia de la inversión técnica, operación, mantenimiento, contingencia (3–20 %, prudente 5–12 %), supervisión, gestión ambiental, acuerdos negociados, coherencia con la cadena y viabilidad financiera. Llenar todos los máximos cuesta más que un presupuesto equilibrado: hay que priorizar.
- Escasez: fondo inicial 100 % / 92 % / 85 % del presupuesto base según dificultad (antes 108 / 100 / 92 %). Las pruebas del catálogo confirman que cada misión y dificultad conserva al menos una estrategia viable.
- Planificador de recursos y centro de información en el panel derecho; los estudios pueden contratarse en cualquier etapa antes de invertir.

### Evaluación ex ante (IMPLEMENTADA)

`src/features/ExAnteBrief.tsx` explica qué es, para qué sirve, por qué ocurre antes de ejecutar y qué papel cumple en la partida, con los datos reales: alternativa, población y cobertura, costo a comprometer, costo y beneficio anual, tiempo, riesgo, diagnóstico del presupuesto, sostenibilidad y decisiones con efectos pendientes. Escenarios y sensibilidad siguen usando el modelo del motor con las decisiones del jugador.

### ODS (IMPLEMENTADA)

17 ODS sin preselección; cada elegido requiere relación, evidencia y argumento. Tras confirmar, `sdgReview` valora cada ODS (bien sustentado, pertinente mal sustentado, sin relación), informa omisiones y exceso. Seleccionar todos penaliza.

### Preguntas (IMPLEMENTADA)

Práctica V2: 16 preguntas con 7 opciones (cuatro trampas por etapa), una de selección múltiple con 7 opciones y cinco casos aplicados con 6 opciones. Pistas en tres niveles, intentos 100/80/60 %. El módulo de aprendizaje de tres opciones solo existe para partidas guardadas anteriores a la V2.

### Puntuación V2 (IMPLEMENTADA)

- Nueve dimensiones: diagnóstico, alternativa, cadena y presupuesto, evaluación ex ante, regulación y ODS, compromisos y riesgo, ejecución, valor observado y **coherencia transversal** (15 %). Pesos en `src/data/balance.ts`.
- Coherencia transversal (`src/domain/coherence.ts`): problema ↔ alternativa, alternativa ↔ cadena, cadena ↔ presupuesto, presupuesto ↔ evaluación, problema ↔ regulación, proyecto ↔ ODS y actores ↔ estrategia, cada una con su razón.
- Bonificaciones (tope +6) y penalizaciones (tope −8) explicables (`adjustmentRules`).
- Nota = redondear(limitar(Σ valor × peso − penalizaciones + bonificaciones, 0, 100) × factor de cierre).
- Resultado: historia por reglas, radar, tabla de aportes, bonificaciones y penalizaciones, matriz de coherencia, diagnóstico del presupuesto aprobado, conceptos dominados y a repasar, y **aciertos y errores** por etapa (`src/domain/ledger.ts`).

### Logros (IMPLEMENTADA)

Planificador, Analista, Regulador, Gestor de riesgo y Proyecto sostenible, además de los cinco anteriores. Todos exigen evidencia observable; ninguno se otorga por avanzar.

### Dificultad (IMPLEMENTADA)

Centralizada en `difficultyRules`: fondo, información inicial, incertidumbre regulatoria, probabilidad de eventos y dilemas, costo de los dilemas, penalización de pistas, detalle de la retroalimentación y aviso de consecuencias diferidas. La pantalla de inicio muestra la comparación con los valores reales.

### Validación de misiones (IMPLEMENTADA)

`validateMission`, `validateDilemmas` y `validateRegulationLab` (`src/domain/missions.ts`) detectan identificadores duplicados, probabilidades o efectos inválidos, tiempos negativos, dilemas sin trade-off o sin explicación e instrumentos sin configuración. Se ejecutan en las pruebas.

### Preparado para el futuro (PREPARADA / NO IMPLEMENTADA)

- **Modo docente:** crear y asignar misiones podrá reutilizar `Spec`, `dilemmaTemplates` y `balance.ts`; un código de partida ya existe (semilla); resultados, promedios y errores frecuentes pueden derivarse de `Outcome.assessment` y `outcomeLedger`. Falta: almacenamiento compartido, cuentas y exportación agregada.
- **Modo reto:** ya existe con configuración versionada (`src/domain/challenges.ts`); se puede endurecer con `difficultyRules` y restricciones. No hay multijugador.
- **Analítica local:** se registran intentos, pistas, cambios, dilemas y consecuencias. No se mide el tiempo por etapa.

### Reglas de balance

No debe existir presupuesto suficiente para maximizar todo. Ninguna alternativa domina en todas las dimensiones (prueba de catálogo). Los dilemas tienen al menos dos opciones con efectos distintos. Los efectos monetarios de un dilema no superan el 5 % del presupuesto. La regulación no siempre es correcta.


# Historial de prompts

## 2026-09-22 · Solicitud maestra de evolución V2

Se conserva íntegramente a continuación. Nuevas evoluciones deberán agregar fecha, instrucción completa, cambios y validación en una nueva entrada cronológica.


<details><summary>Prompt completo recibido</summary>

# PROMPT MAESTRO — EVOLUCIÓN V2 DEL SIMULADOR DE FORMULACIÓN Y EVALUACIÓN DE PROYECTOS

Quiero realizar una evolución profunda del simulador existente de **Formulación y Evaluación de Proyectos**.

Trabaja directamente sobre el repositorio actual.

NO quiero una reconstrucción innecesaria desde cero, ni una colección de cambios aislados, ni simples mejoras visuales.

Primero debes comprender completamente el proyecto existente y después evolucionarlo manteniendo todo lo que actualmente funciona correctamente.

El objetivo es transformar el simulador en una experiencia educativa mucho más:

- interactiva;
- estratégica;
- dinámica;
- difícil;
- visual;
- coherente;
- rejugable;
- pedagógica;
- profesional.

Debe sentirse progresivamente como:

**un simulador de gestión de proyectos + juego estratégico de decisiones + herramienta educativa.**

NO debe sentirse como:

**un formulario académico con preguntas de selección múltiple.**

---

# 1. VISIÓN GENERAL

El jugador representa a un agente público o privado que enfrenta un problema, necesidad u oportunidad y debe estructurar un proyecto para intervenirla.

Tiene recursos limitados.

Debe:

1. comprender el problema;
2. identificar causas y efectos;
3. analizar actores;
4. identificar población objetivo;
5. construir el árbol del problema;
6. plantear alternativas;
7. seleccionar una alternativa;
8. construir su cadena de valor;
9. administrar recursos;
10. construir el presupuesto;
11. identificar costos y beneficios;
12. analizar riesgos;
13. realizar evaluación ex ante;
14. analizar aspectos regulatorios;
15. relacionar el proyecto con los ODS;
16. responder a eventos inesperados;
17. revisar decisiones;
18. evaluar viabilidad;
19. observar consecuencias;
20. recibir una evaluación final detallada.

La filosofía central debe ser:

> **El simulador no resuelve el proyecto por el jugador. Le proporciona información, herramientas, restricciones y consecuencias para que el jugador analice, decida, se equivoque, corrija y aprenda.**

---

# 2. PRINCIPIOS DE DISEÑO

Toda mecánica debe cumplir al menos uno de estos objetivos:

- hacer pensar;
- obligar a priorizar;
- mostrar un concepto;
- generar un trade-off;
- introducir incertidumbre;
- conectar etapas;
- mostrar consecuencias;
- evaluar razonamiento.

Antes de crear cualquier interacción preguntarse:

> ¿Esta mecánica obliga al jugador a pensar o solamente le obliga a hacer clic?

Si solamente agrega clics, simplificarla o eliminarla.

La dificultad NO debe provenir de:

- interfaces confusas;
- textos excesivos;
- información escondida arbitrariamente;
- más clics;
- preguntas tramposas sin sentido.

Debe provenir de:

- restricciones;
- decisiones;
- distractores plausibles;
- incertidumbre;
- costo de oportunidad;
- trade-offs;
- análisis;
- coherencia entre etapas;
- consecuencias.

---

# 3. AUDITORÍA DEL PROYECTO ANTES DE PROGRAMAR

ANTES de modificar código realiza una auditoría completa del repositorio.

Identifica:

- stack;
- arquitectura;
- frontend;
- backend;
- rutas;
- componentes;
- manejo de estado;
- persistencia;
- modelos;
- tipos;
- misiones;
- preguntas;
- navegación;
- dificultad;
- puntuación;
- presupuesto;
- evaluación ex ante;
- regulación;
- ODS;
- cadena de valor;
- datos hardcodeados;
- tests;
- documentación;
- dependencias;
- deuda técnica relevante.

Identifica también qué funcionalidades ya existen y funcionan correctamente.

NO reconstruyas algo que ya funciona si puede evolucionarse.

Primero crea internamente un plan de implementación por fases.

Después ejecútalo.

---

# 4. DOCUMENTACIÓN OBLIGATORIA

Crear como mínimo:

## README.md

Debe explicar:

- qué es el proyecto;
- objetivo;
- stack;
- arquitectura resumida;
- requisitos;
- instalación;
- dependencias;
- variables de entorno;
- ejecución local;
- desarrollo;
- tests;
- build;
- despliegue;
- persistencia;
- comandos;
- estructura del repositorio;
- troubleshooting;
- cómo continuar el desarrollo.

Una persona nueva debe poder descargar el repositorio y ejecutar la aplicación siguiendo únicamente este README.

NO inventes comandos.

Documenta exclusivamente la arquitectura real.

---

# 5. MANUAL_CREACION.md

Crear:

`MANUAL_CREACION.md`

Debe funcionar como memoria técnica, funcional y conceptual del simulador.

Documentar:

- visión;
- objetivos pedagógicos;
- metodología;
- arquitectura;
- flujo;
- módulos;
- misiones;
- motor de misiones;
- variables;
- puntuación;
- dificultad;
- presupuesto;
- recursos;
- eventos;
- riesgos;
- actores;
- cadena de valor;
- evaluación ex ante;
- regulación;
- ODS;
- consecuencias;
- persistencia;
- decisiones arquitectónicas;
- reglas de balance;
- funcionalidades existentes;
- funcionalidades futuras.

Crear una sección:

# Historial de prompts

Guardar allí este prompt completo.

Dejar preparada una estructura cronológica para agregar futuros prompts.

Cada nueva evolución importante deberá poder quedar registrada.

---

# 6. TERMINOLOGÍA

Revisar toda la aplicación.

Cuando se haga referencia a la herramienta metodológica, nunca utilizar simplemente:

**“Árbol”**

Utilizar:

**“Árbol del problema”**

Aplicarlo a:

- títulos;
- textos;
- botones;
- navegación;
- tutoriales;
- ayudas;
- resultados;
- componentes;
- tooltips;
- preguntas;
- documentación.

Actualizar nombres internos cuando mejore la consistencia sin romper innecesariamente compatibilidad.

---

# 7. ESTADO CENTRAL DE LA PARTIDA

Crear o mejorar una fuente de verdad central para la partida.

Debe poder almacenar como mínimo:

- ID de partida;
- seed;
- misión;
- dificultad;
- etapa;
- etapas desbloqueadas;
- etapas completadas;
- etapas que requieren revisión;
- problema;
- árbol del problema;
- actores;
- población objetivo;
- alternativas;
- alternativa seleccionada;
- cadena de valor;
- presupuesto;
- recursos;
- tiempo;
- costos;
- beneficios;
- riesgos;
- evaluación ex ante;
- decisiones regulatorias;
- ODS;
- eventos;
- decisiones;
- pistas;
- intentos;
- puntajes;
- errores;
- aciertos;
- consecuencias.

Debe existir una fuente clara de verdad para evitar estados contradictorios.

---

# 8. PERSISTENCIA

El jugador debe poder:

- comenzar;
- salir;
- recargar;
- cerrar;
- volver;
- continuar desde donde estaba.

Persistir correctamente:

- decisiones;
- progreso;
- seed;
- presupuesto;
- recursos;
- tiempo;
- eventos;
- puntuación;
- etapas;
- revisiones;
- alternativa;
- cadena de valor;
- ODS;
- regulación.

Agregar cuando corresponda:

**Nueva partida**

**Continuar partida**

No destruir una partida accidentalmente.

---

# 9. NAVEGACIÓN LIBRE

Una vez desbloqueada una etapa, el jugador podrá regresar directamente.

No obligarlo a repetir el recorrido.

Mostrar estados:

- bloqueada;
- pendiente;
- en progreso;
- completada;
- requiere revisión.

Crear un mapa visual del proyecto.

Ejemplo:

Problema  
↓  
Árbol del problema  
↓  
Actores  
↓  
Alternativas  
↓  
Cadena de valor  
↓  
Presupuesto  
↓  
Evaluación ex ante  
↓  
Regulación  
↓  
ODS  
↓  
Resultado

Permitir navegación entre etapas desbloqueadas.

---

# 10. DEPENDENCIAS ENTRE ETAPAS

Las etapas NO pueden sentirse independientes.

Crear relaciones reales.

Ejemplo:

Problema
↓
Árbol del problema
↓
Alternativas
↓
Alternativa seleccionada
↓
Cadena de valor
↓
Recursos
↓
Presupuesto
↓
Costos y beneficios
↓
Evaluación ex ante
↓
Regulación
↓
ODS
↓
Resultado

Las decisiones anteriores deben alimentar las siguientes.

---

# 11. SISTEMA “REQUIERE REVISIÓN”

NO borrar progreso innecesariamente.

Si una decisión anterior cambia y afecta una etapa posterior:

mantener el trabajo realizado.

Pero marcar esa etapa como:

**Requiere revisión**

Ejemplo:

El jugador cambia la alternativa.

No borrar su presupuesto.

Mostrar:

> “Este presupuesto fue construido utilizando una alternativa diferente. Revísalo para comprobar si continúa siendo válido.”

Crear estados como:

- válido;
- requiere revisión;
- inconsistente.

Explicar qué decisión provocó la inconsistencia.

---

# 12. ALTERNATIVA SELECCIONADA

La alternativa seleccionada debe permanecer visible en el panel lateral derecho.

Mostrar:

- nombre;
- descripción;
- costo estimado;
- población;
- beneficios;
- riesgos;
- restricciones;
- información relevante.

Agregar:

**Cambiar alternativa**

Puede cambiarse durante la partida.

No borrar automáticamente otras etapas.

Activar el sistema de revisión de dependencias.

---

# 13. DASHBOARD / CENTRO DE MANDO

Crear un dashboard principal de partida.

Debe mostrar visualmente, según corresponda:

- misión;
- alternativa;
- presupuesto;
- recursos;
- tiempo;
- avance;
- cobertura;
- aceptación social;
- riesgo;
- viabilidad;
- impacto;
- sostenibilidad.

No necesariamente revelar todos los indicadores desde el inicio.

Algunos pueden aparecer conforme el jugador obtiene información.

Debe sentirse como un panel de gestión.

---

# 14. VARIABLES VIVAS

Crear variables que evolucionen durante la simulación.

Estudiar como mínimo:

- presupuesto;
- tiempo;
- cobertura;
- aceptación social;
- riesgo;
- viabilidad;
- impacto esperado;
- sostenibilidad.

Las decisiones deben modificar estas variables.

Ejemplo:

Realizar estudio adicional:

Presupuesto ↓  
Tiempo ↓  
Información ↑  
Riesgo ↓

Evitar alternativas superiores en todas las dimensiones.

---

# 15. TIEMPO COMO RECURSO

Agregar el tiempo como restricción cuando corresponda.

Ejemplo:

Duración máxima:

18 meses.

Las decisiones pueden consumir:

- días;
- semanas;
- meses.

Puede existir:

menor costo + mayor duración

o

mayor costo + menor duración.

El jugador debe administrar ambos recursos.

---

# 16. PLANIFICADOR DE RECURSOS

En el panel derecho agregar:

**Planificar recursos**

Debe abrir un planificador que muestre:

Disponible  
Planeado  
Comprometido  
Utilizado  
Reserva

Debe permitir anticipar decisiones.

No sustituye la etapa formal de presupuesto.

Debe funcionar como herramienta estratégica durante toda la partida.

---

# 17. PREGUNTAS Y APRENDIZAJE

Aumentar significativamente la dificultad.

En:

- Aprender;
- quizzes;
- preguntas;
- comprobaciones conceptuales;

utilizar normalmente entre:

**5 y 7 opciones.**

Crear distractores plausibles.

Incluir:

- respuestas similares;
- errores comunes;
- conceptos parcialmente correctos;
- causalidades incorrectas;
- confusión causa/efecto;
- actividad/producto/resultado/impacto;
- costo/beneficio;
- eficiencia/eficacia;
- regulación;
- presupuesto;
- ODS.

Cuando sea apropiado permitir varias respuestas correctas.

La interfaz debe advertirlo.

Aleatorizar posiciones cuando sea apropiado.

---

# 18. MODELO DE PREGUNTAS

Crear una estructura reutilizable que pueda contener:

- ID;
- pregunta;
- contexto;
- concepto;
- dificultad;
- alternativas;
- respuestas válidas;
- distractores;
- explicación;
- puntaje;
- penalización;
- pista;
- tags.

No hardcodear preguntas directamente en componentes si puede evitarse.

---

# 19. FEEDBACK INTELIGENTE

Evitar:

**Incorrecto.**

Utilizar feedback como:

> “Esta decisión reduce el costo inicial, pero deja sin tratar un riesgo importante.”

O:

> “El instrumento puede corregir la falla identificada, pero existe un posible efecto secundario que debes considerar.”

No revelar siempre la solución inmediatamente.

---

# 20. PISTAS

Crear pistas escalonadas.

### Pista 1
Orientación conceptual.

### Pista 2
Información adicional.

### Pista 3
Orientación fuerte.

Usar pistas reduce ligeramente la puntuación.

La penalización depende de dificultad.

---

# 21. SEGUNDOS INTENTOS

En puzzles y preguntas pedagógicas:

Primer intento:
100%

Segundo:
aprox. 80%

Tercero:
aprox. 60%

Después puede mostrarse una explicación.

No utilizar necesariamente este mecanismo en decisiones estratégicas cuyas consecuencias forman parte del juego.

---

# 22. CADENA DE VALOR

Rediseñar completamente esta etapa.

NO entregar la cadena construida.

El jugador debe crearla.

Proporcionar un banco amplio de elementos.

Incluir:

- correctos;
- incorrectos;
- parcialmente relacionados;
- distractores plausibles.

El jugador debe:

1. seleccionar;
2. clasificar;
3. ordenar;
4. relacionar.

Estructura conceptual:

**Insumos → Actividades → Productos → Resultados → Impactos**

Utilizar drag & drop o alternativa accesible equivalente.

Evaluar:

- selección;
- clasificación;
- orden;
- relaciones;
- coherencia.

La construcción debe afectar directamente la nota.

---

# 23. PRESUPUESTO INTERACTIVO

Rediseñar esta etapa.

NO entregar el presupuesto resuelto.

El jugador debe construirlo.

Proporcionar:

- recursos disponibles;
- categorías;
- rangos;
- costos aproximados;
- restricciones;
- cantidades;
- referencias;
- pistas.

El jugador decide:

- cantidades;
- asignaciones;
- prioridades;
- reservas;
- distribución.

Crear una interfaz tipo:

**Planificador presupuestal**

Evaluar:

- viabilidad;
- suficiencia;
- eficiencia;
- sobrecostos;
- subestimación;
- desperdicio;
- restricciones;
- coherencia con alternativa;
- coherencia con cadena de valor.

---

# 24. ESCASEZ REAL

Ajustar los recursos de cada misión.

No debe existir dinero suficiente para simplemente elegir todo.

Debe existir:

**costo de oportunidad.**

El jugador debe priorizar.

Regla general:

No permitir maximizar simultáneamente:

- cobertura;
- calidad;
- rapidez;
- bajo costo;
- bajo riesgo.

---

# 25. CONTINGENCIA

Permitir reservar presupuesto.

Ejemplo:

Total:
$1.000 M

Asignado:
$910 M

Contingencia:
$90 M

Si aparece un evento inesperado, disponer de contingencia puede reducir su impacto.

Pero reservar excesivamente también puede reducir eficiencia.

---

# 26. INFORMACIÓN IMPERFECTA

No entregar toda la información gratuitamente.

Permitir:

- investigar;
- realizar estudios;
- consultar;
- analizar;
- avanzar con incertidumbre.

Obtener información puede consumir:

- presupuesto;
- tiempo.

Ejemplo:

Estudio de demanda

Costo: $25 M  
Tiempo: 3 semanas

Beneficio:
reduce incertidumbre.

El jugador decide si comprar información vale la pena.

---

# 27. CENTRO DE INFORMACIÓN

Crear un espacio donde consultar:

- estadísticas;
- estudios;
- antecedentes;
- población;
- territorio;
- costos;
- normativa;
- datos;
- restricciones.

Algunos elementos son gratuitos.

Otros pueden requerir:

- recursos;
- tiempo;
- completar actividades.

---

# 28. ACTORES

Los actores identificados deben tener consecuencias posteriores.

Cada actor puede tener:

- interés;
- poder;
- influencia;
- posición;
- necesidades;
- capacidad de presión;
- relación con el proyecto.

Ejemplos:

- comunidad;
- gobierno;
- empresa;
- usuarios;
- regulador;
- proveedores;
- organizaciones;
- competidores.

---

# 29. MAPA DE ACTORES

Crear matriz interactiva:

**Poder × Interés**

El jugador debe ubicar actores.

Después seleccionar estrategias:

- informar;
- consultar;
- involucrar;
- negociar;
- monitorear.

Estas decisiones deben afectar la simulación.

---

# 30. ACEPTACIÓN SOCIAL

Cuando tenga sentido, incorporar aceptación de actores o apoyo social.

Ejemplo:

Comunidad:

72%

Una decisión problemática:

72% → 51%

Esto puede afectar:

- riesgo;
- tiempo;
- costos;
- viabilidad.

---

# 31. NEGOCIACIONES

Introducir pequeñas negociaciones cuando corresponda.

Ejemplo:

Un actor solicita modificar el proyecto.

Opciones:

Aceptar  
Rechazar  
Negociar  
Modificar parcialmente  
Solicitar información

Cada elección genera consecuencias.

Mantenerlas rápidas y estratégicas.

---

# 32. DILEMAS

Crear decisiones donde ninguna opción sea perfecta.

Ejemplo:

Recursos suficientes para mejorar solamente uno:

- cobertura;
- calidad;
- reducción de riesgo;
- contingencia.

Obligar a priorizar.

---

# 33. MOTOR DE EVENTOS

Crear un sistema de eventos.

Posibles eventos:

- aumento de costos;
- retrasos;
- oposición social;
- pérdida de financiación;
- cofinanciación;
- nueva información;
- problema ambiental;
- cambio de demanda;
- incumplimiento;
- tecnología nueva;
- modificación del contexto.

No todos deben ser negativos.

---

# 34. EVENTOS CON REGLAS

Cada evento debe contener:

- contexto;
- condiciones;
- probabilidad;
- alternativas;
- costos;
- consecuencias;
- variables afectadas;
- explicación.

No depender principalmente de suerte.

Las decisiones anteriores deben modificar probabilidades.

Ejemplo:

No hacer estudio técnico:

ahorro inicial

pero

probabilidad de sobrecostos ↑

---

# 35. CONSECUENCIAS

Clasificar consecuencias:

### Inmediatas
Aparecen inmediatamente.

### Diferidas
Aparecen posteriormente.

### Sistémicas
Modifican diferentes módulos.

Ejemplo:

Reducir diagnóstico:

Presupuesto disponible ↑

pero posteriormente:

Riesgo ↑  
Errores presupuestales ↑  
Mala focalización ↑

---

# 36. SEED DE PARTIDA

Cuando técnicamente sea conveniente, cada partida tendrá un seed.

Esto permitirá:

- reproducir escenarios;
- depurar;
- repetir eventos;
- comparar estudiantes;
- compartir una misma misión.

Los tests deben poder utilizar seeds determinísticos.

---

# 37. BITÁCORA DEL PROYECTO

Crear:

**Bitácora**

Registrar automáticamente:

- etapa;
- decisión;
- momento;
- recursos;
- consecuencias;
- eventos;
- cambios.

Ejemplo:

SEMANA 4

Redujiste el estudio de demanda.

Ahorro:
+$40 M

Posteriormente:
la demanda estimada resultó superior a la observada.

La bitácora debe explicar la historia de la partida.

---

# 38. EVALUACIÓN EX ANTE

Mejorar profundamente esta etapa.

Antes de comenzar explicar brevemente:

### ¿Qué es?

### ¿Para qué sirve?

### ¿Por qué ocurre antes de ejecutar?

### ¿Qué función tiene en esta partida?

Después aplicar el concepto.

Utilizar información real generada durante la partida:

- alternativa;
- costos;
- beneficios;
- población;
- riesgos;
- presupuesto;
- horizonte;
- sostenibilidad;
- restricciones.

---

# 39. MÉTODOS DE EVALUACIÓN

Cuando corresponda incorporar:

- costo-beneficio;
- costo-eficiencia;
- indicadores;
- escenarios;
- sensibilidad.

No convertirlo solamente en teoría.

---

# 40. ESCENARIOS

Permitir analizar:

**Optimista**

**Base**

**Pesimista**

Modificar:

- costos;
- demanda;
- beneficios;
- tiempo;
- riesgos.

---

# 41. ANÁLISIS DE SENSIBILIDAD

Crear una herramienta visual sencilla.

Ejemplos:

Costo +10%

Demanda -15%

Tiempo +20%

Beneficios -10%

Mostrar cómo cambia la viabilidad.

Debe ayudar a entender que la evaluación depende de supuestos.

---

# 42. REGULACIÓN ECONÓMICA — MÓDULO AVANZADO

Esta debe convertirse en una de las mejores etapas del simulador.

Integrar conceptos reales de Regulación Económica.

Incluir cuando corresponda:

- fallas de mercado;
- externalidades;
- bienes públicos;
- información asimétrica;
- poder de mercado;
- monopolio natural;
- selección adversa;
- riesgo moral;
- captura regulatoria;
- incentivos;
- regulación de precios;
- entrada;
- estándares;
- impuestos;
- subsidios;
- competencia;
- costos regulatorios;
- bienestar;
- efectos no deseados;
- falla regulatoria.

NO convertir esto únicamente en preguntas.

---

# 43. LABORATORIO REGULATORIO

Crear una experiencia:

**Laboratorio Regulatorio**

El jugador debe determinar primero si existe una falla.

Debe existir la posibilidad de concluir:

**No intervenir.**

No asumir que regular siempre es correcto.

Después permitir elegir instrumentos:

- impuesto;
- subsidio;
- precio;
- estándar;
- información;
- entrada;
- competencia;
- provisión pública;
- autorregulación;
- no intervención.

Después simular consecuencias.

---

# 44. PUZZLE REGULATORIO

Crear puzzles con tarjetas:

Problema
↓
Evidencia
↓
Falla de mercado
↓
Instrumento
↓
Incentivo
↓
Comportamiento
↓
Resultado
↓
Efecto adverso

Agregar distractores plausibles.

Evaluar:

- diagnóstico;
- instrumento;
- causalidad;
- consecuencias;
- efectos secundarios.

---

# 45. TRADE-OFF REGULATORIO

Las políticas no deben producir únicamente beneficios.

Ejemplo:

+ cobertura

+ corrección de externalidad

- costo fiscal

- posible incentivo perverso

El jugador debe analizar el balance.

---

# 46. BIENESTAR

Cuando sea pedagógicamente apropiado mostrar efectos sobre:

- consumidores;
- productores;
- gobierno;
- sociedad.

No es necesario convertir cada misión en un modelo matemático avanzado.

Debe ser comprensible y visual.

---

# 47. ODS

Rediseñar esta sección.

NO preseleccionar ningún ODS.

Mostrar los 17 ODS.

El jugador selecciona los que considere pertinentes.

Permitir uno o varios.

Después exigir una justificación breve o estructurada.

Evaluar:

- pertinencia;
- relación directa;
- relación indirecta;
- coherencia;
- omisiones;
- exceso.

NO premiar seleccionar todos.

---

# 48. JUSTIFICACIÓN DE DECISIONES

En decisiones importantes permitir o exigir:

**¿Por qué tomaste esta decisión?**

Evitar textos largos.

Utilizar:

- argumentos;
- ranking;
- razones seleccionables;
- texto corto máximo aproximado de 200 caracteres.

La justificación puede aportar información para evaluar coherencia.

---

# 49. INTRODUCCIÓN DE CADA ETAPA

Cada etapa debe comenzar brevemente con:

### Qué estás haciendo

### Por qué importa

### Qué debes decidir

### Cómo afecta el proyecto

Evitar bloques largos.

Agregar:

**Aprender más**

para profundización opcional.

---

# 50. TUTOR CONTEXTUAL

Crear ayuda contextual.

Ejemplos:

¿Qué es una externalidad?

¿Qué diferencia existe entre producto y resultado?

¿Qué es costo de oportunidad?

¿Qué es evaluación ex ante?

No resolver directamente el ejercicio.

El tutor debe orientar.

---

# 51. SISTEMA DE DIFICULTAD

En la pantalla inicial explicar claramente:

## Fácil

- mayor orientación;
- más pistas;
- mayor presupuesto;
- distractores simples;
- penalizaciones menores;
- eventos moderados.

## Intermedio

- orientación moderada;
- presupuesto restringido;
- preguntas complejas;
- más incertidumbre;
- mayor coherencia requerida.

## Difícil

- recursos escasos;
- pocas ayudas;
- distractores avanzados;
- eventos más exigentes;
- decisiones regulatorias complejas;
- penalizaciones mayores;
- alta exigencia de coherencia.

La dificultad NO debe modificar solamente números.

Debe modificar realmente la experiencia.

Centralizar las reglas.

---

# 52. DIFICULTAD ADAPTATIVA

Preparar la arquitectura para ajustar algunas ayudas según desempeño.

Buen desempeño:

- menos pistas;
- distractores más sofisticados.

Dificultades:

- mayor orientación.

No alterar silenciosamente la nota ni la dificultad seleccionada.

---

# 53. SISTEMA DE PUNTUACIÓN V2

Rediseñar completamente la puntuación.

No evaluar únicamente respuestas correctas.

Considerar:

- diagnóstico;
- árbol del problema;
- actores;
- población;
- alternativa;
- cadena de valor;
- presupuesto;
- eficiencia;
- costos y beneficios;
- riesgo;
- evaluación ex ante;
- regulación;
- ODS;
- administración de recursos;
- coherencia global.

---

# 54. COHERENCIA TRANSVERSAL

El sistema debe evaluar relaciones.

Ejemplos:

Problema ↔ alternativa

Alternativa ↔ cadena de valor

Cadena de valor ↔ presupuesto

Presupuesto ↔ evaluación

Problema ↔ regulación

Proyecto ↔ ODS

No evaluar únicamente módulos aislados.

---

# 55. PROCESO + RESULTADO

La nota debe considerar:

**resultado + proceso + coherencia + eficiencia**

No exigir siempre una única solución.

Diferentes estrategias pueden ser válidas.

---

# 56. PENALIZACIONES

Considerar penalizaciones por:

- desperdicio;
- incoherencia;
- sobrecostos;
- mala priorización;
- pistas;
- múltiples intentos;
- decisiones regulatorias inconsistentes;
- selección indiscriminada de ODS.

No aplicar penalizaciones arbitrarias.

Toda penalización debe tener explicación.

---

# 57. RESULTADO FINAL

No mostrar solamente:

**85/100**

Crear informe completo.

Mostrar:

- puntaje total;
- puntaje por etapa;
- aciertos;
- errores;
- decisiones;
- recursos;
- tiempo;
- desperdicio;
- riesgos;
- consecuencias;
- aporte de cada etapa;
- penalizaciones;
- bonificaciones;
- conceptos dominados;
- conceptos a repasar.

---

# 58. PERFIL DEL PROYECTO

Agregar una visualización tipo radar o equivalente:

- formulación;
- finanzas;
- eficiencia;
- regulación;
- sostenibilidad;
- riesgo;
- impacto.

Debe complementar, no reemplazar, los números.

---

# 59. HISTORIA FINAL

Generar mediante reglas una síntesis de la partida.

Ejemplo:

> “Tu proyecto consiguió una cobertura alta y manejó adecuadamente los principales riesgos, pero el presupuesto quedó demasiado ajustado y la estrategia regulatoria incrementó los costos de implementación.”

Debe basarse exclusivamente en decisiones reales.

No generar comentarios aleatorios.

---

# 60. EXPLICAR LA CALIFICACIÓN

El usuario debe poder responder:

**¿Por qué obtuve esta nota?**

Cada error debe mostrar cuánto afectó.

Cada acierto importante debe mostrar cuánto aportó.

La puntuación debe ser transparente.

---

# 61. LOGROS

Crear logros educativos.

Ejemplos:

**Planificador**
Finaliza sin superar presupuesto.

**Analista**
Construye correctamente una cadena de valor.

**Regulador**
Identifica una falla y un instrumento coherente.

**Gestor de riesgo**
Supera un evento manteniendo viabilidad.

**Proyecto sostenible**
Logra coherencia con ODS.

No regalar logros por simplemente avanzar.

---

# 62. REJUGABILIDAD

Las misiones pueden variar entre partidas.

Variar controladamente:

- presupuesto;
- costos;
- actores;
- eventos;
- riesgos;
- restricciones;
- preguntas;
- información.

Mantener el objetivo pedagógico.

---

# 63. MODO RETO

Preparar arquitectura para:

**Modo Reto**

Menos orientación.

Recursos estrictos.

Restricciones fuertes.

Objetivo:

crear la mejor formulación posible bajo esas condiciones.

No es necesario implementar multijugador.

---

# 64. CASOS DE ESTUDIO

Preparar el motor para proyectos:

- públicos;
- privados;
- sociales;
- ambientales;
- infraestructura;
- transporte;
- educación;
- alimentación;
- empresariales;
- energía;
- mercados regulados.

La arquitectura no debe depender de una sola misión.

---

# 65. MOTOR CONFIGURABLE DE MISIONES

Este es un objetivo arquitectónico importante.

Siempre que pueda hacerse sin reescribir innecesariamente el sistema, evolucionar hacia un motor donde una misión pueda configurarse mediante datos.

Una misión debería definir:

- metadata;
- contexto;
- problema;
- actores;
- población;
- alternativas;
- recursos;
- tiempo;
- presupuesto;
- información;
- preguntas;
- cadena de valor;
- riesgos;
- eventos;
- evaluación;
- regulación;
- ODS;
- reglas;
- puntuación;
- dificultad.

Objetivo:

**crear nuevas misiones sin reconstruir componentes centrales.**

---

# 66. SEPARACIÓN DE RESPONSABILIDADES

Separar:

**contenido**

**reglas**

**estado**

**motor de simulación**

**puntuación**

**persistencia**

**UI**

Evitar lógica importante distribuida arbitrariamente dentro de componentes visuales.

---

# 67. CONFIGURACIÓN DE BALANCE

Separar parámetros como:

- presupuesto;
- tiempo;
- probabilidades;
- costos;
- penalizaciones;
- puntuación;
- eventos;
- dificultad;
- pistas.

Esto permitirá balancear las misiones posteriormente sin modificar el motor.

---

# 68. VALIDACIÓN DE MISIONES

Crear validaciones para detectar:

- preguntas sin respuesta;
- presupuesto imposible;
- alternativa incompleta;
- cadena sin solución;
- evento sin consecuencia;
- ODS sin criterio;
- puntuación incorrecta;
- dependencia circular;
- recurso negativo;
- configuración inválida.

Detectarlos durante desarrollo.

---

# 69. MICROINTERACCIONES

Agregar feedback visual discreto.

Ejemplos:

Presupuesto cambia → indicador animado.

Riesgo aumenta → feedback breve.

Evento → tarjeta.

Etapa inconsistente → indicador.

Logro → notificación.

No saturar con animaciones.

---

# 70. EXPERIENCIA VISUAL

Mantener identidad visual actual y mejorarla.

La aplicación debe sentirse como:

**dashboard estratégico + simulador + juego de gestión + herramienta educativa**

No infantilizar la interfaz.

Priorizar:

- jerarquía;
- claridad;
- accesibilidad;
- consistencia;
- feedback;
- legibilidad.

---

# 71. REDUCIR PANTALLAS PASIVAS

Evitar:

leer → siguiente → leer → siguiente.

Transformar cuando sea posible en:

- selección;
- clasificación;
- ranking;
- drag & drop;
- presupuesto;
- comparación;
- negociación;
- puzzle;
- análisis;
- asignación;
- decisión.

---

# 72. RESET CONTROLADO

Permitir:

- reiniciar decisión;
- reiniciar etapa;
- reiniciar misión.

Advertir qué dependencias serán afectadas.

No destruir progreso accidentalmente.

---

# 73. ANALÍTICA PEDAGÓGICA LOCAL

Registrar estructuradamente:

- intentos;
- errores;
- pistas;
- cambios;
- tiempo por etapa;
- conceptos difíciles.

Evitar tracking externo innecesario.

Preparar esta información para futuras mejoras.

---

# 74. MODO DOCENTE — PREPARACIÓN FUTURA

No construir todavía un LMS complejo.

Pero evitar decisiones arquitectónicas que impidan posteriormente agregar:

- creación de misiones;
- asignación;
- códigos de partida;
- estudiantes;
- resultados;
- promedio;
- errores frecuentes;
- desempeño por concepto;
- exportación.

Documentar la posible evolución en `MANUAL_CREACION.md`.

---

# 75. COMPARACIÓN DE ESTRATEGIAS

Preparar arquitectura para mostrar al terminar:

**“Existían otras estrategias posibles.”**

Puede presentar rutas alternativas conceptuales.

No afirmar que existe siempre una única solución perfecta.

---

# 76. GAMIFICACIÓN SIN DISTORSIONAR EL APRENDIZAJE

La gamificación debe reforzar el aprendizaje.

Utilizar:

- progreso;
- retos;
- logros;
- consecuencias;
- eventos;
- feedback;
- puntuación;
- incertidumbre;
- descubrimiento.

Evitar puntos arbitrarios sin relación con desempeño.

---

# 77. PRUEBAS AUTOMATIZADAS

Crear o actualizar tests.

Prioridad:

- puntuación;
- presupuesto;
- recursos;
- cambio de alternativa;
- persistencia;
- navegación;
- dependencias;
- cadena de valor;
- eventos;
- seed;
- regulación;
- ODS;
- dificultad.

---

# 78. PRUEBA MANUAL COMPLETA

Al terminar, jugar una misión completa.

Probar:

1. partida nueva;
2. continuar partida;
3. cada dificultad;
4. respuestas correctas;
5. incorrectas;
6. parcialmente correctas;
7. uso de pistas;
8. cambio de alternativa;
9. volver atrás;
10. modificar decisiones;
11. etapas que requieren revisión;
12. presupuesto deficiente;
13. presupuesto eficiente;
14. cadena incorrecta;
15. cadena correcta;
16. ODS excesivos;
17. ODS incorrectos;
18. regulación incorrecta;
19. no intervención;
20. eventos;
21. contingencia;
22. evaluación ex ante;
23. sensibilidad;
24. puntuación final;
25. persistencia después de recargar.

---

# 79. PRUEBA DE EXPERIENCIA

Durante la revisión manual preguntarse:

- ¿hay demasiado texto?
- ¿hay demasiados clics?
- ¿las decisiones importan?
- ¿existe escasez?
- ¿los distractores son creíbles?
- ¿hay incertidumbre?
- ¿hay trade-offs?
- ¿las etapas están conectadas?
- ¿el jugador comprende los errores?
- ¿puede corregir?
- ¿hay razones para volver a jugar?
- ¿regulación exige análisis?
- ¿evaluación ex ante utiliza decisiones anteriores?
- ¿ODS exige razonamiento?
- ¿cadena de valor realmente la construye el jugador?

Corregir problemas detectados.

---

# 80. NO HACER

NO dejar:

- placeholders;
- botones sin funcionar;
- TODOs críticos;
- mocks presentados como funcionalidad;
- pantallas decorativas;
- preguntas obvias;
- ODS preseleccionados;
- presupuestos resueltos;
- decisiones falsas;
- etapas desconectadas;
- progreso destruido;
- puntuaciones inexplicables;
- eventos puramente aleatorios;
- interfaces innecesariamente complejas.

---

# 81. NO SACRIFICAR ESTABILIDAD

Si alguna funcionalidad secundaria requiere comprometer la estabilidad de las funciones principales:

priorizar estabilidad.

No implementar gamificación superficial antes que:

- estado;
- persistencia;
- navegación;
- puntuación;
- presupuesto;
- dependencias;
- evaluación;
- regulación.

---

# 82. PRIORIDADES DE IMPLEMENTACIÓN

## PRIORIDAD 1 — FUNDAMENTOS

- auditoría;
- arquitectura;
- estado;
- persistencia;
- navegación;
- dependencias;
- documentación.

## PRIORIDAD 2 — FUNCIONALIDADES CENTRALES

- preguntas;
- alternativa;
- cadena de valor;
- presupuesto;
- recursos;
- evaluación ex ante;
- regulación;
- ODS;
- puntuación;
- informe final.

## PRIORIDAD 3 — SIMULACIÓN

- variables vivas;
- tiempo;
- actores;
- información;
- eventos;
- riesgos;
- consecuencias;
- bitácora;
- escenarios;
- sensibilidad.

## PRIORIDAD 4 — EXPERIENCIA

- dashboard;
- microinteracciones;
- logros;
- rejugabilidad;
- tutor;
- mejoras visuales.

## PRIORIDAD 5 — FUTURO

- modo reto;
- modo docente;
- analítica avanzada;
- editor de misiones.

No abandonar una prioridad anterior a medias para comenzar una posterior.

---

# 83. CRITERIO PEDAGÓGICO GENERAL

Cada módulo debe intentar seguir:

**Contexto → Información → Análisis → Decisión → Consecuencia → Feedback → Impacto sobre el proyecto**

El jugador debe aprender haciendo.

---

# 84. PRINCIPIO DE ORQUESTACIÓN

Todo debe sentirse como un único proyecto.

No como 10 minijuegos independientes.

Ejemplo:

Mala identificación del problema

↓

Alternativa menos coherente

↓

Cadena de valor problemática

↓

Presupuesto ineficiente

↓

Evaluación ex ante débil

↓

Mayor riesgo

↓

Resultado final inferior.

Las relaciones deben ser comprensibles y pedagógicamente defendibles.

---

# 85. REGLA DE CONSECUENCIAS

No castigar arbitrariamente.

Toda consecuencia debe poder explicarse mediante:

- lógica del proyecto;
- economía;
- regulación;
- administración;
- riesgo;
- información disponible.

---

# 86. REGLA DE MÚLTIPLES SOLUCIONES

No diseñar todas las misiones alrededor de una única ruta correcta.

Debe ser posible que existan varias estrategias razonables.

Evaluar:

- coherencia;
- eficiencia;
- justificación;
- resultados;
- riesgos asumidos.

---

# 87. REGLA DE DIVERSIÓN

La diversión debe surgir de:

- tomar decisiones;
- descubrir información;
- gestionar recursos;
- asumir riesgos;
- resolver puzzles;
- enfrentar eventos;
- observar consecuencias;
- corregir estrategias;
- superar restricciones.

No de elementos visuales superficiales.

---

# 88. REVISIÓN TÉCNICA FINAL

Ejecutar los comandos correspondientes del repositorio:

- tests;
- lint;
- typecheck;
- build.

Corregir errores introducidos.

No afirmar que una prueba pasó si no fue ejecutada.

---

# 89. ENTREGA FINAL DE CODEX

Cuando termines, responde con:

## IMPLEMENTADO

Lista concreta de funcionalidades terminadas.

## ARQUITECTURA

Cambios estructurales realizados.

## ARCHIVOS CREADOS

Archivo + propósito.

## ARCHIVOS MODIFICADOS

Archivo + motivo.

## MOTOR DE MISIONES

Estado actual.

## ESTADO Y PERSISTENCIA

Funcionamiento.

## SISTEMA DE PUNTUACIÓN

Explicación.

## PRESUPUESTO Y RECURSOS

Funcionamiento.

## EVENTOS Y CONSECUENCIAS

Funcionamiento.

## EVALUACIÓN EX ANTE

Funcionamiento.

## REGULACIÓN ECONÓMICA

Mecánicas implementadas.

## ODS

Funcionamiento.

## DIFICULTAD

Cambios entre modos.

## PRUEBAS

Comandos ejecutados y resultados reales.

## PENDIENTES

Solo elementos realmente pendientes.

## DEUDA TÉCNICA

Si existe.

## PRÓXIMA EVOLUCIÓN

Qué tendría mayor sentido implementar posteriormente.

---

# 90. ACTUALIZACIÓN FINAL DE DOCUMENTACIÓN

Antes de finalizar:

Actualizar:

`README.md`

y

`MANUAL_CREACION.md`

para reflejar exactamente el estado real.

NO documentar una funcionalidad como terminada si únicamente está preparada.

Registrar este prompt en:

`MANUAL_CREACION.md → Historial de prompts`

---

# 91. CRITERIOS DE ACEPTACIÓN

Antes de considerar terminada esta evolución comprobar:

### Arquitectura
¿Crear una nueva misión es considerablemente más fácil?

### Decisiones
¿Las decisiones realmente afectan la partida?

### Recursos
¿Existe verdadera escasez?

### Presupuesto
¿El jugador realmente lo construye?

### Tiempo
¿Puede actuar como restricción?

### Cadena de valor
¿La construye realmente el jugador?

### Actores
¿Tienen consecuencias posteriores?

### Alternativa
¿Puede cambiarse sin destruir progreso?

### Navegación
¿Puede regresar libremente?

### Dependencias
¿Cambiar algo anterior marca correctamente qué debe revisarse?

### Evaluación ex ante
¿Utiliza información producida durante la partida?

### Regulación
¿Exige analizar fallas, instrumentos, incentivos y consecuencias?

### ODS
¿El jugador decide y justifica?

### Puntuación
¿Puede comprender exactamente por qué obtuvo su resultado?

### Dificultad
¿Los modos realmente cambian la experiencia?

### Rejugabilidad
¿Una segunda partida puede desarrollarse diferente?

### Persistencia
¿Puede cerrar y continuar?

### Educación
¿Está aprendiendo mediante decisiones y no únicamente leyendo teoría?

Si alguna respuesta es NO, revisar esa parte antes de darla por terminada.

---

# 92. OBJETIVO FINAL DE ESTA VERSIÓN

Quiero que después de esta evolución el jugador deje de sentir:

**“Estoy contestando preguntas de Formulación y Evaluación de Proyectos.”**

y empiece a sentir:

**“Estoy administrando un proyecto, tengo recursos limitados, necesito analizar información y cada decisión que tomo puede cambiar lo que ocurre después.”**

El conocimiento académico debe estar integrado dentro de la experiencia.

La metodología debe aprenderse mediante la aplicación.

El simulador debe recompensar:

**pensar, analizar, priorizar, administrar, justificar, anticipar y corregir.**

No simplemente memorizar.

---

# INSTRUCCIÓN FINAL PARA CODEX

Comienza ahora revisando el repositorio completo.

No empieces modificando componentes de forma aislada.

Primero comprende:

**arquitectura → estado actual → dependencias → problemas → plan de implementación.**

Después implementa por fases respetando las prioridades anteriores.

Toma decisiones técnicas razonables por tu cuenta cuando no exista ambigüedad importante.

No me detengas constantemente para solicitar confirmaciones.

Si encuentras una limitación arquitectónica, busca primero una solución compatible con el proyecto existente.

Mantén compatibilidad con lo que funciona.

No realices una reescritura completa salvo que exista una razón técnica verdaderamente justificada.

Implementa funcionalidades reales, no demostraciones.

Al terminar cada fase importante:

1. valida;
2. prueba;
3. corrige;
4. continúa.

Finalmente ejecuta una revisión integral de la aplicación y actualiza toda la documentación.

**Prioridad absoluta:**

**coherencia pedagógica + decisiones reales + interacción + estrategia + dificultad + consecuencias + estabilidad + arquitectura escalable + buena experiencia de usuario.**

</details>


## Continuación solicitada por el usuario

> continua

Se ampliaron costo-eficiencia y negociación con actores; alcance y pruebas en ENTREGA_V2.md.



### Continuación · modo reto (23 de septiembre de 2026)
Se implementó el apartado 63 mediante configuraciones versionadas en `src/domain/challenges.ts`, catálogo y seguimiento en `src/features/Challenges.tsx`. Restricción de crédito aplicada en el motor y en financiación; objetivos MGA basados en fotografía de inversión y resultados al cierre. Informe, guardado, reintento y copia conservan el reto. Distinción separada de la nota 0–100. Dos trayectorias ganadoras comprobadas mediante acciones del motor; no equivale a validación pedagógica con estudiantes.


### Continuación · detalle, aprendizaje y preparación GitHub (23 de septiembre de 2026)

Se añadieron `budgetLines.ts`, `appliedCases.ts`, `negotiationProfiles.ts` y regresiones del catálogo completo. El detalle se valida antes de confirmar, se guarda y se incluye en el informe. Los términos de negociación anteriores se conservan. Cinco nuevos ejercicios ofrecen feedback específico; no cambian puntuaciones históricas.

Se fijaron Node 24 y pnpm 11.19.0, se preparó CI de solo validación y se inicializó Git local. `.gitignore` excluye dependencias, registros, cachés y compilaciones. No se creó repositorio remoto ni se concedió una licencia abierta. Documentos de subida, contribución, recursos y protocolo de piloto en la carpeta `docs`.


## 2026-09-25 · Implementación integral V2 (iteración 2)

Ejecutada con Claude Code en una sesión en la nube sobre la rama `main-zkuwe9`. Se registran las dos instrucciones recibidas: la lista original de cambios del usuario (de la que se derivó el prompt) y el prompt completo.

### Lista original de cambios solicitados por el usuario

<details><summary>Texto recibido</summary>

> Quiero crear un promt para realizar varios cambios a el simulador, dame el promt para que códex realice todos los cambios.
> Necesito crear un archivo readme que explique el despliegue de la app, además de otro en la que se almacene toda la documentación y promts usados (manual de creación),
>
> - no referirse a árbol si no a árbol del problema en todo las menciones dentro del simulador
> - en todas las preguntas principalmente en el modulo de aprender y en las demás cajas de preguntas mínimo deben de salir 5-7 respuestas para hacer más difícil su respuesta, además de mejorar su estructura, además de que las respuestas allá una o varias trampa para aumentar la dificultad
> - en la parte de cadena de valor el usuario deberá crear su propia cadena de valor. Por lo que deberán aver muchas opciones para que el la construya y el resultado forma parte de la calificación
> - al final cuando el usuario obtiene el puntaje, desglosar errores y aciertos y su aporte a la calificación
> - la alternativa seleccionada se podrá observar en la pantalla de información del lado derecho, detallando la misma. Además el jugador podrá cambiarla en cualquier momento sin que se borre El Progreso de las demás etapas.
> - si el usuario quiero devolverse a una de las etapas podrá hacerlo sin tener que volver a pasar por el recorrido
> - en la parte de presupuesto, ajustar los recursos de cada misión para que sea más difícil lograr el objetivo. Además se necesita que el usuario tenga interacción en esta parte y pueda tomar decisión en esta parte (no traer valores Pre establecidos) crear guía , pero que el usuario sea el que complete los valores
> - en la pantalla de inicio donde se selecciona la dificultad, describir cuál es la diferencia entre los modos
> - en lado derecho poner un botón donde el usuario pueda planear la administración de los recursos que sirva de guía para no estar devolviéndose
> - mejorar el sistema de puntuación
> - en la evaluación ex ante, explicar cuál es la función dentro de la partida y en general en los proyectos, todo tiene que estar orquestado
> - pasar a el siguiente nivel la etapa de regulación, esta tiene que ser la mejor con relaicon a el curso de regulación economía, agregar puzzle, mejorar interacción del usuario con las decisiones y el simulador
> - en la parte de los ODS, no traer nada Pre seleccionada el usuario debe donar decision y esta ser valorada . Mejorar la interacción con el usuario

</details>

### Prompt completo recibido

<details><summary>CLAUDE CODE — IMPLEMENTACIÓN INTEGRAL V2 DEL SIMULADOR DE FORMULACIÓN Y EVALUACIÓN DE PROYECTOS</summary>

CLAUDE CODE — IMPLEMENTACIÓN INTEGRAL V2 DEL SIMULADOR DE FORMULACIÓN Y EVALUACIÓN DE PROYECTOS

Actúa como arquitecto de software senior, desarrollador full-stack, diseñador UX/UI de productos educativos y especialista en simuladores de toma de decisiones.

Vas a trabajar directamente sobre un proyecto existente: un simulador educativo de Formulación y Evaluación de Proyectos.

Tu tarea NO es crear otro proyecto desde cero.

Tu tarea es:

auditar → comprender → diseñar → implementar → integrar → probar → corregir → documentar

una evolución profunda del simulador actual.

Quiero que ejecutes realmente los cambios sobre el repositorio.

No quiero solamente recomendaciones, pseudocódigo, propuestas ni documentación de lo que “se podría hacer”.

**1. OBJETIVO DE ESTA VERSIÓN**

Transformar el simulador actual desde una experiencia principalmente académica hacia:

un simulador estratégico de gestión de proyectos donde el jugador administra recursos limitados, analiza información, toma decisiones, enfrenta incertidumbre y observa las consecuencias de sus decisiones.

Debe combinar:

- Formulación y Evaluación de Proyectos.
- MGA.
- Economía.
- Regulación Económica.
- Gestión de recursos.
- Evaluación ex ante.
- Riesgo.
- ODS.
- Estrategia.
- Simulación.
- Gamificación educativa.

El jugador debe sentir:

“Estoy administrando un proyecto y mis decisiones tienen consecuencias.”

NO:

“Estoy contestando un cuestionario.”

**2. REGLA FUNDAMENTAL**

NO empieces inmediatamente modificando componentes.

Primero inspecciona el repositorio completo.

Debes comprender la arquitectura existente antes de decidir cómo implementar esta versión.

No reescribas funcionalidades que actualmente funcionan si pueden evolucionarse.

No cambies stack, framework o arquitectura principal sin una razón técnica fuerte.

No elimines funcionalidades existentes sin comprobar primero su función.

**3. PRIMERA FASE OBLIGATORIA — AUDITORÍA**

Inspecciona:

- estructura de carpetas;
- package/config files;
- frontend;
- backend;
- rutas;
- componentes;
- modelos;
- tipos;
- servicios;
- stores;
- hooks;
- persistencia;
- misiones;
- preguntas;
- navegación;
- sistema de puntuación;
- dificultad;
- presupuesto;
- cadena de valor;
- árbol del problema;
- alternativas;
- actores;
- evaluación ex ante;
- regulación;
- ODS;
- tests;
- documentación;
- build;
- lint;
- typecheck.

Busca también:

- código duplicado;
- lógica hardcodeada;
- componentes demasiado acoplados;
- estados locales que deberían centralizarse;
- dependencias entre módulos;
- deuda técnica que impida esta evolución.

**4. CREA UN PLAN ANTES DE IMPLEMENTAR**

Después de la auditoría crea o actualiza:

`IMPLEMENTATION_PLAN_V2.md`

Debe contener:

Estado actual — Arquitectura encontrada.

Funcionalidades existentes — Qué funciona actualmente.

Problemas encontrados — Técnicos y funcionales.

Arquitectura objetivo — Cómo evolucionará el sistema.

Fases — Divide la implementación en fases pequeñas.

Riesgos — Posibles regresiones.

Estrategia de compatibilidad — Cómo preservarás partidas o funcionalidades existentes cuando sea razonable.

Después comienza la implementación.

No te quedes esperando mi aprobación salvo que exista un bloqueo real que haga imposible continuar responsablemente.

**5. DOCUMENTACIÓN PRINCIPAL**

Crear o mejorar:

`README.md`

Debe explicar:

- proyecto;
- propósito;
- stack;
- arquitectura;
- requisitos;
- instalación;
- variables de entorno;
- desarrollo;
- ejecución;
- tests;
- build;
- despliegue;
- persistencia;
- estructura;
- troubleshooting.

No inventes comandos.

Verifica que los comandos documentados realmente existan.

**6. MANUAL DE CREACIÓN**

Crear:

`MANUAL_CREACION.md`

Este documento será la memoria técnica y conceptual del simulador.

Debe contener:

- visión;
- metodología;
- objetivos pedagógicos;
- arquitectura;
- flujo de juego;
- motor de misiones;
- estado;
- persistencia;
- puntuación;
- dificultad;
- presupuesto;
- recursos;
- cadena de valor;
- actores;
- eventos;
- riesgos;
- evaluación ex ante;
- regulación;
- ODS;
- gamificación;
- decisiones arquitectónicas;
- reglas de balance;
- funcionalidades implementadas;
- funcionalidades futuras.

Crear:

Historial de prompts

Registrar este prompt completo y dejar preparada una estructura cronológica para prompts posteriores.

**7. TERMINOLOGÍA GLOBAL**

Buscar todas las referencias donde la herramienta metodológica aparezca simplemente como:

`Árbol`

Cambiarla por:

`Árbol del problema`

Aplicar en:

- UI;
- navegación;
- preguntas;
- ayudas;
- títulos;
- tooltips;
- resultados;
- documentación.

También actualizar nombres internos cuando sea seguro y mejore la consistencia.

No romper imports o datos persistidos innecesariamente por cambios cosméticos.

**8. ARQUITECTURA DEL ESTADO DE PARTIDA**

Necesitamos una fuente de verdad consistente.

Analiza el mecanismo actual y evolúcionalo.

El estado debe poder representar como mínimo:

```
gameId
seed

mission
difficulty

currentStage
unlockedStages
completedStages
reviewRequiredStages

problem
problemTree

actors
targetPopulation

alternatives
selectedAlternative

valueChain

resources
budget
contingency
time

costs
benefits
risks

exAnteEvaluation

regulation

selectedSDGs
sdgJustifications

events
decisions
consequences

hints
attempts

scores
bonuses
penalties

achievements
```

Adapta nombres y estructura al lenguaje y arquitectura existente.

No copies esta estructura literalmente si existe una solución mejor compatible con el proyecto.

**9. PERSISTENCIA**

El jugador debe poder:

- iniciar partida;
- guardar automáticamente;
- cerrar;
- recargar;
- continuar.

Persistir:

- progreso;
- decisiones;
- recursos;
- presupuesto;
- tiempo;
- alternativa;
- cadena de valor;
- actores;
- evaluación;
- regulación;
- ODS;
- eventos;
- seed;
- puntuación;
- etapas que requieren revisión.

Agregar cuando corresponda:

Nueva partida

Continuar partida

Evitar pérdida accidental de progreso.

**10. NAVEGACIÓN ENTRE ETAPAS**

Una etapa desbloqueada debe poder visitarse nuevamente sin repetir todo el recorrido.

Estados:

- bloqueada;
- pendiente;
- en progreso;
- completada;
- requiere revisión.

Crear un mapa/progreso visual del proyecto.

Ejemplo conceptual:

```
Problema
   ↓
Árbol del problema
   ↓
Actores
   ↓
Alternativas
   ↓
Cadena de valor
   ↓
Presupuesto
   ↓
Evaluación ex ante
   ↓
Regulación
   ↓
ODS
   ↓
Resultado
```

La navegación debe respetar las dependencias necesarias.

**11. SISTEMA DE DEPENDENCIAS**

Las etapas deben estar conectadas.

Ejemplo:

```
Problema
→ Árbol del problema
→ Alternativas
→ Alternativa seleccionada
→ Cadena de valor
→ Recursos
→ Presupuesto
→ Costos/beneficios
→ Evaluación ex ante
→ Regulación
→ ODS
→ Resultado
```

Las decisiones anteriores deben alimentar etapas posteriores.

**12. SISTEMA “REQUIERE REVISIÓN”**

Este mecanismo es obligatorio.

Cuando el jugador modifica una decisión anterior:

NO eliminar automáticamente el trabajo posterior.

Conservarlo.

Analizar dependencias.

Marcar etapas afectadas:

Requiere revisión

Ejemplo:

Cambio de alternativa.

El presupuesto existente permanece.

Pero mostrar:

Este presupuesto fue construido utilizando otra alternativa. Revisa si continúa siendo coherente.

Estados posibles:

```
valid
needs_review
inconsistent
```

Adaptarlos a la arquitectura.

Debe existir una razón visible que explique por qué una etapa requiere revisión.

**13. ALTERNATIVA SELECCIONADA**

Mostrar permanentemente en el panel lateral:

- nombre;
- descripción;
- costos;
- población;
- beneficios;
- riesgos;
- restricciones.

Agregar:

Cambiar alternativa

Puede modificarse sin destruir automáticamente el progreso.

Disparar el sistema de dependencias.

**14. DASHBOARD DE PARTIDA**

Convertir el panel principal/lateral en un verdadero centro de mando.

Mostrar según disponibilidad:

- misión;
- alternativa;
- progreso;
- presupuesto;
- presupuesto comprometido;
- contingencia;
- tiempo;
- cobertura;
- riesgo;
- aceptación;
- viabilidad;
- impacto;
- sostenibilidad.

No revelar necesariamente toda la información desde el inicio.

**15. VARIABLES VIVAS**

Implementar un sistema de variables de simulación.

Como mínimo estudiar:

```
budget
time
coverage
socialAcceptance
risk
viability
expectedImpact
sustainability
```

Las decisiones pueden modificar varias variables.

Ejemplo:

```
Realizar estudio técnico

budget -30
time -2 semanas
information +20
risk -15
```

Los valores concretos deben provenir de configuración de misión.

**16. TIEMPO**

Incorporar tiempo como recurso cuando corresponda.

Una misión puede tener:

```
18 meses
```

Las decisiones pueden consumir:

- días;
- semanas;
- meses.

Crear trade-offs:

```
más barato + lento

más caro + rápido
```

**17. PLANIFICADOR DE RECURSOS**

Agregar en el panel derecho:

Planificar recursos

Debe permitir visualizar:

```
Disponible
Planeado
Comprometido
Utilizado
Reserva
```

Debe funcionar durante toda la partida.

No reemplaza la etapa formal de presupuesto.

**18. PREGUNTAS MÁS DIFÍCILES**

Revisar todas las preguntas.

En Aprender y demás quizzes utilizar normalmente:

5–7 alternativas.

Los distractores deben ser plausibles.

Incluir errores relacionados con:

- causa/efecto;
- actividad/producto;
- producto/resultado;
- resultado/impacto;
- costos/beneficios;
- eficiencia/eficacia;
- regulación;
- presupuesto;
- ODS;
- población;
- actores.

Permitir preguntas multirrespuesta cuando corresponda.

Indicarlo claramente.

**19. MODELO REUTILIZABLE DE PREGUNTAS**

Crear o evolucionar una estructura como:

```
id
question
context
concept
difficulty
options
correctAnswers
explanation
score
penalty
hints
tags
```

No hardcodear preguntas dentro de componentes si puede evitarse.

**20. FEEDBACK PEDAGÓGICO**

Eliminar feedback pobre como:

Incorrecto.

Utilizar explicaciones contextuales.

Ejemplo:

La alternativa reduce el costo inicial, pero deja sin atender una causa directa del problema.

No entregar siempre la solución inmediatamente.

**21. PISTAS**

Crear tres niveles.

```
Hint 1 → orientación conceptual
Hint 2 → información adicional
Hint 3 → orientación fuerte
```

Cada uso puede reducir ligeramente el puntaje.

La penalización depende de dificultad.

**22. INTENTOS**

Para puzzles y actividades pedagógicas:

```
1.er intento → 100%
2.º intento → ~80%
3.er intento → ~60%
```

Después mostrar explicación cuando corresponda.

No aplicar esto mecánicamente a decisiones estratégicas.

**23. CADENA DE VALOR — RECONSTRUCCIÓN**

Esta etapa debe cambiar profundamente.

NO entregar una cadena preconstruida.

El jugador debe construirla.

Banco de tarjetas:

- correctas;
- incorrectas;
- parcialmente relacionadas;
- distractores.

Clasificación conceptual:

```
Insumos
↓
Actividades
↓
Productos
↓
Resultados
↓
Impactos
```

Permitir:

- seleccionar;
- ordenar;
- clasificar;
- relacionar.

Utilizar drag & drop cuando sea apropiado y crear alternativa accesible mediante controles.

Evaluar:

- elementos;
- clasificación;
- orden;
- relaciones;
- coherencia.

Debe aportar directamente a la calificación.

**24. PRESUPUESTO — RECONSTRUCCIÓN**

NO entregar valores completamente resueltos.

El jugador construye el presupuesto.

El simulador proporciona:

- categorías;
- recursos disponibles;
- rangos;
- costos de referencia;
- restricciones;
- información;
- cantidades estimadas.

El jugador decide:

- cantidades;
- valores;
- distribución;
- prioridades;
- reservas.

Crear un verdadero:

Planificador presupuestal

**25. EVALUACIÓN DEL PRESUPUESTO**

Evaluar:

- viabilidad;
- suficiencia;
- eficiencia;
- coherencia;
- sobrecostos;
- subestimaciones;
- desperdicio;
- restricciones;
- coherencia con alternativa;
- coherencia con cadena de valor.

No limitar la validación a:

`total <= presupuesto`.

**26. ESCASEZ Y COSTO DE OPORTUNIDAD**

Rebalancear misiones.

No debe existir presupuesto suficiente para maximizar todo.

El jugador debe elegir.

Nunca debería poder maximizar simultáneamente:

- cobertura;
- calidad;
- rapidez;
- bajo costo;
- bajo riesgo.

**27. CONTINGENCIA**

Permitir decidir cuánto reservar.

Ejemplo:

```
Presupuesto: 1.000
Asignado: 910
Contingencia: 90
```

Una reserva puede ayudar frente a eventos.

Pero reservar demasiado reduce recursos disponibles para impacto.

**28. INFORMACIÓN IMPERFECTA**

No entregar toda la información gratuitamente.

Permitir comprar/obtener información mediante:

- estudios;
- análisis;
- consultas;
- investigación.

Ejemplo:

```
Estudio de demanda
Costo: 25
Tiempo: 3 semanas
Efecto: reduce incertidumbre
```

Esto introduce el concepto de valor de la información.

**29. CENTRO DE INFORMACIÓN**

Crear una sección para consultar:

- datos;
- estadísticas;
- estudios;
- antecedentes;
- población;
- territorio;
- regulación;
- costos;
- restricciones.

Algunos recursos pueden ser gratuitos.

Otros consumen tiempo o presupuesto.

**30. ACTORES**

Los actores no deben desaparecer después de identificarlos.

Cada actor puede tener:

```
interest
power
influence
position
needs
support
```

Ejemplos:

- comunidad;
- gobierno;
- regulador;
- usuarios;
- empresas;
- proveedores;
- organizaciones;
- competidores.

**31. MAPA DE ACTORES**

Crear matriz:

Poder × Interés

El jugador ubica actores.

Después decide estrategias:

- informar;
- consultar;
- involucrar;
- negociar;
- monitorear.

Estas decisiones deben afectar variables posteriores.

**32. ACEPTACIÓN SOCIAL**

Cuando aplique:

```
support = 72
```

Una decisión puede producir:

```
72 → 53
```

y afectar:

- riesgo;
- retrasos;
- costos;
- viabilidad.

**33. NEGOCIACIONES**

Crear pequeñas decisiones con actores.

Opciones como:

- aceptar;
- rechazar;
- negociar;
- modificar parcialmente;
- solicitar información.

No crear diálogos innecesariamente largos.

**34. DILEMAS**

Crear situaciones donde ninguna alternativa sea perfecta.

Ejemplo:

Solo existe presupuesto para mejorar uno:

- cobertura;
- calidad;
- reducción de riesgo;
- contingencia.

El jugador prioriza.

**35. MOTOR DE EVENTOS**

Crear una arquitectura configurable de eventos.

Posibles eventos:

- inflación de costos;
- retraso;
- oposición;
- reducción presupuestal;
- cofinanciación;
- nueva información;
- impacto ambiental;
- cambio de demanda;
- incumplimiento;
- tecnología nueva.

No todos deben ser negativos.

**36. EVENTOS CONDICIONALES**

Cada evento debe poder contener:

```
id
conditions
probability
context
choices
effects
delayedEffects
explanation
```

Las probabilidades deben poder depender de decisiones anteriores.

Ejemplo:

No realizar estudio técnico:

```
initialCost ↓
futureOverrunRisk ↑
```

**37. ALEATORIEDAD CONTROLADA**

No convertir el simulador en suerte.

Utilizar probabilidades solamente cuando aporten incertidumbre realista.

Las decisiones deben modificar el riesgo.

Utilizar seed para reproducibilidad cuando sea posible.

**38. CONSECUENCIAS**

Soportar:

```
immediate
delayed
systemic
```

Ejemplo:

Reducir diagnóstico:

ahora:

```
budget ↑
```

después:

```
risk ↑
targetingQuality ↓
costUncertainty ↑
```

**39. BITÁCORA**

Crear:

Bitácora del proyecto

Registrar:

- etapa;
- decisión;
- fecha/turno;
- recursos;
- variables;
- eventos;
- consecuencias.

Debe permitir reconstruir cómo se llegó al resultado.

**40. EVALUACIÓN EX ANTE**

Rediseñar esta etapa.

Primero explicar brevemente:

- qué es;
- para qué sirve;
- por qué ocurre antes de ejecutar;
- qué papel cumple en esta partida.

Después utilizar información real de la partida:

- alternativa;
- presupuesto;
- costos;
- beneficios;
- población;
- riesgos;
- tiempo;
- sostenibilidad.

**41. EVALUACIÓN ECONÓMICA**

Cuando la misión lo permita incorporar:

- costo-beneficio;
- costo-eficiencia;
- indicadores;
- escenarios;
- sensibilidad.

No convertirlo en una calculadora aislada.

Debe utilizar decisiones anteriores.

**42. ESCENARIOS**

Crear:

```
Optimista
Base
Pesimista
```

Modificar:

- costos;
- demanda;
- beneficios;
- duración;
- riesgo.

**43. SENSIBILIDAD**

Crear controles visuales sencillos.

Ejemplos:

```
Costos +10%
Demanda -15%
Beneficios -10%
Duración +20%
```

Mostrar cambios en viabilidad.

**44. REGULACIÓN ECONÓMICA — PRIORIDAD ALTA**

Esta debe ser una de las etapas más profundas y divertidas.

Incorporar según la misión:

- externalidades;
- bienes públicos;
- información asimétrica;
- poder de mercado;
- monopolio natural;
- selección adversa;
- riesgo moral;
- captura regulatoria;
- incentivos;
- regulación de precios;
- entrada;
- estándares;
- impuestos;
- subsidios;
- competencia;
- costos regulatorios;
- bienestar;
- efectos no deseados;
- falla regulatoria.

No limitar a selección múltiple.

**45. LABORATORIO REGULATORIO**

Crear:

Laboratorio Regulatorio

Primero:

analizar el mercado.

Después:

determinar si existe una falla.

Debe existir:

No intervenir

como posible conclusión cuando corresponda.

No asumir que regular siempre es correcto.

**46. INSTRUMENTOS REGULATORIOS**

Permitir seleccionar según la misión:

- impuestos;
- subsidios;
- precios;
- estándares;
- obligaciones de información;
- regulación de entrada;
- competencia;
- provisión pública;
- autorregulación;
- no intervención.

Después simular efectos.

**47. PUZZLE REGULATORIO**

Crear tarjetas:

```
Problema
↓
Evidencia
↓
Falla
↓
Instrumento
↓
Incentivo
↓
Comportamiento
↓
Resultado
↓
Efecto adverso
```

Agregar distractores creíbles.

Evaluar causalidad completa.

**48. TRADE-OFF REGULATORIO**

Las decisiones regulatorias pueden tener:

```
+ cobertura
+ bienestar

pero

- costo fiscal
- eficiencia
```

o efectos similares.

Evitar instrumentos mágicos sin efectos secundarios.

**49. FALLO REGULATORIO**

Permitir que una regulación mal diseñada genere:

- distorsiones;
- incentivos perversos;
- barreras;
- costos;
- pérdida de bienestar.

Integrarlo al sistema de consecuencias.

**50. ODS**

Mostrar los 17 ODS.

NO preseleccionar.

El jugador selecciona.

Después justifica.

Evaluar:

- pertinencia;
- relación directa;
- indirecta;
- coherencia;
- omisiones;
- exceso.

Seleccionar todos NO debe ser una estrategia válida.

**51. JUSTIFICACIONES**

En decisiones importantes permitir:

¿Por qué tomaste esta decisión?

Preferir:

- selección de razones;
- ranking;
- argumentos;
- texto breve.

Evitar formularios largos.

**52. INTRODUCCIÓN DE ETAPAS**

Cada etapa debe comenzar con:

Qué vas a hacer

Por qué importa

Qué debes decidir

Cómo afecta el proyecto

Muy breve.

Agregar:

Aprender más

para explicación extendida.

**53. TUTOR CONTEXTUAL**

Crear ayuda contextual basada en el contenido de la misión.

Ejemplos:

- externalidad;
- costo de oportunidad;
- producto vs resultado;
- evaluación ex ante;
- actor;
- ODS.

Debe orientar sin entregar directamente la respuesta.

**54. DIFICULTAD**

Explicar en la pantalla inicial:

Fácil — Más orientación, pistas, recursos y tolerancia.

Intermedio — Restricciones moderadas y mayor análisis.

Difícil — Escasez fuerte, menos pistas, distractores complejos, eventos exigentes y mayor necesidad de coherencia.

La dificultad debe afectar:

- presupuesto;
- tiempo;
- pistas;
- preguntas;
- eventos;
- penalizaciones;
- información;
- incertidumbre.

Centralizar estas reglas.

**55. PUNTUACIÓN V2**

Rediseñar el sistema.

Evaluar:

- problema;
- árbol del problema;
- actores;
- población;
- alternativa;
- cadena de valor;
- presupuesto;
- recursos;
- costos/beneficios;
- riesgos;
- evaluación ex ante;
- regulación;
- ODS;
- eficiencia;
- coherencia.

**56. COHERENCIA TRANSVERSAL**

Evaluar relaciones:

```
problema ↔ alternativa
alternativa ↔ cadena
cadena ↔ presupuesto
presupuesto ↔ evaluación
problema ↔ regulación
proyecto ↔ ODS
```

Este componente debe ser importante.

**57. PROCESO + RESULTADO**

La evaluación final debe considerar:

```
resultado
+
proceso
+
coherencia
+
eficiencia
```

No exigir una única estrategia.

**58. PENALIZACIONES Y BONIFICACIONES**

Penalizaciones posibles:

- desperdicio;
- incoherencia;
- sobrecostos;
- mala priorización;
- exceso de pistas;
- múltiples intentos;
- regulación incoherente;
- selección indiscriminada de ODS.

Bonificaciones posibles:

- coherencia;
- eficiencia;
- buena gestión de riesgo;
- reserva adecuada;
- decisiones consistentes.

Todo debe ser explicable.

**59. RESULTADO FINAL DETALLADO**

No mostrar únicamente:

`85/100`

Mostrar:

- total;
- etapa;
- aciertos;
- errores;
- decisiones;
- recursos;
- tiempo;
- desperdicio;
- riesgos;
- penalizaciones;
- bonificaciones;
- conceptos dominados;
- conceptos a repasar.

**60. EXPLICABILIDAD DEL PUNTAJE**

El jugador debe poder saber:

¿Por qué obtuve esta nota?

Mostrar el aporte de decisiones relevantes.

Ejemplo:

```
Cadena de valor     16/20
Presupuesto         13/20
Regulación          18/20
ODS                  8/10
Coherencia          14/20
```

Y explicar por qué.

**61. PERFIL FINAL**

Crear una visualización tipo radar o alternativa equivalente:

- formulación;
- finanzas;
- eficiencia;
- regulación;
- sostenibilidad;
- riesgo;
- impacto.

No reemplaza el desglose numérico.

**62. HISTORIA FINAL DEL PROYECTO**

Generar mediante reglas una síntesis basada en la partida.

Ejemplo:

El proyecto consiguió una cobertura alta, pero el presupuesto quedó ajustado y la estrategia regulatoria aumentó los costos de implementación.

No utilizar comentarios aleatorios.

**63. LOGROS**

Agregar logros educativos.

Ejemplos:

Planificador — No supera presupuesto.

Analista — Cadena coherente.

Regulador — Diagnóstico e instrumento coherentes.

Gestor de riesgo — Supera un evento sin comprometer viabilidad.

Proyecto sostenible — ODS coherentes.

No otorgarlos por simplemente avanzar.

**64. REJUGABILIDAD**

Permitir variaciones controladas en:

- presupuesto;
- costos;
- actores;
- eventos;
- riesgos;
- restricciones;
- preguntas;
- información.

Mantener objetivos pedagógicos.

**65. MOTOR CONFIGURABLE DE MISIONES**

Esta es una prioridad arquitectónica.

Evolucionar progresivamente hacia misiones configurables mediante datos.

Una misión debería poder definir:

```
metadata
context
problem
actors
population
alternatives
resources
budget
time
information
questions
valueChain
risks
events
evaluation
regulation
sdgs
rules
scoring
difficulty
```

No es obligatorio utilizar exactamente esta estructura.

Diseña la más apropiada para el código existente.

**66. SEPARAR RESPONSABILIDADES**

Separar claramente:

```
contenido
reglas
estado
simulación
puntuación
persistencia
UI
```

No colocar toda la lógica dentro de componentes React/UI.

**67. BALANCE**

Separar configuración de:

- presupuesto;
- tiempo;
- costos;
- probabilidades;
- puntuación;
- penalizaciones;
- eventos;
- pistas;
- dificultad.

Esto debe permitir balancear una misión sin modificar el motor.

**68. VALIDACIÓN DE MISIONES**

Crear validaciones de desarrollo.

Detectar:

- preguntas sin respuesta;
- presupuesto imposible;
- alternativa incompleta;
- evento inválido;
- cadena imposible;
- ODS sin criterio;
- puntuación incorrecta;
- dependencia circular;
- valores negativos;
- configuración incompleta.

**69. UX/UI**

Mantener la identidad actual, pero elevar la experiencia.

Debe sentirse como:

dashboard estratégico + juego de gestión + simulador educativo

No infantilizar.

Priorizar:

- claridad;
- jerarquía;
- accesibilidad;
- feedback;
- consistencia;
- navegación.

**70. MICROINTERACCIONES**

Agregar animaciones discretas cuando aporten feedback.

Ejemplos:

- cambio de presupuesto;
- aumento de riesgo;
- evento;
- etapa que requiere revisión;
- logro;
- consecuencia.

No abusar.

**71. REDUCIR CONTENIDO PASIVO**

Buscar pantallas del tipo:

```
leer
↓
siguiente
```

Cuando sea pedagógicamente apropiado convertirlas en:

- ordenar;
- clasificar;
- seleccionar;
- priorizar;
- asignar;
- comparar;
- negociar;
- construir;
- presupuestar;
- analizar.

**72. RESET CONTROLADO**

Permitir reiniciar:

- decisión;
- etapa;
- misión.

Antes explicar qué dependencias se verán afectadas.

**73. ANALÍTICA PEDAGÓGICA LOCAL**

Registrar cuando sea razonable:

- intentos;
- errores;
- pistas;
- cambios;
- tiempo por etapa;
- conceptos difíciles.

No introducir tracking externo innecesario.

**74. PREPARACIÓN PARA MODO DOCENTE**

NO construir un LMS completo ahora.

Pero evita bloquear futuras funcionalidades:

- crear misiones;
- asignar;
- código de partida;
- estudiantes;
- resultados;
- promedio;
- errores frecuentes;
- exportación.

Documentarlo en `MANUAL_CREACION.md`.

**75. MODO RETO — PREPARACIÓN**

Preparar arquitectura para un futuro:

Modo Reto

Con:

- menos ayuda;
- recursos estrictos;
- incertidumbre;
- restricciones fuertes.

No es necesario implementar multijugador.

**76. MÚLTIPLES SOLUCIONES**

No diseñes todo alrededor de una única respuesta perfecta.

Una misión puede admitir varias estrategias.

Evaluar:

- coherencia;
- eficiencia;
- justificación;
- riesgo;
- resultado.

**77. GAMIFICACIÓN**

La diversión debe surgir de:

- decisiones;
- descubrimiento;
- restricciones;
- recursos;
- riesgo;
- puzzles;
- consecuencias;
- eventos;
- corrección;
- estrategia.

No de puntos arbitrarios.

**78. TESTS**

Crear o actualizar tests para:

- scoring;
- budget;
- resources;
- alternative changes;
- persistence;
- navigation;
- dependencies;
- value chain;
- events;
- deterministic seed;
- regulation;
- ODS;
- difficulty.

No reduzcas cobertura existente.

**79. VALIDACIÓN POR FASES**

Después de cada fase importante:

1. ejecutar tests relevantes;
2. ejecutar typecheck;
3. ejecutar lint cuando corresponda;
4. corregir;
5. continuar.

No acumules todos los errores hasta el final.

**80. PRUEBA MANUAL COMPLETA**

Antes de terminar simula una partida.

Prueba:

- nueva partida;
- continuar;
- dificultades;
- preguntas;
- pistas;
- errores;
- cambio de alternativa;
- navegación hacia atrás;
- modificación de decisiones;
- requires-review;
- presupuesto;
- contingencia;
- cadena de valor;
- actores;
- eventos;
- ODS;
- regulación;
- no intervención;
- evaluación ex ante;
- escenarios;
- sensibilidad;
- puntuación;
- resultado;
- persistencia.

**81. REVISA LA DIVERSIÓN**

Pregúntate durante la prueba:

- ¿hay demasiado texto?
- ¿hay demasiados clics?
- ¿las decisiones realmente importan?
- ¿existe escasez?
- ¿los distractores son creíbles?
- ¿hay incertidumbre?
- ¿existen trade-offs?
- ¿las etapas están conectadas?
- ¿los eventos tienen sentido?
- ¿entiendo por qué perdí puntos?
- ¿puedo corregir?
- ¿quiero intentar otra estrategia?
- ¿Regulación Económica requiere análisis real?
- ¿Evaluación ex ante usa mis decisiones?
- ¿ODS requiere razonamiento?
- ¿realmente construyo la cadena de valor?

Corrige los problemas evidentes encontrados.

**82. NO HACER**

No dejar:

- placeholders;
- botones muertos;
- TODOs críticos;
- mocks disfrazados de funcionalidad;
- pantallas decorativas;
- preguntas absurdamente fáciles;
- ODS preseleccionados;
- presupuestos solucionados;
- decisiones falsas;
- etapas desconectadas;
- puntuaciones inexplicables;
- eventos totalmente aleatorios;
- pérdida innecesaria de progreso.

**83. NO SOBREDISEÑAR**

No construyas ahora sistemas enormes que todavía no necesitamos.

Prioriza:

1. arquitectura sólida;
2. funcionalidades reales;
3. integración;
4. experiencia;
5. extensibilidad.

No implementes un LMS completo, multijugador, backend distribuido o infraestructura innecesaria solamente porque podría utilizarse en el futuro.

**84. ORDEN DE IMPLEMENTACIÓN**

Trabaja en este orden:

FASE 1 — BASE: auditoría; documentación inicial; arquitectura; estado; persistencia; navegación; dependencias.

FASE 2 — CORE EDUCATIVO: preguntas; árbol del problema; alternativa; cadena de valor; presupuesto; recursos; scoring.

FASE 3 — SIMULACIÓN: variables; tiempo; actores; información; eventos; consecuencias; bitácora.

FASE 4 — EVALUACIÓN: evaluación ex ante; escenarios; sensibilidad.

FASE 5 — REGULACIÓN: laboratorio; puzzles; instrumentos; trade-offs; falla regulatoria.

FASE 6 — ODS: selección; justificación; evaluación.

FASE 7 — EXPERIENCIA: dashboard; feedback; microinteracciones; logros; resultado final; perfil.

FASE 8 — HARDENING: tests; lint; typecheck; build; prueba manual; correcciones; documentación final.

No saltes a FASE 7 dejando FASE 1 o 2 incompleta.

**85. CRITERIOS DE ACEPTACIÓN**

Antes de declarar terminada la V2 debes poder responder SÍ a:

- ¿El jugador construye el presupuesto?
- ¿Construye la cadena de valor?
- ¿Selecciona los ODS?
- ¿Puede cambiar de alternativa?
- ¿Conserva progreso?
- ¿Las etapas afectadas se marcan para revisión?
- ¿Puede regresar a etapas anteriores?
- ¿Existen restricciones reales?
- ¿Las decisiones tienen consecuencias?
- ¿Existe incertidumbre controlada?
- ¿Los actores importan?
- ¿Evaluación ex ante utiliza decisiones anteriores?
- ¿Regulación Económica requiere análisis?
- ¿Puede ser correcto no intervenir?
- ¿Existen fallas regulatorias?
- ¿La puntuación es explicable?
- ¿Los modos de dificultad son realmente diferentes?
- ¿Puede continuar una partida después de recargar?
- ¿Existe rejugabilidad?
- ¿Crear una misión futura será más sencillo?
- ¿La aplicación continúa compilando correctamente?

Si alguna respuesta es NO por un bug o implementación incompleta de esta versión, continúa trabajando.

**86. CONTROL DE REGRESIONES**

Después de cada cambio importante revisa que no hayas roto funcionalidades existentes.

No sacrifiques una función estable por una mejora visual.

Si necesitas hacer una migración del estado persistido, implementa una estrategia razonable de compatibilidad o fallback.

**87. COMMITS / CAMBIOS MANEJABLES**

Trabaja en cambios lógicos y manejables.

Evita una modificación masiva de cientos de archivos sin validación intermedia.

Si el entorno Git disponible lo permite, organiza el trabajo de manera que los cambios sean fáciles de revisar y revertir.

No hagas operaciones destructivas de Git ni elimines trabajo existente que no hayas creado tú.

**88. DOCUMENTACIÓN DURANTE LA IMPLEMENTACIÓN**

No esperes hasta el final para intentar recordar qué cambiaste.

Actualiza progresivamente:

`IMPLEMENTATION_PLAN_V2.md`

y cuando corresponda:

`MANUAL_CREACION.md`

Mantén sincronizados código y documentación.

**89. ENTREGA FINAL**

Al terminar entrégame:

1. RESUMEN — Qué cambió.
2. ARQUITECTURA — Qué decisiones tomaste.
3. IMPLEMENTADO — Lista real.
4. ARCHIVOS CREADOS — Archivo + función.
5. ARCHIVOS MODIFICADOS — Principales archivos + motivo.
6. ESTADO Y PERSISTENCIA — Cómo funcionan.
7. MOTOR DE MISIONES — Estado de la arquitectura.
8. SISTEMA DE DEPENDENCIAS — Cómo funciona `requires review`.
9. PRESUPUESTO Y RECURSOS — Funcionamiento.
10. SIMULACIÓN — Variables, eventos y consecuencias.
11. EVALUACIÓN EX ANTE — Funcionamiento.
12. REGULACIÓN — Qué mecánicas se implementaron.
13. ODS — Cómo funciona.
14. PUNTUACIÓN — Cómo se calcula y explica.
15. UX — Principales mejoras.
16. TESTS — Comandos realmente ejecutados. Resultados.
17. BUILD — Resultado real.
18. PENDIENTES — Solo lo que realmente no pudo terminarse.
19. DEUDA TÉCNICA — Si existe.
20. SIGUIENTE VERSIÓN — Qué evolución recomendarías.

**90. DOCUMENTACIÓN FINAL OBLIGATORIA**

Antes de finalizar verifica que existan y estén actualizados:

`README.md`

`MANUAL_CREACION.md`

`IMPLEMENTATION_PLAN_V2.md`

El README debe permitir desplegar el proyecto.

El manual debe permitir comprender cómo fue construido.

El plan debe permitir comprender cómo se ejecutó esta evolución.

Registrar este prompt completo en:

`MANUAL_CREACION.md → Historial de prompts`

No documentes como terminada una función que no esté realmente implementada.

**91. REGLA DE AUTONOMÍA**

Tienes autorización para:

- inspeccionar el repositorio;
- crear archivos;
- modificar código;
- refactorizar;
- ejecutar comandos;
- ejecutar tests;
- corregir errores;
- reorganizar componentes;
- mejorar arquitectura;
- actualizar documentación;

siempre que sea necesario para cumplir esta versión y no destruyas deliberadamente funcionalidades existentes.

No me preguntes por decisiones técnicas rutinarias.

Resuélvelas utilizando buenas prácticas y la arquitectura encontrada.

Solo detente si:

1. necesitas una credencial que no existe;
2. necesitas realizar una operación irreversible peligrosa;
3. existe una ambigüedad funcional crítica que no puede resolverse examinando el proyecto;
4. existe un bloqueo externo real.

En cualquier otro caso:

analiza → decide → implementa → prueba → corrige → continúa.

**92. REGLA DE CALIDAD**

No confundas:

“implementado”

con:

“dejé preparada la arquitectura”.

Si una característica está únicamente preparada, indícala como:

PREPARADA / NO IMPLEMENTADA

Si está parcialmente terminada:

PARCIAL

Si funciona:

IMPLEMENTADA

Nunca presentes como completada una funcionalidad que no hayas validado.

**93. OBJETIVO FINAL**

Al terminar esta versión quiero que el cambio fundamental sea:

ANTES:

“Respondo actividades para avanzar.”

DESPUÉS:

“Administro un proyecto. Tengo recursos y tiempo limitados. Analizo información, selecciono una estrategia, construyo el proyecto, enfrento incertidumbre, tomo decisiones y después veo sus consecuencias.”

El conocimiento académico debe estar integrado dentro de esas decisiones.

El simulador debe recompensar:

analizar + priorizar + administrar + justificar + anticipar + corregir

y no solamente:

memorizar + responder.

**COMIENZA AHORA**

Empieza inspeccionando el repositorio completo.

No hagas todavía cambios cosméticos aislados.

Primero:

1. comprende el proyecto;
2. identifica la arquitectura;
3. ejecuta una línea base de tests/build si es posible;
4. identifica riesgos;
5. crea `IMPLEMENTATION_PLAN_V2.md`;
6. define las fases;
7. comienza la implementación;
8. valida después de cada fase;
9. corrige regresiones;
10. continúa hasta completar la mayor cantidad posible de esta V2 con calidad.

No sacrifiques estabilidad por cantidad.

Si el alcance completo es demasiado grande para una única iteración, termina primero un vertical slice completamente funcional de las prioridades más altas y continúa progresivamente, dejando claramente documentado qué está IMPLEMENTADO, PARCIAL o PREPARADO.

Prioridad absoluta: arquitectura sólida + integración pedagógica + decisiones reales + consecuencias + estabilidad + experiencia dinámica.

</details>

### Cambios y validación

Resumen en la sección «Iteración 2 de la V2» de este manual y en `IMPLEMENTATION_PLAN_V2.md` (resultado, estados y pendientes). Validación: `pnpm test` (156 pruebas), `pnpm typecheck`, `pnpm build` y revisión en navegador.

---

## Plantilla para próximas instrucciones

Copiar y completar al recibir un nuevo prompt:

```
## AAAA-MM-DD · Título breve

### Prompt completo recibido
<details><summary>Título</summary>
(texto íntegro)
</details>

### Cambios realizados
- …

### Validación
- Comandos ejecutados y resultados reales.
- Estado de cada funcionalidad: IMPLEMENTADA / PARCIAL / PREPARADA / NO IMPLEMENTADA.
```
