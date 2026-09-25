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
    cash: 1.08,
    hintPenalty: 1,
    event: 0.8,
    dilemmaCost: 0.8,
    feedback: "full",
    description:
      "Orientación contextual y pistas graduales; fondo inicial +8 %. Puedes analizar antes de confirmar.",
  },
  profesional: {
    label: "Intermedio · profesional",
    cash: 1,
    hintPenalty: 2,
    event: 1,
    dilemmaCost: 1,
    feedback: "cards",
    description:
      "Sin recomendaciones de solución; pistas con mayor costo pedagógico y recursos base.",
  },
  experto: {
    label: "Difícil · experto",
    cash: 0.92,
    hintPenalty: 3,
    event: 1.25,
    dilemmaCost: 1.2,
    feedback: "score",
    description:
      "Fondo inicial −8 %, información menos precisa y mayor exposición a eventos. Ayudas a demanda.",
  },
};
export const retryFactors = [1, 0.8, 0.6];
// Diagnóstico, alternativa, preparación, evaluación, regulación/ODS,
// compromisos, ejecución y valor observado. Cada perfil suma 1.
export const scoringWeightsV2 = {
  publico: [0.15, 0.1, 0.2, 0.15, 0.15, 0.1, 0.1, 0.05],
  privado: [0.1, 0.1, 0.2, 0.2, 0.15, 0.1, 0.1, 0.05],
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
