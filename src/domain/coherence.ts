import { gameActors } from "./actors";
import type { GameState } from "./types";
import { scenarioById } from "../data/scenarios";
import { adjustmentRules as A } from "../data/balance";
import { clamp } from "./finance";
import { chainV2Score, sdgReasonScore } from "./projectV2";
import { budgetReview } from "./budgetReview";
import { recommendedPolicies } from "./regulationLab";

export interface CoherenceLink {
  pair: string;
  value: number;
  reason: string;
}
/**
 * Coherencia transversal: evaluates whether decisions in different stages support each other.
 * Each link is 0–100 and carries the reason, so the player can see why coherence was lost.
 */
export function coherenceMatrix(g: GameState): CoherenceLink[] {
  const s = scenarioById(g.scenarioId),
    a = s.alternatives.find((a) => a.id === g.alternative);
  if (!a) return [];
  const causes = a.causes.filter((id) => g.nodes.includes(id)).length / Math.max(1, a.causes.length),
    problemAlt = clamp(50 * Number(g.objective === "n0") + 50 * causes);
  const chainPending = (g.v2?.reviews[2] ?? []).some((r) => r.includes("alternativa")),
    chain = chainV2Score(g) * (chainPending ? 0.5 : 1);
  const review = budgetReview(g),
    chainBudgetIssues = review.findings.filter((f) => f.topic === "Coherencia con la cadena" || f.topic === "Inversión técnica").filter((f) => f.level !== "ok").length,
    chainBudget = clamp(100 - chainBudgetIssues * 30);
  const evaluated = g.acknowledged.includes("evaluation") || !!g.snapshot,
    budgetEval = evaluated ? (review.findings.some((f) => f.tag === "inviable") ? 50 : 100) : 30;
  const rec = recommendedPolicies(g),
    diagnosisOk = g.failure === s.failure || (g.policy === "none" && g.failure === "Ninguna falla suficiente" && rec.includes("none")),
    regulation = g.failure ? clamp(50 * Number(diagnosisOk) + 50 * Number(rec.includes(g.policy))) : 0;
  const sdg = sdgReasonScore(g);
  const keyActors = gameActors(g).filter((x) => x.power >= 60 && (x.interest >= 60 || (!!g.actorProfiles && !x.government && x.position < 0))),
    engaged = keyActors.filter((x) => ["consultar", "involucrar", "negociar"].includes(g.actorActions[x.id]) || g.v2?.negotiations?.[x.id]).length,
    actors = keyActors.length ? (100 * engaged) / keyActors.length : 100;
  return [
    { pair: "Problema ↔ alternativa", value: problemAlt, reason: `Objetivo central ${g.objective === "n0" ? "correcto" : "desalineado"}; la alternativa atiende ${(causes * 100).toFixed(0)} % de sus causas en tu Árbol del problema.` },
    { pair: "Alternativa ↔ cadena de valor", value: chain, reason: chainPending ? "La cadena se construyó con otra alternativa y no se revisó." : `La cadena alcanza ${chainV2Score(g)}/100 con la alternativa actual.` },
    { pair: "Cadena ↔ presupuesto", value: chainBudget, reason: chainBudgetIssues ? `${chainBudgetIssues} hallazgo(s): lo que la cadena promete no está financiado.` : "Lo que la cadena promete está financiado." },
    { pair: "Presupuesto ↔ evaluación", value: budgetEval, reason: evaluated ? "La evaluación ex ante se confirmó con el presupuesto vigente." : "El presupuesto cambió y la evaluación no se volvió a confirmar." },
    { pair: "Problema ↔ regulación", value: regulation, reason: !g.failure ? "Sin diagnóstico regulatorio." : `${diagnosisOk ? "Diagnóstico coherente" : "Diagnóstico distinto de la falla observada"}; instrumento ${rec.includes(g.policy) ? "proporcional a la evidencia" : "desproporcionado frente a la severidad real"}.` },
    { pair: "Proyecto ↔ ODS", value: sdg, reason: `Pertinencia y evidencia de los ODS seleccionados: ${sdg.toFixed(0)}/100.` },
    { pair: "Actores ↔ estrategia", value: actors, reason: keyActors.length ? `${engaged} de ${keyActors.length} actores clave (alto poder con alto interés${g.actorProfiles ? " o en contra del proyecto" : ""}) recibieron consulta, involucramiento o negociación.` : "No hay actores de alto poder e interés." },
  ];
}
export function transversalCoherence(g: GameState) {
  const m = coherenceMatrix(g);
  return m.length ? m.reduce((n, l) => n + l.value, 0) / m.length : 0;
}
export interface Adjustment {
  label: string;
  points: number;
  reason: string;
}
/** Explicit, capped bonuses and penalties. Every entry says why it was applied. */
export function adjustments(g: GameState) {
  const s = scenarioById(g.scenarioId),
    coherence = transversalCoherence(g),
    review = budgetReview(g),
    bonuses: Adjustment[] = [],
    penalties: Adjustment[] = [];
  if (coherence >= A.coherenceBonus.threshold)
    bonuses.push({ label: "Coherencia", points: A.coherenceBonus.points, reason: `Coherencia transversal de ${coherence.toFixed(0)}/100.` });
  const reserveOk = review.findings.some((f) => f.topic === "Contingencia" && f.level === "ok");
  if (reserveOk && g.snapshot)
    bonuses.push({ label: "Reserva adecuada", points: A.reserveBonus, reason: "La contingencia quedó dentro del rango prudente al invertir." });
  if ((g.v2?.eventRisk ?? 0) <= 0 && g.mitigations.length > 0)
    bonuses.push({ label: "Gestión de riesgo", points: A.riskBonus, reason: "Mitigaste riesgos y no acumulaste exposición sistémica adicional." });
  const altChanges = (g.v2?.changes ?? []).filter((c) => c.action === "alternative").length;
  if (g.snapshot && altChanges <= 1 && coherence >= 60)
    bonuses.push({ label: "Decisiones consistentes", points: A.consistencyBonus, reason: "Mantuviste una estrategia estable y coherente." });
  if (review.findings.some((f) => f.tag === "desperdicio"))
    penalties.push({ label: "Desperdicio", points: A.wastePenalty, reason: "Parte del presupuesto quedó inmovilizado sin aportar al impacto." });
  if (coherence < A.incoherencePenalty.threshold)
    penalties.push({ label: "Incoherencia", points: A.incoherencePenalty.points, reason: `Coherencia transversal de ${coherence.toFixed(0)}/100: las etapas no se sostienen entre sí.` });
  if (g.sdgs.length > s.sdgs.length + 2)
    penalties.push({ label: "ODS indiscriminados", points: A.sdgExcessPenalty, reason: `Seleccionaste ${g.sdgs.length} ODS; el proyecto sustenta pocos de ellos.` });
  if (g.failure && !recommendedPolicies(g).includes(g.policy))
    penalties.push({ label: "Regulación desproporcionada", points: A.regulatoryPenalty, reason: "El instrumento no corresponde a la severidad real de la falla." });
  if (g.extraCost > s.budget * A.overrunPenalty.share)
    penalties.push({ label: "Sobrecostos", points: A.overrunPenalty.points, reason: `Los sobrecostos superaron ${(A.overrunPenalty.share * 100).toFixed(0)} % del presupuesto de la misión.` });
  const bonus = Math.min(A.maxBonus, bonuses.reduce((n, b) => n + b.points, 0)),
    penalty = Math.min(A.maxPenalty, penalties.reduce((n, p) => n + p.points, 0));
  return { bonuses, penalties, bonus, penalty };
}
