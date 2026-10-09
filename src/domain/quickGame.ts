import type { GameState } from "./types";
import { phases } from "./types";
import { createGameV2 } from "./engine";
import { confirmReviews, next, referenceStage, settle } from "./demo";

/**
 * Partida rápida: the player picks the stages (modules) to practise and the rest are solved with the
 * engine's reference answers, the same ones the presentation mode shows. Ex post (stage 8) always closes
 * the game with its results. Only the chosen stages count in the grade (domain/scoringV2.ts).
 */
export const quickModules = [
  { phase: 0, name: phases[0], topic: "Árbol del problema, actores, estudios y focalización" },
  { phase: 1, name: phases[1], topic: "Objetivos y elección de la alternativa" },
  { phase: 2, name: phases[2], topic: "Planeación: cadena de valor, presupuesto, cronograma e indicadores" },
  { phase: 3, name: phases[3], topic: "Valoración de impactos, flujos, VPN y RPC" },
  { phase: 4, name: phases[4], topic: "Regulación económica, Ley 388 de 1997 y ODS" },
  { phase: 5, name: phases[5], topic: "Comité evaluador y compromiso de la inversión" },
  { phase: 6, name: phases[6], topic: "Eventos de ejecución y adaptación" },
] as const;

/** Sorted, unique stages between 0 and 6; null when the list is not a valid quick selection. */
export function quickSelection(stages: unknown): number[] | null {
  if (!Array.isArray(stages)) return null;
  const valid = [...new Set(stages)].filter((p): p is number => Number.isInteger(p) && p >= 0 && p <= 6).sort((a, b) => a - b);
  return valid.length && valid.length === stages.length ? valid : null;
}
export const isQuick = (g: GameState | null | undefined) => !!g?.v2?.quick;
/** True when the stage is solved automatically in this quick game. */
export const autoStage = (g: GameState, phase: number) => !!g.v2?.quick && phase < 7 && !g.v2.quick.stages.includes(phase);

/**
 * Solves every automatic stage from the current one until the next stage the player chose (or the results).
 * A stage already confirmed is only confirmed again, unless it went stale. Dilemmas that open on an automatic stage take the
 * reference choice. The function is pure: it returns a new state built with `act`.
 */
export function autoAdvance(g: GameState): GameState {
  for (let guard = 0; guard < 16 && !g.outcome && autoStage(g, g.phase); guard++) {
    const phase = g.phase;
    g = settle(g);
    if (phase < 5) {
      // Solved again when it was never solved, when a later decision sent it to review (for example, a new
      // alternative) or when its ex ante confirmation was cleared (exploring another strategy clears it).
      const stale = !g.v2!.completed.includes(phase) || !!g.v2!.reviews[phase]?.length || (phase === 3 && !g.acknowledged.includes("evaluation"));
      if (stale) g = referenceStage(g, phase);
      g = next(confirmReviews(g));
    } else g = referenceStage(phase === 5 ? confirmReviews(g) : g, phase);
    if (g.phase === phase && !g.outcome) break;
  }
  return g.outcome ? g : confirmAutoReviews(g);
}

/**
 * The player cannot open automatic stages, so when only those are waiting for review (for example, a risk
 * mitigated while deciding reopens the evaluation) they are confirmed again without changes.
 */
export function confirmAutoReviews(g: GameState): GameState {
  if (!g.v2?.quick || g.snapshot) return g;
  const pending = Object.entries(g.v2.reviews)
    .filter(([p, r]) => r.length && Number(p) < g.phase)
    .map(([p]) => Number(p));
  return pending.length && pending.every((p) => autoStage(g, p)) ? confirmReviews(g) : g;
}

/** New quick game: the chosen stages are played, the rest are solved before the player arrives. */
export function quickGame(base: GameState, stages: number[]): GameState {
  const chosen = quickSelection(stages);
  if (!chosen) throw new Error("Elige al menos un módulo para la partida rápida.");
  if (chosen.length === 7) return base;
  const g = structuredClone(base);
  g.v2!.quick = { stages: chosen };
  return autoAdvance(g);
}
export function createQuickGame(id: string, d: GameState["difficulty"], seed: string, mode: "aprendizaje" | "evaluacion", stages: number[]) {
  return quickGame(createGameV2(id, d, seed, mode), stages);
}
