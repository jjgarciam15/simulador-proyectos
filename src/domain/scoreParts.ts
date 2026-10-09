import type { GameState, Outcome, ScorePart } from "./types";
import { questionsV2 } from "./questionsV2";
import { negotiationCommitments } from "./negotiations";
import { clamp } from "./finance";

/**
 * Puntuación integral: helpers that turn every activity of the game into scored parts.
 * A dimension's value is the weighted sum of its parts, so the breakdown always adds up to the grade.
 */
export const part = (name: string, value: number, share: number): ScorePart => ({ name, value: clamp(value), share });
export const sumParts = (parts: ScorePart[]) => parts.reduce((n, p) => n + p.value * p.share, 0);
/** Same parts scaled to a share of a larger dimension. */
export const scaleParts = (parts: ScorePart[], factor: number) => parts.map((p) => ({ ...p, share: p.share * factor }));

/**
 * Práctica de conceptos: average score of every practice question answerable before closing (an unanswered question counts 0).
 * Each question's score already discounts hints and extra attempts.
 */
export function practiceScore(g: GameState) {
  // Ex post questions (stage 8) open after the grade is computed, so they never count.
  // In a quick game only the exercises of the chosen modules count.
  const quick = g.v2?.quick?.stages,
    qs = questionsV2(g).filter((q) => q.phase < 7 && (!quick || quick.includes(q.phase))),
    done = g.v2?.assessments ?? {};
  if (!qs.length) return { score: 0, answered: 0, total: 0 };
  const answered = qs.filter((q) => done[q.id]?.choices.length).length;
  return { score: qs.reduce((n, q) => n + (done[q.id]?.score ?? 0), 0) / qs.length, answered, total: qs.length };
}

/**
 * Negociación con actores (only when the player negotiated): an agreement honoured in the budget is worth 100,
 * an agreement left without funding 25, closing without agreement 60 (walking away can be legitimate) and an open table 50.
 */
export function negotiationScore(g: GameState) {
  const records = Object.entries(g.v2?.negotiations ?? {});
  if (!records.length) return null;
  const funded = new Map(negotiationCommitments(g).map((c) => [c.id, c.funded]));
  const values = records.map(([id, r]) => (r.status === "acuerdo" ? (funded.get(id) ? 100 : 25) : r.status === "cerrado" ? 60 : 50));
  return values.reduce((n, v) => n + v, 0) / values.length;
}

/** One row per scored activity, with its weight in the final grade and the points it contributed. */
export function scoreBreakdown(dimensions: Outcome["dimensions"]) {
  return dimensions.flatMap((d) =>
    (d.parts?.length ? d.parts : [part(d.name, d.value, 1)]).map((p) => ({
      dimension: d.name,
      activity: p.name,
      value: p.value,
      weight: d.weight * p.share,
      points: d.weight * p.share * p.value,
    })),
  );
}
