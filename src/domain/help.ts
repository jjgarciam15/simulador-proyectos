import type { GameState } from "./types";
import { difficultyRules } from "../data/balance";

/**
 * Central help policy.
 * Aprendizaje: immediate feedback (detail by difficulty), hints, visible formulas and library.
 * Evaluación (modo examen): decisions are recorded, feedback is deferred to the final result, hints are limited.
 */
export function helpPolicy(g: GameState) {
  const mode = g.v2?.v22?.mode ?? "aprendizaje",
    detail = difficultyRules[g.difficulty].feedback,
    exam = mode === "evaluacion";
  return {
    mode,
    exam,
    /** Show right/wrong right after confirming a builder. */
    immediate: !exam,
    /** Level of explanation when feedback is shown. */
    detail: exam ? ("score" as const) : detail,
    /** Formula inspection is always allowed: it explains calculations, not answers. */
    formulas: true,
    /** Guided hints inside builders (e.g. suggested RPC category) only while learning in easy mode. */
    guidedHints: !exam && g.difficulty === "guiado",
    maxHints: exam ? 1 : 3,
    /** Coherence indicator detail: hidden in exam mode, reduced in hard mode. */
    coherenceIndicator: exam ? ("oculto" as const) : g.difficulty === "experto" ? ("nivel" as const) : ("detalle" as const),
  };
}
