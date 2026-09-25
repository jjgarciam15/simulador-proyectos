import { describe, it, expect } from "vitest";
import { costPerResult, efficiencyComparison } from "./costEfficiency";
import { createGameV2, act, budgetFor, defaultActivities } from "./engine";
import { scenarioById } from "../data/scenarios";
describe("Costo-eficiencia", () => {
  it("usa resultados físicos descontados y admite tasa cero", () => {
    expect(costPerResult([100, 10, 10], [0, 50, 50], 0)).toBeCloseTo(1.2);
    expect(costPerResult([100, 10, 10], [0, 50, 50], 0.1)).toBeCloseTo(
      (100 + 10 / 1.1 + 10 / 1.21) / (50 / 1.1 + 50 / 1.21),
    );
  });
  it("no inventa eficiencia cuando no hay resultados", () => {
    expect(costPerResult([100, 10], [0, 0], 0.1)).toBeNull();
    expect(() => costPerResult([100], [0, 50], 0.1)).toThrow();
  });
  it("mantiene el plan original y marca alternativas sin financiación", () => {
    let g = createGameV2("agua");
    g.phase = 1;
    g = act(g, { type: "alternative", id: "a1" });
    g.budget = budgetFor(g, scenarioById("agua").alternatives[1]);
    g.activities = defaultActivities(g);
    g.cash = 1;
    const before = structuredClone(g),
      rows = efficiencyComparison(g);
    expect(rows).toHaveLength(4);
    expect(rows.every((r) => !r.feasible)).toBe(true);
    expect(rows.every((r) => r.unitCost !== null && r.unitCost > 0)).toBe(true);
    expect(g).toEqual(before);
  });
});
