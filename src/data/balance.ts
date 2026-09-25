import type { Difficulty } from "../domain/types";
export const difficultyRules: Record<
  Difficulty,
  {
    label: string;
    cash: number;
    hintPenalty: number;
    event: number;
    description: string;
  }
> = {
  guiado: {
    label: "Fácil · guiado",
    cash: 1.08,
    hintPenalty: 1,
    event: 0.8,
    description:
      "Orientación contextual y pistas graduales; fondo inicial +8 %. Puedes analizar antes de confirmar.",
  },
  profesional: {
    label: "Intermedio · profesional",
    cash: 1,
    hintPenalty: 2,
    event: 1,
    description:
      "Sin recomendaciones de solución; pistas con mayor costo pedagógico y recursos base.",
  },
  experto: {
    label: "Difícil · experto",
    cash: 0.92,
    hintPenalty: 3,
    event: 1.25,
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
