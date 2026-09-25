import { describe, it, expect } from "vitest";
import { scenarios, scenarioById } from "../data/scenarios";
import { missionImpacts } from "../data/impacts";
import { valuationMethods } from "../data/valuationMethods";
import { rpcTable, socialDiscountRate } from "../data/rpc";
import { act, createGameV2 } from "./engine";
import { prepareV2, commitV22, referenceImpacts } from "../testSupport/gameFixture";
import {
  generalObjectiveOptions,
  impactCards,
  impactReview,
  measurement,
  methodFitFor,
  methodOptions,
  objectivesScore,
  referenceValuation,
  specificObjectiveOptions,
  valuationSummary,
  valueImpact,
  valuableCards,
} from "./valuation";
import { missionFlowCase } from "./missionFlow";
import { detectEconomicErrors, detectFlowErrors, evaluate, referenceBenefits, referenceEconomic, referenceRows } from "./flows";
import { traceability } from "./traceability";
import { committeeQuestions, committeeScore } from "./committee";
import { compareAlternatives, decisionMatrix, decisionCriteria } from "./comparison";
import { decode } from "./storage";
import type { GameState } from "./types";

const finish = (g: GameState) => {
  g = commitV22(g);
  for (let i = 0; i < 100 && !g.outcome; i++)
    try {
      g = act(g, g.pendingEvent ? { type: "respond", choice: "mitigar" } : { type: "advance" }, false);
    } catch {
      g = act(g, !g.loans.some((l) => l.type === "credito") ? { type: "finance", source: "credito" } : { type: "abandon" }, false);
    }
  return g;
};

describe("Contenido académico V2.2", () => {
  it("cada misión tiene impactos valorables, uno negativo, un doble conteo y tarjetas trampa", () => {
    for (const s of scenarios) {
      const cards = missionImpacts[s.id];
      expect(cards.filter((c) => c.valuation && !c.valuation.overlap).reduce((n, c) => n + (c.kind === "impactoPositivo" ? c.valuation!.share : 0), 0)).toBeCloseTo(1, 6);
      expect(cards.some((c) => c.kind === "impactoNegativo" && c.valuation)).toBe(true);
      expect(cards.some((c) => c.valuation?.overlap)).toBe(true);
      expect(cards.some((c) => c.kind === "irrelevante" || c.kind === "efecto")).toBe(true);
      for (const c of cards.filter((c) => c.valuation)) expect(valuationMethods.some((m) => methodFitFor(c, m.id) === "optima")).toBe(true);
    }
  });
  it("la tabla RPC y la tasa social provienen de las fuentes documentadas", () => {
    expect(socialDiscountRate).toBe(0.09);
    expect(rpcTable.find((r) => r.id === "divisa")!.value).toBe(1.032);
    expect(rpcTable.find((r) => r.id === "moNoCalificada")!.value).toBe(0.607);
    expect(rpcTable.every((r) => r.source.length > 5)).toBe(true);
  });
  it("las metodologías ofrecidas son 5–7 e incluyen siempre la óptima", () => {
    for (const d of ["guiado", "profesional", "experto"] as const) {
      const g = prepareV2("agua", createGameV2("agua", d, "MET"));
      for (const c of valuableCards(g)) {
        const o = methodOptions(g, c);
        expect(o.length).toBeGreaterThanOrEqual(5);
        expect(o.length).toBeLessThanOrEqual(7);
        expect(o.some((m) => methodFitFor(c, m.id) === "optima")).toBe(true);
      }
    }
  });
});

describe("Objetivos, efectos e impactos", () => {
  it("el objetivo general transforma el problema y los específicos transforman las causas", () => {
    const g = prepareV2();
    expect(generalObjectiveOptions(g).find((o) => o.valid)!.id).toBe("n0");
    expect(specificObjectiveOptions(g).filter((o) => o.valid).map((o) => o.id).sort()).toEqual(["n1", "n2"]);
    expect(objectivesScore(g)).toBe(100);
    const wrong = { ...g, v2: { ...g.v2!, v22: { ...g.v2!.v22!, objectives: { general: "n4", specific: ["n1", "act"] } } } };
    expect(objectivesScore(wrong)).toBeLessThan(40);
  });
  it("distingue efectos del problema, efectos del proyecto e impactos", () => {
    const g = prepareV2();
    const cards = impactCards(g);
    expect(cards.find((c) => c.id === "problema")!.kind).toBe("problema");
    expect(cards.some((c) => c.kind === "efecto")).toBe(true);
    const confused = referenceImpacts(g).map((p) => (p.id === "problema" ? { ...p, kind: "efecto" as const } : p));
    expect(impactReview(g, confused).score).toBeLessThan(impactReview(g, referenceImpacts(g)).score);
  });
});

describe("Valoración económica", () => {
  it("medir no es valorar: la medición no depende del método y el valor sí", () => {
    const g = prepareV2();
    const card = valuableCards(g).find((c) => c.valuation!.type === "salud")!;
    const m = measurement(g, card);
    const good = valueImpact(g, card, { impactId: card.id, method: "enfermedad", study: "completo", quantity: m.quantity });
    const bad = valueImpact(g, card, { impactId: card.id, method: "hedonicos", study: "basico", quantity: m.quantity });
    expect(good.quantity).toBe(bad.quantity);
    expect(good.fit).toBe("optima");
    expect(good.confidence).toBe("alta");
    expect(bad.fit).toBe("inadecuada");
    expect(bad.confidence).toBe("baja");
    expect(bad.high - bad.low).toBeGreaterThan(good.high - good.low);
    expect(good.annual).toBeCloseTo(good.truth, 8);
    expect(bad.feedback).toContain("no es adecuado");
  });
  it("acepta más de una metodología: óptima, válida y parcial puntúan distinto", () => {
    const g = prepareV2();
    const card = valuableCards(g).find((c) => c.valuation!.type === "salud")!;
    const q = measurement(g, card).quantity;
    const score = (method: string) =>
      valuationSummary(g, [{ impactId: card.id, method: method as never, study: "basico", quantity: q }]).rows[0].result.fit;
    expect(score("enfermedad")).toBe("optima");
    expect(score("contingente")).toBe("valida");
    expect(score("gastos")).toBe("parcial");
  });
  it("penaliza el doble conteo y la omisión de impactos negativos", () => {
    const g = prepareV2();
    const ref = referenceValuation(g);
    const overlap = valuableCards(g).find((c) => c.valuation!.overlap)!;
    const withOverlap = [...ref, { impactId: overlap.id, method: "hedonicos" as const, study: "basico" as const, quantity: measurement(g, overlap).quantity }];
    const negative = valuableCards(g).find((c) => c.kind === "impactoNegativo")!;
    expect(valuationSummary(g, withOverlap).score).toBeLessThan(valuationSummary(g, ref).score);
    expect(valuationSummary(g, ref.filter((c) => c.impactId !== negative.id)).missingNegative).toHaveLength(1);
  });
  it("un estudio completo cuesta dinero y tiempo una sola vez", () => {
    let g = prepareV2();
    g = act(g, { type: "visit", phase: 3 });
    const choices = referenceValuation(g).map((c) => ({ ...c, study: "completo" as const }));
    const cash = g.cash,
      month = g.month;
    g = act(g, { type: "valuation", choices });
    expect(g.cash).toBeLessThan(cash);
    expect(g.month).toBeGreaterThan(month);
    const again = act(g, { type: "valuation", choices });
    expect(again.cash).toBe(g.cash - scenarioById("agua").budget * 0.002);
  });
});

describe("Flujos de la misión", () => {
  it("el flujo de referencia no tiene errores y el VPN económico usa la tasa social del 9 %", () => {
    const g = prepareV2();
    const c = missionFlowCase(g)!;
    expect(detectFlowErrors(c, referenceRows(c))).toEqual([]);
    expect(detectEconomicErrors(c, referenceRows(c), referenceEconomic(c), referenceBenefits(c))).toEqual([]);
    expect(c.socialRate).toBe(0.09);
    expect(c.rubros.find((r) => r.id === "estudios")!.kind).toBe("excluir");
  });
  it("hay misiones donde el flujo financiero y el económico llevan a conclusiones distintas", () => {
    const differs = scenarios.some((s) => {
      const g = prepareV2(s.id);
      const c = missionFlowCase(g)!;
      const r = evaluate(c, referenceRows(c), referenceEconomic(c), referenceBenefits(c));
      return Math.sign(r.npvF) !== Math.sign(r.npvE);
    });
    expect(differs).toBe(true);
  });
  it("el presupuesto del jugador alimenta el flujo (trazabilidad)", () => {
    const g = prepareV2();
    const c = missionFlowCase(g)!;
    expect(c.rubros.find((r) => r.id === "supervision")!.amount).toBe(g.budget.oversight);
    expect(c.rubros.find((r) => r.id === "contingencia")!.amount).toBe(g.budget.contingency);
  });
});

describe("Cambio de alternativa a mitad de partida (trazabilidad)", () => {
  it("conserva el trabajo, marca revisión en efectos, valoración y flujos, y recalcula el caso", () => {
    let g = prepareV2();
    const before = structuredClone(g.v2!.v22!);
    const npvBefore = compareAlternatives(g).find((r) => r.chosen)!.npvE;
    g = act(g, { type: "visit", phase: 1 });
    g = act(g, { type: "alternative", id: "a2" });
    expect(g.v2!.v22!.flow).toEqual(before.flow);
    expect(g.v2!.v22!.valuation).toEqual(before.valuation);
    expect(g.v2!.reviews[2].join(" ")).toMatch(/efectos e impactos/);
    expect(g.v2!.reviews[3].join(" ")).toMatch(/valoración y los flujos/);
    const c = missionFlowCase(g)!;
    expect(detectFlowErrors(c, g.v2!.v22!.flow!.rows).some((e) => e.code === "monto")).toBe(true);
    expect(compareAlternatives(g).find((r) => r.chosen)!.npvE).not.toBe(npvBefore);
    expect(() => act(g, { type: "commit" })).toThrow();
  });
});

describe("Trazabilidad, comité y puntuación", () => {
  it("una partida coherente tiene trazabilidad alta y una estrategia mala detecta vacíos", () => {
    const good = prepareV2();
    const t = traceability(good);
    expect(t.level).not.toBe("Baja");
    let bad = act(prepareV2(), { type: "visit", phase: 3 });
    bad = act(bad, { type: "valuation", choices: [] });
    bad = act(bad, { type: "visit", phase: 4 });
    bad = act(bad, { type: "alignment", sdgs: [1, 5, 14], policy: false });
    const tb = traceability(bad);
    const codes = tb.gaps.map((x) => x.code);
    expect(codes).toEqual(expect.arrayContaining(["impacto-sin-valoracion", "ods-sin-impacto"]));
    expect(tb.score).toBeLessThan(t.score);
  });
  it("las preguntas del comité se derivan de la partida y la respuesta más fuerte obtiene 100", () => {
    const g = prepareV2();
    const qs = committeeQuestions(g);
    expect(qs.map((q) => q.id)).toEqual(expect.arrayContaining(["inversion", "demanda", "critica", "valoracion", "ods"]));
    expect(committeeScore(g)).toBe(100);
    const wrong = { ...g, v2: { ...g.v2!, v22: { ...g.v2!.v22!, committee: { answers: Object.fromEntries(qs.map((q) => [q.id, q.options.reduce((w, o) => (o.credit < w.credit ? o : w)).id])) } } } };
    expect(committeeScore(wrong)).toBe(0);
  });
  it("sin comité no se puede comprometer la inversión", () => {
    const g = prepareV2();
    const noCommittee = { ...g, v2: { ...g.v2!, v22: { ...g.v2!.v22!, committee: undefined } } };
    expect(() => act(noCommittee, { type: "commit" })).toThrow(/comité/);
  });
  it("repetir confirmaciones no acumula puntos (anti-farmeo) y el guardado conserva V2.2", () => {
    let g = prepareV2();
    g = act(g, { type: "visit", phase: 1 });
    const s1 = objectivesScore(g);
    for (let i = 0; i < 3; i++) g = act(g, { type: "objectives", general: "n0", specific: ["n1", "n2"] });
    expect(objectivesScore(g)).toBe(s1);
    expect(g.v2!.v22!.attempts!.objectives).toBeGreaterThan(1);
    const restored = decode(JSON.stringify({ version: 1, active: g, history: [] })).active!;
    expect(restored.v2!.v22).toEqual(g.v2!.v22);
  });
  it("una estrategia deliberadamente mala recibe menos nota en valoración y flujos, con errores explicados", () => {
    const good = finish(prepareV2());
    let bad = act(prepareV2(), { type: "visit", phase: 3 });
    const c = missionFlowCase(bad)!;
    bad = act(bad, {
      type: "valuation",
      choices: valuableCards(bad).map((card) => ({ impactId: card.id, method: "hedonicos", study: "basico", quantity: 1 })),
    });
    bad = act(bad, { type: "flow", rows: referenceRows(c).map((r) => (r.rubroId === "estudios" ? { ...r, kind: "inversion", timing: { type: "construccion" } } : r.rubroId === "tarifas" ? { ...r, kind: "operacion" } : r)) });
    const c2 = missionFlowCase(bad)!;
    bad = act(bad, { type: "economic", rows: referenceEconomic(c2).map((e) => ({ ...e, rpc: "obras" })), benefits: c2.benefits.map((b) => b.id) });
    for (const p of [3, 4]) {
      bad = act(bad, { type: "visit", phase: p });
      if (p === 3) bad = act(bad, { type: "ack", id: "evaluation" });
      bad = act(bad, { type: "next" });
    }
    const done = finish(bad);
    const dim = (g: GameState, n: string) => g.outcome!.assessment!.dimensions.find((d) => d.name === n)!.value;
    expect(dim(done, "Efectos, impactos y valoración")).toBeLessThan(dim(good, "Efectos, impactos y valoración"));
    expect(dim(done, "Flujos, VPN y RPC")).toBeLessThan(dim(good, "Flujos, VPN y RPC"));
    expect(done.outcome!.score).toBeLessThan(good.outcome!.score);
  });
  it("la matriz de decisión orienta sin declarar un ganador universal: cambia con los pesos", () => {
    const rows = compareAlternatives(prepareV2());
    const top = (m: ReturnType<typeof decisionMatrix>) => m.reduce((b, r) => (r.score > b.score ? r : b)).id;
    expect(decisionCriteria.length).toBeGreaterThanOrEqual(6);
    const winners = new Set(decisionCriteria.map((c) => top(decisionMatrix(rows, { [c.id]: 1 }))));
    expect(winners.size).toBeGreaterThan(1);
    expect(new Set(rows.map((r) => Math.round(r.npvE))).size).toBeGreaterThan(1);
  });
});
