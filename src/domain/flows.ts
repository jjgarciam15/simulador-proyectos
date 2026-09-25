import { rpcById, type RpcCategory } from "../data/rpc";

/**
 * Motor de flujos: pure, testable functions over a generic FlowCase.
 * Sign convention: inflows (+), outflows (−). Period 0 is "today"; periods 1..N are years.
 * Rounding policy: values are kept unrounded; the UI formats money with 0 decimals (M COP),
 * rates with 1 decimal (%), RPC with 3 decimals and discount factors with 4 decimals.
 */
export type RubroKind =
  | "inversion"
  | "operacion"
  | "mantenimiento"
  | "reinversion"
  | "ingreso"
  | "residual"
  | "excluir";
export type Timing =
  | { type: "construccion" }
  | { type: "operacion" }
  | { type: "final" }
  | { type: "periodo"; period: number }
  | { type: "ninguno" };
export interface Rubro {
  id: string;
  label: string;
  kind: RubroKind;
  amount: number;
  timing: Timing;
  /** entregado: the case gives the value; calcular: the player computes it with `formula`; ingresar: the player estimates it. */
  given: "entregado" | "calcular" | "ingresar";
  formula?: string;
  rpc: RpcCategory;
  why: string;
}
export interface FlowBenefit {
  id: string;
  label: string;
  /** Annual economic value during operation (negative for damages). */
  annual: number;
  overlap?: string;
  source: string;
}
export interface FlowCase {
  id: string;
  title: string;
  horizon: number;
  /** Last construction period (0 = everything built today). */
  constructionEnd: number;
  financialRate: number;
  socialRate: number;
  rubros: Rubro[];
  benefits: FlowBenefit[];
}
export interface RowInput {
  rubroId: string;
  kind: RubroKind;
  amount: number;
  timing: Timing;
  /** Manual cell edits (Excel-like). */
  overrides?: Record<number, number>;
}
export interface EconomicRowInput {
  rubroId: string;
  rpc: RpcCategory;
}
export interface Shocks {
  investment?: number;
  om?: number;
  demand?: number;
  benefits?: number;
  residual?: number;
  rate?: number;
  horizon?: number;
  delay?: number;
}
export const kindLabels: Record<RubroKind, string> = {
  inversion: "Inversión",
  operacion: "Operación",
  mantenimiento: "Mantenimiento",
  reinversion: "Reinversión",
  ingreso: "Ingreso",
  residual: "Valor residual",
  excluir: "No incluir",
};
const costKinds: RubroKind[] = ["inversion", "operacion", "mantenimiento", "reinversion"];
export const sign = (k: RubroKind) => (k === "ingreso" || k === "residual" ? 1 : k === "excluir" ? 0 : -1);

export function operatingPeriods(c: FlowCase, s: Shocks = {}) {
  const horizon = s.horizon ?? c.horizon,
    start = c.constructionEnd + 1 + (s.delay ?? 0);
  return Array.from({ length: Math.max(0, horizon - start + 1) }, (_, i) => start + i);
}
/** Cells of a row, from its specification (kind, amount, timing) and manual overrides. */
export function rowCells(c: FlowCase, row: RowInput, s: Shocks = {}): number[] {
  const horizon = s.horizon ?? c.horizon,
    cells = Array<number>(horizon + 1).fill(0),
    sg = sign(row.kind);
  if (sg !== 0) {
    const t = row.timing;
    if (t.type === "construccion") {
      const n = c.constructionEnd + 1;
      for (let p = 0; p < n && p <= horizon; p++) cells[p] = (sg * row.amount) / n;
    } else if (t.type === "operacion")
      for (const p of operatingPeriods(c, s)) cells[p] = sg * row.amount;
    else if (t.type === "final") cells[horizon] = sg * row.amount;
    else if (t.type === "periodo" && t.period >= 0 && t.period <= horizon) cells[t.period] = sg * row.amount;
  }
  for (const [p, v] of Object.entries(row.overrides ?? {}))
    if (Number(p) <= horizon && Number.isFinite(v)) cells[Number(p)] = v;
  return cells;
}
/** Applies sensitivity multipliers by kind. */
function shocked(row: RowInput, s: Shocks): RowInput {
  const m =
    row.kind === "inversion" || row.kind === "reinversion"
      ? (s.investment ?? 1)
      : row.kind === "operacion" || row.kind === "mantenimiento"
        ? (s.om ?? 1)
        : row.kind === "ingreso"
          ? (s.demand ?? 1)
          : row.kind === "residual"
            ? (s.residual ?? 1)
            : 1;
  return { ...row, amount: row.amount * m };
}
export function referenceRow(r: Rubro): RowInput {
  return { rubroId: r.id, kind: r.kind, amount: r.amount, timing: r.timing };
}
export function referenceRows(c: FlowCase) {
  return c.rubros.map(referenceRow);
}
export function netFlow(c: FlowCase, rows: RowInput[], s: Shocks = {}) {
  const horizon = s.horizon ?? c.horizon,
    net = Array<number>(horizon + 1).fill(0);
  for (const row of rows) rowCells(c, shocked(row, s), s).forEach((v, p) => (net[p] += v));
  return net;
}
export const discountFactor = (rate: number, t: number) => 1 / Math.pow(1 + rate, t);
/** Step-by-step NPV: flow, discount factor and present value per period. */
export function npvSteps(flows: number[], rate: number) {
  const rows = flows.map((flow, period) => {
    const factor = discountFactor(rate, period);
    return { period, flow, factor, pv: flow * factor };
  });
  return { rows, npv: rows.reduce((n, r) => n + r.pv, 0) };
}
export const npv = (flows: number[], rate: number) => npvSteps(flows, rate).npv;

/* ---------------- Flujo económico ---------------- */
export function economicCells(c: FlowCase, row: RowInput, rpc: RpcCategory, s: Shocks = {}) {
  const factor = rpcById(rpc).value;
  return rowCells(c, shocked(row, s), s).map((v) => v * factor);
}
export function benefitCells(c: FlowCase, b: FlowBenefit, s: Shocks = {}) {
  const horizon = s.horizon ?? c.horizon,
    cells = Array<number>(horizon + 1).fill(0),
    m = (s.benefits ?? 1) * (s.demand ?? 1);
  for (const p of operatingPeriods(c, s)) cells[p] = b.annual * (b.annual > 0 ? m : 1);
  return cells;
}
export function economicNet(
  c: FlowCase,
  rows: RowInput[],
  econ: EconomicRowInput[],
  benefitIds: string[],
  s: Shocks = {},
) {
  const horizon = s.horizon ?? c.horizon,
    net = Array<number>(horizon + 1).fill(0);
  for (const row of rows) {
    const e = econ.find((x) => x.rubroId === row.rubroId);
    if (!e) continue;
    economicCells(c, row, e.rpc, s).forEach((v, p) => (net[p] += v));
  }
  for (const b of c.benefits.filter((b) => benefitIds.includes(b.id)))
    benefitCells(c, b, s).forEach((v, p) => (net[p] += v));
  return net;
}
export function referenceEconomic(c: FlowCase): EconomicRowInput[] {
  return c.rubros.filter((r) => r.kind !== "excluir").map((r) => ({ rubroId: r.id, rpc: r.rpc }));
}
/** Reference benefits: overlapping cards capitalize benefits already counted, so they are left out. */
export function referenceBenefits(c: FlowCase) {
  return c.benefits.filter((b) => !b.overlap).map((b) => b.id);
}

/* ---------------- Evaluación ---------------- */
export function evaluate(
  c: FlowCase,
  rows: RowInput[],
  econ: EconomicRowInput[],
  benefitIds: string[],
  s: Shocks = {},
) {
  const financial = netFlow(c, rows, s),
    economic = economicNet(c, rows, econ, benefitIds, s);
  return {
    financial,
    economic,
    npvF: npv(financial, s.rate ?? c.financialRate),
    npvE: npv(economic, s.rate ?? c.socialRate),
  };
}
export const scenarioShocks: Record<"optimista" | "base" | "pesimista", Shocks> = {
  optimista: { demand: 1.15, investment: 0.95, om: 0.95, benefits: 1.1 },
  base: {},
  pesimista: { demand: 0.85, investment: 1.15, om: 1.1, benefits: 0.9, delay: 1 },
};
export const stressTests: { id: string; label: string; shocks: Shocks }[] = [
  { id: "costos", label: "Costos +30 %", shocks: { investment: 1.3, om: 1.3 } },
  { id: "beneficios", label: "Beneficios −25 %", shocks: { benefits: 0.75 } },
  { id: "retraso", label: "Retraso de 2 años", shocks: { delay: 2 } },
  { id: "demanda", label: "Demanda −20 %", shocks: { demand: 0.8 } },
  { id: "combinado", label: "Combinación: costos +20 %, demanda −15 %, retraso 1 año", shocks: { investment: 1.2, om: 1.2, demand: 0.85, delay: 1 } },
];
export const sensitivityVariables = [
  { id: "investment", label: "Inversión" },
  { id: "om", label: "Operación y mantenimiento" },
  { id: "demand", label: "Demanda" },
  { id: "benefits", label: "Beneficios valorados" },
  { id: "residual", label: "Valor residual" },
] as const;
export type SensitivityVar = (typeof sensitivityVariables)[number]["id"];
/** Change in economic (or financial) NPV when each variable worsens 10 %; the largest drop is the critical variable. */
export function criticalVariable(
  c: FlowCase,
  rows: RowInput[],
  econ: EconomicRowInput[],
  benefitIds: string[],
  which: "npvE" | "npvF" = "npvE",
) {
  const base = evaluate(c, rows, econ, benefitIds)[which];
  const worse: Record<SensitivityVar, number> = { investment: 1.1, om: 1.1, demand: 0.9, benefits: 0.9, residual: 0.9 };
  const ranked = sensitivityVariables
    .map((v) => ({
      ...v,
      delta: evaluate(c, rows, econ, benefitIds, { [v.id]: worse[v.id] })[which] - base,
    }))
    .sort((a, b) => a.delta - b.delta);
  return { base, ranked, critical: ranked[0] };
}
/**
 * Switching value: multiplier of a variable that makes the NPV cross zero (bisection on [0, 4]).
 * Returns null when the decision does not change within that range.
 */
export function switchingValue(
  c: FlowCase,
  rows: RowInput[],
  econ: EconomicRowInput[],
  benefitIds: string[],
  variable: SensitivityVar,
  which: "npvE" | "npvF" = "npvE",
) {
  const f = (m: number) => evaluate(c, rows, econ, benefitIds, { [variable]: m })[which];
  let lo = 0,
    hi = 4;
  const flo = f(lo),
    fhi = f(hi),
    f1 = f(1);
  if (Math.sign(flo) === Math.sign(fhi) || flo === 0 || fhi === 0) return null;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2,
      fm = f(mid);
    if (Math.sign(fm) === Math.sign(flo)) lo = mid;
    else hi = mid;
  }
  const m = (lo + hi) / 2;
  return { multiplier: m, change: m - 1, currentSign: Math.sign(f1) };
}

/* ---------------- Detector de errores conceptuales ---------------- */
export interface FlowError {
  code:
    | "tipo"
    | "ingreso-como-costo"
    | "periodo-inversion"
    | "residual"
    | "omitido"
    | "hundido"
    | "incluido-indebido"
    | "monto"
    | "rpc"
    | "transferencia"
    | "doble-conteo"
    | "beneficio-omitido";
  rubroId?: string;
  severity: "grave" | "alerta";
  message: string;
}
const tolerance = 0.02;
const near = (a: number, b: number) => Math.abs(a - b) <= Math.max(1e-6, Math.abs(b) * tolerance);
const sameTiming = (a: Timing, b: Timing) =>
  a.type === b.type && (a.type !== "periodo" || (b.type === "periodo" && a.period === b.period));
export function detectFlowErrors(c: FlowCase, rows: RowInput[]): FlowError[] {
  const errors: FlowError[] = [];
  for (const r of c.rubros) {
    const row = rows.find((x) => x.rubroId === r.id);
    const label = "«" + r.label + "»";
    if (!row) {
      if (r.kind !== "excluir")
        errors.push({ code: "omitido", rubroId: r.id, severity: "grave", message: `${label} no está en el flujo. ${r.kind === "mantenimiento" ? "Omitir el mantenimiento sobrestima el VPN y compromete la vida útil." : "Todo costo o ingreso del proyecto debe aparecer."}` });
      continue;
    }
    if (r.kind === "excluir" && row.kind !== "excluir") {
      errors.push({ code: r.id.includes("estudio") ? "hundido" : "incluido-indebido", rubroId: r.id, severity: "grave", message: `${label} no debe entrar al flujo: ${r.why}` });
      continue;
    }
    if (r.kind !== "excluir" && row.kind === "excluir") {
      errors.push({ code: "omitido", rubroId: r.id, severity: "grave", message: `${label} se excluyó, pero es parte del proyecto. ${r.why}` });
      continue;
    }
    if (r.kind === "ingreso" && costKinds.includes(row.kind)) {
      errors.push({ code: "ingreso-como-costo", rubroId: r.id, severity: "grave", message: `${label} es un ingreso, pero lo registraste como costo: cambia el signo y subestima el VPN.` });
      continue;
    }
    if (row.kind !== r.kind)
      errors.push({ code: "tipo", rubroId: r.id, severity: "alerta", message: `${label} está clasificado como ${kindLabels[row.kind].toLowerCase()}; corresponde a ${kindLabels[r.kind].toLowerCase()}. ${r.why}` });
    if (r.kind !== "excluir" && !sameTiming(row.timing, r.timing)) {
      if (r.kind === "inversion")
        errors.push({ code: "periodo-inversion", rubroId: r.id, severity: "grave", message: `${label} está en un periodo incorrecto: la inversión ocurre durante la construcción${c.constructionEnd ? ` (periodos 0 a ${c.constructionEnd})` : " (periodo 0)"}, antes de que empiece la operación.` });
      else if (r.kind === "residual")
        errors.push({ code: "residual", rubroId: r.id, severity: "grave", message: `${label} mal ubicado: el valor residual aparece al final del horizonte (periodo ${c.horizon}), cuando el activo aún tiene vida útil.` });
      else
        errors.push({ code: "tipo", rubroId: r.id, severity: "alerta", message: `${label} está en periodos distintos a los del caso. ${r.why}` });
    }
    if (r.kind !== "excluir" && !near(row.amount, r.amount))
      errors.push({ code: "monto", rubroId: r.id, severity: r.given === "entregado" ? "alerta" : "grave", message: `${label}: el valor ${Math.round(row.amount).toLocaleString("es-CO")} no coincide con el caso.${r.formula ? " Revisa el cálculo: " + r.formula + "." : ""}` });
    if (row.overrides && Object.keys(row.overrides).length)
      errors.push({ code: "monto", rubroId: r.id, severity: "alerta", message: `${label} tiene celdas editadas a mano: verifica que coincidan con el supuesto del rubro.` });
  }
  return errors;
}
export function detectEconomicErrors(
  c: FlowCase,
  rows: RowInput[],
  econ: EconomicRowInput[],
  benefitIds: string[],
): FlowError[] {
  const errors: FlowError[] = [];
  for (const r of c.rubros) {
    const e = econ.find((x) => x.rubroId === r.id),
      label = "«" + r.label + "»";
    if (r.kind === "excluir") {
      if (e && e.rpc !== "transferencia")
        errors.push({ code: "incluido-indebido", rubroId: r.id, severity: "grave", message: `${label} tampoco entra al flujo económico: ${r.why}` });
      continue;
    }
    if (!e) {
      errors.push({ code: "omitido", rubroId: r.id, severity: "grave", message: `${label} falta en el flujo económico: todo recurso que usa el proyecto tiene un costo para la sociedad.` });
      continue;
    }
    if (r.rpc === "transferencia" && e.rpc !== "transferencia")
      errors.push({ code: "transferencia", rubroId: r.id, severity: "grave", message: `${label} es una transferencia: ${r.why} Mantenerla con RPC ${rpcById(e.rpc).value.toFixed(3)} duplica beneficios o cuenta un pago entre agentes como recurso.` });
    else if (e.rpc !== r.rpc)
      errors.push({ code: "rpc", rubroId: r.id, severity: "alerta", message: `${label}: la RPC adecuada es la de «${rpcById(r.rpc).label}» (${rpcById(r.rpc).value.toFixed(3)}), no ${rpcById(e.rpc).value.toFixed(3)}.` });
  }
  const groups = new Map<string, number>();
  for (const b of c.benefits.filter((b) => benefitIds.includes(b.id) && b.overlap))
    groups.set(b.overlap!, (groups.get(b.overlap!) ?? 0) + 1);
  for (const b of c.benefits.filter((b) => benefitIds.includes(b.id) && b.overlap))
    errors.push({ code: "doble-conteo", rubroId: b.id, severity: "grave", message: `Doble conteo: «${b.label}» representa en buena parte beneficios que ya incluiste. Inclúyelo solo si no sumas los beneficios que capitaliza.` });
  for (const b of c.benefits.filter((b) => !b.overlap && !benefitIds.includes(b.id)))
    errors.push({ code: "beneficio-omitido", rubroId: b.id, severity: b.annual < 0 ? "grave" : "alerta", message: b.annual < 0 ? `Omitiste el costo «${b.label}»: los impactos negativos también entran al flujo económico.` : `Omitiste «${b.label}», un beneficio valorado sin duplicación.` });
  void rows;
  return errors;
}
/** 0–100: each severe error costs 12 points and each warning 5. */
export function errorScore(errors: FlowError[]) {
  return Math.max(0, 100 - errors.reduce((n, e) => n + (e.severity === "grave" ? 12 : 5), 0));
}
