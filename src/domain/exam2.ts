import { exam2, examCase } from "../data/exam2";
import type { RpcCategory } from "../data/rpc";
import { methodById } from "../data/valuationMethods";
import {
  detectFlowErrors,
  errorScore,
  evaluate,
  netFlow,
  npv,
  referenceBenefits,
  referenceEconomic,
  referenceRows,
  type RowInput,
} from "./flows";

export interface ExamAnswers {
  objective?: string;
  tradeoff?: string;
  sunk?: string;
  flow?: RowInput[];
  npv?: number;
  impacts?: Record<string, string>;
  method?: string;
  benefit?: number;
  rpc?: Record<string, RpcCategory>;
  benefits?: string[];
  compare?: "A" | "B";
  sensitivity?: string;
  decision?: "A" | "B";
  reason?: string;
}
/** Reference results computed with the same engine used in missions. */
export function examReference() {
  const A = examCase("A"),
    B = examCase("B"),
    rA = evaluate(A, referenceRows(A), referenceEconomic(A), referenceBenefits(A)),
    rB = evaluate(B, referenceRows(B), referenceEconomic(B), referenceBenefits(B)),
    sA = evaluate(A, referenceRows(A), referenceEconomic(A), referenceBenefits(A), { demand: 0.7 }),
    sB = evaluate(B, referenceRows(B), referenceEconomic(B), referenceBenefits(B), { demand: 0.7 });
  return { A, B, rA, rB, sA, sB };
}
export function sensitivityOptions() {
  const { sA, sB } = examReference(),
    truth = sA.npvE < 0 && sB.npvE >= 0 ? "a" : sA.npvE >= 0 && sB.npvE >= 0 ? "b" : sA.npvE < 0 && sB.npvE < 0 ? "c" : "d";
  return [
    { id: "a", text: "A deja de ser viable económicamente; B sigue siendo viable", correct: truth === "a" },
    { id: "b", text: "Ambas siguen siendo viables", correct: truth === "b" },
    { id: "c", text: "Ninguna es viable", correct: truth === "c" },
    { id: "d", text: "Solo cambia el flujo financiero", correct: false },
  ];
}
export const decisionReasons = [
  { id: "vpn", text: "Tiene mayor VPN económico, aceptando más exposición a una caída de la demanda" },
  { id: "robusta", text: "Sigue siendo viable si las visitas caen 30 % y requiere menos inversión" },
  { id: "barata", text: "Es la más barata" },
  { id: "financiero", text: "Tiene VPN financiero positivo" },
];
/** Decision credit: several strategies are valid when the justification matches the evidence. */
export function decisionCredit(decision?: "A" | "B", reason?: string) {
  const { rA, rB, sA, sB } = examReference();
  const best = rA.npvE >= rB.npvE ? "A" : "B",
    robust = sB.npvE >= 0 && sA.npvE < 0 ? "B" : sA.npvE >= 0 && sB.npvE < 0 ? "A" : null;
  if (!decision || !reason) return 0;
  if (reason === "vpn") return decision === best ? 1 : 0;
  if (reason === "robusta") return decision === robust ? 1 : 0;
  if (reason === "barata") return decision === "B" ? 0.4 : 0;
  if (reason === "financiero") return (decision === "A" ? rA.npvF : rB.npvF) >= 0 ? 0.6 : 0;
  return 0;
}
export interface ExamRow {
  step: string;
  points: number;
  max: number;
  feedback: string;
}
/** Deferred grading of the whole exam (modo evaluación) or per step (modo aprendizaje). */
export function examResults(a: ExamAnswers) {
  const { A, rA, rB } = examReference(),
    rows: ExamRow[] = [];
  const push = (step: string, max: number, credit: number, feedback: string) =>
    rows.push({ step, max, points: Math.round(max * Math.max(0, Math.min(1, credit)) * 10) / 10, feedback });
  const obj = exam2.objectives.find((o) => o.id === a.objective);
  push("Objetivos", 5, obj?.valid ? 1 : 0, obj ? (obj.valid ? "Correcto: " : "Revisa: ") + obj.why : "Sin respuesta.");
  const tr = exam2.tradeoff.options.find((o) => o.id === a.tradeoff);
  push("Alternativas", 5, tr?.correct ? 1 : 0, tr?.feedback ?? "Sin respuesta.");
  const sk = exam2.sunkQuestion.options.find((o) => o.id === a.sunk);
  push("Datos", 5, sk?.correct ? 1 : 0, sk?.feedback ?? "Sin respuesta.");
  const flowErrors = a.flow ? detectFlowErrors(A, a.flow) : [];
  push("Flujo financiero", 15, a.flow ? errorScore(flowErrors) / 100 : 0, a.flow ? (flowErrors.length ? flowErrors.map((e) => e.message).join(" ") : "Flujo consistente con el caso.") : "Sin flujo.");
  const own = a.flow ? npv(netFlow(A, a.flow), A.financialRate) : NaN,
    npvOk = a.npv !== undefined && Math.abs(a.npv - rA.npvF) <= Math.max(1, Math.abs(rA.npvF) * 0.01),
    npvConsistent = a.npv !== undefined && Number.isFinite(own) && Math.abs(a.npv - own) <= Math.max(1, Math.abs(own) * 0.01);
  push("VPN financiero", 8, npvOk ? 1 : npvConsistent ? 0.5 : 0, `VPN financiero de A: ${Math.round(rA.npvF)} M. ${npvOk ? "Correcto." : npvConsistent ? "Calculaste bien tu flujo, pero el flujo tenía errores." : "Revisa el descuento de cada periodo."}`);
  const impactsRight = exam2.impacts.filter((i) => a.impacts?.[i.id] === i.kind).length;
  push("Efectos e impactos", 8, impactsRight / exam2.impacts.length, `${impactsRight} de ${exam2.impacts.length} tarjetas bien clasificadas.`);
  const v = exam2.valuation,
    method = a.method === v.best ? 1 : v.valid.includes(a.method ?? "") ? 0.5 : 0,
    benefit = a.benefit !== undefined && Math.abs(a.benefit - v.visits * v.valuePerVisit) < 0.5 ? 1 : 0;
  push("Valoración", 10, 0.6 * method + 0.4 * benefit, `${methodById(v.best)!.name} es el método más adecuado para el valor recreativo. Beneficio anual: ${v.visits.toLocaleString("es-CO")} visitas × 0,025 M = ${v.visits * v.valuePerVisit} M.`);
  const rpcRight = exam2.rpcRows.filter((id) => a.rpc?.[id] === A.rubros.find((r) => r.id === id)!.rpc).length;
  push("RPC", 8, rpcRight / exam2.rpcRows.length, `${rpcRight} de ${exam2.rpcRows.length} RPC correctas. Las entradas son una transferencia (RPC 0).`);
  const ref = referenceBenefits(A),
    ben = a.benefits ?? [],
    benCredit = !ben.length ? 0 : ref.every((id) => ben.includes(id)) && !ben.includes("predios") ? 1 : ben.includes("predios") ? 0.3 : 0.5;
  push("Flujo económico", 8, benCredit, `Incluye el valor recreativo y el costo por perturbación de aves; el valor de predios duplica el beneficio recreativo. VPN económico de A: ${Math.round(rA.npvE)} M.`);
  const higher = rA.npvE >= rB.npvE ? "A" : "B";
  push("Comparación", 5, a.compare === higher ? 1 : 0, `Mayor VPN económico: ${higher} (A ${Math.round(rA.npvE)} M; B ${Math.round(rB.npvE)} M).`);
  const so = sensitivityOptions().find((o) => o.id === a.sensitivity);
  push("Sensibilidad", 8, so?.correct ? 1 : 0, `Con 30 % menos visitas cambia la viabilidad: ${sensitivityOptions().find((o) => o.correct)?.text}.`);
  push("Decisión", 7, decisionCredit(a.decision, a.reason), "Se acepta A o B si la justificación coincide con la evidencia: A por mayor VPN económico; B por robustez ante la caída de visitas.");
  const max = rows.reduce((n, r) => n + r.max, 0),
    got = rows.reduce((n, r) => n + r.points, 0);
  return { rows, total: Math.round((100 * got) / max) };
}
