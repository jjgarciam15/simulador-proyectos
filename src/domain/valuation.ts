import type { GameState } from "./types";
import { scenarioById } from "../data/scenarios";
import {
  fitReason,
  methodFit,
  missionImpacts,
  type Beneficiary,
  type ImpactCardData,
  type ImpactKind,
} from "../data/impacts";
import { methodById, valuationMethods, type MethodId } from "../data/valuationMethods";
import { random } from "./finance";

/* ---------------- Objetivos ---------------- */
export interface ObjectiveOption {
  id: string;
  text: string;
  valid: boolean;
  why: string;
}
/** General objective options (5): the transformation of the central problem, plus plausible distractors. */
export function generalObjectiveOptions(g: GameState): ObjectiveOption[] {
  const s = scenarioById(g.scenarioId),
    n = (id: string) => s.nodes.find((x) => x.id === id)!;
  return [
    { id: "n0", text: n("n0").objective, valid: true, why: "Transforma el problema central en la situación deseada." },
    { id: "n4", text: n("n4").objective, valid: false, why: "Es un fin de largo plazo (impacto), no el objetivo del proyecto." },
    { id: "n3", text: n("n3").objective, valid: false, why: "Transforma un efecto del problema: es un fin, no el objetivo general." },
    { id: "d1", text: n("d1").objective, valid: false, why: "Es una solución disfrazada de objetivo: nace de una causa mal planteada." },
    { id: "gestion", text: "Ejecutar el presupuesto del proyecto dentro del plazo previsto", valid: false, why: "Es una meta de gestión: describe la ejecución, no el cambio en la situación de la población." },
  ].sort((a, b) => random(g.seed, "og" + a.id) - random(g.seed, "og" + b.id));
}
/** Specific objectives (5): transformations of the causes; distractors include ends, activities and products. */
export function specificObjectiveOptions(g: GameState): ObjectiveOption[] {
  const s = scenarioById(g.scenarioId),
    n = (id: string) => s.nodes.find((x) => x.id === id)!,
    a = s.alternatives.find((x) => x.id === g.alternative);
  return [
    { id: "n1", text: n("n1").objective, valid: true, why: "Transforma la causa directa." },
    { id: "n2", text: n("n2").objective, valid: true, why: "Transforma la causa indirecta." },
    { id: "n3", text: n("n3").objective, valid: false, why: "Es un fin: transforma un efecto del problema." },
    { id: "act", text: "Contratar el diseño y la construcción de la obra", valid: false, why: "Es una actividad, no un objetivo." },
    { id: "prod", text: `Entregar ${a?.product.toLowerCase() ?? "la obra"}`, valid: false, why: "Es un producto: el objetivo describe el cambio en la situación, no lo que se entrega." },
  ].sort((a, b) => random(g.seed, "oe" + a.id) - random(g.seed, "oe" + b.id));
}
export function objectivesScore(g: GameState) {
  const o = g.v2?.v22?.objectives;
  if (!o) return 0;
  const specific = specificObjectiveOptions(g),
    chosen = specific.filter((x) => o.specific.includes(x.id)),
    right = chosen.filter((x) => x.valid).length,
    wrong = chosen.length - right,
    total = specific.filter((x) => x.valid).length;
  return Math.max(0, 40 * Number(o.general === "n0") + (60 * right) / total - 20 * wrong);
}

/* ---------------- Efectos e impactos ---------------- */
export interface ImpactCard extends ImpactCardData {
  generated?: boolean;
}
export const kindText: Record<ImpactKind, string> = {
  producto: "Producto",
  efecto: "Efecto del proyecto",
  impactoPositivo: "Impacto positivo",
  impactoNegativo: "Impacto negativo",
  problema: "Efecto del problema",
  irrelevante: "Irrelevante",
};
export function impactCards(g: GameState): ImpactCard[] {
  const s = scenarioById(g.scenarioId),
    a = s.alternatives.find((x) => x.id === g.alternative),
    n3 = s.nodes.find((x) => x.id === "n3")!;
  const generated: ImpactCard[] = [
    { id: "producto", text: a?.product ?? "Servicio en operación", kind: "producto", why: "Es el bien o servicio que entrega el proyecto.", generated: true },
    { id: "problema", text: n3.label + " (situación actual)", kind: "problema", why: "Es una consecuencia de que el problema exista, no un cambio producido por el proyecto.", generated: true },
  ];
  return [...generated, ...(missionImpacts[g.scenarioId] ?? [])].sort(
    (x, y) => random(g.seed, "imp" + x.id) - random(g.seed, "imp" + y.id),
  );
}
export interface ImpactPlacement {
  id: string;
  kind: ImpactKind;
  group?: Beneficiary;
}
export function impactReview(g: GameState, placements = g.v2?.v22?.impacts?.placements ?? []) {
  const cards = impactCards(g);
  const rows = cards.map((c) => {
    const p = placements.find((x) => x.id === c.id);
    const kindOk = p?.kind === c.kind,
      groupOk = !c.group || !["impactoPositivo", "impactoNegativo"].includes(c.kind) || p?.group === c.group;
    return { card: c, placed: p, kindOk, groupOk, status: !p ? "sin clasificar" : kindOk ? (groupOk ? "correcta" : "grupo incorrecto") : "incorrecta" };
  });
  const points = rows.reduce((n, r) => n + (r.kindOk ? (r.groupOk ? 1 : 0.7) : 0), 0);
  return { rows, score: Math.round((100 * points) / Math.max(1, rows.length)) };
}

/* ---------------- Valoración ---------------- */
export type Study = "basico" | "completo";
export interface ValuationChoice {
  impactId: string;
  method: MethodId;
  study: Study;
  /** Quantity the player computed (measurement); compared with the case measurement. */
  quantity: number;
}
export type Fit = "optima" | "valida" | "parcial" | "inadecuada";
export const fitLabel: Record<Fit, string> = { optima: "Óptima", valida: "Válida", parcial: "Parcialmente adecuada", inadecuada: "Inadecuada" };
export const studyCost = { basico: 0.001, completo: 0.004 } as const;
export const studyMonths = { basico: 0, completo: 1 } as const;
export function valuableCards(g: GameState) {
  return impactCards(g).filter((c) => c.valuation);
}
export function coveredPeople(g: GameState) {
  const s = scenarioById(g.scenarioId),
    a = s.alternatives.find((x) => x.id === g.alternative);
  return Math.round(g.target * (a?.coverage ?? 0));
}
/** Measurement: covered people × quantity per person. It is not yet a value in pesos. */
export function measurement(g: GameState, card: ImpactCard) {
  const covered = coveredPeople(g),
    v = card.valuation!;
  return { covered, perCovered: v.perCovered, quantity: covered * v.perCovered, unit: v.unit };
}
/** True annual economic value of the impact for this alternative (M COP/year, negative for damages). */
export function trueAnnualValue(g: GameState, card: ImpactCard) {
  const s = scenarioById(g.scenarioId),
    a = s.alternatives.find((x) => x.id === g.alternative);
  if (!a || !card.valuation) return 0;
  const social = (a.social * g.target) / s.affected;
  return card.kind === "impactoNegativo"
    ? -social * card.valuation.share * (1 + Math.max(0, -a.environment) / 50)
    : social * card.valuation.share;
}
export function methodFitFor(card: ImpactCard, method: MethodId): Fit {
  return (card.valuation && methodFit[card.valuation.type][method]) || "inadecuada";
}
export function confidenceOf(fit: Fit, study: Study): "alta" | "media" | "baja" {
  if (fit === "optima") return study === "completo" ? "alta" : "media";
  if (fit === "valida") return study === "completo" ? "media" : "baja";
  return "baja";
}
export const confidenceBand = { alta: 0.1, media: 0.25, baja: 0.45 } as const;
/** Valuation of one impact: an inadequate or partial method biases the estimate (seeded), better studies narrow the band. */
export function valueImpact(g: GameState, card: ImpactCard, choice: ValuationChoice) {
  const fit = methodFitFor(card, choice.method),
    confidence = confidenceOf(fit, choice.study),
    m = measurement(g, card),
    truth = trueAnnualValue(g, card),
    spread = { optima: 0, valida: 0.1, parcial: 0.3, inadecuada: 0.6 }[fit],
    bias = 1 + (random(g.seed, "bias" + card.id + choice.method) * 2 - 1) * spread,
    annual = truth * bias,
    band = confidenceBand[confidence],
    quantityOk = Math.abs(choice.quantity - m.quantity) <= Math.max(0.5, m.quantity * 0.02);
  return {
    fit,
    confidence,
    quantity: m.quantity,
    unit: m.unit,
    quantityOk,
    unitValue: m.quantity ? annual / m.quantity : 0,
    annual,
    low: annual * (1 - band),
    high: annual * (1 + band),
    truth,
    feedback: valuationFeedback(card, choice.method, fit),
  };
}
export function valuationFeedback(card: ImpactCard, method: MethodId, fit: Fit) {
  const m = methodById(method)!,
    best = valuationMethods.filter((x) => methodFitFor(card, x.id) === "optima").map((x) => x.name),
    reason = card.valuation ? fitReason[card.valuation.type] : "";
  const head =
    fit === "optima"
      ? `${m.name} es la opción más adecuada para este impacto.`
      : fit === "valida"
        ? `${m.name} es válida, aunque ${best.join(" o ")} aprovecharía mejor la información disponible.`
        : fit === "parcial"
          ? `${m.name} solo capta una parte del valor. ${best.join(" o ")} sería más adecuado.`
          : `${m.name} no es adecuado aquí: necesita ${m.needs.charAt(0).toLowerCase() + m.needs.slice(1)} Considera ${best.join(" o ")}.`;
  return `${head} ${reason} Información del caso: ${card.valuation?.data ?? ""}`;
}
/** Money and time needed for the chosen studies that have not been paid yet. */
export function valuationCharge(g: GameState, choices: ValuationChoice[]) {
  const s = scenarioById(g.scenarioId),
    paid = g.v2?.v22?.valuation?.paid ?? {};
  let cost = 0,
    months = 0;
  for (const c of choices) {
    const before = paid[c.impactId];
    if (before === c.study || (before === "completo" && c.study === "basico")) continue;
    cost += s.budget * (studyCost[c.study] - (before ? studyCost[before] : 0));
    months = Math.max(months, studyMonths[c.study]);
  }
  return { cost, months };
}
export function valuationSummary(g: GameState, choices = g.v2?.v22?.valuation?.choices ?? []) {
  const cards = valuableCards(g);
  const rows = choices
    .map((c) => {
      const card = cards.find((x) => x.id === c.impactId);
      return card ? { card, choice: c, result: valueImpact(g, card, c) } : null;
    })
    .filter((x): x is NonNullable<typeof x> => !!x);
  const valuedIds = new Set(rows.map((r) => r.card.id));
  const overlaps = rows.filter((r) => r.card.valuation?.overlap);
  const missingNegative = cards.filter((c) => c.kind === "impactoNegativo" && !valuedIds.has(c.id));
  const missingPositive = cards.filter((c) => c.kind === "impactoPositivo" && !c.valuation?.overlap && !valuedIds.has(c.id));
  const fitPoints = { optima: 100, valida: 80, parcial: 50, inadecuada: 10 };
  const perRow = rows.map((r) => fitPoints[r.result.fit] * (r.result.quantityOk ? 1 : 0.75));
  const coverage = (cards.length - missingNegative.length - missingPositive.length - overlaps.length) / Math.max(1, cards.filter((c) => !c.valuation?.overlap).length);
  const score = rows.length
    ? Math.max(0, (perRow.reduce((n, v) => n + v, 0) / rows.length) * Math.min(1, Math.max(0, coverage)) - overlaps.length * 15 - missingNegative.length * 10)
    : 0;
  return { rows, overlaps, missingNegative, missingPositive, score: Math.round(Math.min(100, score)) };
}
/** Reference solution: optimal method, basic study, correct measurement for every non-overlapping valuable impact. */
export function referenceValuation(g: GameState): ValuationChoice[] {
  return valuableCards(g)
    .filter((c) => !c.valuation!.overlap)
    .map((c) => ({
      impactId: c.id,
      method: valuationMethods.find((m) => methodFitFor(c, m.id) === "optima")!.id,
      study: "basico" as const,
      quantity: measurement(g, c).quantity,
    }));
}
/**
 * Methods offered for an impact: always 5 cards (the maximum per question), seeded order.
 * The best fitting methods always appear; difficulty changes how many of the 5 are close alternatives
 * (guided 2, professional 3, expert 4) instead of adding more cards.
 */
const fitOrder = { optima: 0, valida: 1, parcial: 2, inadecuada: 3 } as const;
export function methodOptions(g: GameState, card: ImpactCard) {
  const seeded = (a: { id: string }, b: { id: string }) => random(g.seed, card.id + a.id) - random(g.seed, card.id + b.id);
  const fitting = valuationMethods
      .filter((m) => methodFitFor(card, m.id) !== "inadecuada")
      .sort((a, b) => fitOrder[methodFitFor(card, a.id)] - fitOrder[methodFitFor(card, b.id)] || seeded(a, b)),
    others = valuationMethods.filter((m) => methodFitFor(card, m.id) === "inadecuada").sort(seeded),
    close = g.difficulty === "guiado" ? 2 : g.difficulty === "profesional" ? 3 : 4,
    picked = fitting.slice(0, close);
  return [...picked, ...others, ...fitting.slice(close)]
    .slice(0, 5)
    .sort((a, b) => random(g.seed, "mo" + card.id + a.id) - random(g.seed, "mo" + card.id + b.id));
}
