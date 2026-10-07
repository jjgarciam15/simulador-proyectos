import { describe, it, expect } from "vitest";
import { act, type Action } from "./engine";
import { prepareV2, commitV22 } from "../testSupport/gameFixture";
import { questionsV2 } from "./questionsV2";
import { practiceScore, negotiationScore, scoreBreakdown } from "./scoreParts";
import type { GameState } from "./types";

function finish(g: GameState) {
  g = commitV22(g);
  for (let i = 0; i < 100 && !g.outcome; i++)
    try {
      g = act(g, g.pendingEvent ? { type: "respond", choice: "mitigar" } : { type: "advance" }, false);
    } catch {
      g = act(g, { type: "abandon" }, false);
    }
  return g;
}
/** Answers every practice question correctly at the first attempt. */
function practiceAll(g: GameState) {
  for (const q of questionsV2(g).filter((q) => q.phase <= g.maxPhase && q.phase < 7 && !g.v2?.assessments[q.id]?.solved)) g = act(g, { type: "answerV2", id: q.id, choices: q.answers } as Action);
  return g;
}
describe("Puntuación integral", () => {
  it("cada dimensión se compone de actividades y el desglose suma exactamente la nota base", () => {
    const g = finish(prepareV2("agua")),
      a = g.outcome!.assessment!;
    expect(a.dimensions).toHaveLength(13);
    for (const d of a.dimensions) {
      expect(d.parts?.length).toBeGreaterThan(0);
      expect(d.parts!.reduce((n, p) => n + p.share, 0)).toBeCloseTo(1, 6);
      expect(d.parts!.reduce((n, p) => n + p.share * p.value, 0)).toBeCloseTo(d.value, 6);
    }
    const rows = scoreBreakdown(a.dimensions);
    expect(rows.reduce((n, r) => n + r.points, 0)).toBeCloseTo(a.base, 6);
    expect(rows.reduce((n, r) => n + r.weight, 0)).toBeCloseTo(1, 6);
    const names = rows.map((r) => r.activity).join(" | ");
    for (const activity of ["Construcción del Árbol del problema", "Mapa de actores", "Cadena de valor", "Presupuesto", "Indicadores", "Objetivos general y específicos", "Flujo financiero", "Respuestas al comité evaluador", "ODS justificados", "Práctica de conceptos"])
      expect(names).toContain(activity);
  });
  it("responder bien la práctica sube la nota; sin practicar, esa parte vale 0", () => {
    const base = prepareV2("salud");
    expect(practiceScore(base).score).toBe(0);
    const practiced = practiceAll(base);
    expect(practiceScore(practiced).score).toBeGreaterThan(50);
    // The execution-stage questions open after committing: answer them too, then everything counts 100.
    const all = practiceAll(commitV22(practiced));
    expect(practiceScore(all).score).toBe(100);
    expect(practiceScore(all).answered).toBe(practiceScore(all).total);
    const a = finish(base).outcome!, b = finish(practiced).outcome!;
    expect(b.assessment!.base).toBeGreaterThan(a.assessment!.base);
    expect(b.score).toBeGreaterThan(a.score);
  });
  it("la negociación solo cuenta cuando el jugador negoció", () => {
    const g = prepareV2("agua");
    expect(negotiationScore(g)).toBeNull();
    const withTable: GameState = { ...g, v2: { ...g.v2!, negotiations: { actor0: { consulted: true, status: "cerrado", rounds: [] } } } };
    expect(negotiationScore(withTable)).toBe(60);
  });
});
