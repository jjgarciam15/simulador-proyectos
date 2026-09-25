# Memoria del simulador PROYECTA

## Visión y método

Gestión de proyectos en un territorio ficticio después del Gran Apagón. El jugador diagnostica, formula, prepara, evalúa, regula, compromete, ejecuta y explica resultados. La secuencia educativa es contexto, información, análisis, decisión, consecuencia y revisión. La MGA se aprende mediante formulación; la nota del juego no es certificación de conocimientos ni viabilidad legal.

## Estado de evolución

V2 funcional implementada sobre la base anterior: mapa de etapas y revisiones, conservación al cambiar alternativa, partidas en pausa, cadena de valor construida con tarjetas y enlaces, clasificación de actores, presupuesto desde cero y calculadora cantidad × costo, justificaciones ODS, laboratorio de incentivos, práctica con pistas y reintentos, perfil de puntuación e informe. Reinicio controlado de etapas 1–5 antes de invertir, con confirmación, sin reembolsos y con revisión de dependencias. La práctica posterior al cierre conserva el resultado original.

Validación: 136 pruebas automatizadas pasaron en la última ejecución registrada; una misión de agua se recorrió completa por interfaz, incluyendo eventos, cierre, historial tras recarga y copia de estrategia. La copia permitió comprobar el reinicio de preparación y su costo de 76 M COP/mes en ese escenario. Se revisaron capturas de escritorio y móvil. El resto de misiones se recorrió mediante el motor, no manualmente. Consultar ENTREGA_V2.md para alcance y limitaciones: esto no equivale a certificar todos los criterios del prompt ni a validar aprendizaje con estudiantes.

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
