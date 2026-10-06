import { evaluate, scenarioShocks, type EconomicRowInput, type FlowCase, type RowInput, type Shocks } from "./flows";
import { random } from "./finance";
import type { GameState } from "./types";

/**
 * Análisis de riesgo por simulación Monte Carlo (educativo, local y reproducible con la semilla).
 * Each run draws every uncertain variable from a triangular distribution whose bounds are the
 * optimistic and pessimistic scenarios already shown in the sensitivity lab, so no new data is invented:
 * - investment, O&M and valued benefits: between the optimistic and pessimistic multipliers, mode 1;
 * - demand: ± the information band of the game (narrower after buying the demand study);
 * - operation delay: 0 or up to the pessimistic delay (1 year), more often 0.
 */
export const riskRuns = 500;
/** Half-width of the demand uncertainty band: the demand study narrows it (same band shown in «Supuestos del proyecto»). */
export function demandBand(g: GameState) {
  return g.studies.includes("demanda") ? 0.08 : g.difficulty === "experto" ? 0.3 : 0.2;
}
export function triangular(u: number, low: number, mode: number, high: number) {
  if (high <= low) return mode;
  const f = (mode - low) / (high - low);
  return u < f ? low + Math.sqrt(u * (high - low) * (mode - low)) : high - Math.sqrt((1 - u) * (high - low) * (high - mode));
}
/** Bounds of each variable: [low, mode, high] multipliers. */
export function riskRanges(demandBand: number) {
  const opt = scenarioShocks.optimista,
    pes = scenarioShocks.pesimista;
  return {
    investment: [opt.investment ?? 1, 1, pes.investment ?? 1],
    om: [opt.om ?? 1, 1, pes.om ?? 1],
    benefits: [pes.benefits ?? 1, 1, opt.benefits ?? 1],
    demand: [1 - demandBand, 1, 1 + demandBand],
    delay: [0, 0, pes.delay ?? 0],
  } as const;
}
export function percentile(sorted: number[], p: number) {
  if (!sorted.length) return 0;
  const i = (sorted.length - 1) * p,
    lo = Math.floor(i),
    hi = Math.ceil(i);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}
function summary(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    mean: values.reduce((n, v) => n + v, 0) / Math.max(1, values.length),
    p10: percentile(sorted, 0.1),
    p50: percentile(sorted, 0.5),
    p90: percentile(sorted, 0.9),
    min: sorted[0] ?? 0,
    max: sorted.at(-1) ?? 0,
    probNegative: values.filter((v) => v < 0).length / Math.max(1, values.length),
  };
}
/** Equal-width bins of the economic NPV for a histogram (each bin is entirely below or above zero when possible). */
export function histogram(values: number[], bins = 12) {
  const lo = Math.min(...values),
    hi = Math.max(...values);
  if (!values.length || hi === lo) return [{ from: lo, to: hi, count: values.length }];
  const width = (hi - lo) / bins;
  const out = Array.from({ length: bins }, (_, i) => ({ from: lo + i * width, to: lo + (i + 1) * width, count: 0 }));
  for (const v of values) out[Math.min(bins - 1, Math.floor((v - lo) / width))].count++;
  return out;
}
export function riskAnalysis(c: FlowCase, rows: RowInput[], econ: EconomicRowInput[], benefitIds: string[], seed: string, demandBand: number, runs = riskRuns) {
  const r = riskRanges(demandBand),
    draw = (i: number, k: keyof typeof r) => triangular(random(seed, `riesgo:${i}:${k}`), r[k][0], r[k][1], r[k][2]);
  const results = Array.from({ length: runs }, (_, i) => {
    const s: Shocks = {
      investment: draw(i, "investment"),
      om: draw(i, "om"),
      benefits: draw(i, "benefits"),
      demand: draw(i, "demand"),
      delay: Math.round(draw(i, "delay")),
    };
    return evaluate(c, rows, econ, benefitIds, s);
  });
  const npvE = results.map((x) => x.npvE),
    npvF = results.map((x) => x.npvF);
  return { runs, ranges: r, economic: summary(npvE), financial: summary(npvF), bins: histogram(npvE) };
}
