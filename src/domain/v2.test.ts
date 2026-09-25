import { projectReport } from "./recognition";
import { forkDecision } from "./engine";
import { challenges, challengeProgress } from "./challenges";
import type { GameState } from "./types";
import { describe, it, expect } from "vitest";
import { createGameV2, act } from "./engine";
import { decode } from "./storage";
import { chainBank, chainV2Score, chainLevels } from "./projectV2";
import { scenarios, scenarioById } from "../data/scenarios";
import { budgetFor, defaultActivities, projectCost, available } from "./engine";
import { questionsV2 } from "./questionsV2";
import { validateMission } from "./missions";
import { scoreV2 } from "./scoringV2";

import {prepareV2} from '../testSupport/gameFixture';
describe("Fundamentos V2", () => {
  it("visita etapas desbloqueadas sin gastar ni borrar", () => {
    const g = createGameV2("agua");
    g.maxPhase = 5;
    g.phase = 5;
    g.v2!.completed = [0, 1, 2, 3, 4];
    const n = act(g, { type: "visit", phase: 1 });
    expect(n.cash).toBe(g.cash);
    expect(n.month).toBe(g.month);
    expect(n.maxPhase).toBe(5);
    expect(() =>
      act(createGameV2("agua"), { type: "visit", phase: 3 }),
    ).toThrow();
  });
  it("cambiar alternativa conserva presupuesto y cronograma e invalida dependencias", () => {
    const g = createGameV2("agua");
    g.phase = 1;
    g.maxPhase = 5;
    g.alternative = "a1";
    g.budget.maintenance = 400;
    g.activities = [
      {
        id: "x",
        name: "Diseño",
        cost: 20,
        months: 2,
        dependency: "",
        owner: "Equipo",
      },
    ];
    g.v2!.completed = [0, 1, 2, 3, 4];
    const next = act(g, { type: "alternative", id: "a2" });
    expect(next.budget).toEqual(g.budget);
    expect(next.activities).toEqual(g.activities);
    expect(next.v2!.reviews[2]).toHaveLength(1);
    expect(next.v2!.reviews[3]).toHaveLength(1);
    expect(next.month).toBe(1);
    expect(next.cash).toBeLessThan(g.cash);
    expect(g.month).toBe(0);
  });
  it("no compromete inversión con revisiones pendientes", () => {
    const g = createGameV2("agua");
    g.phase = 5;
    g.alternative = "a1";
    g.v2!.completed = [0, 1, 2, 3, 4];
    g.v2!.reviews[3] = ["Cambio de alternativa"];
    expect(() => act(g, { type: "commit" })).toThrow(/Revisa/);
  });
  it("mantiene las partidas en pausa y las dependencias al guardar", () => {
    const g = createGameV2("energia");
    g.v2!.reviews[2] = ["Cambio"];
    expect(
      decode(
        JSON.stringify({
          version: 1,
          active: null,
          history: [],
          suspended: [g],
        }),
      ).suspended?.[0],
    ).toEqual(g);
  });
});
describe("Construcción y evaluación V2", () => {
  it("liquida acuerdos una sola vez al invertir y al reproducir el contrafactual", () => {
    const g = prepareV2();
    g.v2!.negotiations = {
      actor0: { consulted: true, status: "acuerdo", rounds: [] },
    };
    g.budget.social = 500;
    // Baseline without agreements isolates the settlement from dilemma and regulatory consequences.
    const plain = act(
      { ...g, v2: { ...g.v2!, negotiations: {} } },
      { type: "commit" },
      false,
    );
    const backed = act(g, { type: "commit" }, false);
    expect(backed.support).toBe(plain.support + 8);
    expect(backed.reputation).toBe(plain.reputation + 3);
    const replay = act(
      backed.snapshot!.decisionState!,
      { type: "commit" },
      false,
    );
    expect(replay.support).toBe(backed.support);
    expect(replay.reputation).toBe(backed.reputation);
    const broken = { ...g, budget: { ...g.budget, social: 0 } };
    const result = act(broken, { type: "commit" }, false);
    expect(result.support).toBe(plain.support - 10);
    expect(result.reputation).toBe(plain.reputation - 12);
    expect(g.support).toBe(50);
  });
  it("reinicia una etapa sin reembolsar estudios ni borrar el trabajo posterior", () => {
    let g = prepareV2();
    g = act(g, { type: "visit", phase: 1 });
    const budget = structuredClone(g.budget),
      activities = structuredClone(g.activities),
      cash = g.cash;
    g = act(g, { type: "resetStage" });
    expect(g.alternative).toBe("");
    expect(g.budget).toEqual(budget);
    expect(g.activities).toEqual(activities);
    expect(g.cash).toBeCloseTo(
      cash - scenarioById(g.scenarioId).budget * 0.002,
    );
    expect(g.v2!.completed).not.toContain(1);
    expect(g.v2!.reviews[2].length).toBeGreaterThan(0);
    expect(() => act(g, { type: "visit", phase: 2 })).toThrow(/Selecciona/);
    expect(g.v2!.resetCount).toBe(1);
  });
  it("no permite reiniciar una inversión comprometida", () => {
    const g = act(prepareV2(), { type: "commit" }, false);
    expect(g.v2!.completed).toContain(5);
    expect(() => act(g, { type: "resetStage" })).toThrow(/ejecución/);
  });
  it("califica selección múltiple parcial sin premiar marcarlo todo", () => {
    let g = prepareV2();
    const q = questionsV2(g).find((q) => q.answers.length === 2)!;
    g = act(g, {
      type: "answerV2",
      id: q.id,
      choices: q.options.map((o) => o.id),
    });
    expect(g.v2!.assessments[q.id].score).toBe(0);
    g = act(g, { type: "answerV2", id: q.id, choices: q.answers.slice(0, 1) });
    expect(g.v2!.assessments[q.id].score).toBe(40);
    g = act(g, { type: "answerV2", id: q.id, choices: q.answers });
    expect(g.v2!.assessments[q.id].score).toBe(60);
  });
  it("los eventos posteriores no cambian la dimensión ex ante", () => {
    const g = act(prepareV2(), { type: "commit" }, false);
    const dimensions = Array.from({ length: 8 }, (_, i) => ({
      name: String(i),
      value: 50,
      weight: 0.125,
    }));
    const base = scoreV2(g, dimensions);
    const adverse = scoreV2(
      { ...g, quality: 1, extraCost: 10000 },
      dimensions.map((d) => ({ ...d, value: 0 })),
    );
    expect(base.dimensions[3].value).toBe(adverse.dimensions[3].value);
    expect(base.dimensions[6].value).not.toBe(adverse.dimensions[6].value);
  });
  it("detecta cadenas incorrectas y ciclos sin cambiar el original", () => {
    let g = prepareV2();
    expect(chainV2Score(g)).toBe(100);
    g = act(g, { type: "visit", phase: 2 });
    const bad = g.v2!.chain.map((c) => ({ ...c, level: chainLevels[0] }));
    expect(chainV2Score({ ...g, v2: { ...g.v2!, chain: bad } })).toBeLessThan(
      100,
    );
    expect(() =>
      act(g, {
        type: "chain",
        cards: g.v2!.chain,
        connections: [
          { from: "capital", to: "design" },
          { from: "design", to: "capital" },
        ],
      }),
    ).toThrow(/circulares/);
  });
  it("descuenta pistas e intentos sin repetir acciones económicas", () => {
    let g = createGameV2("agua");
    const q = questionsV2(g)[0];
    expect(q.options.length).toBeGreaterThanOrEqual(5);
    g = act(g, { type: "hintV2", id: q.id });
    g = act(g, {
      type: "answerV2",
      id: q.id,
      choices: [q.options.find((o) => !q.answers.includes(o.id))!.id],
    });
    g = act(g, { type: "answerV2", id: q.id, choices: q.answers });
    expect(g.v2!.assessments[q.id].score).toBe(79);
    expect(g.month).toBe(0);
    expect(() =>
      act(g, { type: "answerV2", id: q.id, choices: q.answers }),
    ).toThrow();
  });
  for (const s of scenarios)
    it("valida y completa V2: " + s.id, () => {
      expect(validateMission(s)).toEqual([]);
      let g = act(prepareV2(s.id), { type: "commit" }, false);
      for (let i = 0; i < 100 && !g.outcome; i++) {
        try {
          g = act(
            g,
            g.pendingEvent
              ? { type: "respond", choice: "mitigar" }
              : { type: "advance" },
            false,
          );
        } catch {
          g = act(
            g,
            !g.loans.some((l) => l.type === "credito")
              ? { type: "finance", source: "credito" }
              : { type: "abandon" },
            false,
          );
        }
      }
      expect(g.outcome?.assessment).toBeDefined();
      expect(g.outcome!.score).toBeGreaterThanOrEqual(0);
      expect(g.outcome!.score).toBeLessThanOrEqual(100);
      expect(
        g.outcome!.dimensions.reduce((n, d) => n + d.weight, 0),
      ).toBeCloseTo(1);
      expect(g.cash + g.spent).toBeCloseTo(
        g.v2!.initialCash + g.loans.reduce((n, l) => n + l.principal, 0),
      );
    });
});

describe("Modo reto", () => {
  function fresh(index = 0) {
    const c = challenges[index],
      g = createGameV2(c.scenarioId, c.difficulty, c.seed);
    g.v2!.challenge = structuredClone(c);
    return g;
  }
  it("bloquea crédito sin consumir recursos y conserva las partidas normales", () => {
    const g = fresh(),
      before = structuredClone(g);
    expect(() => act(g, { type: "finance", source: "credito" })).toThrow(
      /reto/,
    );
    expect(g).toEqual(before);
    expect(
      act(createGameV2("agua"), { type: "finance", source: "credito" }).loans,
    ).toHaveLength(1);
  });
  it("conserva las reglas al guardar y rechaza una configuración incompatible", () => {
    const g = fresh(),
      raw = () => JSON.stringify({ version: 1, active: g, history: [] });
    expect(decode(raw()).active?.v2?.challenge).toEqual(challenges[0]);
    g.v2!.challenge!.seed = "otra";
    expect(() => decode(raw())).toThrow(/reto/);
  });
  it("no entrega distinciones por abandonar ni por progreso provisional", () => {
    const g = fresh();
    expect(challengeProgress(g)?.won).toBe(false);
    expect(challengeProgress(act(g, { type: "abandon" }))?.won).toBe(false);
  });
  for (let index = 0; index < challenges.length; index++)
    it("permite una trayectoria ganadora: " + challenges[index].id, () => {
      let g = act(
        prepareV2(
          challenges[index].scenarioId,
          fresh(index),
          index === 1 ? 3 : 1,
        ),
        { type: "commit" },
        false,
      );
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
            !g.v2!.challenge!.noCredit &&
            !g.loans.some((l) => l.type === "credito")
          )
            g = act(g, { type: "finance", source: "credito" }, false);
          else throw error;
        }
      }
      expect(g.outcome).toBeTruthy();
      expect(
        challengeProgress(g),
        JSON.stringify({ outcome: g.outcome, progress: challengeProgress(g) }),
      ).toMatchObject({ won: true });
      expect(projectReport(g)).toContain("Distinción: formulador bajo presión");
      expect(forkDecision(g).v2?.challenge).toEqual(g.v2?.challenge);
      const originalChain = challengeProgress(g)!.goals[1].value;
      g.v2!.chain = [];
      expect(challengeProgress(g)!.goals[1].value).toBe(originalChain);
    });
});
