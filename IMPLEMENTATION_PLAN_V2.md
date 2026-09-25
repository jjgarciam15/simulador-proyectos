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

_En curso._
