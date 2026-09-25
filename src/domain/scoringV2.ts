import type { GameState, Outcome } from "./types";
import { scenarioById } from "../data/scenarios";
import { chainV2Score, actorMapScore, sdgReasonScore } from "./projectV2";
import { causalQuality, indicatorReview } from "./mga";
import { clamp } from "./finance";
import { learningPenalty } from "./questionsV2";
import { scoringWeightsV2 } from "../data/balance";
export interface AssessmentV2 {
  base: number;
  penalty: number;
  notes: string[];
  dimensions: Outcome["dimensions"];
  story: string;
}
export function regulatoryScore(g: GameState) {
  const r = g.v2!.regulatory;
  const expected =
    g.policy === "none"
      ? ["baseline", "persistence"]
      : g.policy === "strict"
        ? ["price", "barriers"]
        : ["entry", "oversight"];
  return (
    25 *
    (Number(r.evidence === "observed") +
      Number(g.failure === scenarioById(g.scenarioId).failure) +
      Number(r.incentive === expected[0]) +
      Number(r.adverse === expected[1]))
  );
}
export function scoreV2(
  g: GameState,
  observed: Outcome["dimensions"],
): AssessmentV2 {
  const s = scenarioById(g.scenarioId),
    a = s.alternatives.find((a) => a.id === g.alternative)!,
    target = g.target / s.affected;
  const activityTotal = g.activities.reduce((n, a) => n + a.cost, 0),
    reference = a.capex * target * g.assumptions.capex;
  const sufficiency = Math.min(1, activityTotal / Math.max(1, reference));
  const maintenance = Math.min(
    1,
    g.budget.maintenance / Math.max(1, a.capex * target * 0.025),
  );
  const excessReserve =
    Math.max(0, g.budget.contingency / (s.budget || 1) - 0.15) * 100;
  const budget = clamp(50 * sufficiency + 50 * maintenance - excessReserve);
  const indicators = g.indicators.length
    ? clamp(100 - indicatorReview(g).length * 20)
    : 0;
  const diagnosis =
    0.5 * causalQuality(g) +
    0.3 * actorMapScore(g) +
    0.2 * (g.target > 0 && g.target <= s.affected ? 100 : 0);
  const alternative =
    50 * Number(g.objective === "n0") +
    (50 * a.causes.filter((id) => g.nodes.includes(id)).length) /
      Math.max(1, a.causes.length);
  const expectedValue = g.snapshot
    ? clamp(
        50 +
          ((s.role === "publico"
            ? g.snapshot.expectedSocial
            : g.snapshot.expectedFinancial) /
            s.budget) *
            30,
      )
    : 0;
  const informationAtDecision = g.snapshot?.quality ?? g.quality;
  const values = [
    diagnosis,
    alternative,
    0.5 * chainV2Score(g) + 0.3 * budget + 0.2 * indicators,
    50 * Number(g.acknowledged.includes("evaluation")) +
      0.25 * expectedValue +
      0.25 * informationAtDecision,
    0.6 * regulatoryScore(g) + 0.4 * sdgReasonScore(g),
    0.5 * observed[5].value + 0.5 * observed[3].value,
    0.4 * observed[2].value + 0.3 * observed[6].value + 0.3 * observed[7].value,
    observed[1].value,
  ];
  const weights = scoringWeightsV2[s.role];
  const names = [
    "Diagnóstico y Árbol del problema",
    "Alternativa y objetivos",
    "Cadena de valor y presupuesto",
    "Evaluación ex ante",
    "Regulación y ODS",
    "Compromisos y riesgo",
    "Ejecución y servicio",
    "Valor observado",
  ];
  const dimensions = values.map((value, i) => ({
    name: names[i],
    value: clamp(value),
    weight: weights[i],
  }));
  const notes = [
    `Diagnóstico: 50 % enlaces causales, 30 % ubicación de actores y 20 % focalización válida. Matriz de actores: ${actorMapScore(g).toFixed(0)}/100.`,
    `Alternativa: 50 % correspondencia del objetivo central y 50 % causas atendidas.`,
    `Preparación: 50 % cadena (${chainV2Score(g)}), 30 % presupuesto (${budget.toFixed(0)}) y 20 % indicadores (${indicators}). Presupuesto: suficiencia de asignación y mantenimiento, con descuento por reserva superior al 15 % del fondo base.`,
    `Evaluación: 50 % revisión confirmada, 25 % valor esperado normalizado y 25 % información disponible al invertir. Los eventos posteriores no cambian esta dimensión.`,
    `Regulación: 60 % evidencia, falla, incentivo y efecto adverso (${regulatoryScore(g)}); 40 % pertinencia y evidencia ODS (${sdgReasonScore(g).toFixed(0)}). Los textos no se califican automáticamente.`,
    `Compromisos: disciplina financiera e información/riesgo, con igual peso.`,
    `Ejecución: 40 % cobertura/equidad, 30 % plazo y 30 % legitimidad.`,
    `Valor observado: beneficio social para rol público; creación de valor para privado, normalizado con la referencia de misión.`,
    `Práctica: cada pista descuenta según dificultad; cada intento adicional 0,2 puntos. Tope total: 8 puntos. La nota de cada ejercicio se informa aparte.`,
  ];
  const story = `La cobertura observada fue ${((g.outcome?.coverage ?? 0) * 100).toFixed(0)} %. La cadena de valor alcanzó ${chainV2Score(g)}/100; el presupuesto, ${budget.toFixed(0)}/100. ${g.extraCost > 0 ? "Los eventos exigieron recursos adicionales." : "No se registraron sobrecostos de eventos."} ${g.month > s.deadline ? "El cierre superó el plazo." : "El cierre ocurrió dentro del plazo disponible."}`;
  return {
    dimensions,
    base: dimensions.reduce((n, d) => n + d.value * d.weight, 0),
    penalty: learningPenalty(g),
    notes,
    story,
  };
}
