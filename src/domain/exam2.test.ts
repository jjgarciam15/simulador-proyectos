import { describe, it, expect } from "vitest";
import { examCase } from "../data/exam2";
import { examReference, examResults, decisionCredit, sensitivityOptions } from "./exam2";
import { referenceRows } from "./flows";

describe("Examen 2 (números verificables a mano)", () => {
  it("VPN financiero de A: −1000 + 60 × (anualidad 4 años al 12 %) + 660 / 1,12⁵", () => {
    const { rA } = examReference();
    const annuity = [1, 2, 3, 4].reduce((n, t) => n + 1 / 1.12 ** t, 0);
    expect(rA.npvF).toBeCloseTo(-1000 + 60 * annuity + 660 / 1.12 ** 5, 6);
    expect(rA.npvF).toBeCloseTo(-443.26, 1);
  });
  it("VPN económico de A al 9 % con RPC y beneficios valorados", () => {
    const { rA } = examReference();
    const p0 = -(800 * 0.903 + 200 * 0.607),
      pt = 300 - 20 - 60 * 1.018 - 30 * 0.903,
      p5 = pt + 600 * 0.903;
    const expected = p0 + [1, 2, 3, 4].reduce((n, t) => n + pt / 1.09 ** t, 0) + p5 / 1.09 ** 5;
    expect(rA.npvE).toBeCloseTo(expected, 6);
    expect(rA.npvE).toBeCloseTo(254.5, 0);
  });
  it("A tiene mayor VPN económico, pero B es más robusta: ambas decisiones pueden defenderse", () => {
    const { rA, rB, sA, sB } = examReference();
    expect(rA.npvE).toBeGreaterThan(rB.npvE);
    expect(sA.npvE).toBeLessThan(0);
    expect(sB.npvE).toBeGreaterThan(0);
    expect(sensitivityOptions().find((o) => o.correct)!.id).toBe("a");
    expect(decisionCredit("A", "vpn")).toBe(1);
    expect(decisionCredit("B", "robusta")).toBe(1);
    expect(decisionCredit("A", "robusta")).toBe(0);
  });
  it("la solución completa obtiene 100 y un examen vacío 0", () => {
    const A = examCase("A");
    const full = examResults({
      objective: "a",
      tradeoff: "a",
      sunk: "estudio",
      flow: referenceRows(A),
      npv: examReference().rA.npvF,
      impacts: { visitas: "impactoPositivo", aves: "impactoNegativo", sendero: "producto", guias: "efecto", degradado: "problema" },
      method: "viaje",
      benefit: 300,
      rpc: { obra: "obras", mo: "moNoCalificada", guias: "moCalificada", mant: "obras", entradas: "transferencia" },
      benefits: ["recreativo", "aves"],
      compare: "A",
      sensitivity: "a",
      decision: "B",
      reason: "robusta",
    });
    expect(full.total).toBe(100);
    expect(examResults({}).total).toBe(0);
  });
  it("penaliza el doble conteo y un flujo con errores con retroalimentación explicativa", () => {
    const A = examCase("A");
    const bad = examResults({
      flow: referenceRows(A).map((r) => (r.rubroId === "estudio" ? { ...r, kind: "inversion", timing: { type: "construccion" } } : r)),
      benefits: ["recreativo", "aves", "predios"],
    });
    const flow = bad.rows.find((r) => r.step === "Flujo financiero")!;
    expect(flow.points).toBeLessThan(flow.max);
    expect(flow.feedback).toMatch(/hundido/);
    expect(bad.rows.find((r) => r.step === "Flujo económico")!.points).toBeLessThan(8);
  });
  it("no da puntos a una plantilla de flujo sin rubros incluidos", () => {
    const A = examCase("A");
    const empty = examResults({ flow: referenceRows(A).map((r) => ({ ...r, kind: "excluir" as const })) });
    expect(empty.rows.find((r) => r.step === "Flujo financiero")!.points).toBe(0);
  });
});
