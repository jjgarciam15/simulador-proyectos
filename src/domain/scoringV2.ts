import type { GameState, Outcome } from "./types";
import { scenarioById } from "../data/scenarios";
import { chainV2Score, actorMapScore, sdgReasonScore } from "./projectV2";
import { causalQuality, indicatorReview } from "./mga";
import { treeReview } from "./problemTree";
import { clamp } from "./finance";
import type { ScorePart } from "./types";
import { part, practiceScore, negotiationScore, scaleParts, sumParts } from "./scoreParts";
import { learningPenalty } from "./questionsV2";
import { scoringWeightsV2 } from "../data/balance";
import { regulatoryLabScore } from "./regulationLab";
import { currentTerritory, encajeScore, plusvaliaScore, prediosScore, territoryActive, territoryScore } from "./territory";
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
/**
 * Regulación, territorio y ODS. From 3.0 the economic regulation shares the dimension with the territorial
 * puzzles of the Ley 388 de 1997 (encaje, predios, plusvalía); older games keep 60 % regulation and 40 % ODS.
 */
export function regulationParts(g: GameState): ScorePart[] {
  if (!territoryActive(g)) return [part("Regulación: diagnóstico y proporcionalidad", regulatoryScore(g), 0.6), part("ODS justificados", sdgReasonScore(g), 0.4)];
  const t = currentTerritory(g);
  return [
    part("Regulación económica: diagnóstico y proporcionalidad", regulatoryScore(g), 0.4),
    part("Ley 388: encaje en el ordenamiento", encajeScore(g, t?.encaje), 0.15),
    part("Ley 388: ruta de adquisición de predios", prediosScore(g, t?.predios), 0.15),
    part("Ley 388: participación en la plusvalía", plusvaliaScore(g, t?.plusvalia), 0.1),
    part("ODS justificados", sdgReasonScore(g), 0.2),
  ];
}
function regulationNote(g: GameState) {
  return territoryActive(g)
    ? `Regulación, territorio y ODS: 40 % regulación económica (${regulatoryScore(g)}); 40 % ordenamiento territorial con la Ley 388 de 1997 (${territoryScore(g)}/100: encaje en el plan, ruta predial y plusvalía); 20 % pertinencia y evidencia ODS (${sdgReasonScore(g).toFixed(0)}).`
    : `Regulación: 60 % evidencia, falla, incentivo y efecto adverso (${regulatoryScore(g)}); 40 % pertinencia y evidencia ODS (${sdgReasonScore(g).toFixed(0)}).`;
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
  const focal = g.target > 0 && g.target <= s.affected ? 100 : 0;
  // With the player-built tree: 35 % causal links, 25 % tree construction, 25 % actors, 15 % targeting.
  // Negotiating with actors adds a 10 % part (the others keep their proportions).
  const negotiation = negotiationScore(g),
    diagnosisCore = g.v2?.tree
      ? [part("Enlaces causales (laboratorio MGA)", causalQuality(g), 0.35), part("Construcción del Árbol del problema", treeReview(g).score, 0.25), part("Mapa de actores", actorMapScore(g), 0.25), part("Focalización de la población", focal, 0.15)]
      : [part("Enlaces causales (laboratorio MGA)", causalQuality(g), 0.5), part("Mapa de actores", actorMapScore(g), 0.3), part("Focalización de la población", focal, 0.2)];
  const parts: ScorePart[][] = [
    negotiation === null ? diagnosisCore : [...scaleParts(diagnosisCore, 0.9), part("Negociación con actores", negotiation, 0.1)],
    [
      part("Objetivo central del Árbol de objetivos", 100 * Number(g.objective === "n0"), 0.5),
      part("Causas que atiende la alternativa", (100 * a.causes.filter((id) => g.nodes.includes(id)).length) / Math.max(1, a.causes.length), 0.5),
    ],
  ];
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
  parts.push(
    [part("Cadena de valor", chainV2Score(g), 0.5), part("Presupuesto", budget, 0.3), part("Indicadores", indicators, 0.2)],
    [part("Revisión de la evaluación ex ante", 100 * Number(g.acknowledged.includes("evaluation")), 0.5), part("Valor esperado al invertir", expectedValue, 0.25), part("Información disponible al invertir", informationAtDecision, 0.25)],
    regulationParts(g),
    [part(observed[5].name, observed[5].value, 0.5), part(observed[3].name, observed[3].value, 0.5)],
    [part(observed[2].name, observed[2].value, 0.4), part(observed[6].name, observed[6].value, 0.3), part(observed[7].name, observed[7].value, 0.3)],
    [part(observed[1].name, observed[1].value, 1)],
    [part("Coherencia transversal", transversal, 1)],
  );
  const values = parts.map(sumParts);
  const weights = scoringWeightsV2[s.role];
  const names = [
    "Diagnóstico y Árbol del problema",
    "Alternativa y objetivos",
    "Cadena de valor y presupuesto",
    "Evaluación ex ante",
    "Regulación, territorio y ODS",
    "Compromisos y riesgo",
    "Ejecución y servicio",
    "Valor observado",
    "Coherencia transversal",
  ];
  let dimensions = values.map((value, i) => ({
    name: names[i],
    value: clamp(value),
    weight: weights[i],
    parts: parts[i],
  }));
  const notes = [
    g.v2?.tree
      ? `Diagnóstico: 35 % enlaces causales, 25 % construcción del Árbol del problema (${treeReview(g).score}/100: nivel y de qué causa o efecto cuelga cada tarjeta), 25 % ubicación de actores y 15 % focalización válida. Matriz de actores: ${actorMapScore(g).toFixed(0)}/100.`
      : `Diagnóstico: 50 % enlaces causales, 30 % ubicación de actores y 20 % focalización válida. Matriz de actores: ${actorMapScore(g).toFixed(0)}/100.`,
    `Alternativa: 50 % correspondencia del objetivo central y 50 % causas atendidas.`,
    `Preparación: 50 % cadena (${chainV2Score(g)}), 30 % presupuesto (${budget.toFixed(0)}) y 20 % indicadores (${indicators}). Presupuesto: suficiencia de asignación y mantenimiento, con descuento por reserva superior al 15 % del fondo base.`,
    `Evaluación: 50 % revisión confirmada, 25 % valor esperado normalizado y 25 % información disponible al invertir. Los eventos posteriores no cambian esta dimensión.`,
    regulationNote(g),
    `Compromisos: disciplina financiera e información/riesgo, con igual peso.`,
    `Ejecución: 40 % cobertura/equidad, 30 % plazo y 30 % legitimidad.`,
    `Valor observado: beneficio social para rol público; creación de valor para privado, normalizado con la referencia de misión.`,
    `Coherencia transversal: promedio de ${matrix.length} relaciones entre etapas (problema, alternativa, cadena, presupuesto, evaluación, regulación, ODS y actores).`,
    `Práctica: cada pista descuenta según dificultad; cada intento adicional 0,2 puntos. Tope total: 8 puntos. La nota de cada ejercicio se informa aparte.`,
    `Ajustes: bonificaciones +${adjust.bonus} (tope 6) y penalizaciones −${adjust.penalty} (tope 8), cada una con su razón.`,
  ];
  const v3 = plan.v2?.v22 ? scoreV3Parts(g, plan, parts, transversal) : null;
  if (v3) {
    dimensions = v3.dimensions;
    notes.splice(0, 10, ...v3.notes);
  }
  const story = projectStory(g, plan, review, transversal);
  return {
    dimensions,
    base: dimensions.reduce((n, d) => n + d.value * d.weight, 0),
    // V3 grades the practice as its own dimension (hints and retries are inside each question's score).
    penalty: (v3 ? 0 : learningPenalty(g)) + adjust.penalty,
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
  const regulatory = cons.find((c) => c.kind === "sistémica" && c.area !== "territorio" && c.title !== "Regulación proporcional");
  const territorial = cons.filter((c) => c.area === "territorio");
  if (territorial.some((c) => c.title !== "Ordenamiento territorial en regla"))
    parts.push(`En el territorio (Ley 388 de 1997): ${territorial.filter((c) => c.title !== "Ordenamiento territorial en regla").map((c) => c.title.charAt(0).toLowerCase() + c.title.slice(1)).join("; ")}.`);
  else if (territorial.length) parts.push("El sitio, los predios y la plusvalía cumplieron la Ley 388 de 1997.");
  if (regulatory) parts.push(`En regulación: ${regulatory.title.charAt(0).toLowerCase() + regulatory.title.slice(1)}, con efectos sobre la implementación.`);
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

import { scoringWeightsV3 } from "../data/balance";
import { profileOf, moduleEnabled } from "../data/missionProfiles";
import { objectivesScore, impactReview, valuationSummary } from "./valuation";
import { missionFlowCase } from "./missionFlow";
import { detectEconomicErrors, detectFlowErrors, errorScore } from "./flows";
import { committeeScore } from "./committee";
import { traceability } from "./traceability";

/** V2.2 flows score of the approved plan: the player's rows compared with the case (error detector). */
export function flowScores(plan: GameState) {
  const v = plan.v2?.v22,
    c = missionFlowCase(plan);
  if (!v || !c) return { financial: 0, economic: 0 };
  return {
    financial: v.flow ? errorScore(detectFlowErrors(c, v.flow.rows)) * (v.flow.builtFor === plan.alternative ? 1 : 0.5) : 0,
    economic: v.economic && v.flow ? errorScore(detectEconomicErrors(c, v.flow.rows, v.economic.rows, v.economic.benefits)) * (v.economic.builtFor === plan.alternative ? 1 : 0.5) : 0,
  };
}
function scoreV3Parts(g: GameState, plan: GameState, v2: ScorePart[][], transversal: number) {
  const s = scenarioById(g.scenarioId),
    on = (m: Parameters<typeof moduleEnabled>[1]) => moduleEnabled(g.scenarioId, m),
    impacts = impactReview(plan).score * (plan.v2?.v22?.impacts?.builtFor === plan.alternative ? 1 : 0.5),
    valuation = valuationSummary(plan).score,
    flows = flowScores(plan),
    trace = traceability(plan),
    committee = committeeScore(plan),
    objectives = objectivesScore(plan),
    practice = practiceScore(g);
  const parts: ScorePart[][] = [
    v2[0],
    [...scaleParts(v2[1], 0.6), part("Objetivos general y específicos", objectives, 0.4)],
    v2[2],
    on("valuation") ? [part("Clasificación de efectos e impactos", impacts, 0.4), part("Valoración económica de impactos", valuation, 0.6)] : [part("Clasificación de efectos e impactos", impacts, 1)],
    on("economicFlow") ? [part("Flujo financiero", flows.financial, 0.5), part("Flujo económico con RPC", flows.economic, 0.5)] : [part("Flujo financiero", flows.financial, 1)],
    v2[3],
    v2[4],
    v2[5],
    v2[6],
    v2[7],
    [part("Coherencia transversal", transversal, 0.6), part("Trazabilidad del proyecto", trace.score, 0.4)],
    [part("Respuestas al comité evaluador", committee, 1)],
    [part(`Práctica de conceptos (${practice.answered} de ${practice.total} ejercicios)`, practice.score, 1)],
  ];
  const values = parts.map(sumParts);
  const names = [
    "Diagnóstico y Árbol del problema",
    "Alternativa y objetivos",
    "Cadena de valor y presupuesto",
    "Efectos, impactos y valoración",
    "Flujos, VPN y RPC",
    "Evaluación ex ante",
    "Regulación, territorio y ODS",
    "Compromisos y riesgo",
    "Ejecución y servicio",
    "Valor observado",
    "Coherencia y trazabilidad",
    "Comité evaluador",
    "Práctica de conceptos",
  ];
  const profile = profileOf(g.scenarioId),
    raw = scoringWeightsV3[s.role].map((w, i) => w * (profile.weights?.[names[i]] ?? 1) * (i === 11 && !on("committee") ? 0 : 1)),
    total = raw.reduce((n, w) => n + w, 0);
  const dimensions = values.map((value, i) => ({ name: names[i], value: clamp(value), weight: raw[i] / total, parts: parts[i] }));
  const notes = [
    g.v2?.tree
      ? `Diagnóstico: 35 % enlaces causales, 25 % construcción del Árbol del problema (${treeReview(g).score}/100: nivel y de qué causa o efecto cuelga cada tarjeta), 25 % ubicación de actores y 15 % focalización válida${negotiationScore(g) === null ? "" : "; si negociaste, la negociación pesa 10 % y el resto conserva sus proporciones"}.`
      : "Diagnóstico: 50 % enlaces causales, 30 % ubicación de actores y 20 % focalización válida.",
    `Alternativa y objetivos: 60 % correspondencia de objetivo y causas; 40 % objetivos general y específicos (${objectives.toFixed(0)}/100).`,
    "Preparación: 50 % cadena de valor, 30 % presupuesto (suficiencia, mantenimiento y diagnóstico) y 20 % indicadores.",
    on("valuation")
      ? `Efectos e impactos: 40 % clasificación (${impacts.toFixed(0)}); 60 % valoración (${valuation}): idoneidad del método, medición correcta, impactos negativos incluidos y ausencia de doble conteo.`
      : `Efectos e impactos: clasificación (${impacts.toFixed(0)}). La valoración no aplica en esta misión.`,
    on("economicFlow")
      ? `Flujos: 50 % flujo financiero (${flows.financial.toFixed(0)}) y 50 % flujo económico con RPC (${flows.economic.toFixed(0)}); cada error grave resta 12 puntos y cada alerta 5.`
      : `Flujos: flujo financiero (${flows.financial.toFixed(0)}); cada error grave resta 12 puntos y cada alerta 5.`,
    "Evaluación: 50 % revisión confirmada, 25 % valor esperado normalizado y 25 % información disponible al invertir.",
    regulationNote(g),
    "Compromisos: disciplina financiera e información/riesgo, con igual peso.",
    "Ejecución: 40 % cobertura/equidad, 30 % plazo y 30 % legitimidad.",
    "Valor observado: beneficio social para rol público; creación de valor para privado.",
    `Coherencia y trazabilidad: 60 % coherencia transversal (${transversal.toFixed(0)}) y 40 % trazabilidad (${trace.score}, ${trace.gaps.length} vacío(s)).`,
    on("committee") ? `Comité evaluador: ${committee}/100 en preguntas derivadas de tu partida.` : "Comité evaluador: no aplica en esta misión.",
    `Práctica de conceptos: promedio de los ${practice.total} ejercicios de la partida (${practice.answered} respondidos; los no respondidos cuentan 0). Cada pista y cada intento extra ya descuentan dentro del ejercicio.`,
  ];
  return { dimensions, notes };
}
