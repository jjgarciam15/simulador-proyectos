import type { GameState } from "./types";
import { scenarioById } from "../data/scenarios";
import { directSDGs } from "../data/relationships";
import { chainBank } from "./projectV2";
import { impactCards, valuationSummary, specificObjectiveOptions } from "./valuation";
import { missionFlowCase } from "./missionFlow";
import { playerFlow } from "./comparison";
import { recommendedPolicies } from "./regulationLab";

export type TraceType =
  | "problema"
  | "objetivo"
  | "alternativa"
  | "actividad"
  | "producto"
  | "efecto"
  | "impacto"
  | "metodo"
  | "valor"
  | "flujo"
  | "indicador"
  | "ods"
  | "decision";
export interface TraceabilityLink {
  sourceType: TraceType;
  sourceId: string;
  source: string;
  targetType: TraceType;
  targetId: string;
  target: string;
  relationship: string;
  valid: boolean;
}
export interface TraceGap {
  code: string;
  stage: number;
  message: string;
}
/**
 * Matriz de trazabilidad: links from the problem to the decision, built from the game state.
 * It never blocks the game; gaps mark revision or cost points.
 */
export function traceability(g: GameState) {
  const s = scenarioById(g.scenarioId),
    a = s.alternatives.find((x) => x.id === g.alternative),
    v = g.v2?.v22,
    links: TraceabilityLink[] = [],
    gaps: TraceGap[] = [],
    node = (id: string) => s.nodes.find((n) => n.id === id);
  const link = (l: TraceabilityLink) => links.push(l);
  const problem = node("n0")!;
  if (g.objective)
    link({ sourceType: "problema", sourceId: "n0", source: problem.label, targetType: "objetivo", targetId: g.objective, target: node(g.objective)?.objective ?? g.objective, relationship: "se transforma en", valid: g.objective === "n0" });
  if (g.objective && g.objective !== "n0") gaps.push({ code: "objetivo-problema", stage: 1, message: "El objetivo general no transforma el problema central." });
  const specific = specificObjectiveOptions(g).filter((o) => v?.objectives?.specific.includes(o.id));
  for (const o of specific) {
    const addresses = !!a?.causes.includes(o.id);
    link({ sourceType: "objetivo", sourceId: o.id, source: o.text, targetType: "alternativa", targetId: a?.id ?? "", target: a?.name ?? "Sin alternativa", relationship: "se alcanza con", valid: o.valid && addresses });
    if (o.valid && !g.nodes.includes(o.id)) gaps.push({ code: "objetivo-sin-causa", stage: 1, message: `El objetivo «${o.text}» no tiene su causa en tu Árbol del problema.` });
    if (o.valid && a && !addresses) gaps.push({ code: "objetivo-sin-alternativa", stage: 1, message: `La alternativa no atiende el objetivo «${o.text}».` });
    if (!o.valid) gaps.push({ code: "objetivo-invalido", stage: 1, message: `«${o.text}» no es un objetivo específico: ${o.why}` });
  }
  const bank = chainBank(g),
    chain = g.v2?.chain ?? [],
    label = (id: string) => bank.find((b) => b.id === id)?.label ?? id;
  for (const p of chain.filter((c) => c.level === "Productos")) {
    const from = (g.v2?.connections ?? []).filter((l) => l.to === p.id && chain.find((c) => c.id === l.from)?.level === "Actividades");
    for (const l of from) link({ sourceType: "actividad", sourceId: l.from, source: label(l.from), targetType: "producto", targetId: p.id, target: label(p.id), relationship: "produce", valid: true });
    if (!from.length) gaps.push({ code: "producto-sin-actividad", stage: 2, message: `El producto «${label(p.id)}» no tiene una actividad que lo produzca en tu cadena.` });
  }
  const activityCost = g.activities.reduce((n, x) => n + x.cost, 0);
  if (a && g.activities.length && activityCost <= 0) gaps.push({ code: "costo-sin-actividad", stage: 2, message: "La inversión del flujo no está asignada a actividades del cronograma." });
  const cards = impactCards(g),
    placements = v?.impacts?.placements ?? [],
    placedImpacts = placements.filter((p) => p.kind === "impactoPositivo" || p.kind === "impactoNegativo"),
    effects = placements.filter((p) => p.kind === "efecto");
  if (v?.impacts && placedImpacts.length && !effects.length) gaps.push({ code: "impacto-sin-efecto", stage: 2, message: "Identificaste impactos, pero ningún efecto del proyecto que los produzca." });
  if (v?.impacts && placedImpacts.length && !chain.some((c) => c.level === "Productos")) gaps.push({ code: "impacto-sin-producto", stage: 2, message: "Hay impactos sin un producto en la cadena de valor que los genere." });
  const summary = valuationSummary(g),
    valued = new Set(summary.rows.map((r) => r.card.id));
  for (const p of placedImpacts) {
    const card = cards.find((c) => c.id === p.id);
    if (!card) continue;
    if (card.valuation && !valued.has(card.id) && !card.valuation.overlap)
      gaps.push({ code: "impacto-sin-valoracion", stage: 3, message: `El impacto «${card.text}» no está valorado.` });
    if (valued.has(card.id)) {
      const row = summary.rows.find((r) => r.card.id === card.id)!;
      link({ sourceType: "impacto", sourceId: card.id, source: card.text, targetType: "metodo", targetId: row.choice.method, target: row.choice.method, relationship: "se valora con", valid: row.result.fit !== "inadecuada" });
      link({ sourceType: "metodo", sourceId: row.choice.method, source: row.choice.method, targetType: "valor", targetId: card.id, target: Math.round(row.result.annual) + " M/año", relationship: "estima", valid: row.result.quantityOk });
      if (row.result.fit === "inadecuada") gaps.push({ code: "valor-sin-fuente", stage: 3, message: `El valor de «${card.text}» no tiene una fuente metodológica defendible.` });
    }
  }
  for (const r of summary.rows)
    if (!placedImpacts.some((p) => p.id === r.card.id))
      gaps.push({ code: "valoracion-sin-impacto", stage: 3, message: `Valoraste «${r.card.text}» sin clasificarlo como impacto.` });
  const c = missionFlowCase(g);
  if (c && v?.economic) {
    for (const id of v.economic.benefits) {
      const b = c.benefits.find((x) => x.id === id);
      link({ sourceType: "valor", sourceId: id, source: b?.label ?? id, targetType: "flujo", targetId: "economico", target: "Flujo económico", relationship: "alimenta", valid: !!b && !b.overlap });
      if (!b) gaps.push({ code: "beneficio-sin-valoracion", stage: 3, message: "El flujo económico incluye un beneficio que ya no está valorado." });
    }
    const f = playerFlow(g, c);
    for (const r of f.rows.filter((r) => r.kind !== "excluir" && r.amount === 0))
      gaps.push({ code: "flujo-sin-fuente", stage: 3, message: `El rubro «${c.rubros.find((x) => x.id === r.rubroId)?.label}» está en el flujo sin valor.` });
    const operation = c.rubros.filter((x) => x.kind === "operacion").reduce((n, x) => n + x.amount, 0);
    if (g.budget.operation < operation * 0.8)
      gaps.push({ code: "operacion-sin-presupuesto", stage: 2, message: "La operación del primer año del flujo no está cubierta por tu presupuesto." });
  }
  if (g.indicators.length && valued.size)
    link({ sourceType: "flujo", sourceId: "economico", source: "Flujo económico", targetType: "indicador", targetId: g.indicators[0].name, target: g.indicators[0].name, relationship: "se sigue con", valid: g.indicators.some((i) => i.kind === "Resultado" || i.kind === "Impacto") });
  const impactSdgs = new Set(placedImpacts.flatMap((p) => cards.find((c) => c.id === p.id)?.valuation?.sdg ?? []));
  for (const id of g.sdgs) {
    const ok = impactSdgs.has(id) || (directSDGs[g.scenarioId] ?? []).includes(id);
    link({ sourceType: "impacto", sourceId: "impactos", source: "Impactos identificados", targetType: "ods", targetId: String(id), target: "ODS " + id, relationship: "contribuye a", valid: ok });
    if (!ok) gaps.push({ code: "ods-sin-impacto", stage: 4, message: `El ODS ${id} no se relaciona con ningún impacto identificado.` });
  }
  if (g.failure && !recommendedPolicies(g).includes(g.policy)) gaps.push({ code: "regulacion-desconectada", stage: 4, message: "La estrategia regulatoria no corresponde a la severidad de la falla observada." });
  if (g.snapshot) link({ sourceType: "indicador", sourceId: "plan", source: "Plan evaluado", targetType: "decision", targetId: "inversion", target: "Decisión de inversión", relationship: "sustenta", valid: true });
  const valid = links.filter((l) => l.valid).length;
  const score = Math.max(0, Math.round(links.length ? (100 * valid) / links.length - gaps.length * 4 : 0));
  return { links, gaps, score, level: score >= 75 ? "Alta" : score >= 50 ? "Media" : "Baja" };
}
