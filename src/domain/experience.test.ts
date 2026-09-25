import { describe, it, expect } from "vitest";
import { createGame } from "./engine";
import { decisionMoment } from "./experience";
describe("Efectos de progreso", () => {
  it("recargar o explorar sin cambios no dispara una celebración", () => {
    const g = createGame("agua");
    expect(decisionMoment(g, structuredClone(g))).toBeNull();
  });
  it("prioriza la decisión de un evento sobre el avance del reloj", () => {
    const g = createGame("agua"),
      after = {
        ...g,
        elapsed: 3,
        pendingEvent: {
          id: "shock",
          name: "Ruta interrumpida",
          description: "",
          category: "technical",
          probability: 1,
          cost: 0.1,
          delay: 2,
          benefit: 0,
          study: "tecnico",
        },
      };
    expect(decisionMoment(g, after)?.cue).toBe("event");
  });
  it("distingue capítulos, avance y confirmación sin alterar la partida", () => {
    const g = createGame("agua"),
      original = JSON.stringify(g);
    expect(decisionMoment(g, { ...g, phase: 1 })?.cue).toBe("chapter");
    expect(decisionMoment(g, { ...g, elapsed: 3 })?.cue).toBe("progress");
    expect(
      decisionMoment(g, {
        ...g,
        journal: [
          {
            id: 1,
            phase: 0,
            month: 0,
            title: "Prueba",
            detail: "",
            cost: 0,
            time: 0,
          },
        ],
      })?.cue,
    ).toBe("confirm");
    expect(JSON.stringify(g)).toBe(original);
  });
});
