import { describe, it, expect } from "vitest";
import { createGame, act } from "./engine";
import {
  learningChallenges,
  learningSummary,
  discountExperiment,
} from "./learning";
import { scenarios } from "../data/scenarios";
import { decode } from "./storage";
import { projectReport } from "./recognition";
describe("Aprender, contrastar y aplicar", () => {
  it("ofrece dos casos por etapa en todos los escenarios sin opciones numéricas ambiguas", () => {
    for (const s of scenarios) {
      const cases = learningChallenges(createGame(s.id));
      expect(cases).toHaveLength(16);
      expect(new Set(cases.map((c) => c.id)).size).toBe(16);
      for (const c of cases) {
        expect(new Set(c.options.map((o) => o.text)).size).toBe(5); // 5 opciones: respuesta, dos errores y dos trampas
        expect(c.options.filter((o) => o.id === c.answer)).toHaveLength(1);
      }
    }
  });
  it("guarda el primer intento, no cobra recursos ni cambia condiciones o puntuación", () => {
    const g = createGame("agua"),
      before = JSON.stringify(g),
      c = learningChallenges(g)[0];
    const next = act(g, {
      type: "learn",
      id: c.id,
      choice: "shortcut",
      confidence: "seguro",
    });
    expect(JSON.stringify(g)).toBe(before);
    expect(next.cash).toBe(g.cash);
    expect(next.month).toBe(g.month);
    expect(next.truth).toEqual(g.truth);
    expect(next.outcome).toBeNull();
    expect(next.learning?.[0].correct).toBe(false);
    expect(() =>
      act(next, {
        type: "learn",
        id: c.id,
        choice: c.answer,
        confidence: "duda",
      }),
    ).toThrow(/primera respuesta/);
  });
  it("exige responder el caso inicial antes del caso de transferencia", () => {
    const g = createGame("agua"),
      c = learningChallenges(g)[1];
    expect(() =>
      act(g, { type: "learn", id: c.id, choice: c.answer, confidence: "duda" }),
    ).toThrow(/primero/);
  });
  it("rechaza identificadores, opciones y etapas posteriores", () => {
    const g = createGame("agua"),
      cases = learningChallenges(g);
    for (const [id, choice] of [
      ["inventado", "reasoned"],
      [cases[0].id, "inventado"],
      [cases[2].id, "reasoned"],
    ])
      expect(() =>
        act(g, { type: "learn", id, choice, confidence: "duda" }),
      ).toThrow();
  });
  it("distingue la primera respuesta de la aplicación posterior sin borrar el error", () => {
    let g = createGame("agua");
    const [c, t] = learningChallenges(g);
    g = act(g, {
      type: "learn",
      id: c.id,
      choice: "shortcut",
      confidence: "seguro",
    });
    g = act(g, {
      type: "learn",
      id: t.id,
      choice: t.answer,
      confidence: "duda",
    });
    const summary = learningSummary(g);
    expect(summary.initial).toEqual({ answered: 1, correct: 0 });
    expect(summary.transfer).toEqual({ answered: 1, correct: 1 });
    expect(summary.overconfident).toBe(1);
  });
  it("recupera respuestas y orden de opciones después de guardar", () => {
    let g = createGame("salud");
    const c = learningChallenges(g)[0];
    g = act(g, {
      type: "learn",
      id: c.id,
      choice: c.answer,
      confidence: "duda",
    });
    const restored = decode(
      JSON.stringify({ version: 1, active: g, history: [] }),
    ).active!;
    expect(learningChallenges(restored)).toEqual(learningChallenges(g));
    expect(learningSummary(restored)).toEqual(learningSummary(g));
  });
  it("comprueba descuento con caso conocido, retraso y tasa cero", () => {
    expect(discountExperiment(100, 60, 0.1, 0).value).toBeCloseTo(4.132231);
    expect(discountExperiment(100, 60, 0.1, 1).value).toBeLessThan(0);
    expect(discountExperiment(100, 60, 0, 3).value).toBe(20);
    expect(discountExperiment(100, 60, 0.1, 2).terms[3].flow).toBe(60);
  });
  it("permite repaso ex post sin modificar resultados ni diario", () => {
    const g = createGame("agua");
    g.phase = 7;
    const closed = act(g, { type: "abandon" });
    const c = learningChallenges(closed)[0],
      after = act(closed, {
        type: "learn",
        id: c.id,
        choice: c.answer,
        confidence: "seguro",
      });
    expect(after.outcome).toEqual(closed.outcome);
    expect(after.journal).toEqual(closed.journal);
    expect(projectReport(after)).toContain(
      "Práctica de conceptos MGA y económicos",
    );
    expect(projectReport(after)).toContain("Casos iniciales: 1/1 aciertos");
  });
});
