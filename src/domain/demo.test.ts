import { describe, it, expect } from "vitest";
import { presentationGame, referenceChain } from "./demo";
import { questionsV2 } from "./questionsV2";
import { chainV2Score, actorMapScore } from "./projectV2";
import { createGameV2 } from "./engine";

describe("Modo presentación", () => {
  it("la partida de ejemplo queda completa y resuelta con las respuestas de referencia", () => {
    const g = presentationGame("agua");
    expect(g.outcome?.status).toBe("completado");
    expect(g.phase).toBe(7);
    expect(g.v2!.completed).toEqual(expect.arrayContaining([0, 1, 2, 3, 4]));
    expect(g.outcome!.score).toBeGreaterThanOrEqual(90);
    for (const d of g.outcome!.assessment!.dimensions.filter((d) => !["Valor observado", "Ejecución y servicio", "Compromisos y riesgo", "Evaluación ex ante", "Coherencia y trazabilidad"].includes(d.name)))
      expect(d.value, d.name).toBe(100);
    // Every practice question answerable before the end is solved.
    expect(questionsV2(g).filter((q) => q.phase < 7).every((q) => g.v2!.assessments[q.id]?.solved)).toBe(true);
    expect(g.v2!.negotiations && Object.keys(g.v2!.negotiations).length).toBeGreaterThan(0);
    expect(g.studies.length).toBeGreaterThan(0);
    expect(g.mitigations.length).toBeGreaterThan(0);
  });
  it("es reproducible y funciona en las nueve misiones", () => {
    expect(presentationGame("agua").outcome).toEqual(presentationGame("agua").outcome);
    for (const id of ["movilidad", "residuos", "salud", "planta", "mercado", "energia", "alimentos", "vivienda"]) expect(presentationGame(id).outcome, id).not.toBeNull();
  });
  it("la cadena de referencia y el mapa de actores obtienen la nota máxima", () => {
    const g = presentationGame("salud");
    expect(chainV2Score(g)).toBe(100);
    expect(actorMapScore(g)).toBe(100);
    expect(referenceChain(createGameV2("salud")).cards.length).toBeGreaterThanOrEqual(5);
  });
});
