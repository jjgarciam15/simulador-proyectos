import { describe, it, expect } from "vitest";
import { scenarios, scenarioById } from "../data/scenarios";
import { createGameV2, act, budgetFor, defaultActivities, type Action } from "./engine";
import { prepareV2, commitV22 } from "../testSupport/gameFixture";
import { referenceTree } from "./problemTree";
import type { GameState } from "./types";

let seed = 7;
const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const pick = <T,>(a: readonly T[]) => a[Math.floor(rnd() * a.length)];
const internal = (e: unknown) => !(e instanceof Error) || e instanceof TypeError || e instanceof RangeError || e instanceof ReferenceError;

/** Valid and malformed actions for the current state (malformed ones mimic a corrupted save or a future bug). */
function randomAction(g: GameState): Action {
  const sc = scenarioById(g.scenarioId),
    junk = pick<unknown>([undefined, null, NaN, -1, 1e12, "x", [], {}, [null], [{}], ["x", 3], { a: null }, [{ id: null, name: 5 }]]),
    chosen = sc.alternatives.find((a) => a.id === g.alternative);
  const actions: unknown[] = [
    { type: "next" },
    { type: "advance" },
    { type: "abandon" },
    { type: "waitGrant" },
    { type: "commit" },
    { type: "resetStage" },
    { type: "study", id: pick([...sc.studies.map((x) => x.id), "zz"]) },
    { type: "actor", id: pick([...sc.actors.map((a) => a.id), "zz"]), choice: pick(["consultar", "negociar", "ignorar", "zz"]) },
    { type: "nodes", ids: pick([["n0", "n1"], ["zz"], junk]) },
    { type: "tree", placements: pick([referenceTree(g), {}, { n0: "central" }, junk]) },
    { type: "objective", id: pick(["n0", "n1", "zz"]) },
    { type: "target", value: pick([sc.affected, junk, 0]) },
    { type: "alternative", id: pick([...sc.alternatives.map((a) => a.id), "zz"]) },
    { type: "budget", value: pick([chosen ? budgetFor(g, chosen) : junk, junk]), lines: pick([undefined, [], junk]) },
    { type: "activities", value: pick([chosen ? defaultActivities(g) : [], junk]) },
    { type: "finance", source: pick(["credito", "cofinanciacion", "socio", "zz"]) },
    { type: "reopen", phase: pick([0, 1, 2, 3, junk]) },
    { type: "visit", phase: pick([0, 1, 2, 7, junk]) },
    { type: "respond", choice: pick(["continuar", "mitigar", "redimensionar", "aplazar", "abandonar"]) },
    { type: "mitigate", id: pick([...sc.risks.map((r) => r.id), "zz"]) },
    { type: "dilemma", choice: pick(["a", "b", junk]) },
    { type: "chain", cards: junk, connections: junk },
    { type: "actorMap", value: junk },
    { type: "sdgReasons", value: junk },
    { type: "regulatory", value: junk },
    { type: "planner", value: junk },
    { type: "indicators", value: junk },
    { type: "alignment", sdgs: pick([[1, 6], junk]), policy: true },
    { type: "policy", id: pick([...sc.instruments.map((p) => p.id), "zz"]), failure: "x" },
    { type: "objectives", general: "n0", specific: pick([["n1", "n2"], junk]) },
    { type: "answerV2", id: "applied-gap", choices: pick([["reason"], junk]) },
    { type: "hintV2", id: "applied-gap" },
    { type: "reflection", text: junk },
    { type: "justify", text: pick(["x", junk]) },
    { type: "stageTime", phase: pick([0, junk]), seconds: pick([30, junk]) },
  ];
  return pick(actions) as Action;
}

/**
 * Robustness: seeded random actions, valid and malformed, over the nine missions.
 * Validation messages are expected; internal errors (TypeError, RangeError…) or non-finite resources are bugs.
 */
describe("Robustez del motor", () => {
  it("acciones aleatorias y malformadas nunca rompen el motor ni dejan recursos inválidos", () => {
    const bugs = new Map<string, string>();
    for (const sd of [7, 99]) {
      seed = sd;
      for (const s of scenarios)
        for (const start of [
          () => createGameV2(s.id, pick(["guiado", "profesional", "experto"] as const), "F" + s.id, pick(["aprendizaje", "evaluacion"] as const)),
          () => prepareV2(s.id),
          () => commitV22(prepareV2(s.id)),
        ]) {
          let g = start();
          for (let i = 0; i < 300 && !g.outcome; i++) {
            const a = randomAction(g);
            try {
              const n = act(g, a, false);
              for (const k of ["cash", "spent", "month", "committed", "phase"] as const)
                if (!Number.isFinite(n[k])) bugs.set(`${k} no finito tras ${a.type}`, JSON.stringify(a).slice(0, 200));
              g = n;
            } catch (e) {
              if (internal(e)) bugs.set(`${a.type}: ${e instanceof Error ? e.message : String(e)}`, JSON.stringify(a).slice(0, 200));
            }
          }
        }
    }
    expect([...bugs].map(([k, v]) => `${k} → ${v}`)).toEqual([]);
  }, 30000);
});
