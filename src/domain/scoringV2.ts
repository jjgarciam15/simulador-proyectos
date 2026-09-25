import type { GameState, Outcome } from "./types";
import { scenarioById } from "../data/scenarios";
import { chainV2Score, actorMapScore, sdgReasonScore } from "./projectV2";
import { causalQuality, indicatorReview } from "./mga";
import { clamp } from "./finance";
import { learningPenalty } from "./questionsV2";
import { scoringWeightsV2 } from "../data/balance";
import { regulatoryLabScore } from "./regulationLab";
import { adjustments, coherenceMatrix, transversalCoherence } from "./coherence";
import { budgetReview } from "./budgetReview";
/** The plan as approved: budget-dependent reviews use it, while execution facts come from the final state. */
function approvedPlan(g: GameState): GameState {
  const d = g.snapshot?.decisionState;
  if (!d || !g.v2) return g;
  return {
    ...d,
    snapshot: g.snapshot,
    extraCost: g.extraCost,
    mitigations: g.mitigations,
    v2: { ...d.v2!, eventRisk: g.v2.eventRisk, changes: g.v2.changes },
  };
}
export interface AssessmentV2 {
  base: number;
  penalty: number;
  notes: string[];
  dimensions: Outcome["dimensions"];
  story: string;
  /** Explicit bonuses, capped (points added to the base). */
  bonus?: number;
  adjustments?: ReturnType<typeof adjustments>;
  coherence?: ReturnType<typeof coherenceMatrix>;
  budgetFindings?: ReturnType<typeof budgetReview>["findings"];
}
export function regulatoryScore(g: GameState) {
  const r = g.v2!.regulatory;
  // Games that built the causal puzzle are scored with the regulatory lab (chain + proportionality).
  if (r.chain) return Math.round(regulatoryLabScore(g));
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
  const plan = approvedPlan(g),
    review = budgetReview(plan);
  // Half the classic sufficiency/maintenance check, half the explainable review (waste, contingency, commitments…).
  const budget = clamp(
    0.5 * (50 * sufficiency + 50 * maintenance - excessReserve) +
      0.5 * review.score,
  );
  const matrix = coherenceMatrix(plan),
    transversal = transversalCoherence(plan),
    adjust = adjustments(plan);
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
    transversal,
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
    "Coherencia transversal",
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
    `Coherencia transversal: promedio de ${matrix.length} relaciones entre etapas (problema, alternativa, cadena, presupuesto, evaluación, regulación, ODS y actores).`,
    `Práctica: cada pista descuenta según dificultad; cada intento adicional 0,2 puntos. Tope total: 8 puntos. La nota de cada ejercicio se informa aparte.`,
    `Ajustes: bonificaciones +${adjust.bonus} (tope 6) y penalizaciones −${adjust.penalty} (tope 8), cada una con su razón.`,
  ];
  const story = projectStory(g, plan, review, transversal);
  return {
    dimensions,
    base: dimensions.reduce((n, d) => n + d.value * d.weight, 0),
    penalty: learningPenalty(g) + adjust.penalty,
    bonus: adjust.bonus,
    adjustments: adjust,
    coherence: matrix,
    budgetFindings: review.findings,
    notes,
    story,
  };
}

/** Rule-based synthesis of the game. Every sentence comes from an observed fact, never from random text. */
export function projectStory(
  g: GameState,
  plan: GameState,
  review: ReturnType<typeof budgetReview>,
  transversal: number,
) {
  const s = scenarioById(g.scenarioId),
    coverage = (g.outcome?.coverage ?? 0) * 100,
    parts: string[] = [];
  if (g.outcome && ["abandonado", "insolvencia"].includes(g.outcome.status))
    parts.push("El proyecto se cerró sin completar la ejecución, por lo que no entregó el servicio previsto.");
  else
    parts.push(
      coverage >= 70
        ? `El proyecto consiguió una cobertura alta (${coverage.toFixed(0)} %).`
        : coverage >= 45
          ? `El proyecto alcanzó una cobertura intermedia (${coverage.toFixed(0)} %).`
          : `La cobertura fue baja (${coverage.toFixed(0)} %).`,
    );
  const tags = new Set(review.findings.map((f) => f.tag));
  if (tags.has("subestimacion"))
    parts.push("El presupuesto quedó ajustado: algunas partidas estaban subestimadas.");
  else if (tags.has("desperdicio"))
    parts.push("Parte del presupuesto quedó inmovilizado en reservas o partidas sobredimensionadas.");
  else parts.push("El presupuesto fue suficiente y equilibrado.");
  const cons = g.v2?.consequences ?? [];
  const regulatory = cons.find((c) => c.kind === "sistémica" && c.title !== "Regulación proporcional");
  if (regulatory) parts.push(`En regulación, ${regulatory.title.charAt(0).toLowerCase() + regulatory.title.slice(1)} afectó la implementación.`);
  else if (cons.some((c) => c.title === "Regulación proporcional")) parts.push("La estrategia regulatoria fue proporcional a la evidencia.");
  const delayed = cons.filter((c) => c.kind === "diferida");
  if (delayed.length)
    parts.push(`${delayed.length} decisión(es) previas tuvieron consecuencias diferidas al invertir.`);
  if (g.extraCost > 0)
    parts.push(
      plan.budget.contingency > 0
        ? "Los eventos de ejecución exigieron recursos; la contingencia amortiguó parte del impacto."
        : "Los eventos de ejecución exigieron recursos y no había contingencia para absorberlos.",
    );
  parts.push(g.month > s.deadline ? `El cierre superó el plazo de ${s.deadline} meses.` : "El cierre ocurrió dentro del plazo.");
  parts.push(
    transversal >= 75
      ? "Las etapas se sostuvieron entre sí: la coherencia transversal fue alta."
      : transversal >= 50
        ? "La coherencia entre etapas fue parcial."
        : "Las decisiones de distintas etapas se contradijeron con frecuencia.",
  );
  return parts.join(" ");
}
