import { describe, it, expect } from "vitest";
import { scenarios, scenarioById } from "../data/scenarios";
import { dilemmaTemplates } from "../data/dilemmas";
import { act, createGameV2, available, projectCost } from "./engine";
import { prepareV2, settleDilemma } from "../testSupport/gameFixture";
import { drawDilemma, dilemmaProbability, matches, pendingDilemma } from "./dilemmas";
import {
  failureSeverity,
  instrumentNet,
  puzzleDeck,
  puzzleKey,
  puzzleResult,
  puzzleSlots,
  recommendedPolicies,
  severityEstimate,
} from "./regulationLab";
import { budgetGuide, budgetReview } from "./budgetReview";
import { adjustments, coherenceMatrix, transversalCoherence } from "./coherence";
import { chainBank, chainReview, chainV2Score, sdgReview } from "./projectV2";
import { outcomeLedger } from "./ledger";
import { referenceTree } from "./problemTree";
import { validateDilemmas, validateRegulationLab } from "./missions";
import { decode } from "./storage";
import type { GameState } from "./types";

function toStage(g: GameState, phase: number) {
  return act(g, { type: "visit", phase });
}
function finish(g: GameState) {
  g = act(g, { type: "commit" }, false);
  for (let i = 0; i < 100 && !g.outcome; i++) {
    try {
      g = act(g, g.pendingEvent ? { type: "respond", choice: "mitigar" } : { type: "advance" }, false);
    } catch {
      g = act(g, !g.loans.some((l) => l.type === "credito") ? { type: "finance", source: "credito" } : { type: "abandon" }, false);
    }
  }
  return g;
}

describe("Validación de contenido configurable", () => {
  it("los dilemas y el laboratorio regulatorio no tienen errores de configuración", () => {
    expect(validateDilemmas()).toEqual([]);
    for (const s of scenarios) expect(validateRegulationLab(s)).toEqual([]);
  });
});

describe("Motor de dilemas", () => {
  it("el dilema de prioridad siempre aparece al completar Formulación y bloquea avanzar", () => {
    let g = createGameV2("agua", "guiado", "DILEMA-1");
    g = act(g, { type: "nodes", ids: ["n0", "n1", "n2", "n3", "n4"] });
    g = act(g, {
      type: "mga",
      section: "links",
      value: { ...g.mga!, links: [{ from: "n2", to: "n1" }, { from: "n1", to: "n0" }, { from: "n0", to: "n3" }, { from: "n3", to: "n4" }] },
    });
    g = act(g, { type: "tree", placements: referenceTree(g) });
    g = settleDilemma(act(g, { type: "next" }));
    g = act(g, { type: "objective", id: "n0" });
    g = act(g, { type: "alternative", id: "a1" });
    g = act(g, { type: "objectives", general: "n0", specific: ["n1", "n2"] });
    g = act(g, { type: "next" });
    expect(pendingDilemma(g)?.id).toBe("form-priority");
    expect(() => act(g, { type: "next" })).toThrow(/dilema/);
    const before = g.cash;
    g = act(g, { type: "dilemma", choice: "riesgo" });
    expect(pendingDilemma(g)).toBeNull();
    expect(g.cash).toBeLessThan(before);
    expect(g.v2!.delayed!.some((d) => d.effects.eventRisk === -0.1)).toBe(true);
    expect(g.journal.at(-1)!.title).toContain("Reducir riesgo");
  });
  it("las condiciones dependen de decisiones: comprar el estudio técnico evita el diseño barato", () => {
    const g = prepareV2("agua");
    const t = dilemmaTemplates.find((t) => t.id === "form-cheap-design")!;
    expect(matches({ ...g, studies: [] }, t.conditions)).toBe(true);
    expect(matches({ ...g, studies: ["tecnico"] }, t.conditions)).toBe(false);
  });
  it("la dificultad modifica la probabilidad y la semilla reproduce el sorteo", () => {
    const t = dilemmaTemplates.find((t) => t.id === "prep-inflation")!;
    const easy = createGameV2("agua", "guiado", "S"),
      hard = createGameV2("agua", "experto", "S");
    expect(dilemmaProbability(hard, t)).toBeGreaterThan(dilemmaProbability(easy, t));
    const a = prepareV2("agua", createGameV2("agua", "profesional", "REPRO")),
      b = prepareV2("agua", createGameV2("agua", "profesional", "REPRO"));
    expect(a.v2!.dilemmas).toEqual(b.v2!.dilemmas);
  });
  it("los efectos diferidos se aplican una sola vez al invertir y quedan en la bitácora", () => {
    let g = prepareV2("agua", undefined, 1, 0);
    const pending = g.v2!.delayed!.length;
    expect(pending).toBeGreaterThan(0);
    g = act(g, { type: "commit" }, false);
    expect(g.v2!.delayed).toEqual([]);
    expect(g.v2!.consequences!.filter((c) => c.kind === "diferida")).toHaveLength(pending);
    expect(g.journal.some((d) => d.title.startsWith("Consecuencia diferida"))).toBe(true);
  });
  it("una partida con dilema pendiente se guarda y se restaura", () => {
    let g = createGameV2("agua", "guiado", "SAVE");
    g.v2!.pendingDilemma = "form-priority";
    const restored = decode(JSON.stringify({ version: 1, active: g, history: [] })).active!;
    expect(pendingDilemma(restored)?.id).toBe("form-priority");
    g = act(restored, { type: "dilemma", choice: "liquidez" });
    expect(g.v2!.pendingDilemma).toBeUndefined();
  });
  it("no se repite el mismo dilema al volver a completar una etapa", () => {
    let g = prepareV2("agua");
    const count = g.v2!.dilemmas!.length;
    g = toStage(g, 1);
    g = act(g, { type: "next" });
    expect(g.v2!.dilemmas!.length).toBe(count);
    expect(drawDilemma({ ...g, phase: 1 }, 1)?.id).not.toBe("form-priority");
  });
});

describe("Laboratorio regulatorio", () => {
  it("la severidad oculta depende solo de la semilla y el estudio de demanda estrecha la estimación", () => {
    const g = createGameV2("agua", "profesional", "REG-1");
    expect(failureSeverity(g)).toBe(failureSeverity({ ...g, studies: ["demanda"] }));
    const blind = severityEstimate(g),
      studied = severityEstimate({ ...g, studies: ["demanda"] });
    expect(studied.high - studied.low).toBeLessThan(blind.high - blind.low);
    expect(studied.low).toBeLessThanOrEqual(failureSeverity(g));
    expect(studied.high).toBeGreaterThanOrEqual(failureSeverity(g));
  });
  it("no intervenir es la respuesta defendible cuando la falla es leve", () => {
    const g = createGameV2("agua");
    expect(recommendedPolicies(g, 0.3)).toContain("none");
    expect(recommendedPolicies(g, 1.4)).not.toContain("none");
    expect(instrumentNet(g, "strict", 1.4).net).toBeGreaterThan(instrumentNet(g, "none", 1.4).net);
  });
  it("existen semillas donde no intervenir es correcto y otras donde conviene regular", () => {
    const seeds = Array.from({ length: 40 }, (_, i) => "SEM-" + i).map((seed) => recommendedPolicies(createGameV2("agua", "guiado", seed)));
    expect(seeds.some((r) => r.includes("none"))).toBe(true);
    expect(seeds.some((r) => !r.includes("none"))).toBe(true);
  });
  it("el puzzle exige la cadena completa y coherente con el instrumento elegido", () => {
    let g = prepareV2("agua");
    g = toStage(g, 4);
    const key = puzzleKey(g),
      chain = Object.fromEntries(puzzleSlots.map((slot) => [slot, key[slot][0]]));
    expect(puzzleResult(g, chain).score).toBe(100);
    const wrong = { ...chain, Incentivo: "incentive:automatic" };
    expect(puzzleResult(g, wrong).score).toBeLessThan(100);
    expect(puzzleDeck(g).length).toBeGreaterThan(puzzleSlots.length * 3);
    g = act(g, {
      type: "regulatory",
      value: { evidence: "observed", incentive: "baseline", adverse: "persistence", reason: "Falla leve frente a costos.", chain },
    });
    expect(g.v2!.regulatory.chain).toEqual(chain);
    expect(() =>
      act(g, { type: "regulatory", value: { ...g.v2!.regulatory, chain: { ...chain, Problema: "problem:inventada" } } }),
    ).toThrow(/ocho eslabones/);
  });
  it("una regulación desproporcionada produce consecuencias sistémicas al invertir", () => {
    const seeds = Array.from({ length: 40 }, (_, i) => "FALLO-" + i);
    const seed = seeds.find((seed) => !recommendedPolicies(createGameV2("agua", "guiado", seed)).includes("strict"))!;
    let g = prepareV2("agua", createGameV2("agua", "guiado", seed));
    g = toStage(g, 4);
    g = act(g, { type: "policy", id: "strict", failure: "Monopolio natural" });
    g = settleDilemma(act(g, { type: "next" }));
    for (const p of [3]) {
      g = toStage(g, p);
      g = act(g, { type: "ack", id: "evaluation" });
      g = settleDilemma(act(g, { type: "next" }));
    }
    g = toStage(g, 5);
    if (projectCost(g) > available(g) && !g.loans.length) g = act(g, { type: "finance", source: "credito" });
    const before = g.performance;
    const committed = act(g, { type: "commit" }, false);
    expect(committed.v2!.consequences!.some((c) => c.title.includes("sobrerregulación"))).toBe(true);
    expect(committed.performance).toBeLessThan(before);
  });
});

describe("Presupuesto, coherencia y resultado", () => {
  it("el diagnóstico detecta presupuesto vacío, reserva excesiva y acuerdos sin respaldo", () => {
    const g = prepareV2("agua");
    const empty = budgetReview(g, { operation: 0, maintenance: 0, environment: 0, social: 0, oversight: 0, contingency: 0 });
    expect(empty.findings.some((f) => f.topic === "Operación" && f.level !== "ok")).toBe(true);
    expect(empty.score).toBeLessThan(60);
    const hoard = budgetReview(g, { ...g.budget, contingency: 20000 });
    expect(hoard.findings.some((f) => f.tag === "desperdicio" || f.tag === "inviable")).toBe(true);
  });
  it("la guía de referencia no rellena valores y no alcanza para dejar todo en el máximo", () => {
    for (const s of scenarios) {
      let g = prepareV2(s.id);
      g = toStage(g, 2);
      const guide = budgetGuide(g);
      expect(guide).toHaveLength(6);
      const max = Object.fromEntries(guide.map((r) => [r.key, r.high])) as unknown as GameState["budget"];
      expect(projectCost({ ...g, budget: max })).toBeGreaterThan(projectCost(g));
    }
    expect(createGameV2("agua").budget.operation).toBe(0);
  });
  it("la matriz de coherencia explica cada relación y penaliza la cadena construida con otra alternativa", () => {
    let g = prepareV2("agua");
    const m = coherenceMatrix(g);
    expect(m.length).toBe(7);
    expect(m.every((l) => l.reason.length > 10)).toBe(true);
    const before = transversalCoherence(g);
    g = toStage(g, 1);
    g = act(g, { type: "alternative", id: "a2" });
    expect(transversalCoherence(g)).toBeLessThan(before);
  });
  it("la cadena reconoce tarjetas parciales y distractores", () => {
    const g = prepareV2("agua");
    const bank = chainBank(g);
    expect(bank.length).toBeGreaterThanOrEqual(20);
    expect(bank.some((c) => c.partial)).toBe(true);
    const partial = bank.find((c) => c.id === "contract")!;
    const withPartial = { ...g, v2: { ...g.v2!, chain: [...g.v2!.chain, { id: partial.id, level: partial.level }] } };
    expect(chainReview(withPartial).find((r) => r.id === "contract")!.status).toBe("parcial");
    expect(chainV2Score(withPartial)).toBeLessThan(chainV2Score(g));
  });
  it("seleccionar todos los ODS no es una estrategia válida", () => {
    let g = prepareV2("agua");
    g = toStage(g, 4);
    const all = Array.from({ length: 17 }, (_, i) => i + 1);
    g = act(g, { type: "alignment", sdgs: all, policy: false });
    g = act(g, {
      type: "sdgReasons",
      value: Object.fromEntries(all.map((id) => [id, { kind: "directa", evidence: "resultado", text: "Contribuye." }])),
    });
    const review = sdgReview(g);
    expect(review.excess).toBeGreaterThan(10);
    expect(adjustments(g).penalties.some((p) => p.label === "ODS indiscriminados")).toBe(true);
  });
  it("el resultado final explica doce dimensiones (V2.2), ajustes, historia y aciertos/errores", () => {
    const g = finish(prepareV2("agua"));
    const a = g.outcome!.assessment!;
    expect(a.dimensions).toHaveLength(12);
    expect(a.dimensions.reduce((n, d) => n + d.weight, 0)).toBeCloseTo(1);
    expect(a.coherence!.length).toBe(7);
    expect(a.story).toMatch(/cobertura/);
    expect(g.outcome!.score).toBe(
      Math.round(Math.min(100, Math.max(0, a.base - a.penalty + (a.bonus ?? 0))) * (["abandonado", "insolvencia"].includes(g.outcome!.status) ? 0.35 : 1)),
    );
    const ledger = outcomeLedger(g);
    expect(ledger.some((l) => l.ok)).toBe(true);
    expect(ledger.some((l) => !l.ok)).toBe(true);
    expect(new Set(ledger.map((l) => l.stage)).size).toBeGreaterThanOrEqual(5);
  });
  it("el fondo inicial difiere por dificultad", () => {
    const [e, p, x] = (["guiado", "profesional", "experto"] as const).map((d) => createGameV2("agua", d).cash);
    expect(e).toBeGreaterThan(p);
    expect(p).toBeGreaterThan(x);
    expect(x).toBeCloseTo(scenarioById("agua").budget * 0.85);
  });
});
