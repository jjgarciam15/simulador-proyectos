import { describe, it, expect } from "vitest";
import { createGameV2, act } from "./engine";
import { questionsV2, practiceFeedback } from "./questionsV2";
import { scenarios } from "../data/scenarios";
import { npv } from "./finance";
describe("Casos de aplicación MGA", () => {
  it("ofrece preguntas únicas con cinco opciones y feedback por error en las nueve misiones", () => {
    for (const s of scenarios) {
      const g = createGameV2(s.id),
        qs = questionsV2(g);
      expect(qs).toHaveLength(21);
      expect(new Set(qs.map((q) => q.id)).size).toBe(qs.length);
      for (const q of qs.filter((q) => q.id.startsWith("applied-"))) {
        expect(q.options).toHaveLength(5);
        expect(new Set(q.options.map((o) => o.text)).size).toBe(5);
        expect(q.options.every((o) => o.feedback)).toBe(true);
      }
    }
  });
  it("explica el error de descontar una sola vez sin gastar recursos", () => {
    const g = createGameV2("agua");
    g.maxPhase = 3;
    g.phase = 3;
    const n = act(g, {
      type: "answerV2",
      id: "applied-npv",
      choices: ["once"],
    });
    expect(practiceFeedback(n, "applied-npv")).toContain("primer año");
    expect(n.cash).toBe(g.cash);
    expect(n.truth).toEqual(g.truth);
    expect(npv([-1000, 600, 600], 0.1)).toBeCloseTo(41.3223, 3);
  });
  it("conserva orden de opciones e intentos al serializar", () => {
    const g = createGameV2("salud", "experto", "same");
    g.maxPhase = 6;
    const n = act(g, {
      type: "answerV2",
      id: "applied-causality",
      choices: ["reason"],
    });
    expect(questionsV2(JSON.parse(JSON.stringify(n)))).toEqual(questionsV2(n));
    expect(n.v2!.assessments["applied-causality"].solved).toBe(true);
  });
});
