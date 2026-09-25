import type { GameState } from "./types";
import { riskLevel, available } from "./engine";

/**
 * Animated characters (V2.4). The state is derived from the game so the animation always has a purpose:
 * it signals what the player should notice. Roles follow the stage: Tutor, Analista, Regulador, Evaluador, Comunidad.
 */
export type Mood = "idle" | "thinking" | "speaking" | "concerned" | "positive" | "warning" | "celebrating";
export type CharacterRole = "Tutor" | "Analista" | "Comunidad" | "Regulador" | "Evaluador";
export const moodLabel: Record<Mood, string> = {
  idle: "atento",
  thinking: "pensando",
  speaking: "hablando",
  concerned: "preocupado",
  positive: "satisfecho",
  warning: "alerta",
  celebrating: "celebrando",
};
export function roleFor(phase: number): CharacterRole {
  return phase <= 1 ? "Tutor" : phase <= 3 ? "Analista" : phase === 4 ? "Regulador" : phase === 5 ? "Evaluador" : "Comunidad";
}
export function moodFor(g: GameState, previous?: GameState): Mood {
  if (g.outcome) return g.outcome.score >= 70 ? "celebrating" : g.outcome.score >= 45 ? "positive" : "concerned";
  if (g.pendingEvent || g.v2?.pendingDilemma) return "warning";
  const risk = riskLevel(g),
    budget = g.v2?.initialCash ?? g.cash,
    cashShare = budget > 0 ? available(g) / budget : 1;
  if (risk >= 55 || cashShare < 0.1) return "concerned";
  if (previous && previous.id === g.id) {
    if (g.phase > previous.phase) return "positive";
    if (riskLevel(previous) - risk >= 3) return "positive";
    if (g.journal.length > previous.journal.length) return "speaking";
  }
  if (g.phase === 3 || g.phase === 4) return "thinking";
  return "idle";
}
