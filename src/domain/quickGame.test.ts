import { describe, expect, it } from "vitest";
import { act } from "./engine";
import { scenarioById, scenarios } from "../data/scenarios";
import { autoAdvance, autoStage, createQuickGame, quickSelection } from "./quickGame";
import { referenceStage, settle } from "./demo";
import { practiceScore } from "./scoreParts";
import type { GameState } from "./types";
import { sampleProject } from "../testSupport/projectFixture";
import { createMission, emptyStore, startGeneratedGame, upsertProject } from "./project/store";
import { quickGame } from "./quickGame";
import { decode } from "./storage";

/** Plays a chosen stage with the reference answers, as a careful player would, and advances. */
function playStage(g: GameState) {
  const phase = g.phase;
  g = settle(g);
  g = referenceStage(g, phase);
  if (phase < 5) g = act(g, { type: "next" }, false);
  return autoAdvance(settle(g));
}
function playQuick(id: string, stages: number[]) {
  let g = createQuickGame(id, "guiado", "RAPIDA-1", "aprendizaje", stages);
  for (let i = 0; i < 10 && !g.outcome; i++) {
    expect(stages).toContain(g.phase);
    g = playStage(g);
  }
  return g;
}

describe("partida rápida", () => {
  it("valida la selección de módulos", () => {
    expect(quickSelection([2])).toEqual([2]);
    expect(quickSelection([4, 1])).toEqual([1, 4]);
    expect(quickSelection([])).toBeNull();
    expect(quickSelection([7])).toBeNull();
    expect(quickSelection([1.5])).toBeNull();
    expect(quickSelection("2")).toBeNull();
    expect(() => createQuickGame("agua", "guiado", "X", "aprendizaje", [])).toThrow(/al menos un módulo/);
  });

  it("solo Preparación (planeación): arranca en esa etapa con las anteriores resueltas", () => {
    const g = createQuickGame("agua", "guiado", "RAPIDA-1", "aprendizaje", [2]);
    expect(g.phase).toBe(2);
    expect(g.v2!.quick).toEqual({ stages: [2] });
    expect(g.v2!.completed).toEqual(expect.arrayContaining([0, 1]));
    expect(g.alternative).not.toBe("");
    expect(g.v2!.tree).toBeTruthy();
    expect(autoStage(g, 0) && autoStage(g, 1) && !autoStage(g, 2) && autoStage(g, 3)).toBe(true);
    // The chosen stage is left for the player: nothing of it was filled in.
    expect(g.v2!.chain.length).toBe(0);
  });

  it("al terminar el último módulo elegido, el resto se resuelve y se llega a los resultados", () => {
    const g = playQuick("agua", [2]);
    expect(g.outcome).toBeTruthy();
    expect(g.phase).toBe(7);
  });

  it("todos los escenarios oficiales se pueden jugar con un solo módulo de cada etapa", () => {
    for (const s of scenarios)
      for (let stage = 0; stage <= 6; stage++) {
        const g = playQuick(s.id, [stage]);
        expect(g.outcome, `${s.id} · etapa ${stage}`).toBeTruthy();
      }
  }, 120_000);

  it("combina módulos no consecutivos y conserva la alternativa que elige el jugador", () => {
    let g = createQuickGame("salud", "profesional", "RAPIDA-2", "aprendizaje", [1, 4]);
    expect(g.phase).toBe(1);
    g = settle(referenceStage(g, 1));
    const other = scenarioById("salud").alternatives.find((a) => a.id !== g.alternative)!;
    g = act(g, { type: "alternative", id: other.id }, false);
    g = autoAdvance(settle(act(g, { type: "next" }, false)));
    // Preparation and Evaluation were solved for the player's alternative; the game waits in Regulation.
    expect(g.phase).toBe(4);
    expect(g.alternative).toBe(other.id);
    expect(g.v2!.v22!.flow!.builtFor).toBe(other.id);
    g = playStage(g);
    expect(g.outcome).toBeTruthy();
  });

  it("los ejercicios de práctica solo cuentan los de los módulos elegidos", () => {
    const g = playQuick("agua", [2]);
    const all = practiceScore({ ...g, v2: { ...g.v2!, quick: undefined } });
    expect(practiceScore(g).total).toBeLessThan(all.total);
  });

  it("la nota solo pondera las dimensiones de los módulos jugados", () => {
    const g = playQuick("agua", [2]),
      dims = g.outcome!.dimensions,
      weight = (name: string) => dims.find((d) => d.name === name)!.weight;
    expect(dims.reduce((n, d) => n + d.weight, 0)).toBeCloseTo(1, 6);
    expect(weight("Cadena de valor y presupuesto")).toBeGreaterThan(0);
    expect(weight("Efectos, impactos y valoración")).toBeGreaterThan(0);
    expect(weight("Práctica de conceptos")).toBeGreaterThan(0);
    for (const name of ["Diagnóstico y Árbol del problema", "Alternativa y objetivos", "Regulación, territorio y ODS", "Ejecución y servicio", "Coherencia y trazabilidad"]) expect(weight(name)).toBe(0);
    expect(g.outcome!.assessment!.bonus).toBe(0);
    expect(g.outcome!.assessment!.penalty).toBe(0);
    expect(g.outcome!.assessment!.notes.at(-1)).toMatch(/^Partida rápida: .*Preparación/);
    const score = Math.round(dims.reduce((n, d) => n + d.value * d.weight, 0));
    expect(g.outcome!.score).toBe(score);
  });

  it("una mala planeación baja la nota aunque las demás etapas estén resueltas", () => {
    const good = playQuick("agua", [2]);
    let bad = referenceStage(createQuickGame("agua", "guiado", "RAPIDA-1", "aprendizaje", [2]), 2);
    // A single management indicator, without a result to measure: a weak plan.
    bad = act(bad, { type: "indicators", value: [{ name: "Reuniones de coordinación", kind: "Gestión", baseline: 0, target: 1, unit: "reuniones", frequency: "Anual", source: "Actas", owner: "Equipo" }] }, false);
    bad = autoAdvance(settle(act(bad, { type: "next" }, false)));
    expect(bad.outcome!.score).toBeLessThan(good.outcome!.score);
  });

  it("los proyectos propios también admiten partida rápida", () => {
    const p = sampleProject(),
      c = createMission(upsertProject(emptyStore(), p), p, { difficulty: "guiado", mode: "aprendizaje", duration: "completa" });
    if (!c.ok) throw new Error(JSON.stringify(c.errors));
    for (let stage = 0; stage <= 6; stage++) {
      let g = quickGame(startGeneratedGame(c.mission.id, "PROPIO-Q"), [stage]);
      expect(g.phase).toBe(stage);
      for (let i = 0; i < 10 && !g.outcome; i++) g = playStage(g);
      expect(g.outcome, "etapa " + stage).toBeTruthy();
    }
  });

  it("elegir los siete módulos es una partida completa", () => {
    const g = createQuickGame("agua", "guiado", "X", "aprendizaje", [0, 1, 2, 3, 4, 5, 6]);
    expect(g.v2!.quick).toBeUndefined();
    expect(g.phase).toBe(0);
  });

  it("se guarda y se recupera; una selección dañada deja la partida como completa", () => {
    const g = createQuickGame("agua", "guiado", "X", "aprendizaje", [3]);
    expect(decode(JSON.stringify({ version: 1, active: g, history: [] })).active!.v2!.quick).toEqual({ stages: [3] });
    const bad = structuredClone(g);
    (bad.v2 as unknown as { quick: unknown }).quick = { stages: ["x"] };
    expect(decode(JSON.stringify({ version: 1, active: bad, history: [] })).active!.v2!.quick).toBeUndefined();
  });
});
