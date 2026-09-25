import { describe, it, expect } from "vitest";
import {
  criticalVariable,
  detectEconomicErrors,
  detectFlowErrors,
  discountFactor,
  evaluate,
  netFlow,
  npvSteps,
  referenceBenefits,
  referenceEconomic,
  referenceRows,
  rowCells,
  switchingValue,
  type FlowCase,
} from "./flows";

/** Hand-checkable case: horizon 3, built today, 10 % financial and 9 % social rate. */
const base: FlowCase = {
  id: "manual",
  title: "Caso de verificación manual",
  horizon: 3,
  constructionEnd: 0,
  financialRate: 0.1,
  socialRate: 0.09,
  rubros: [
    { id: "obra", label: "Obra", kind: "inversion", amount: 1000, timing: { type: "construccion" }, given: "entregado", rpc: "obras", why: "" },
    { id: "personal", label: "Personal", kind: "operacion", amount: 100, timing: { type: "operacion" }, given: "entregado", rpc: "moNoCalificada", why: "" },
    { id: "mant", label: "Mantenimiento", kind: "mantenimiento", amount: 50, timing: { type: "operacion" }, given: "calcular", formula: "5 % de la obra", rpc: "obras", why: "" },
    { id: "tarifas", label: "Tarifas", kind: "ingreso", amount: 600, timing: { type: "operacion" }, given: "entregado", rpc: "transferencia", why: "Ya está en los beneficios valorados." },
    { id: "residual", label: "Residual", kind: "residual", amount: 200, timing: { type: "final" }, given: "calcular", rpc: "obras", why: "" },
    { id: "estudio", label: "Estudio ya pagado", kind: "excluir", amount: 80, timing: { type: "ninguno" }, given: "entregado", rpc: "obras", why: "es un costo hundido." },
  ],
  benefits: [
    { id: "b1", label: "Beneficio valorado", annual: 700, source: "prueba" },
    { id: "dup", label: "Beneficio duplicado", annual: 300, overlap: "g", source: "prueba" },
  ],
};

describe("Flujo financiero y VPN (verificable a mano)", () => {
  it("ubica inversión en el periodo 0, operación en 1..N y residual al final", () => {
    const rows = referenceRows(base);
    expect(netFlow(base, rows)).toEqual([-1000, 450, 450, 650]);
    expect(rowCells(base, rows.find((r) => r.rubroId === "estudio")!)).toEqual([0, 0, 0, 0]);
  });
  it("calcula el VPN paso a paso: −1000 + 450/1,1 + 450/1,21 + 650/1,331 = 269,35", () => {
    const steps = npvSteps([-1000, 450, 450, 650], 0.1);
    expect(steps.rows[2].factor).toBeCloseTo(1 / 1.21, 10);
    expect(steps.rows[3].pv).toBeCloseTo(650 / 1.331, 8);
    expect(steps.npv).toBeCloseTo(269.35, 2);
    expect(discountFactor(0.1, 0)).toBe(1);
  });
  it("reparte la inversión cuando la construcción dura dos periodos y retrasa la operación", () => {
    const c = { ...base, constructionEnd: 1 };
    expect(netFlow(c, referenceRows(c))).toEqual([-500, -500, 450, 650]);
  });
  it("aplica RPC, excluye transferencias y suma beneficios valorados en el flujo económico", () => {
    const r = evaluate(base, referenceRows(base), referenceEconomic(base), referenceBenefits(base));
    // p0 = −1000 × 0,903; p1–p2 = 700 − 100 × 0,607 − 50 × 0,903; p3 = p1 + 200 × 0,903
    expect(r.economic[0]).toBeCloseTo(-903, 8);
    expect(r.economic[1]).toBeCloseTo(594.15, 8);
    expect(r.economic[3]).toBeCloseTo(774.75, 8);
    expect(r.npvE).toBeCloseTo(-903 + 594.15 / 1.09 + 594.15 / 1.09 ** 2 + 774.75 / 1.09 ** 3, 8);
    expect(r.npvE).toBeCloseTo(740.43, 2);
    expect(referenceBenefits(base)).toEqual(["b1"]);
  });
  it("un proyecto puede ser inviable financieramente y viable económicamente", () => {
    const c = { ...base, rubros: base.rubros.map((r) => (r.id === "tarifas" ? { ...r, amount: 100 } : r)) };
    const r = evaluate(c, referenceRows(c), referenceEconomic(c), referenceBenefits(c));
    expect(r.npvF).toBeLessThan(0);
    expect(r.npvE).toBeGreaterThan(0);
  });
});

describe("Detector de errores conceptuales", () => {
  it("detecta inversión en periodo incorrecto, ingreso como costo, costo hundido, residual mal ubicado y mantenimiento omitido", () => {
    const rows = referenceRows(base).map((r) => {
      if (r.rubroId === "obra") return { ...r, timing: { type: "operacion" as const } };
      if (r.rubroId === "tarifas") return { ...r, kind: "operacion" as const };
      if (r.rubroId === "estudio") return { ...r, kind: "inversion" as const, timing: { type: "construccion" as const } };
      if (r.rubroId === "residual") return { ...r, timing: { type: "periodo" as const, period: 0 } };
      return r;
    }).filter((r) => r.rubroId !== "mant");
    const codes = detectFlowErrors(base, rows).map((e) => e.code);
    expect(codes).toEqual(expect.arrayContaining(["periodo-inversion", "ingreso-como-costo", "hundido", "residual", "omitido"]));
    expect(detectFlowErrors(base, referenceRows(base))).toEqual([]);
  });
  it("detecta montos mal calculados con referencia a la fórmula", () => {
    const rows = referenceRows(base).map((r) => (r.rubroId === "mant" ? { ...r, amount: 5 } : r));
    const e = detectFlowErrors(base, rows).find((e) => e.rubroId === "mant")!;
    expect(e.code).toBe("monto");
    expect(e.message).toContain("5 % de la obra");
  });
  it("en el flujo económico detecta RPC incorrecta, transferencias y doble conteo", () => {
    const econ = referenceEconomic(base).map((e) =>
      e.rubroId === "tarifas" ? { ...e, rpc: "obras" as const } : e.rubroId === "personal" ? { ...e, rpc: "moCalificada" as const } : e,
    );
    const codes = detectEconomicErrors(base, referenceRows(base), econ, ["b1", "dup"]).map((e) => e.code);
    expect(codes).toEqual(expect.arrayContaining(["transferencia", "rpc", "doble-conteo"]));
    expect(detectEconomicErrors(base, referenceRows(base), referenceEconomic(base), referenceBenefits(base))).toEqual([]);
  });
});

describe("Sensibilidad, variable crítica y valor de quiebre", () => {
  const rows = referenceRows(base),
    econ = referenceEconomic(base),
    ben = referenceBenefits(base);
  it("el valor de quiebre anula el VPN económico", () => {
    const sv = switchingValue(base, rows, econ, ben, "benefits")!;
    expect(sv).not.toBeNull();
    expect(evaluate(base, rows, econ, ben, { benefits: sv.multiplier }).npvE).toBeCloseTo(0, 4);
    expect(sv.change).toBeLessThan(0);
  });
  it("identifica la variable que más reduce el VPN ante un cambio de 10 %", () => {
    const c = criticalVariable(base, rows, econ, ben);
    // In the economic flow tariffs are a transfer, so demand acts only through valued benefits: both tie.
    expect(["demand", "benefits"]).toContain(c.critical.id);
    expect(c.ranked.find((v) => v.id === "demand")!.delta).toBeCloseTo(c.ranked.find((v) => v.id === "benefits")!.delta, 8);
    // Financially, demand moves tariffs and becomes the critical variable.
    expect(criticalVariable(base, rows, econ, ben, "npvF").critical.id).toBe("demand");
    expect(c.ranked[0].delta).toBeLessThanOrEqual(c.ranked.at(-1)!.delta);
  });
  it("un retraso reduce el VPN y cambia la tasa de descuento solo cuando se indica", () => {
    const r0 = evaluate(base, rows, econ, ben),
      r1 = evaluate(base, rows, econ, ben, { delay: 1 });
    expect(r1.npvE).toBeLessThan(r0.npvE);
    expect(evaluate(base, rows, econ, ben, { rate: 0 }).npvF).toBeCloseTo(-1000 + 450 + 450 + 650, 8);
  });
});
