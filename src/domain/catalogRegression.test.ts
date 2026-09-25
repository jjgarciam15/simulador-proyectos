import { describe, it, expect } from "vitest";
import { scenarios } from "../data/scenarios";
import { act, createGameV2, available } from "./engine";
import { prepareV2 } from "../testSupport/gameFixture";
import type { Difficulty, GameState } from "./types";
import { decode } from "./storage";
function execute(g: GameState) {
  g = act(g, { type: "commit" }, false);
  for (let i = 0; i < 100 && !g.outcome; i++) {
    try {
      g = act(
        g,
        g.pendingEvent
          ? { type: "respond", choice: "mitigar" }
          : { type: "advance" },
        false,
      );
    } catch (error) {
      if (
        !(error instanceof Error) ||
        !error.message.includes("Saldo insuficiente")
      )
        throw error;
      g = act(
        g,
        !g.loans.some((l) => l.type === "credito")
          ? { type: "finance", source: "credito" }
          : { type: "abandon" },
        false,
      );
    }
    expect(available(g)).toBeGreaterThanOrEqual(-0.000001);
    expect(g.cash + g.spent).toBeCloseTo(
      g.v2!.initialCash + g.loans.reduce((sum, l) => sum + l.principal, 0),
      5,
    );
  }
  expect(g.outcome).toBeTruthy();
  return g;
}
describe("Catálogo completo por dificultad", () => {
  for (const s of scenarios)
    for (const difficulty of [
      "guiado",
      "profesional",
      "experto",
    ] as Difficulty[])
      it(`${s.id} / ${difficulty}: cuatro estrategias, reproducción y al menos un cierre viable`, () => {
        const results: GameState[] = [];
        for (let index = 0; index < 4; index++) {
          let initial: GameState;
          try {
            initial = prepareV2(
              s.id,
              createGameV2(s.id, difficulty, "CATALOGO-2026"),
              index,
            );
          } catch (error) {
            if (
              error instanceof Error &&
              /presupuesto|recursos|Saldo/.test(error.message)
            )
              continue;
            throw error;
          }
          const done = execute(initial);
          results.push(done);
          expect(done.outcome!.score).toBeGreaterThanOrEqual(0);
          expect(done.outcome!.score).toBeLessThanOrEqual(100);
          if (index === 2) {
            const restored = decode(
              JSON.stringify({ version: 1, active: initial, history: [] }),
            ).active!;
            const replay = execute(restored);
            expect(replay.outcome).toEqual(done.outcome);
            expect(replay.eventIds).toEqual(done.eventIds);
          }
        }
        expect(results.length).toBeGreaterThanOrEqual(2);
        expect(
          results.some((g) => g.outcome!.status === "completado"),
          results
            .map(
              (g) => `${g.alternative}: ${g.outcome!.status}, mes ${g.month}`,
            )
            .join("; "),
        ).toBe(true);
        expect(
          new Set(results.map((g) => g.outcome!.financial)).size,
        ).toBeGreaterThan(1);
      });
  it("ninguna tecnología domina todas las dimensiones iniciales modeladas", () => {
    for (const s of scenarios)
      for (const a of s.alternatives)
        for (const b of s.alternatives.filter((b) => b.id !== a.id)) {
          const av = [
            -a.capex,
            -a.opex,
            a.revenue,
            a.social,
            a.coverage,
            -a.months,
            -a.risk,
            a.equity,
            a.environment,
            -a.complexity,
            a.flexibility,
          ];
          const bv = [
            -b.capex,
            -b.opex,
            b.revenue,
            b.social,
            b.coverage,
            -b.months,
            -b.risk,
            b.equity,
            b.environment,
            -b.complexity,
            b.flexibility,
          ];
          expect(
            av.every((v, i) => v >= bv[i]) && av.some((v, i) => v > bv[i]),
            `${s.id}: ${a.id} domina ${b.id}`,
          ).toBe(false);
        }
  });
});
