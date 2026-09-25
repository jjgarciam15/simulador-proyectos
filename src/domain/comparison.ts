import type { GameState } from "./types";
import { scenarioById } from "../data/scenarios";
import { riskLevel } from "./engine";
import {
  evaluate,
  referenceEconomic,
  referenceRows,
  type EconomicRowInput,
  type FlowCase,
  type RowInput,
} from "./flows";
import { missionFlowCase } from "./missionFlow";
import { valuationSummary } from "./valuation";

/** The player's own flow when it exists and was built for this alternative; otherwise the case reference. */
export function playerFlow(g: GameState, c: FlowCase) {
  const v = g.v2?.v22,
    own = v?.flow?.builtFor === g.alternative && c.id.endsWith(":" + g.alternative);
  const rows: RowInput[] = own ? v!.flow!.rows : referenceRows(c);
  const econ: EconomicRowInput[] = own && v?.economic ? v.economic.rows : referenceEconomic(c);
  const benefits = own && v?.economic ? v.economic.benefits : c.benefits.filter((b) => !b.overlap).map((b) => b.id);
  return { rows, econ, benefits, own };
}
/**
 * Comparator: every alternative evaluated with the same horizon, rates and RPC. Benefits of the other
 * alternatives project the player's valuation by the ratio of social benefits (same methods, same confidence).
 */
export function compareAlternatives(g: GameState) {
  const s = scenarioById(g.scenarioId),
    chosen = s.alternatives.find((a) => a.id === g.alternative),
    summary = valuationSummary(g),
    confidence = summary.rows.length
      ? summary.rows.some((r) => r.result.confidence === "baja")
        ? "Baja"
        : summary.rows.every((r) => r.result.confidence === "alta")
          ? "Alta"
          : "Media"
      : "Sin valorar";
  return s.alternatives.map((a) => {
    const base = missionFlowCase(g, a.id)!,
      ratio = chosen ? a.social / chosen.social : 1,
      c: FlowCase =
        a.id === g.alternative
          ? missionFlowCase(g)!
          : {
              ...base,
              benefits: (missionFlowCase(g)?.benefits ?? []).map((b) => ({
                ...b,
                annual: b.annual * (b.annual > 0 ? ratio : 1 + Math.max(0, -a.environment) / 50),
              })),
            };
    const own = a.id === g.alternative ? playerFlow(g, c) : null,
      rows = own?.rows ?? referenceRows(c),
      econ = own?.econ ?? referenceEconomic(c),
      benefits = own?.benefits ?? c.benefits.filter((b) => !b.overlap).map((b) => b.id),
      r = evaluate(c, rows, econ, benefits),
      scale = g.target / s.affected;
    return {
      id: a.id,
      name: a.name,
      chosen: a.id === g.alternative,
      investment: c.rubros.filter((x) => x.kind === "inversion").reduce((n, x) => n + x.amount, 0),
      om: c.rubros.filter((x) => x.kind === "operacion" || x.kind === "mantenimiento").reduce((n, x) => n + x.amount, 0),
      life: a.life,
      residual: c.rubros.find((x) => x.id === "residual")?.amount ?? 0,
      months: a.months,
      coverage: a.coverage,
      npvF: r.npvF,
      npvE: r.npvE,
      // Project exposure (information, mitigation, support) combined with the technology risk of the alternative.
      risk: 0.5 * riskLevel(g) + 0.5 * a.risk,
      impact: a.social * scale,
      confidence: a.id === g.alternative ? confidence : confidence === "Sin valorar" ? confidence : "Proyectada",
      regulation: a.complexity,
      sustainability: a.environment,
      causes: a.causes.length,
    };
  });
}
export type ComparisonRow = ReturnType<typeof compareAlternatives>[number];
export const decisionCriteria = [
  { id: "economico", label: "Económico (VPN económico)", value: (r: ComparisonRow) => r.npvE },
  { id: "financiero", label: "Financiero (VPN financiero)", value: (r: ComparisonRow) => r.npvF },
  { id: "social", label: "Social (cobertura)", value: (r: ComparisonRow) => r.coverage },
  { id: "ambiental", label: "Ambiental", value: (r: ComparisonRow) => r.sustainability },
  { id: "riesgo", label: "Riesgo (menor es mejor)", value: (r: ComparisonRow) => -r.risk },
  { id: "implementacion", label: "Implementación (plazo y complejidad)", value: (r: ComparisonRow) => -r.months - r.regulation / 5 },
] as const;
/** Weighted decision matrix: min–max normalization per criterion. A support tool, not an automatic verdict. */
export function decisionMatrix(rows: ComparisonRow[], weights: Record<string, number>) {
  const total = Object.values(weights).reduce((n, v) => n + Math.max(0, v), 0) || 1;
  return rows.map((row) => {
    const parts = decisionCriteria.map((c) => {
      const values = rows.map(c.value),
        min = Math.min(...values),
        max = Math.max(...values),
        norm = max === min ? 1 : (c.value(row) - min) / (max - min);
      return { id: c.id, norm, weighted: (norm * Math.max(0, weights[c.id] ?? 0)) / total };
    });
    return { id: row.id, name: row.name, parts, score: parts.reduce((n, p) => n + p.weighted, 0) * 100 };
  });
}
