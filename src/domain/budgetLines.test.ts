import { describe, it, expect } from "vitest";
import { act, createGameV2 } from "./engine";
import { decode } from "./storage";
import {
  type BudgetLine,
  validBudgetLines,
  detailedTotals,
} from "./budgetLines";
const line: BudgetLine = {
  id: "maintenance-1",
  category: "maintenance",
  description: "Visitas preventivas",
  unit: "visita",
  quantity: 12,
  unitCost: 5,
};
function setup() {
  const g = createGameV2("agua");
  g.phase = 2;
  g.maxPhase = 2;
  return g;
}
describe("Detalle presupuestal", () => {
  it("calcula cantidades fraccionarias sin duplicar asignación ni gastar caja", () => {
    const g = setup(),
      l = { ...line, quantity: 2.5 },
      budget = { ...g.budget, maintenance: 12.5 };
    const next = act(g, { type: "budget", value: budget, lines: [l] });
    expect(detailedTotals(next.v2!.budgetLines!).maintenance).toBe(12.5);
    expect(next.budget.maintenance).toBe(12.5);
    expect(next.cash).toBe(g.cash);
    expect(g.v2?.budgetLines).toBeUndefined();
  });
  it.each([0, -1, NaN, Infinity])(
    "rechaza cantidad inválida %s sin alterar estado",
    (quantity) => {
      const g = setup();
      expect(() =>
        act(g, {
          type: "budget",
          value: { ...g.budget, maintenance: 100 },
          lines: [{ ...line, quantity }],
        }),
      ).toThrow(/cantidades/);
      expect(g.budget.maintenance).toBe(0);
    },
  );
  it("rechaza duplicados, textos vacíos, categorías y desbordamientos", () => {
    const budget = { ...setup().budget, maintenance: 100 };
    expect(validBudgetLines([line, line], budget)).toBe(false);
    expect(validBudgetLines([{ ...line, unit: " " }], budget)).toBe(false);
    expect(validBudgetLines([{ ...line, category: "inventada" }], budget)).toBe(
      false,
    );
    expect(
      validBudgetLines([{ ...line, quantity: Number.MAX_VALUE }], budget),
    ).toBe(false);
    expect(validBudgetLines([line], { ...budget, maintenance: 59 })).toBe(
      false,
    );
  });
  it("conserva el detalle al guardar y permite asignaciones parcialmente desglosadas", () => {
    const g = setup(),
      next = act(g, {
        type: "budget",
        value: { ...g.budget, maintenance: 100 },
        lines: [line],
      });
    expect(
      decode(JSON.stringify({ version: 1, active: next, history: [] })).active
        ?.v2?.budgetLines,
    ).toEqual([line]);
    expect(() =>
      act(next, { type: "budget", value: { ...g.budget, maintenance: 10 } }),
    ).toThrow();
  });
  it("reinicia el detalle junto con el presupuesto y conserva gastos", () => {
    const g = setup(),
      next = act(g, {
        type: "budget",
        value: { ...g.budget, maintenance: 60 },
        lines: [line],
      });
    const reset = act(next, { type: "resetStage" });
    expect(reset.v2?.budgetLines).toEqual([]);
    expect(reset.spent).toBe(next.spent);
  });
});
