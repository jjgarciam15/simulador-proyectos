import type { Difficulty } from "../domain/types";
export const difficultyRules: Record<
  Difficulty,
  {
    label: string;
    cash: number;
    hintPenalty: number;
    event: number;
    /** Multiplier for the money cost of dilemma choices. */
    dilemmaCost: number;
    /** How much the value-chain builder explains after confirming: reasons, wrong cards only, or score only. */
    feedback: "full" | "cards" | "score";
    description: string;
  }
> = {
  guiado: {
    label: "Fácil · guiado",
    cash: 1,
    hintPenalty: 1,
    event: 0.8,
    dilemmaCost: 0.8,
    feedback: "full",
    description:
      "Orientación contextual y pistas graduales; fondo inicial completo. Puedes analizar antes de confirmar.",
  },
  profesional: {
    label: "Intermedio · profesional",
    cash: 0.92,
    hintPenalty: 2,
    event: 1,
    dilemmaCost: 1,
    feedback: "cards",
    description:
      "Sin recomendaciones de solución; fondo inicial −8 % y pistas con mayor costo pedagógico.",
  },
  experto: {
    label: "Difícil · experto",
    cash: 0.85,
    hintPenalty: 3,
    event: 1.25,
    dilemmaCost: 1.2,
    feedback: "score",
    description:
      "Fondo inicial −15 %, información menos precisa y mayor exposición a eventos. Ayudas a demanda.",
  },
};
export const retryFactors = [1, 0.8, 0.6];
// Diagnóstico, alternativa, preparación, evaluación, regulación/ODS,
// compromisos, ejecución, valor observado y coherencia transversal.
// Iteration 2 adds a ninth dimension, transversal coherence (15 %). Each profile sums 1.
export const scoringWeightsV2 = {
  publico: [0.13, 0.08, 0.17, 0.13, 0.13, 0.08, 0.08, 0.05, 0.15],
  privado: [0.08, 0.08, 0.17, 0.17, 0.13, 0.08, 0.08, 0.06, 0.15],
};
export const dependencyRules: Record<string, number[]> = {
  nodes: [1, 2, 3, 4, 5],
  target: [1, 2, 3, 4, 5],
  objective: [2, 3, 4, 5],
  alternative: [2, 3, 4, 5],
  budget: [3, 5],
  activities: [3, 5],
  indicators: [3, 4, 5],
  assumptions: [2, 4, 5],
  policy: [3, 5],
  alignment: [5],
  study: [1, 2, 3, 4, 5],
  actor: [3, 5],
  mitigate: [3, 5],
  chain: [3, 4, 5],
  regulatory: [5],
};
/**
 * Educational regulatory lab. Harm of the market failure under no intervention = harmScale × severity
 * (severity is hidden, seeded per game, 0.3–1.4). Each instrument corrects a share of the harm and has
 * fixed costs (administration + compliance) and side effects (capture, barriers, oversight gaps).
 * Instruments within `tolerance` of the best net value are considered defensible.
 */
export const regulationBalance = {
  harmScale: 100,
  tolerance: 8,
  severity: { min: 0.3, range: 1.1 },
  /** Half-width of the severity band shown to the player, with and without a demand/market study. */
  uncertainty: { studied: 0.1, unstudied: { guiado: 0.35, profesional: 0.4, experto: 0.5 } },
  instruments: {
    none: { correction: 0, cost: 0, side: 0 },
    targeted: { correction: 0.55, cost: 35, side: 5 },
    strict: { correction: 0.85, cost: 55, side: 20 },
  } as Record<string, { correction: number; cost: number; side: number }>,
  /** Systemic consequences applied when the investment is committed. */
  consequences: {
    overRegulation: { performance: -0.05, sustainability: -3, reputation: -2 },
    needlessCost: { reputation: -3, performance: -0.01 },
    persistentFailure: { performance: -0.04, eventRisk: 0.15 },
    wrongDiagnosis: { performance: -0.03, reputation: -2 },
  },
};
/** Budget review thresholds (ratios against references of the selected alternative). */
export const budgetRules = {
  underestimate: { grave: 0.7, alert: 0.85 },
  operation: { min: 0.8, max: 1.3 },
  maintenance: { min: 0.8, max: 1.6 },
  /** Contingency as a share of the technical investment. */
  contingency: { min: 0.03, max: 0.2 },
  penalty: { grave: 20, alert: 8 },
};
/** Explicit bonuses and penalties of the final assessment (points on the 0–100 scale). */
export const adjustmentRules = {
  maxBonus: 6,
  maxPenalty: 8,
  coherenceBonus: { threshold: 80, points: 3 },
  reserveBonus: 2,
  riskBonus: 2,
  consistencyBonus: 1,
  wastePenalty: 2,
  incoherencePenalty: { threshold: 50, points: 3 },
  sdgExcessPenalty: 2,
  regulatoryPenalty: 2,
  overrunPenalty: { share: 0.1, points: 2 },
};
