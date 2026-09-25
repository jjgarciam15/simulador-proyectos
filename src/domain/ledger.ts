import type { GameState } from "./types";
import { scenarioById } from "../data/scenarios";
import { chainReview, sdgReview } from "./projectV2";
import { budgetReview } from "./budgetReview";
import { puzzleResult, recommendedPolicies } from "./regulationLab";
import { dilemmaById, fillText } from "./dilemmas";

export interface LedgerItem {
  stage: string;
  /** Dimension of the grade that the item feeds. */
  dimension: string;
  ok: boolean;
  text: string;
}
/**
 * Aciertos y errores: concrete, verifiable items behind each dimension of the grade.
 * Pre-investment items are read from the approved plan (decision state) when it exists.
 */
export function outcomeLedger(g: GameState): LedgerItem[] {
  const plan = g.snapshot?.decisionState ?? g,
    s = scenarioById(g.scenarioId),
    items: LedgerItem[] = [],
    add = (stage: string, dimension: string, ok: boolean, text: string) => items.push({ stage, dimension, ok, text });
  for (const id of plan.nodes.filter((id) => id !== "n0")) {
    const n = s.nodes.find((n) => n.id === id);
    if (n) add("Diagnóstico", "Diagnóstico y Árbol del problema", n.valid, `${n.valid ? "Incluiste" : "Incluiste una causa falsa:"} «${n.label}» en el Árbol del problema.`);
  }
  const missing = s.nodes.filter((n) => n.valid && n.id !== "n0" && !plan.nodes.includes(n.id));
  for (const n of missing) add("Diagnóstico", "Diagnóstico y Árbol del problema", false, `Faltó «${n.label}» en el Árbol del problema.`);
  const actorsOk = s.actors.filter((a) => {
    const p = plan.v2?.actorMap[a.id];
    return p?.power === (a.power >= 60 ? "alto" : "bajo") && p?.interest === (a.interest >= 60 ? "alto" : "bajo");
  }).length;
  add("Diagnóstico", "Diagnóstico y Árbol del problema", actorsOk === s.actors.length, `Ubicaste correctamente ${actorsOk} de ${s.actors.length} actores en la matriz poder × interés.`);
  const a = s.alternatives.find((x) => x.id === plan.alternative);
  add("Formulación", "Alternativa y objetivos", plan.objective === "n0", plan.objective === "n0" ? "El objetivo central corresponde al problema central." : "El objetivo central no corresponde al problema central.");
  if (a) {
    const covered = a.causes.filter((id) => plan.nodes.includes(id)).length;
    add("Formulación", "Alternativa y objetivos", covered === a.causes.length, `${a.name} atiende ${covered} de ${a.causes.length} causas que identificaste.`);
  }
  for (const r of chainReview(plan))
    add("Cadena de valor", "Cadena de valor y presupuesto", r.status === "correcta", `«${r.label}» en ${r.placed}: ${r.status}.${r.status === "correcta" ? "" : " " + r.why}`);
  for (const f of budgetReview(plan).findings)
    add("Presupuesto", "Cadena de valor y presupuesto", f.level === "ok", `${f.topic}: ${f.text}`);
  add("Evaluación", "Evaluación ex ante", plan.acknowledged.includes("evaluation") || !!g.snapshot, "Confirmaste la revisión de la evaluación ex ante con los supuestos vigentes.");
  if (plan.v2?.regulatory.chain)
    for (const r of puzzleResult(plan).rows)
      add("Regulación", "Regulación y ODS", r.correct, `Eslabón «${r.slot}» de la cadena regulatoria ${r.correct ? "coherente" : "incoherente"}.`);
  if (plan.failure) {
    const proportional = recommendedPolicies(plan).includes(plan.policy);
    add("Regulación", "Regulación y ODS", proportional, proportional ? "El instrumento fue proporcional a la severidad real de la falla." : "El instrumento no fue proporcional a la severidad real de la falla.");
  }
  const sdg = sdgReview(plan);
  for (const r of sdg.rows) add("ODS", "Regulación y ODS", r.status === "bien sustentado", `ODS ${r.id}: ${r.status}.`);
  if (sdg.omitted.length) add("ODS", "Regulación y ODS", false, `Omitiste ${sdg.omitted.length} ODS relacionados con el proyecto.`);
  for (const d of (g.v2?.dilemmas ?? []).filter((d) => d.choice)) {
    const t = dilemmaById(d.id),
      c = t?.choices.find((c) => c.id === d.choice);
    if (!t || !c) continue;
    // A choice counts as an error when it hid a cost that materialised later (any negative delayed effect).
    const e = c.delayed?.effects ?? {},
      hiddenCost = Object.entries(e).some(([k, v]) => (k === "eventRisk" ? v > 0 : v < 0));
    add("Decisiones", "Coherencia transversal", !hiddenCost, `${fillText(g, t.title)}: elegiste «${c.label}»${hiddenCost ? ", que trasladó costos al futuro" : ""}. ${c.lesson}`);
  }
  const practice = Object.values(g.v2?.assessments ?? {});
  if (practice.length)
    add("Práctica", "Ajustes", practice.every((p) => p.solved && p.choices.length <= 1), `Ejercicios resueltos: ${practice.filter((p) => p.solved).length} de ${practice.length}; ${practice.reduce((n, p) => n + Math.max(0, p.choices.length - 1), 0)} intento(s) fallidos y ${practice.reduce((n, p) => n + p.hints, 0)} pista(s).`);
  return items;
}
