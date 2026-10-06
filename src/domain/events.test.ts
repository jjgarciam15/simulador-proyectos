import { describe, it, expect } from "vitest";
import { scenarios } from "../data/scenarios";
import { act } from "./engine";
import { validateMission } from "./missions";
import { prepareV2, commitV22 } from "../testSupport/gameFixture";
import type { GameState } from "./types";

/** Runs the execution with a modified event list and returns the ids of the events that fired. */
function runWith(id: string, patch: (e: (typeof scenarios)[number]["events"][number]) => typeof e) {
  const s = scenarios.find((x) => x.id === id)!,
    original = s.events;
  s.events = original.map(patch);
  try {
    let g: GameState = commitV22(prepareV2(id));
    for (let i = 0; i < 100 && !g.outcome; i++)
      try {
        g = act(g, g.pendingEvent ? { type: "respond", choice: "mitigar" } : { type: "advance" }, false);
      } catch {
        g = act(g, { type: "abandon" }, false);
      }
    return g.eventIds;
  } finally {
    s.events = original;
  }
}
describe("Eventos de ejecución condicionales", () => {
  it("cada evento declara como dato que su estudio reduce la probabilidad a la mitad", () => {
    for (const s of scenarios)
      for (const e of s.events) expect(e.modifiers).toContainEqual({ when: { hasStudy: e.study }, factor: 0.5 });
  });
  it("un evento cuya condición no se cumple nunca ocurre", () => {
    const fired = runWith("agua", (e) => ({ ...e, probability: 1, conditions: { role: "privado" } }));
    expect(fired.filter((id) => id !== "technical-reveal")).toEqual([]);
  });
  it("un modificador que se cumple cambia la probabilidad del evento", () => {
    const never = runWith("agua", (e) => ({ ...e, modifiers: [{ when: { role: "publico" }, factor: 1e-9 }] }));
    expect(never.filter((id) => id !== "technical-reveal")).toEqual([]);
    const always = runWith("agua", (e) => ({ ...e, probability: 1, modifiers: [{ when: { role: "publico" }, factor: 50 }] }));
    expect(always.filter((id) => id !== "technical-reveal").length).toBeGreaterThan(0);
  });
  it("la validación rechaza modificadores inválidos", () => {
    const s = scenarios[0];
    expect(validateMission({ ...s, events: s.events.map((e, i) => (i ? e : { ...e, modifiers: [{ when: {}, factor: -1 }] })) })).toContain("Modificador de probabilidad inválido en el evento: " + s.events[0].id);
  });
});
