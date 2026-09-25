# Entrega V2 · PROYECTA

> Actualización del 25 de septiembre de 2026: la iteración 2 de la V2 (dilemas, laboratorio regulatorio, planificador presupuestal, coherencia transversal y más) se documenta en `IMPLEMENTATION_PLAN_V2.md` y en `MANUAL_CREACION.md`. Este documento conserva el estado de la entrega anterior.

Fecha de revisión: 23 de septiembre de 2026. Evolución local del proyecto existente, sin publicación. Este documento distingue implementación, verificación y pendientes del prompt maestro.

## IMPLEMENTADO

Mapa de ocho etapas con estado; navegación gratuita por etapas desbloqueadas antes de invertir; revisiones dependientes sin eliminar el trabajo; alternativa visible; planificador exploratorio; partidas en pausa; construcción de cadena de valor; ubicación de actores; presupuesto desde cero y calculadora de partidas; argumentación regulatoria y ODS; práctica con cinco o seis opciones, selección múltiple, pistas e intentos; perfil final con radar, aportes y explicación; reinicio controlado de etapas de formulación. Se mantienen narrativa de Aurora, nueve misiones, personajes, audio local y transiciones existentes.

Ampliación posterior: laboratorio de costo-eficiencia, modo reto, mesas de negociación de hasta tres rondas por actor, 36 condiciones específicas por misión, presupuesto detallado persistente y cinco casos adicionales de aprendizaje (21 por misión). Preparación local para GitHub, sin publicación.

## ARQUITECTURA

React/TypeScript/Vite. App coordina la sesión y persistencia; los módulos de fase mantienen borradores. `act` valida y aplica acciones sobre copias; `coreAct` conserva compatibilidad anterior. Cálculos, contenido, puntuación y presentación están separados. No existe servidor de partidas ni llamadas externas para decidir resultados.

## ARCHIVOS CREADOS

- `AUDITORIA_V2.md`, `README.md`, `MANUAL_CREACION.md`, `ENTREGA_V2.md`.
- `src/data/balance.ts`, `src/data/relationships.ts`.
- `src/domain/projectV2.ts`, `actionsV2.ts`, `questionsV2.ts`, `scoringV2.ts`, `missions.ts`, `v2.test.ts`.
- `src/features/CommandCenter.tsx`, `BuildersV2.tsx`, `PracticeV2.tsx`, `ScoreV2.tsx`, `BudgetCalculator.tsx`, `ResetStage.tsx`.
- `src/v2.css`.
- `src/domain/costEfficiency.ts`, `costEfficiency.test.ts`, `negotiations.ts`, `negotiations.test.ts`; `src/features/CostEfficiency.tsx`, `NegotiationDesk.tsx`.

## ARCHIVOS MODIFICADOS

`src/App.tsx`, `main.tsx`, `components/workbench.tsx`; `domain/types.ts`, `engine.ts`, `storage.ts`, `mga.ts`, `recognition.ts`; `features/Diagnosis.tsx`, `Preparation.tsx`, `Evaluation.tsx`, `Regulation.tsx`, `MgaLab.tsx`, `Endgame.tsx`.

## MOTOR DE MISIONES

Las nueve misiones existentes usan datos de escenario y el mismo motor. Cuatro alternativas por misión. `validateMission` comprueba identificadores, rangos, referencias, dependencias y financiación inicial razonable; las pruebas lo ejecutan para todo el catálogo. No se ha añadido un editor visual. Una prueba verifica que ninguna tecnología domina otra en todas las dimensiones iniciales comparadas; no garantiza ausencia de dominancia para cualquier combinación de supuestos.

## ESTADO Y PERSISTENCIA

Estado V2 opcional/versionado: etapas completadas, revisiones, cadena, conexiones, clasificación de actores, argumentos, intentos, pistas, planificador y contador de reinicio. Guardado automático tras confirmaciones válidas. Nueva misión preserva otra misión activa en pausa. QA usa `?qa=1`, separado del guardado habitual. Estado ilegible se intenta conservar antes de reemplazarlo; si falla el almacenamiento la interfaz avisa y mantiene la sesión en memoria. No se garantiza recuperación tras borrar datos del navegador.

Reiniciar etapa requiere confirmación en pantalla. No revierte estudios, préstamos, negociaciones pagadas ni gasto. La reformulación de una etapa completada consume 0,2 % del presupuesto base y un mes. Etapas posteriores se conservan y se marcan para revisión. Tras invertir se usan respuestas de ejecución, no reset.

## SISTEMA DE PUNTUACIÓN

Ocho dimensiones de 0–100; pesos públicos 15/10/20/15/15/10/10/5 % y privados 10/10/20/20/15/10/10/5 %, configurados en `balance.ts`. Nota = redondear(limitar(base ponderada − penalizaciones, 0, 100) × factor de cierre). Abandono/insolvencia: factor 0,35; demás cierres: 1.

Ex ante: 50 % confirmación de revisión, 25 % valor esperado normalizado y 25 % información al invertir. No utiliza el resultado del sorteo posterior. El resto de dimensiones combina coherencia, preparación, regulación/ODS, disciplina, riesgo y desempeño según los criterios mostrados al terminar. Pistas/reintentos tienen costo explícito y tope final de 8 puntos; la práctica posterior al cierre no altera la nota congelada. Textos libres no se califican automáticamente. Premios reconocen evidencias observables, no acreditan competencia oficial.

## PRESUPUESTO Y RECURSOS

Caja, compromisos, gasto y reservas conservan cuentas separadas. Elegir una alternativa no rellena el presupuesto de gestión ni los costos del cronograma V2. Calculadora cantidad × costo unitario suma al borrador. Confirmar asignación guarda categoría, descripción, cantidad, unidad y costo unitario; el informe conserva el detalle aprobado. Se permiten asignaciones parcialmente desglosadas y se rechazan detalles superiores al monto de su categoría. Quitar una partida modifica solo el borrador; el reinicio elimina detalle y presupuesto juntos. Durante ejecución, el guardado compara el detalle con la fotografía del presupuesto aprobado, aunque se haya consumido contingencia. La inversión técnica mantiene una referencia del escenario. Mantenimiento afecta confiabilidad; contingencia protege ante sobrecostos y su exceso puede reducir la nota de preparación. Planificar no gasta recursos. Préstamos, aportes condicionados y socio conservan obligaciones del motor anterior.

## EVENTOS Y CONSECUENCIAS

Se conserva semilla y realidad subyacente. Estudios precisan información; mitigación, mantenimiento, apoyo y dificultad modifican exposición/desempeño. Seleccionar respuesta muestra consecuencias; confirmar aplica costo, retraso y cambios. No se añadió un catálogo nuevo en esta entrega: se integró el existente con el expediente V2 y la puntuación.

## EVALUACIÓN EX ANTE

Flujos financieros, sociales y tras financiación separados; VPN, TIR, B/C, CAUE y recuperación, escenarios y sensibilidad existentes. La fotografía de inversión conserva supuestos y resultados esperados. La interfaz recuerda que el VPN social no es caja. Se mantiene la distinción de precios reales/nominales y casos no recuperables.

Nuevo laboratorio de costo-eficiencia: valor presente de costos a precios constantes dividido entre valor presente de personas-año atendidas. Usa un horizonte y tasa real comunes, sin tarifas ni financiación en el denominador. Un umbral exploratorio de acceso filtra alternativas junto con caja y plazo. Mantiene presupuesto de gestión; escala inversión y cronograma por tecnología. Menor costo unitario no implica igual calidad, equidad o sostenibilidad. Pendiente revisión académica externa de las simplificaciones.

## REGULACIÓN ECONÓMICA

Comparación de no intervenir y dos instrumentos; bienestar educativo con curvas simplificadas y costos. Nuevo argumento estructurado: evidencia → incentivo → efecto adverso, más justificación breve. La falla diagnosticada debe corresponder al escenario incluso cuando se elige no intervenir. La elección del instrumento tiene efectos económicos; no se declara una política universalmente correcta.

En Diagnóstico, la mesa de acuerdos permite escuchar, proponer un compromiso, financiar acompañamiento o retirarse. Máximo tres rondas; costos y tiempos explícitos. La oferta necesita escucha previa o estudio social. Un acuerdo condiciona apoyo futuro a reservar una partida concreta; al invertir, cumplir da apoyo +8/legitimidad +3 y no respaldarlo da −10/−12. Esa pérdida altera exposición social del motor. Las consecuencias se muestran antes de confirmar inversión. Reiniciar diagnóstico no borra acuerdos ni permite cobrar sus efectos otra vez. Las condiciones de los 36 actores son propias de las nueve misiones y describen evidencia de seguimiento. Se congelan al negociar; las partidas anteriores conservan reglas previas. Son educativas, no contratos oficiales.

## ODS

Los 17 ODS permanecen disponibles sin preselección. Cada elegido exige relación directa/indirecta, tipo de evidencia y texto breve. La puntuación contrasta relaciones configuradas; seleccionar objetivos no pertinentes penaliza. La tabla orientadora se muestra después de registrar argumentos V2. Los efectos físicos modelados pueden existir aunque el jugador no los identifique; se distinguen del mérito de justificar la alineación. El PND 2022–2026 sigue identificado como histórico; no se inventó un PND posterior.

## DIFICULTAD

Fácil: fondo +8 %, pistas de menor costo y menor exposición. Intermedio: fondo base. Difícil: fondo −8 %, información menos precisa y mayor exposición. Parámetros centralizados. Tras dos errores se muestra apoyo contextual; no hay adaptación oculta del presupuesto ni cambios retroactivos de eventos. Ampliar dificultad adaptativa requerirá calibración pedagógica.

Modo reto disponible: agua sin crédito (profesional) y salud con fondo reducido (experto). Cada partida conserva su configuración versionada, semilla y umbrales. La distinción exige completar sin incumplimiento, cadena de valor ≥ 80 al invertir, cobertura ≥ 50 % y nota ≥ 60. Los objetivos aparecen durante la partida y en el informe; no otorgan dinero ni puntos adicionales. Ambos retos tienen una trayectoria ganadora comprobada por el motor.

## PRUEBAS

- 136 pruebas automatizadas en 13 archivos. Incluyen nueve misiones × tres dificultades × hasta cuatro alternativas, con al menos un cierre viable por combinación, reproducción tras guardado, conservación de caja y diversidad de resultados. Añaden detalle presupuestal, perfiles de negociación y casos aplicados de aprendizaje.
- Modo reto: bloqueo de crédito, guardado, rechazo de configuración incompatible, ausencia de premio al abandonar, dos trayectorias ganadoras, informe y conservación de reglas en el contrafactual. Inicio y panel de objetivos comprobados en navegador QA.
- TypeScript verificado sin errores.
- Recorrido manual completo en QA: agua, guiado, semilla PROY-2510; diagnóstico, elección, cadena, presupuesto, cronograma, indicadores, evaluación, regulación, ODS, compromiso, cinco eventos y cierre con informe y comparación. Resultado observado en esa revisión: 80/100, mes 25 y cobertura aproximada de 79 %. La fórmula se afinó después; ese resultado histórico no se recalifica.
- Recarga e historial conservaron el resultado. Copia desde inversión conservó semilla y condiciones; reinicio de preparación dejó presupuesto vacío y evaluación/regulación pendientes, descontando 76 M y un mes. El resultado original quedó en el historial.
- Inspección visual en escritorio y viewport de 390 × 844. No equivale a una auditoría exhaustiva de accesibilidad ni a recorrer las nueve misiones manualmente.
- Negociación comprobada en pantalla: escucha y acuerdo consumieron 190 M COP y tres meses; obligación de 456 M respaldada por 500 M en gestión social; evaluación marcada para revisar. Comparador probado con teclado: subir el umbral a toda la población mostró que ninguna alternativa cumplía.
- Build de producción probado en navegador: inicio, diagnóstico, negociación específica, formulación y detalle presupuestal. 12 visitas × 5 M se conservan tras recarga; asignación insuficiente bloquea confirmación. Formulario revisado a 390 × 844; sin errores de consola observados.
- Dependencias instaladas con lockfile congelado y caché local. Compilación sin advertencia de tamaño: paquetes aproximados de 289, 299 y 378 kB (antes de gzip).
- No hay lint configurado. Las pruebas del motor no prueban duración real de 60–90 minutos, diversión ni adquisición de conocimientos.

## PENDIENTES

Piloto con estudiantes y revisión académica externa; recorrido exhaustivo por interfaz de las otras ocho misiones y todas las dificultades; calibración empírica de presupuesto, tiempo, pistas y premios. El protocolo está en `docs/PILOTO_PEDAGOGICO.md`. Las pruebas automáticas cubren el catálogo, pero no prueban aprendizaje, diversión ni cada control por interfaz. Para GitHub faltan elegir cuenta/repositorio/visibilidad, resolver la licencia de distribución y verificar el primer CI remoto; no se ha publicado.

## DEUDA TÉCNICA

App y partes del motor siguen siendo extensos. Vite ahora separa gráficos, dependencias y aplicación, sin el aviso anterior; la carga diferida de fases puede mejorar más el arranque. La validación del guardado comprueba estructura principal pero no es un esquema exhaustivo. `Scenario` y metadatos narrativos aún se mantienen en módulos separados. Parte del balance histórico permanece en el motor. No hay ESLint ni prueba E2E automatizada permanente. La analítica local cuenta prácticas y conserva decisiones, pero no mide tiempo activo ni dominio validado.

## PRÓXIMA EVOLUCIÓN

Priorizar el piloto de jugabilidad/MGA y la revisión de simplificaciones económicas. Mantener las regresiones por misión/dificultad y ampliar las pruebas por interfaz. Futuro docente/editor: utilizar Scenario + reglas de balance + validador + GameState/Outcome; mantener un solo motor, sin duplicar simulación ni usar textos libres como notas automáticas. Un reto debe fijar misión, dificultad, semilla y restricciones de manera visible; no cambiar probabilidades para forzar ganadores.
