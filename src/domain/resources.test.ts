import { describe, it, expect } from "vitest";
import { createGame } from "./engine";
import { resourceChanges, resourceViews } from "./resources";
import { decisionMoment } from "./experience";
describe("Panel de recursos", () => {
  it("distingue dinero comprometido de gasto", () => {
    const g = createGame("agua"),
      after = { ...g, committed: 1000 };
    const cash = resourceChanges(g, after).find((r) => r.id === "cash")!;
    expect(cash.delta).toBe(-1000);
    expect(cash.favorable).toBeNull();
    expect(after.spent).toBe(0);
  });
  it("un riesgo menor es favorable y la recarga no crea cambios", () => {
    const g = createGame("agua");
    expect(
      resourceChanges(g, { ...g, quality: 90 }).find((r) => r.id === "risk")!
        .favorable,
    ).toBe(true);
    expect(resourceChanges(g, structuredClone(g))).toEqual([]);
    expect(resourceChanges(g, { ...g, id: "otra" })).toEqual([]);
  });
  it("conserva el retraso sin ocultarlo tras cero meses", () => {
    const g = { ...createGame("agua"), month: 45 };
    const time = resourceViews(g).find((r) => r.id === "time")!;
    expect(time.value).toBe(-3);
    expect(time.display).toContain("fuera de plazo");
    expect(time.level).toBe(0);
  });
  it("distingue financiación, gasto y deterioro en el sonido", () => {
    const g = createGame("agua");
    expect(
      decisionMoment(g, {
        ...g,
        cash: g.cash + 1000,
        loans: [{ principal: 1000, rate: 0.12, years: 5, type: "credito" }],
      })?.cue,
    ).toBe("funding");
    expect(
      decisionMoment(g, { ...g, cash: g.cash - 100, spent: 100 })?.cue,
    ).toBe("spend");
    expect(decisionMoment(g, { ...g, support: g.support - 5 })?.cue).toBe(
      "strain",
    );
  });
});
