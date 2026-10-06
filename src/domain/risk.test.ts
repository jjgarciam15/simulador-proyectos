import { describe, it, expect } from "vitest";
import { act } from "./engine";
import { prepareV2 } from "../testSupport/gameFixture";
import { missionFlowCase } from "./missionFlow";
import { playerFlow } from "./comparison";
import { demandBand, riskAnalysis, triangular, percentile } from "./risk";

const analyse = (g: ReturnType<typeof prepareV2>) => {
  const c = missionFlowCase(g)!,
    f = playerFlow(g, c);
  return riskAnalysis(c, f.rows, f.econ, f.benefits, g.seed, demandBand(g));
};
describe("Análisis de riesgo Monte Carlo", () => {
  it("la distribución triangular respeta sus límites y su moda", () => {
    for (let u = 0; u <= 1; u += 0.05) {
      const x = triangular(u, 0.9, 1, 1.2);
      expect(x).toBeGreaterThanOrEqual(0.9);
      expect(x).toBeLessThanOrEqual(1.2);
    }
    expect(triangular(0.5, 1, 1, 1)).toBe(1);
    expect(percentile([1, 2, 3, 4, 5], 0.5)).toBe(3);
  });
  it("es reproducible con la semilla y ordena P10 ≤ P50 ≤ P90", () => {
    const g = prepareV2("agua"),
      a = analyse(g),
      b = analyse(structuredClone(g));
    expect(a).toEqual(b);
    expect(a.runs).toBe(500);
    for (const s of [a.economic, a.financial]) {
      expect(s.p10).toBeLessThanOrEqual(s.p50);
      expect(s.p50).toBeLessThanOrEqual(s.p90);
      expect(s.probNegative).toBeGreaterThanOrEqual(0);
      expect(s.probNegative).toBeLessThanOrEqual(1);
    }
    expect(a.bins.reduce((n, x) => n + x.count, 0)).toBe(500);
  });
  it("comprar el estudio de demanda estrecha el riesgo de demanda", () => {
    const base = prepareV2("agua", undefined, 1),
      without = { ...base, studies: base.studies.filter((s) => s !== "demanda") },
      withStudy = base.studies.includes("demanda") ? base : act({ ...base, phase: 0 }, { type: "study", id: "demanda" });
    expect(demandBand(withStudy)).toBeLessThan(demandBand(without));
    expect(analyse(withStudy).ranges.demand[2] - analyse(withStudy).ranges.demand[0]).toBeLessThan(analyse(without).ranges.demand[2] - analyse(without).ranges.demand[0]);
  });
});
