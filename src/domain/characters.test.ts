import { describe, expect, it } from "vitest";
import { createGameV2 } from "./engine";
import { moodFor, roleFor } from "./characters";
import { scenarioById } from "../data/scenarios";

describe("Personajes con estados", () => {
  it("el rol cambia con la etapa", () => {
    expect([0, 2, 4, 5, 6].map(roleFor)).toEqual(["Tutor", "Analista", "Regulador", "Evaluador", "Comunidad"]);
  });
  it("el estado refleja la situación de la partida", () => {
    const g = createGameV2("agua", "guiado", "CH-1");
    expect(moodFor(g)).toBe("idle");
    expect(moodFor({ ...g, phase: 3 })).toBe("thinking");
    expect(moodFor({ ...g, phase: 1 }, g)).toBe("positive");
    expect(moodFor({ ...g, cash: g.cash * 0.05 })).toBe("concerned");
    expect(moodFor({ ...g, pendingEvent: scenarioById("agua").events[0] })).toBe("warning");
    expect(moodFor({ ...g, outcome: { ...(g.outcome ?? {}), score: 80 } } as typeof g)).toBe("celebrating");
  });
});
