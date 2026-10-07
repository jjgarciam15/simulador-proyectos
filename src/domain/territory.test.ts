import { describe, expect, it } from "vitest";
import { scenarios, scenarioById } from "../data/scenarios";
import { territorialProfiles, lawSections } from "../data/ley388";
import { act, createGameV2, available } from "./engine";
import { prepareV2 } from "../testSupport/gameFixture";
import { sampleProject } from "../testSupport/projectFixture";
import { createMission, emptyStore, startGeneratedGame, upsertProject } from "./project/store";
import type { GameState } from "./types";
import {
  destinationQuestion,
  encajeQuestions,
  generatorQuestion,
  landEventProbability,
  legalQuestion,
  planInstrument,
  plusvaliaCase,
  projectTerritory,
  referenceTerritory,
  territorialConsequences,
  territoryActive,
  territoryComplete,
  territoryScore,
  type TerritoryAction,
} from "./territory";
import { regulationParts } from "./scoringV2";

/** A game in Regulation (phase 4) with the given alternative, before the territorial puzzles. */
function atRegulation(id: string, alternative: number, seed = "LEY388"): GameState {
  const g = prepareV2(id, createGameV2(id, "guiado", seed), alternative);
  // prepareV2 already solved the puzzles and moved on: go back to a clean Regulation stage.
  const back = structuredClone(g.v2!.territory ? { ...g, phase: 4 } : g);
  delete back.v2!.territory;
  return back;
}
const solve = (g: GameState) => referenceTerritory(g).reduce((x, a) => act(x, a), g);

describe("Ley 388 de 1997 · ordenamiento territorial", () => {
  it("el repaso cubre la ley y cada misión relaciona sus cuatro alternativas con un sitio", () => {
    expect(lawSections.map((x) => x.id)).toEqual(["principios", "planes", "adopcion", "suelo", "gestion", "adquisicion", "plusvalia"]);
    for (const s of scenarios) {
      expect(territorialProfiles[s.id], s.id).toBeDefined();
      expect(territorialProfiles[s.id].sites).toHaveLength(s.alternatives.length);
      // Private developers cannot invoke a utility motive (art. 59).
      expect(territorialProfiles[s.id].motive === null, s.id).toBe(s.role === "privado");
    }
    const soils = new Set(scenarios.flatMap((s) => territorialProfiles[s.id].sites.map((x) => x.soil)));
    expect([...soils].sort()).toEqual(["expansion", "proteccion", "rural", "suburbano", "urbano"]);
  });
  it("art. 9: el instrumento depende de la población", () => {
    expect(planInstrument(120000)).toBe("pot");
    expect(planInstrument(100000)).toBe("pbot");
    expect(planInstrument(30000)).toBe("pbot");
    expect(planInstrument(29999)).toBe("eot");
    expect(planInstrument(scenarioById("planta").population)).toBe("pbot");
  });
  it("todas las preguntas tienen 5 opciones, sin repetir, e incluyen la respuesta", () => {
    for (const s of scenarios)
      for (let i = 0; i < 4; i++) {
        const g = createGameV2(s.id, "guiado", "Q-" + i);
        g.alternative = "a" + i;
        for (const q of [...encajeQuestions(g), legalQuestion(g), generatorQuestion(g), destinationQuestion(g)]) {
          expect(q.options, `${s.id}/a${i}/${q.id}`).toHaveLength(5);
          expect(new Set(q.options.map((o) => o.id)).size).toBe(5);
          expect(q.options.some((o) => o.id === q.answer), `${s.id}/a${i}/${q.id}`).toBe(true);
        }
      }
  });
  it("las respuestas de referencia obtienen 100 en las nueve misiones y en cada alternativa", () => {
    for (const s of scenarios)
      for (let i = 0; i < 4; i++) {
        let g: GameState;
        try {
          g = atRegulation(s.id, i);
        } catch {
          continue; // a strategy that cannot be financed in this difficulty
        }
        g = solve(g);
        expect(territoryComplete(g), `${s.id}/a${i}`).toBe(true);
        expect(territoryScore(g), `${s.id}/a${i}`).toBe(100);
        expect(territorialConsequences(g).map((c) => c.title), `${s.id}/a${i}`).toEqual(["Ordenamiento territorial en regla"]);
      }
  });
  it("Regulación exige los tres puzzles para avanzar y una nueva alternativa los invalida", () => {
    const g = atRegulation("agua", 1);
    expect(() => act(g, { type: "next" })).toThrow(/ordenamiento territorial/);
    const solved = solve(g);
    expect(act(solved, { type: "next" }).phase).toBe(5);
    expect(territoryComplete({ ...solved, alternative: "a2" })).toBe(false);
    expect(() => act(solved, { type: "territory", puzzle: "encaje", answers: { instrument: "pot" } } as unknown as TerritoryAction)).toThrow(/cinco preguntas/);
  });
  it("suelo de protección: relocalizar a tiempo cuesta menos que una licencia negada al invertir", () => {
    const g = atRegulation("energia", 0),
      t = projectTerritory(g);
    expect(t.site.soil).toBe("proteccion");
    const [encaje] = referenceTerritory(g) as [Extract<TerritoryAction, { puzzle: "encaje" }>];
    const right = act(g, encaje);
    expect(right.month).toBe(g.month + 2);
    expect(right.cash).toBeLessThan(g.cash);
    const wrong = act(g, { ...encaje, answers: { ...encaje.answers, requirement: "rural" } });
    const late = territorialConsequences(wrong).find((c) => /protección/.test(c.title))!;
    expect(late.delay).toBe(6);
    expect(late.extraCost).toBeGreaterThan(g.cash - right.cash);
    expect(territorialConsequences(right).some((c) => /protección/.test(c.title))).toBe(false);
  });
  it("plusvalía: un proyecto público bien liquidado la recibe como cofinanciación; uno privado la paga", () => {
    const pub = atRegulation("movilidad", 0);
    expect(projectTerritory(pub).site.generator).toBe("obra");
    const pv = referenceTerritory(pub)[2],
      c = plusvaliaCase(pub);
    expect(c.amount).toBeCloseTo((((c.after - c.before) * c.area * c.rate) / 100) / 1e6, 1);
    expect(c.amount / scenarioById("movilidad").budget).toBeGreaterThan(0.02);
    expect(c.amount / scenarioById("movilidad").budget).toBeLessThan(0.06);
    const cofinanced = act(pub, pv);
    expect(cofinanced.cash).toBeCloseTo(pub.cash + c.amount, 5);
    expect(cofinanced.v2!.inflows).toBeCloseTo((pub.v2!.inflows ?? 0) + c.amount, 5);
    // A wrong liquidation receives nothing; confirming again does not pay twice.
    const wrong = act(pub, { ...pv, answers: { ...(pv.answers as object), amount: c.amount * 2 } } as TerritoryAction);
    expect(wrong.cash).toBe(pub.cash);
    expect(act(cofinanced, pv).cash).toBe(cofinanced.cash);

    const priv = atRegulation("planta", 3),
      privCase = plusvaliaCase(priv);
    expect(projectTerritory(priv).site.generator).toBe("aprovechamiento");
    const paid = act(priv, referenceTerritory(priv)[2]);
    expect(paid.cash).toBeCloseTo(priv.cash - privCase.amount, 5);
    // Not foreseeing it costs more and delays the license at the investment.
    const unpaid = territorialConsequences(priv).find((x) => /no prevista/.test(x.title))!;
    expect(unpaid.extraCost).toBeGreaterThan(privCase.amount);
    expect(unpaid.delay).toBe(2);
  });
  it("una ruta predial irregular aumenta el riesgo de predios sin liberar y se paga al invertir", () => {
    const g = atRegulation("movilidad", 0),
      [, route] = referenceTerritory(g);
    const good = act(g, route),
      bad = act(g, { type: "territory", puzzle: "predios", answers: { route: ["ocupar", "avaluo", "oferta"], legal: "periodo" } });
    expect(landEventProbability(bad)).toBeGreaterThan(landEventProbability(good) * 3);
    expect(territorialConsequences(bad).some((c) => /impugnable/.test(c.title))).toBe(true);
    expect(territorialConsequences(good).some((c) => /impugnable/.test(c.title))).toBe(false);
  });
  it("la ejecución puede traer «Predios sin liberar» y el resultado cuenta la Ley 388 en la nota", () => {
    let found = false;
    for (let i = 0; i < 12 && !found; i++) {
      let g = solve(atRegulation("movilidad", 0, "PREDIOS-" + i));
      g.v2!.territory!.predios = { route: ["ocupar", "avaluo", "oferta"], legal: "periodo" };
      g = act(g, { type: "next" });
      g = act(g, { type: "commit" });
      for (let k = 0; k < 60 && !g.outcome; k++) {
        if (g.pendingEvent?.id === "predios") found = true;
        try {
          g = act(g, g.pendingEvent ? { type: "respond", choice: "mitigar" } : { type: "advance" });
        } catch {
          g = act(g, { type: "abandon" });
        }
        expect(available(g)).toBeGreaterThanOrEqual(-0.000001);
      }
      const dim = g.outcome!.assessment!.dimensions.find((d) => d.name === "Regulación, territorio y ODS")!;
      expect(dim.parts!.map((p) => p.name)).toEqual(expect.arrayContaining(["Ley 388: encaje en el ordenamiento", "Ley 388: ruta de adquisición de predios", "Ley 388: participación en la plusvalía"]));
    }
    expect(found).toBe(true);
  });
  it("las partidas guardadas antes de 3.0 conservan sus reglas y su nota", () => {
    const g = prepareV2("agua");
    delete g.v2!.territoryRules;
    delete g.v2!.territory;
    expect(territoryActive(g)).toBe(false);
    expect(regulationParts(g).map((p) => p.name)).toEqual(["Regulación: diagnóstico y proporcionalidad", "ODS justificados"]);
    expect(territorialConsequences(g)).toEqual([]);
    expect(landEventProbability(g)).toBe(0);
  });
  it("los proyectos propios reciben un perfil territorial y resuelven los puzzles", () => {
    const p = sampleProject(),
      c = createMission(upsertProject(emptyStore(), p), p, { difficulty: "guiado", mode: "aprendizaje", duration: "completa" });
    if (!c.ok) throw new Error(JSON.stringify(c.errors));
    const g = startGeneratedGame(c.mission.id, "PROPIO-388"),
      s = scenarioById(g.scenarioId);
    for (const a of s.alternatives) {
      const t = projectTerritory(g, a.id);
      expect(t.generated).toBe(true);
      expect(["urbano", "expansion", "rural"]).toContain(t.site.soil);
    }
    expect(encajeQuestions(g)).toHaveLength(5);
  });
});
